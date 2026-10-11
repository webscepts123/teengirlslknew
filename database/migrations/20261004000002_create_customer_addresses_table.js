export async function up(db) {
  await db.query(`
    CREATE TABLE customer_addresses (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      customer_id BIGINT UNSIGNED NOT NULL,
      label VARCHAR(60) NOT NULL DEFAULT 'Home',
      recipient_name VARCHAR(120) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      street VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      district VARCHAR(100) NOT NULL DEFAULT 'Colombo',
      postal_code VARCHAR(10) NULL,
      notes VARCHAR(255) NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT customer_addresses_customer_fk FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS customer_addresses");
}
