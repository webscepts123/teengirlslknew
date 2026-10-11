import {cartItems,saveCartItem,removeCartItem} from '../Services/cart.js';
import {executeCheckout} from '../Services/checkout.js';
import {addressesFor} from '../Services/customer.js';
import { randomUUID } from "node:crypto";
import { AppController } from "./AppController.js";
import {
  database,
  transaction,
  fail,
  number,
  required,
  jsonValue,
} from "../Services/database.js";
import { settingsFor } from "../Services/settings.js";
import { purchaseSpecial } from "../Services/special-order.js";
import { surpriseEligibility, currentSurprise } from '../Services/surprise-box.js';
import {latestBidding,placePointBid,cancelPointBids} from '../Services/points-bidding.js';

export class StoreController extends AppController {
  async products() {
    return this.api(async () => {
      const db = await database();
      const values = [];
      let where = "is_active=1";
      if (this.query.q) {
        where += " AND (title LIKE ? OR sku LIKE ?)";
        values.push(
          `%${String(this.query.q).slice(0, 100)}%`,
          `%${String(this.query.q).slice(0, 100)}%`,
        );
      }
      if (this.query.category) {
        const descendants = await db.query(`WITH RECURSIVE selected AS (
          SELECT id,name FROM categories WHERE name=? AND is_active=1
          UNION ALL SELECT c.id,c.name FROM categories c JOIN selected s ON c.parent_id=s.id WHERE c.is_active=1
        ) SELECT name FROM selected`, [String(this.query.category)]);
        const names = descendants.length ? descendants.map(c => c.name) : [String(this.query.category)];
        where += " AND category IN (" + names.map(() => '?').join(',') + ")";
        values.push(...names);
      }
      const rows = await db.query(
        `SELECT * FROM products WHERE ${where} ORDER BY created_at DESC LIMIT 100`,
        values,
      );
      return {
        products: rows.map((p) => ({
          ...p,
          colors: jsonValue(p.colors, []),
          sizes: jsonValue(p.sizes, []),
        })),
      };
    });
  }
  async optionalCartCustomer() { return this.context.session?.customer ? this.customerRecord() : null; }
  async cart() {
    return this.api(async()=>({items:await cartItems(this.context.session,await this.optionalCartCustomer()),signedIn:Boolean(this.context.session?.customer)}));
  }
  async saveCart() {
    return this.api(async()=>saveCartItem(this.context.session,await this.optionalCartCustomer(),this.body??{}));
  }
  async removeCart() {
    return this.api(async()=>removeCartItem(this.context.session,await this.optionalCartCustomer(),this.body?.id));
  }
  async quote() {
    return this.checkout(true);
  }
  async checkoutData() {
    return this.api(async()=>{
      const customer=await this.customerRecord();
      const db=await database(),settings=await settingsFor(db);
      return {items:await cartItems(this.context.session,customer),addresses:await addressesFor(customer.id,db),points:Number(customer.points),
        methods:[['cod','Cash on delivery','codEnabled'],['bank_transfer','Bank transfer','bankTransferEnabled'],['points','Reward points','pointsEnabled']].filter(([, ,flag])=>Number(settings[flag]??1)===1).map(([id,label])=>({id,label})),
        bankInstructions:settings.bankInstructions||'Contact the store for bank details.',pointValue:Number(settings.pointValue??100)};
    });
  }
  async checkout(preview=false) {
    return this.api(async()=>{
      const customer=await this.customerRecord();
      await cartItems(this.context.session,customer);
      return transaction(db=>executeCheckout(db,customer,this.body??{},preview));
    });
  }
  async review() {
    return this.api(async () => {
      const customer = await this.customerRecord();
      const b = this.body ?? {};
      const db = await database();
      const [p] = await db.query("SELECT id FROM products WHERE sku=?", [
        b.productId,
      ]);
      if (!p) fail("Product not found.", 404);
      const [purchase] = await db.query(
        "SELECT o.id FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.customer_id=? AND i.product_id=? AND o.status='delivered' LIMIT 1",
        [customer.id, p.id],
      );
      if (!purchase) fail("Reviews require a delivered purchase.");
      await db.query(
        "INSERT INTO product_reviews(customer_id,product_id,rating,comment) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating),comment=VALUES(comment),is_approved=0",
        [
          customer.id,
          p.id,
          number(b.rating, "Rating", { integer: true, min: 1, max: 5 }),
          required(b.comment, "Review", 4000),
        ],
      );
      return { message: "Review submitted for approval." };
    });
  }
  async bid() {
    return this.api(async()=>{
      const customer=await this.customerRecord();
      return transaction(db=>placePointBid(db,customer,this.body?.auctionId));
    });
  }
  async purchaseSpecial() {
    return this.api(async () => {
      const customer = await this.customerRecord();
      return transaction((db) =>
        purchaseSpecial(db, customer, this.body ?? {}),
      );
    });
  }
  async surpriseStatus() {
    return this.api(async()=>surpriseEligibility(await database(),await this.customerRecord()));
  }
  async biddingStatus() {
    return this.api(async()=> {
      const customer=this.context.session?.customer ? await this.customerRecord() : null;
      return {round:await transaction(db=>latestBidding(db,customer)),signedIn:Boolean(customer)};
    });
  }
  async cancelBids() {
    return this.api(async()=>{
      const customer=await this.customerRecord();
      return transaction(db=>cancelPointBids(db,customer,this.body?.auctionId));
    });
  }
  async publicFeatures() {
    return this.api(async () => {
      const kind = this.query.kind;
      if(kind==='bidding') {
        const round=await transaction(db=>latestBidding(db));
        return {records:round?[{id:round.id,kind,name:round.name,data:{targetBids:round.target,productSku:round.product?.sku,currentBids:round.total,closed:round.closed}}]:[]};
      }
      if (kind==='surprise-box') {
        const box=await currentSurprise(await database());
        return {records:box?[{id:box.id,kind,name:box.name,data:{price:box.points,description:box.description}}]:[]};
      }
      if (!["faq", "bidding", "surprise-box"].includes(kind))
        fail("Unknown public feature.", 404);
      const db = await database();
      return {
        records: (
          await db.query(
            "SELECT id,kind,name,data FROM feature_records WHERE kind=? AND status IN ('active','completed')",
            [kind],
          )
        ).map((r) => ({ ...r, data: jsonValue(r.data) })),
      };
    });
  }
}
