import { fail, jsonValue } from "./database.js";

export function validateVariant(product, color = "", size = "") {
  for (const [value, list, label] of [
    [color, jsonValue(product.colors, []), "color"],
    [size, jsonValue(product.sizes, []), "size"],
  ]) {
    if (list.length && !list.includes(value))
      fail(`Select a valid ${label} for ${product.title}.`);
    if (!list.length && value) fail(`Invalid ${label}.`);
  }
}
export function couponDiscount(
  coupon,
  {
    customerId,
    tier,
    subtotal,
    shipping,
    today = new Date().toISOString().slice(0, 10),
  },
) {
  if (
    !coupon ||
    !coupon.is_active ||
    (coupon.customer_id && Number(coupon.customer_id) !== Number(customerId)) ||
    (coupon.required_tier && coupon.required_tier !== tier)
  )
    fail("Coupon is unavailable.");
  const date = (value) =>
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
  if (
    (coupon.valid_until && date(coupon.valid_until) < today) ||
    (coupon.valid_from && date(coupon.valid_from) > today)
  )
    fail("Coupon is outside its validity period.");
  if (
    coupon.redemption_limit != null &&
    coupon.redemption_count >= coupon.redemption_limit
  )
    fail("Coupon redemption limit reached.");
  if (subtotal < Number(coupon.min_spend))
    fail(`Coupon requires a minimum spend of Rs ${coupon.min_spend}.`);
  return coupon.discount_type === "free_shipping"
    ? { discount: 0, shipping: 0 }
    : {
        discount: Math.min(
          subtotal,
          coupon.discount_type === "percentage"
            ? (subtotal * Number(coupon.discount_value)) / 100
            : Number(coupon.discount_value),
        ),
        shipping,
      };
}
export const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
