export async function up(db) {
  await db.query(
    `CREATE TABLE cart_items (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, customer_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL, color VARCHAR(60) NOT NULL DEFAULT '', size VARCHAR(30) NOT NULL DEFAULT '', quantity INT UNSIGNED NOT NULL DEFAULT 1, UNIQUE KEY cart_variant(customer_id,product_id,color,size), FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE, FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE) ENGINE=InnoDB`,
  );
  await db.query(
    `CREATE TABLE product_reviews (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, customer_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL, rating INT UNSIGNED NOT NULL, comment TEXT NOT NULL, is_approved BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY review_customer_product(customer_id,product_id), FOREIGN KEY(customer_id) REFERENCES customers(id), FOREIGN KEY(product_id) REFERENCES products(id)) ENGINE=InnoDB`,
  );
  await db.query(
    `CREATE TABLE auction_bids (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, auction_id BIGINT UNSIGNED NOT NULL, customer_id BIGINT UNSIGNED NOT NULL, amount DECIMAL(10,2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(auction_id) REFERENCES feature_records(id) ON DELETE CASCADE, FOREIGN KEY(customer_id) REFERENCES customers(id)) ENGINE=InnoDB`,
  );
}
export async function down(db) {
  for (const table of ["auction_bids", "product_reviews", "cart_items"])
    await db.query(`DROP TABLE IF EXISTS ${table}`);
}
