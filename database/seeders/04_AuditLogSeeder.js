import { skipInProduction } from "../support.js";

const entries = [
  { minutesAgo: 1, actor: "admin", level: "info", badge: "AUTH", message: "Admin authenticated via secure session key", ip: "127.0.0.1" },
  { minutesAgo: 7, actor: "system", level: "success", badge: "HEALTH", message: "Database connection pool verified active (latency 1.4ms)", ip: "internal" },
  { minutesAgo: 30, actor: "system", level: "info", badge: "CACHE", message: "Memory cache garbage collection completed (0 items evicted)", ip: "internal" },
  { minutesAgo: 55, actor: "sconnor", level: "warning", badge: "SECURITY", message: "Rate limit threshold reached for IP 198.51.100.44", ip: "198.51.100.44" },
  { minutesAgo: 93, actor: "alex.m", level: "success", badge: "CONFIG", message: "Database pool limit verified (10 max connections)", ip: "127.0.0.1" }
];

export async function run(db) {
  if (skipInProduction("AuditLogSeeder")) return;

  // The log is append-only, so seed it only while it is empty.
  const [{ total }] = await db.query("SELECT COUNT(*) AS total FROM audit_logs");
  if (Number(total) > 0) return;

  for (const entry of entries) {
    await db.query(
      `INSERT INTO audit_logs (actor, level, badge, message, ip, created_at)
       VALUES (?, ?, ?, ?, ?, NOW() - INTERVAL ? MINUTE)`,
      [entry.actor, entry.level, entry.badge, entry.message, entry.ip, entry.minutesAgo]
    );
  }
}
