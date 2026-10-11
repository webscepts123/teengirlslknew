export async function up(db) {
  // title, variant, unit_price and image are copied from the product at checkout,
  // so an order still reads correctly after the product changes or is removed.
  await db.query(`
    CREATE TABLE order_items (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NULL,
      title VARCHAR(191) NOT NULL,
      variant VARCHAR(120) NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      image VARCHAR(500) NULL,
      CONSTRAINT order_items_order_fk FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE,
      CONSTRAINT order_items_product_fk FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS order_items");
}
