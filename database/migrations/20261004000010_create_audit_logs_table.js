export async function up(db) {
  await db.query(`
    CREATE TABLE audit_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      actor VARCHAR(60) NOT NULL,
      level ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
      badge VARCHAR(20) NOT NULL,
      message VARCHAR(500) NOT NULL,
      ip VARCHAR(45) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX audit_logs_created_index (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(db) {
  await db.query("DROP TABLE IF EXISTS audit_logs");
}
