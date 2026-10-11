import { hashPassword } from "noderyx-framework";
import { skipInProduction } from "../support.js";

// The superadmin comes from ADMIN_USER / ADMIN_PASSWORD / ADMIN_EMAIL and is
// created on every environment. An existing account keeps its password, so
// re-running the seeder never resets a password that was changed later.
const staff = [
  { username: "sconnor", name: "Sarah Connor", email: "sconnor@teensgirls.com", role: "Security Lead", status: "active" },
  { username: "alex.m", name: "Alex Mercer", email: "alex.m@teensgirls.com", role: "Database Engineer", status: "active" },
  { username: "devon", name: "Devon Vance", email: "devon@teensgirls.com", role: "Moderator", status: "suspended" },
  { username: "elena", name: "Elena Rostova", email: "elena@teensgirls.com", role: "Platform Analyst", status: "active" }
];

export async function run(db) {
  const username = process.env.ADMIN_USER ?? "admin";
  const email = process.env.ADMIN_EMAIL ?? "admin@teensgirls.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  await db.query(
    `INSERT IGNORE INTO admin_users (username, name, email, password_hash, role, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [username, "System Administrator", email, await hashPassword(password), "Superadmin"]
  );

  if (skipInProduction("demo staff accounts")) return;

  // Demo staff have no password and cannot sign in until one is set.
  for (const member of staff) {
    await db.query(
      `INSERT INTO admin_users (username, name, email, role, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [member.username, member.name, member.email, member.role, member.status]
    );
  }
}
