import { randomUUID } from "node:crypto";
import { fail, number } from "./database.js";
import { validateVariant } from "./pricing.js";

export async function createManualOrder(db, body) {
  const [customer] = await db.query(
    "SELECT id FROM customers WHERE code=? AND is_active=1",
    [body.customerCode],
  );
  if (!customer) fail("Customer was not found.");
  const [address] = await db.query(
    "SELECT id FROM customer_addresses WHERE id=? AND customer_id=?",
    [body.addressId, customer.id],
  );
  if (!address) fail("Choose an address owned by this customer.");
  const [product] = await db.query(
    "SELECT * FROM products WHERE sku=? AND is_active=1 FOR UPDATE",
    [body.productSku],
  );
  if (!product) fail("Product was not found.");
  const quantity = number(body.quantity, "Quantity", {
    integer: true,
    min: 1,
    max: 99,
  });
  validateVariant(product, body.color || "", body.size || "");
  if (product.stock < quantity && !product.allow_preorder)
    fail("Insufficient stock.");
  if (!["cod", "bank_transfer"].includes(body.paymentMethod))
    fail("Choose cash on delivery or bank transfer.");
  const subtotal = Number(product.price) * quantity;
  const shipping = subtotal >= 3500 ? 0 : 350;
  const orderNumber =
    "TG" + randomUUID().replaceAll("-", "").slice(0, 14).toUpperCase();
  const order = await db.query(
    "INSERT INTO orders(order_number,customer_id,shipping_address_id,status,total,payment_method,payment_status,placed_at,shipping_total) VALUES (?,?,?,'pending',?,?,'Pending',NOW(),?)",
    [
      orderNumber,
      customer.id,
      address.id,
      subtotal + shipping,
      body.paymentMethod,
      shipping,
    ],
  );
  await db.query(
    "INSERT INTO order_items(order_id,product_id,title,variant,unit_price,quantity,image) VALUES (?,?,?,?,?,?,?)",
    [
      order.insertId,
      product.id,
      product.title,
      [body.color, body.size].filter(Boolean).join(" / "),
      product.price,
      quantity,
      product.image,
    ],
  );
  await db.query("UPDATE products SET stock=GREATEST(0,stock-?) WHERE id=?", [
    quantity,
    product.id,
  ]);
  return orderNumber;
}
