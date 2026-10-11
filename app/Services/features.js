import { featureSchemas } from "../../public/admin-feature-schema.js";
import { required, number, fail, jsonValue } from "./database.js";

export async function validateFeature(kind, body, db) {
  const schema = featureSchemas[kind];
  if (!schema) fail("Unknown feature.", 404);
  const data = {};
  for (const [key, label, type, optional] of schema) {
    if (optional && !body[key]) {
      data[key] = "";
      continue;
    }
    if (type === "number")
      data[key] = number(body[key], label, {
        max: 100000000,
        integer: [
          "quantity",
          "stock",
          "estimatedDays",
          "displayOrder",
        ].includes(key),
      });
    else if (type === "date" || type === "datetime-local") {
      const value = required(body[key], label, 30);
      if (!Number.isFinite(Date.parse(value))) fail(`${label} is invalid.`);
      data[key] = value;
    } else
      data[key] = required(body[key], label, type === "textarea" ? 4000 : 191);
  }
  if (data.discountPercent > 100) fail("Discount cannot exceed 100%.");
  if (data.startsAt && Date.parse(data.endsAt) <= Date.parse(data.startsAt))
    fail("End must be after start.");
  if (data.increment === 0) fail("Bid increment must be positive.");
  if (kind==='surprise-box') number(data.price,'Box points',{min:1,integer:true});
  if (kind==='bidding') {
    number(data.targetBids,'Bid target',{min:1,integer:true});
    number(data.cancelHours,'Cancellation window',{integer:true});
    number(data.claimHours,'Winner claim window',{min:1,integer:true});
  }
  const skus = data.productSku
    ? [data.productSku]
    : data.productSkus
      ? data.productSkus.split(",").map((v) => v.trim())
      : [];
  for (const sku of skus) {
    const [product] = await db.query(
      "SELECT id FROM products WHERE sku=? AND is_active=1",
      [sku],
    );
    if (!product) fail(`Product ${sku} was not found.`);
  }
  if (
    !["active", "paused", "scheduled", "completed"].includes(
      body.status || "active",
    )
  )
    fail("Invalid feature status.");
  return data;
}
export async function featureRows(db, kind) {
  return (
    await db.query(
      "SELECT * FROM feature_records WHERE kind=? ORDER BY id DESC",
      [kind],
    )
  ).map((r) => ({ ...r, data: jsonValue(r.data) }));
}
