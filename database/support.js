// Helpers shared by the seeders. Kept outside database/seeders/ because every
// .js file in that directory is run as a seeder.

export const isProduction = () => process.env.NODE_ENV === "production";

// Demo seeders call this first so `npm run seed` on a live server never
// mixes sample customers and orders into real data.
export function skipInProduction(name) {
  if (!isProduction()) return false;
  console.log(`Skipping ${name}: demo data is not seeded when NODE_ENV=production.`);
  return true;
}

export async function idFor(db, table, column, value) {
  const [row] = await db.query(`SELECT id FROM ${table} WHERE ${column} = ? LIMIT 1`, [value]);
  if (!row) throw new Error(`${table}.${column} = ${value} not found; run the seeders in order`);
  return row.id;
}

export function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
