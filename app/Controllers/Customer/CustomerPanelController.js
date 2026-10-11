import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "noderyx-framework";
import { AppController } from "../AppController.js";
import {
  database,
  transaction,
  fail,
  required,
  number,
  boolean,
  money,
  jsonValue,
} from "../../Services/database.js";
import { settingsFor } from "../../Services/settings.js";
import {
  customerView,
  addressesFor,
  ordersFor,
  couponView,
} from "../../Services/customer.js";
import { normalizeSriLankanPhone } from "../../../public/customer-registration-rules.js";

export class CustomerPanelController extends AppController {
  async dashboard(asJson = false) {
    let row;
    try {
      row = await this.customerRecord();
    } catch (error) {
      if (error.status === 401)
        return asJson
          ? this.json({ success: false, error: "Please sign in." }, 401)
          : this.redirect("/login");
      throw error;
    }
    const db = await database();
    const [addresses, orders, wishlist, coupons] = await Promise.all([
      addressesFor(row.id),
      ordersFor(row.id),
      db.query(
        "SELECT w.id AS wishlist_id, p.* FROM wishlist_items w JOIN products p ON p.id=w.product_id WHERE w.customer_id=? AND p.is_active=1",
        [row.id],
      ),
      db.query(
        "SELECT * FROM coupons WHERE is_active=1 AND (customer_id IS NULL OR customer_id=?) AND (valid_until IS NULL OR valid_until>=CURRENT_DATE) AND (valid_from IS NULL OR valid_from<=CURRENT_DATE) AND (required_tier IS NULL OR required_tier=?)",
        [row.id, row.tier],
      ),
    ]);
    const points = Number(row.points);
    const customer = customerView(row, addresses);
    const stats = {
      totalOrders: orders.length,
      activeOrders: orders.filter(
        (o) => !["Delivered", "Cancelled", "Returned"].includes(o.status),
      ).length,
      wishlistCount: wishlist.length,
      rewardPoints: points,
      totalSpent: money(
        orders
          .filter((o) => o.status === "Delivered")
          .reduce((sum, o) => sum + o.numericTotal, 0),
      ),
      voucherAway: money(Math.max(0, 1000 - points)),
      targetVoucher: money(1000),
      voucherTargetPoints: 1000,
      voucherProgressPercent: Math.min(100, Math.round(points / 10)),
      voucherProgressLabel: `${points} / 1000`,
      pointsValueLKR: money(points),
      storeCredit: customer.storeCredit,
      tier: customer.tier,
      tierProgress: Math.min(100, points / 10),
      nextTierPoints: Math.max(0, 1000 - points),
    };
    const data = {
      siteName: "teengirls.lk",
      pageTitle: "Customer Dashboard",
      customer,
      stats,
      activeOrder:
        orders.find((o) =>
          ["Shipped", "Out For Delivery"].includes(o.status),
        ) ||
        orders[0] ||
        null,
      orders,
      wishlist: wishlist.map((p) => ({
        ...p,
        id: `WISH-${p.wishlist_id}`,
        productId: p.sku,
        price: money(p.price),
        originalPrice: p.original_price ? money(p.original_price) : "",
        stockStatus: p.stock ? "In Stock" : "Out of Stock",
        stockClass: p.stock ? "stock-available" : "stock-preorder",
        colors: jsonValue(p.colors, []),
        sizes: jsonValue(p.sizes, []),
      })),
      coupons: coupons.map(couponView),
      commissionBalance: money(row.commission_balance || 0),
      returns: await db.query(
        "SELECT r.*,o.order_number FROM return_requests r JOIN orders o ON o.id=r.order_id WHERE r.customer_id=? ORDER BY r.id DESC",
        [row.id],
      ),
      commissions: await db.query(
        "SELECT level,amount,is_released,created_at FROM referral_commissions WHERE customer_id=? ORDER BY id DESC",
        [row.id],
      ),
      addresses,
      activeTab: this.query.tab || "dashboard",
      welcome: this.query.welcome === "true",
      csrfToken: this.context.csrfToken,
    };
    return asJson
      ? this.json({ success: true, ...data })
      : this.render("customer/dashboard", data);
  }
  async data() {
    return this.dashboard(true);
  }
  async orders() {
    this.query.tab = "orders";
    return this.dashboard();
  }
  async wishlist() {
    this.query.tab = "wishlist";
    return this.dashboard();
  }
  async addresses() {
    this.query.tab = "addresses";
    return this.dashboard();
  }
  async rewards() {
    this.query.tab = "rewards";
    return this.dashboard();
  }
  async profile() {
    this.query.tab = "profile";
    return this.dashboard();
  }
  async support() {
    this.query.tab = "support";
    return this.dashboard();
  }
  async referrals() {
    this.query.tab = "referrals";
    return this.dashboard();
  }
  async saveAddress() {
    return this.api(async () => {
      const customer = await this.customerRecord();
      const b = this.body ?? {};
      const phone = normalizeSriLankanPhone(b.phone);
      if (!phone) fail("Enter a valid Sri Lankan phone number.");
      const values = [
        required(b.label || "Home", "Label", 60),
        required(b.recipientName, "Recipient name", 120),
        phone,
        required(b.street, "Street", 255),
        required(b.city, "City", 100),
        required(b.district, "District", 100),
        String(b.postalCode || "").slice(0, 10),
        String(b.notes || "").slice(0, 255),
      ];
      await transaction(async (db) => {
        await db.query("SELECT id FROM customers WHERE id=? FOR UPDATE", [
          customer.id,
        ]);
        const rows = await db.query(
          "SELECT id,is_default FROM customer_addresses WHERE customer_id=?",
          [customer.id],
        );
        const id = b.id
          ? number(String(b.id).replace("ADDR-", ""), "Address ID", {
              integer: true,
              min: 1,
            })
          : null;
        if (id && !rows.some((row) => Number(row.id) === id))
          fail("Address not found.", 404);
        const isDefault =
          boolean(b.isDefault) ||
          rows.length === 0 ||
          rows.some((row) => Number(row.id) === id && row.is_default);
        if (isDefault)
          await db.query(
            "UPDATE customer_addresses SET is_default=0 WHERE customer_id=?",
            [customer.id],
          );
        if (id)
          await db.query(
            "UPDATE customer_addresses SET label=?,recipient_name=?,phone=?,street=?,city=?,district=?,postal_code=?,notes=?,is_default=? WHERE id=? AND customer_id=?",
            [...values, isDefault, id, customer.id],
          );
        else
          await db.query(
            "INSERT INTO customer_addresses (label,recipient_name,phone,street,city,district,postal_code,notes,is_default,customer_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
            [...values, isDefault, customer.id],
          );
      });
      return {
        message: "Address saved successfully.",
        addresses: await addressesFor(customer.id),
      };
    });
  }
  async deleteAddress() {
    return this.api(async () => {
      const customer = await this.customerRecord();
      const id = number(
        String(this.body.addressId || "").replace("ADDR-", ""),
        "Address ID",
        { integer: true, min: 1 },
      );
      await transaction(async (db) => {
        await db.query("SELECT id FROM customers WHERE id=? FOR UPDATE", [
          customer.id,
        ]);
        const result = await db.query(
          "DELETE FROM customer_addresses WHERE id=? AND customer_id=?",
          [id, customer.id],
        );
        if (!result.affectedRows) fail("Address not found.", 404);
        const rows = await db.query(
          "SELECT id,is_default FROM customer_addresses WHERE customer_id=? ORDER BY id",
          [customer.id],
        );
        if (rows.length && !rows.some((a) => a.is_default))
          await db.query(
            "UPDATE customer_addresses SET is_default=1 WHERE id=?",
            [rows[0].id],
          );
      });
      return {
        message: "Address removed.",
        addresses: await addressesFor(customer.id),
      };
    });
  }
  async updateProfile() {
    return this.api(async () => {
      const row = await this.customerRecord();
      const b = this.body ?? {};
      const name = required(b.name || row.name, "Name", 120);
      const phone = normalizeSriLankanPhone(b.phone || row.phone);
      if (!phone) fail("Invalid phone.");
      const preferences = { ...jsonValue(row.preferences) };
      for (const key of [
        "preferredTopSize",
        "preferredBottomSize",
        "preferredFootwear",
      ])
        if (b[key] != null) preferences[key] = String(b[key]).slice(0, 30);
      if (b.styleAesthetics != null)
        preferences.styleAesthetics = (
          Array.isArray(b.styleAesthetics)
            ? b.styleAesthetics
            : String(b.styleAesthetics).split(",")
        )
          .slice(0, 10)
          .map((v) => String(v).trim().slice(0, 60));
      await (
        await database()
      ).query("UPDATE customers SET name=?,phone=?,preferences=? WHERE id=?", [
        name,
        phone,
        JSON.stringify(preferences),
        row.id,
      ]);
      const customer = customerView({ ...row, name, phone, preferences });
      this.context.session.customer = customer;
      return { message: "Profile saved.", customer };
    });
  }
  async changePassword() {
    return this.api(async () => {
      const row = await this.customerRecord();
      const b = this.body ?? {};
      if (!(await verifyPassword(b.currentPassword || "", row.password_hash)))
        fail("Current password is incorrect.");
      const password = required(b.password, "Password", 128);
      if (password.length < 8 || password !== b.confirmPassword)
        fail("Use a matching password of at least 8 characters.");
      await (
        await database()
      ).query("UPDATE customers SET password_hash=? WHERE id=?", [
        await hashPassword(password),
        row.id,
      ]);
      return { message: "Password updated." };
    });
  }
  async removeWishlistItem() {
    return this.api(async () => {
      const row = await this.customerRecord();
      const id = number(
        String(this.body.itemId || "").replace("WISH-", ""),
        "Wishlist ID",
        { integer: true, min: 1 },
      );
      const db = await database();
      const result = await db.query(
        "DELETE FROM wishlist_items WHERE id=? AND customer_id=?",
        [id, row.id],
      );
      if (!result.affectedRows) fail("Wishlist item not found.", 404);
      const [{ count }] = await db.query(
        "SELECT COUNT(*) AS count FROM wishlist_items WHERE customer_id=?",
        [row.id],
      );
      return { message: "Item removed.", wishlistCount: count };
    });
  }
  async addWishlistItem() {
    return this.api(async () => {
      const row = await this.customerRecord();
      const db = await database();
      const [product] = await db.query(
        "SELECT id FROM products WHERE sku=? AND is_active=1",
        [this.body.productId],
      );
      if (!product) fail("Product not found.", 404);
      await db.query(
        "INSERT IGNORE INTO wishlist_items(customer_id,product_id) VALUES (?,?)",
        [row.id, product.id],
      );
      return { message: "Added to wishlist." };
    });
  }
  async redeemPoints() {
    return this.api(async () => {
      const row = await this.customerRecord();
      const pts = number(this.body.pointsToRedeem, "Points", {
        integer: true,
        min: 100,
        max: 1000000,
      });
      return transaction(async (db) => {
        const result = await db.query(
          "UPDATE customers SET points=points-? WHERE id=? AND points>=?",
          [pts, row.id, pts],
        );
        if (!result.affectedRows) fail("Insufficient points.", 400);
        const code = `REDEEM-${randomUUID().slice(0, 8).toUpperCase()}`;
        await db.query(
          "INSERT INTO coupons(code,customer_id,title,discount_type,discount_value,min_spend,badge,valid_until,redemption_limit) VALUES (?,?,?,'fixed',?,?, 'Redeemed',DATE_ADD(CURRENT_DATE,INTERVAL 30 DAY),1)",
          [code, row.id, `${money(pts)} Reward Voucher`, pts, pts * 2],
        );
        await db.query(
          "INSERT INTO reward_transactions(customer_id,amount,reason) VALUES (?,?,?)",
          [row.id, -pts, `Redeemed ${code}`],
        );
        const [customer] = await db.query(
          "SELECT points FROM customers WHERE id=?",
          [row.id],
        );
        const [coupon] = await db.query("SELECT * FROM coupons WHERE code=?", [
          code,
        ]);
        return {
          message: "Reward voucher created.",
          newBalance: customer.points,
          coupon: couponView(coupon),
        };
      });
    });
  }
  async submitReturn() {
    return this.api(async () => {
      const row = await this.customerRecord();
      const b = this.body ?? {};
      const reason = required(b.reason, "Reason");
      const actionType = String(b.actionType || "return").toLowerCase();
      if (!["return", "exchange"].includes(actionType))
        fail("Invalid return action.");
      return transaction(async (db) => {
        const settings = await settingsFor(db);
        const [order] = await db.query(
          "SELECT * FROM orders WHERE order_number=? AND customer_id=? FOR UPDATE",
          [String(b.orderId || "").replace("#", ""), row.id],
        );
        if (!order) fail("Order not found.", 404);
        if (
          order.status !== "delivered" ||
          !order.delivered_at ||
          Date.now() - new Date(order.delivered_at).getTime() >
            Number(settings.returnDays ?? 7) * 86400000
        )
          fail(
            "Returns require a delivered order within the configured return period.",
          );
        const [existing] = await db.query(
          "SELECT id FROM return_requests WHERE order_id=? AND status IN ('open','approved','completed')",
          [order.id],
        );
        if (existing) fail("A return already exists for this order.", 409);
        const ticketId = `RET-${randomUUID().slice(0, 8)}`;
        await db.query(
          "INSERT INTO return_requests(ticket,order_id,customer_id,action_type,reason,comments) VALUES (?,?,?,?,?,?)",
          [
            ticketId,
            order.id,
            row.id,
            actionType,
            reason,
            String(b.comments || "").slice(0, 4000),
          ],
        );
        return { message: "Your request has been saved for review.", ticketId };
      });
    });
  }
  async tickets() {
    return this.api(async () => {
      const row = await this.customerRecord();
      const db = await database();
      const tickets = await db.query(
        "SELECT * FROM support_tickets WHERE customer_id=? ORDER BY updated_at DESC",
        [row.id],
      );
      const messages = await db.query(
        "SELECT m.ticket_id,m.actor,m.message,m.created_at FROM ticket_messages m JOIN support_tickets t ON t.id=m.ticket_id WHERE t.customer_id=? ORDER BY m.id",
        [row.id],
      );
      return {
        tickets: tickets.map((t) => ({
          ...t,
          messages: messages.filter((m) => m.ticket_id === t.id),
        })),
      };
    });
  }
  async saveTicket() {
    return this.api(async () => {
      const row = await this.customerRecord();
      const b = this.body ?? {};
      const db = await database();
      if (b.id) {
        const [ticket] = await db.query(
          "SELECT id FROM support_tickets WHERE id=? AND customer_id=?",
          [b.id, row.id],
        );
        if (!ticket) fail("Ticket not found.", 404);
        if (b.status === "closed")
          await db.query(
            "UPDATE support_tickets SET status='closed' WHERE id=?",
            [ticket.id],
          );
        else
          await db.query(
            "INSERT INTO ticket_messages(ticket_id,actor,message) VALUES (?,?,?)",
            [ticket.id, row.name, required(b.message, "Message", 4000)],
          );
      } else
        await db.query(
          "INSERT INTO support_tickets(customer_id,subject,message) VALUES (?,?,?)",
          [
            row.id,
            required(b.subject, "Subject"),
            required(b.message, "Message", 4000),
          ],
        );
      return { message: "Support request saved." };
    });
  }
}
