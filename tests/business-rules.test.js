import test from "node:test";
import assert from "node:assert/strict";
import { couponDiscount, validateVariant } from "../app/Services/pricing.js";
import { validateTransition } from "../app/Services/order-status.js";
import { authorizeAdmin } from "../app/Services/admin-permissions.js";
import { number, boolean } from "../app/Services/database.js";

const customer = {
  customerId: 1,
  tier: "gold",
  subtotal: 3000,
  shipping: 350,
  today: "2026-10-11",
};
const coupon = {
  is_active: 1,
  discount_type: "percentage",
  discount_value: 10,
  min_spend: 2500,
  redemption_limit: 10,
  redemption_count: 0,
};
test("discounts use store prices and never exceed the subtotal", () => {
  assert.deepEqual(couponDiscount(coupon, customer), {
    discount: 300,
    shipping: 350,
  });
  assert.deepEqual(
    couponDiscount(
      { ...coupon, discount_type: "fixed", discount_value: 5000 },
      customer,
    ),
    { discount: 3000, shipping: 350 },
  );
  assert.deepEqual(
    couponDiscount({ ...coupon, discount_type: "free_shipping" }, customer),
    { discount: 0, shipping: 0 },
  );
});
test("coupon ownership, tier, spend, expiry and quota are enforced", () => {
  for (const override of [
    { customer_id: 2 },
    { required_tier: "silver" },
    { min_spend: 5000 },
    { valid_until: "2026-10-10" },
    { valid_from: "2026-10-12" },
    { redemption_count: 10 },
    { is_active: 0 },
  ])
    assert.throws(() => couponDiscount({ ...coupon, ...override }, customer));
});
test("variants must belong to the selected product", () => {
  const p = { title: "Dress", colors: '["Pink"]', sizes: ["M"] };
  assert.doesNotThrow(() => validateVariant(p, "Pink", "M"));
  assert.throws(() => validateVariant(p, "Pink", "L"));
  assert.throws(() => validateVariant(p, "", "M"));
});
test("order progression rejects impossible transitions and permits retrying the same status", () => {
  assert.throws(() => validateTransition("pending", "delivered"));
  assert.throws(() => validateTransition("cancelled", "processing"));
  assert.doesNotThrow(() => validateTransition("processing", "dispatched"));
  assert.doesNotThrow(() => validateTransition("delivered", "delivered"));
});
test("staff permissions restrict writes and administrator account management", () => {
  assert.doesNotThrow(() =>
    authorizeAdmin({ role: "Catalog Manager" }, "products", true),
  );
  assert.throws(() =>
    authorizeAdmin({ role: "Catalog Manager" }, "manage-admin", true),
  );
  assert.throws(() => authorizeAdmin({ role: "Analyst" }, "orders", true));
  assert.doesNotThrow(() =>
    authorizeAdmin({ role: "Support Agent" }, "returns", true),
  );
});
test("reward and quantity inputs cannot accept negative, fractional or nonfinite values", () => {
  for (const value of [-500, 1.5, "NaN", Infinity, "", null])
    assert.throws(() => number(value, "Points", { integer: true, min: 100 }));
  assert.equal(number("500", "Points", { integer: true, min: 100 }), 500);
  assert.equal(boolean("false"), false);
  assert.equal(boolean("true"), true);
});
