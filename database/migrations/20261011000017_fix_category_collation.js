// Categories inherited the database default; products use utf8mb4_unicode_ci.
// Their name/category join requires matching column collations.
export async function up(db) {
  await db.query('ALTER TABLE categories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
}
export async function down() {
  // Keep compatible collations; reverting would reintroduce dashboard failures.
}
