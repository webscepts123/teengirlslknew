export async function up(db) {
  await db.query(`
    CREATE TABLE products (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sku VARCHAR(30) NOT NULL UNIQUE,
      title VARCHAR(191) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      original_price DECIMAL(10, 2) NULL,
      badge VARCHAR(40) NULL,
      stock INT UNSIGNED NOT NULL DEFAULT 0,
      allow_preorder BOOLEAN NOT NULL DEFAULT FALSE,
      image VARCHAR(500) NULL,
      colors JSON NULL,
      sizes JSON NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX products_category_index (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS products");
}
