export async function up(db) {
  await db.query(`CREATE TABLE surprise_claims (
    customer_id BIGINT UNSIGNED PRIMARY KEY,
    feature_id BIGINT UNSIGNED NULL,
    order_id BIGINT UNSIGNED NULL,
    points_used INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
  ) ENGINE=InnoDB`);
  await db.query(`INSERT INTO surprise_claims(customer_id,order_id,points_used)
    SELECT o.customer_id,MIN(o.id),0 FROM orders o
    WHERE o.notes LIKE 'Special offer: surprise-box%' GROUP BY o.customer_id`);
}
export async function down(db) { await db.query('DROP TABLE IF EXISTS surprise_claims'); }
