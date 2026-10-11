export async function up(db) {
  await db.query(`
    CREATE TABLE orders (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(20) NOT NULL UNIQUE,
      customer_id BIGINT UNSIGNED NOT NULL,
      shipping_address_id BIGINT UNSIGNED NULL,
      status ENUM('pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')
        NOT NULL DEFAULT 'pending',
      total DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(60) NOT NULL,
      payment_status VARCHAR(40) NOT NULL,
      courier_name VARCHAR(80) NULL,
      tracking_number VARCHAR(60) NULL,
      placed_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX orders_customer_placed_index (customer_id, placed_at),
      INDEX orders_status_index (status),
      CONSTRAINT orders_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE RESTRICT,
      CONSTRAINT orders_shipping_address_fk FOREIGN KEY (shipping_address_id)
        REFERENCES customer_addresses (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS orders");
}
