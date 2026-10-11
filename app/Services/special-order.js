import { randomUUID } from "node:crypto";
import { fail, jsonValue } from "./database.js";
import { roundMoney } from "./pricing.js";
import { claimSurprise } from './surprise-box.js';
import {claimBiddingPrize} from './points-bidding.js';

export async function purchaseSpecial(db, customer, body) {
  const [record] = await db.query(
    "SELECT * FROM feature_records WHERE id=? AND kind IN ('bidding','surprise-box') FOR UPDATE",
    [body.featureId],
  );
  if (!record) fail("Offer not found.", 404);
  const data = jsonValue(record.data);
  const [address] = await db.query(
    "SELECT id FROM customer_addresses WHERE id=? AND customer_id=?",
    [String(body.addressId || "").replace("ADDR-", ""), customer.id],
  );
  if (!address) fail("Choose one of your delivery addresses.");
  if (record.kind === 'surprise-box') return claimSurprise(db,customer,record,address.id,body.paymentMethod);
  if (record.kind==='bidding' && data.targetBids) return claimBiddingPrize(db,customer,record,address.id);
  if (!["cod", "bank_transfer", "points"].includes(body.paymentMethod))
    fail("Invalid payment method.");
  let price, skus;
  if (record.kind === "surprise-box") {
    if (record.status !== "active" || data.stock < 1)
      fail("This box is unavailable.");
    price = Number(data.price);
    skus = String(data.productSkus)
      .split(",")
      .map((s) => s.trim());
  } else {
    if (Date.now() < Date.parse(data.endsAt))
      fail("Wait until the auction closes.");
    if (data.orderId) fail("The auction has already been purchased.", 409);
    const [winner] = await db.query(
      "SELECT customer_id,amount FROM auction_bids WHERE auction_id=? ORDER BY amount DESC,id LIMIT 1",
      [record.id],
    );
    if (!winner || winner.customer_id !== customer.id)
      fail("Only the winning bidder can purchase this item.", 403);
    price = Number(winner.amount);
    skus = [data.productSku];
  }
  const products = [];
  for (const sku of skus) {
    const [product] = await db.query(
      "SELECT * FROM products WHERE sku=? AND is_active=1 FOR UPDATE",
      [sku],
    );
    if (!product || product.stock < 1)
      fail("A product in this offer is out of stock.");
    products.push(product);
  }
  const occurrences = new Map();
  for (const p of products)
    occurrences.set(p.id, (occurrences.get(p.id) || 0) + 1);
  for (const p of products)
    if (p.stock < occurrences.get(p.id))
      fail("Insufficient stock in this offer.");
  const shipping = price >= 3500 ? 0 : 350,
    total = roundMoney(price + shipping),
    points = Math.ceil(total);
  const [locked] = await db.query(
    "SELECT points FROM customers WHERE id=? FOR UPDATE",
    [customer.id],
  );
  if (body.paymentMethod === "points" && locked.points < points)
    fail("Insufficient points.");
  const orderNumber =
    "TG" + randomUUID().replaceAll("-", "").slice(0, 14).toUpperCase();
  const order = await db.query(
    "INSERT INTO orders(order_number,customer_id,shipping_address_id,status,total,payment_method,payment_status,placed_at,shipping_total,notes) VALUES (?,?,?,'pending',?,?,?,NOW(),?,?)",
    [
      orderNumber,
      customer.id,
      address.id,
      total,
      body.paymentMethod,
      body.paymentMethod === "points" ? "Paid" : "Pending",
      shipping,
      `Special offer: ${record.kind} #${record.id}`,
    ],
  );
  const each = roundMoney(price / products.length);
  for (const [index, p] of products.entries()) {
    const unitPrice =
      index === products.length - 1
        ? roundMoney(price - each * (products.length - 1))
        : each;
    await db.query(
      "INSERT INTO order_items(order_id,product_id,title,variant,unit_price,quantity,image) VALUES (?,?,?,?,?,1,?)",
      [
        order.insertId,
        p.id,
        p.title,
        "Curated special offer",
        unitPrice,
        p.image,
      ],
    );
    await db.query("UPDATE products SET stock=stock-1 WHERE id=?", [p.id]);
  }
  if (body.paymentMethod === "points") {
    await db.query("UPDATE customers SET points=points-? WHERE id=?", [
      points,
      customer.id,
    ]);
    await db.query(
      "INSERT INTO reward_transactions(customer_id,amount,reason,order_id) VALUES (?,?,'Points payment',?)",
      [customer.id, -points, order.insertId],
    );
  }
  if (record.kind === "surprise-box") data.stock -= 1;
  else data.orderId = order.insertId;
  await db.query("UPDATE feature_records SET data=?,status=? WHERE id=?", [
    JSON.stringify(data),
    record.kind === "bidding" ? "completed" : record.status,
    record.id,
  ]);
  return { message: "Order placed.", orderNumber, total };
}
