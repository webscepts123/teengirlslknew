export async function up(db) {
  await db.query(
    "ALTER TABLE customers ADD commission_balance DECIMAL(10,2) NOT NULL DEFAULT 0",
  );
  await db.query(
    "ALTER TABLE categories ADD parent_id BIGINT UNSIGNED NULL, ADD CONSTRAINT categories_parent_fk FOREIGN KEY(parent_id) REFERENCES categories(id) ON DELETE SET NULL",
  );
  await db.query(
    "ALTER TABLE products ADD referral_level_1 DECIMAL(10,2) NOT NULL DEFAULT 0, ADD referral_level_2 DECIMAL(10,2) NOT NULL DEFAULT 0, ADD referral_level_3 DECIMAL(10,2) NOT NULL DEFAULT 0",
  );
  await db.query(
    "CREATE TABLE referral_commissions (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, customer_id BIGINT UNSIGNED NOT NULL, order_id BIGINT UNSIGNED NOT NULL, level INT UNSIGNED NOT NULL, amount DECIMAL(10,2) NOT NULL, is_released BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY referral_order_level(order_id,level), FOREIGN KEY(customer_id) REFERENCES customers(id), FOREIGN KEY(order_id) REFERENCES orders(id)) ENGINE=InnoDB",
  );
  // Canonical numbers give existing demo accounts the same phone login semantics
  // as registrations. A duplicate prevents the unique index rather than silently
  // merging unrelated accounts.
  await db.query(
    "UPDATE customers SET phone=REGEXP_REPLACE(phone,'[^0-9]','') WHERE phone IS NOT NULL",
  );
  await db.query(
    "UPDATE customers SET phone=CONCAT('94',SUBSTRING(phone,2)) WHERE phone LIKE '07%' AND LENGTH(phone)=10",
  );
  await db.query(
    "ALTER TABLE customers ADD UNIQUE KEY customers_phone_unique(phone)",
  );
}
export async function down(db) {
  await db.query("ALTER TABLE customers DROP commission_balance");
  await db.query("ALTER TABLE customers DROP INDEX customers_phone_unique");
  await db.query("DROP TABLE IF EXISTS referral_commissions");
  await db.query(
    "ALTER TABLE products DROP referral_level_1,DROP referral_level_2,DROP referral_level_3",
  );
  await db.query(
    "ALTER TABLE categories DROP FOREIGN KEY categories_parent_fk,DROP parent_id",
  );
}
