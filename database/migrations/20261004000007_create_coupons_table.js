export async function up(db) {
  // customer_id is NULL for public coupons and set for personal vouchers,
  // such as those created when a customer redeems reward points.
  await db.query(`
    CREATE TABLE coupons (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(40) NOT NULL UNIQUE,
      customer_id BIGINT UNSIGNED NULL,
      title VARCHAR(191) NOT NULL,
      discount_type ENUM('percentage', 'fixed', 'free_shipping') NOT NULL,
      discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
      min_spend DECIMAL(10, 2) NOT NULL DEFAULT 0,
      required_tier ENUM('bronze', 'silver', 'gold') NULL,
      badge VARCHAR(40) NULL,
      valid_until DATE NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT coupons_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS coupons");
}
