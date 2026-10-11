export async function up(db) {
  await db.query(`
    CREATE TABLE customers (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      first_name VARCHAR(60) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      phone VARCHAR(30) NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar VARCHAR(500) NULL,
      tier ENUM('bronze', 'silver', 'gold') NOT NULL DEFAULT 'bronze',
      points INT UNSIGNED NOT NULL DEFAULT 0,
      store_credit DECIMAL(10, 2) NOT NULL DEFAULT 0,
      preferences JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX customers_phone_index (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS customers");
}
