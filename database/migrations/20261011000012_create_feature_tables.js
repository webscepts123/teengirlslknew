export async function up(db) {
  await db.query(
    `ALTER TABLE customers ADD is_active BOOLEAN NOT NULL DEFAULT TRUE`,
  );
  await db.query(`ALTER TABLE products ADD description TEXT NULL`);
  await db.query(
    `ALTER TABLE orders MODIFY status ENUM('pending','processing','dispatched','shipped','out_for_delivery','delivered','cancelled','returned') NOT NULL DEFAULT 'pending', ADD delivered_at DATETIME NULL, ADD shipping_total DECIMAL(10,2) NOT NULL DEFAULT 0, ADD discount_total DECIMAL(10,2) NOT NULL DEFAULT 0, ADD coupon_id BIGINT UNSIGNED NULL, ADD notes TEXT NULL`,
  );
  await db.query(
    `ALTER TABLE coupons ADD redemption_limit INT UNSIGNED NULL, ADD redemption_count INT UNSIGNED NOT NULL DEFAULT 0, ADD valid_from DATE NULL`,
  );
  await db.query(
    `CREATE TABLE categories (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, slug VARCHAR(120) NOT NULL UNIQUE, icon VARCHAR(60) NOT NULL DEFAULT 'fa-bag-shopping', description TEXT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, display_order INT NOT NULL DEFAULT 1) ENGINE=InnoDB`,
  );
  await db.query(
    `CREATE TABLE settings (setting_key VARCHAR(100) PRIMARY KEY, value JSON NOT NULL) ENGINE=InnoDB`,
  );
  await db.query(
    `CREATE TABLE feature_records (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, kind VARCHAR(40) NOT NULL, name VARCHAR(191) NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'active', data JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX feature_kind(kind)) ENGINE=InnoDB`,
  );
  await db.query(
    `CREATE TABLE support_tickets (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, customer_id BIGINT UNSIGNED NOT NULL, subject VARCHAR(191) NOT NULL, message TEXT NOT NULL, priority VARCHAR(20) NOT NULL DEFAULT 'normal', status VARCHAR(20) NOT NULL DEFAULT 'open', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY(customer_id) REFERENCES customers(id)) ENGINE=InnoDB`,
  );
  await db.query(
    `CREATE TABLE ticket_messages (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, ticket_id BIGINT UNSIGNED NOT NULL, actor VARCHAR(191) NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE) ENGINE=InnoDB`,
  );
  await db.query(
    `CREATE TABLE reward_transactions (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, customer_id BIGINT UNSIGNED NOT NULL, amount INT NOT NULL, reason VARCHAR(191) NOT NULL, order_id BIGINT UNSIGNED NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY reward_order(reason,order_id), FOREIGN KEY(customer_id) REFERENCES customers(id)) ENGINE=InnoDB`,
  );
  await db.query(
    `CREATE TABLE password_resets (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, customer_id BIGINT UNSIGNED NOT NULL, token_hash VARCHAR(64) NOT NULL UNIQUE, expires_at DATETIME NOT NULL, used_at DATETIME NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE) ENGINE=InnoDB`,
  );
}
export async function down(db) {
  for (const table of [
    "password_resets",
    "reward_transactions",
    "ticket_messages",
    "support_tickets",
    "feature_records",
    "settings",
    "categories",
  ])
    await db.query(`DROP TABLE IF EXISTS ${table}`);
  await db.query(
    "ALTER TABLE coupons DROP redemption_limit, DROP redemption_count, DROP valid_from",
  );
  await db.query(
    "ALTER TABLE orders DROP delivered_at, DROP shipping_total, DROP discount_total, DROP coupon_id, DROP notes",
  );
  await db.query("ALTER TABLE products DROP description");
  await db.query("ALTER TABLE customers DROP is_active");
}
