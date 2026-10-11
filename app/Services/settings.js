import { jsonValue } from "./database.js";
export async function settingsFor(db) {
  return Object.fromEntries(
    (await db.query("SELECT * FROM settings")).map((row) => [
      row.setting_key,
      jsonValue(row.value),
    ]),
  );
}
