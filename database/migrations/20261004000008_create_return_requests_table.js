export async function up(db) {
  await db.query(`
    CREATE TABLE return_requests (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ticket VARCHAR(20) NOT NULL UNIQUE,
      order_id BIGINT UNSIGNED NOT NULL,
      customer_id BIGINT UNSIGNED NOT NULL,
      action_type ENUM('return', 'exchange') NOT NULL DEFAULT 'return',
      reason VARCHAR(191) NOT NULL,
      comments TEXT NULL,
      status ENUM('open', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT return_requests_order_fk FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE,
      CONSTRAINT return_requests_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS return_requests");
}
