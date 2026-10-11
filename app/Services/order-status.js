import { settingsFor } from "./settings.js";
import { fail } from "./database.js";
export const transitions = {
  pending: ["processing", "cancelled"],
  processing: ["dispatched", "cancelled"],
  dispatched: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};
export function validateTransition(current, next) {
  if (current !== next && !transitions[current]?.includes(next))
    fail(`Cannot change ${current} to ${next}.`);
}
export async function updateOrder(db, id, body) {
  const [order] = await db.query("SELECT * FROM orders WHERE id=? FOR UPDATE", [
    id,
  ]);
  if (!order) fail("Order not found.", 404);
  const next = body.status || order.status;
  validateTransition(order.status, next);
  const items = await db.query(
    "SELECT product_id,quantity FROM order_items WHERE order_id=?",
    [id],
  );
  if (next === "cancelled" && order.status !== "cancelled") {
    for (const item of items)
      if (item.product_id)
        await db.query("UPDATE products SET stock=stock+? WHERE id=?", [
          item.quantity,
          item.product_id,
        ]);
    const [payment] = await db.query(
      "SELECT amount FROM reward_transactions WHERE order_id=? AND reason='Points payment'",
      [id],
    );
    if (payment) {
      const refund = await db.query(
        "INSERT IGNORE INTO reward_transactions(customer_id,amount,reason,order_id) VALUES (?,?,'Order cancelled refund',?)",
        [order.customer_id, -payment.amount, id],
      );
      if (refund.affectedRows)
        await db.query("UPDATE customers SET points=points+? WHERE id=?", [
          -payment.amount,
          order.customer_id,
        ]);
    }
  }
  if (next === "delivered" && order.status !== "delivered") {
    const settings = await settingsFor(db);
    const points = Math.floor(
      Number(order.total) * Number(settings.pointsPerLkr ?? 0.01),
    );
    const reward = await db.query(
      "INSERT IGNORE INTO reward_transactions(customer_id,amount,reason,order_id) VALUES (?,?,'Order delivered',?)",
      [order.customer_id, points, id],
    );
    if (reward.affectedRows)
      await db.query("UPDATE customers SET points=points+? WHERE id=?", [
        points,
        order.customer_id,
      ]);
    const [discounted] = await db.query(
      "SELECT i.id FROM order_items i JOIN products p ON p.id=i.product_id WHERE i.order_id=? AND i.unit_price<p.price LIMIT 1",
      [id],
    );
    if (
      order.payment_method === "cod" &&
      Number(order.discount_total) === 0 &&
      !discounted &&
      !String(order.notes || "").startsWith("Special offer:")
    ) {
      const [first] = await db.query(
        "SELECT p.* FROM order_items i JOIN products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY i.id LIMIT 1",
        [id],
      );
      let buyerId = order.customer_id;
      const visited = new Set([buyerId]);
      for (let level = 1; level <= 3 && first; level++) {
        const [buyer] = await db.query(
          "SELECT referred_by_customer_id FROM customers WHERE id=?",
          [buyerId],
        );
        const referrerId = buyer?.referred_by_customer_id;
        if (!referrerId || visited.has(referrerId)) break;
        visited.add(referrerId);
        const amount = Number(first["referral_level_" + level]);
        if (amount > 0) {
          const award = await db.query(
            "INSERT IGNORE INTO referral_commissions(customer_id,order_id,level,amount) VALUES (?,?,?,?)",
            [referrerId, id, level, amount],
          );
          if (award.affectedRows)
            await db.query(
              "UPDATE customers SET commission_balance=commission_balance+? WHERE id=?",
              [amount, referrerId],
            );
        }
        buyerId = referrerId;
      }
    }
  }
  await db.query(
    "UPDATE orders SET status=?,payment_status=?,courier_name=?,tracking_number=?,notes=?,delivered_at=IF(?='delivered',COALESCE(delivered_at,NOW()),delivered_at) WHERE id=?",
    [
      next,
      body.paymentStatus ||
        (next === "delivered" && order.payment_method === "cod"
          ? "Paid on Delivery"
          : order.payment_status),
      body.courierName ?? order.courier_name,
      body.trackingNumber ?? order.tracking_number,
      body.notes ?? order.notes,
      next,
      id,
    ],
  );
}
