export async function up(db) {
  await db.query('ALTER TABLE products ADD weight_kg DECIMAL(8,2) NOT NULL DEFAULT 0');
  await db.query('ALTER TABLE customers MODIFY points DECIMAL(12,2) UNSIGNED NOT NULL DEFAULT 0');
  await db.query('ALTER TABLE reward_transactions MODIFY amount DECIMAL(12,2) NOT NULL');
  await db.query(`ALTER TABLE orders ADD cod_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD extra_weight_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD shipping_address_snapshot JSON NULL,
    ADD checkout_request_id VARCHAR(64) NULL,
    ADD UNIQUE KEY order_checkout_request(customer_id,checkout_request_id)`);
}
export async function down(db) {
  await db.query('ALTER TABLE orders DROP INDEX order_checkout_request,DROP cod_fee,DROP extra_weight_charge,DROP shipping_address_snapshot,DROP checkout_request_id');
  await db.query('ALTER TABLE products DROP weight_kg');
  // Preserve fractional points already earned or spent by completed checkouts.
}
