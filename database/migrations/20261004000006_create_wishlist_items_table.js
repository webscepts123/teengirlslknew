export async function up(db) {
  await db.query(`
    CREATE TABLE wishlist_items (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customer_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY wishlist_items_customer_product_unique (customer_id, product_id),
      CONSTRAINT wishlist_items_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE CASCADE,
      CONSTRAINT wishlist_items_product_fk FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS wishlist_items");
}
