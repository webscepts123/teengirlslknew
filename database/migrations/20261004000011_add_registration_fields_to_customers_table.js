// Fields collected by the customer register form. nic and referral_code are
// nullable so existing customers stay valid; MySQL allows many NULLs in a
// UNIQUE index.
export async function up(db) {
  await db.query(`
    ALTER TABLE customers
      ADD COLUMN last_name VARCHAR(60) NULL AFTER first_name,
      ADD COLUMN nic VARCHAR(12) NULL AFTER phone,
      ADD COLUMN referral_code VARCHAR(20) NULL AFTER nic,
      ADD COLUMN referred_by_customer_id BIGINT UNSIGNED NULL AFTER referral_code,
      ADD UNIQUE INDEX customers_nic_unique (nic),
      ADD UNIQUE INDEX customers_referral_code_unique (referral_code),
      ADD CONSTRAINT customers_referred_by_fk FOREIGN KEY (referred_by_customer_id)
        REFERENCES customers (id) ON DELETE SET NULL
  `);
}

export async function down(db) {
  await db.query(`
    ALTER TABLE customers
      DROP FOREIGN KEY customers_referred_by_fk,
      DROP INDEX customers_referral_code_unique,
      DROP INDEX customers_nic_unique,
      DROP COLUMN referred_by_customer_id,
      DROP COLUMN referral_code,
      DROP COLUMN nic,
      DROP COLUMN last_name
  `);
}
