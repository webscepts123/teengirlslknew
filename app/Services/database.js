import { connect } from "noderyx-framework";

let connection;
export async function database() {
  if (!connection) {
    const { default: config } = await import("../../noderyx.config.js");
    connection = connect(config.database).catch((error) => {
      connection = null;
      throw error;
    });
  }
  return connection;
}

// Framework transactions expose the raw mysql2 connection. Keep the same
// rows-only query contract used by migrations and repositories.
export async function transaction(work) {
  const db = await database();
  return db.transaction((connection) =>
    work({
      query: async (sql, values = []) => {
        const [rows] = await connection.execute(sql, values);
        return rows;
      },
    }),
  );
}

export function fail(message, status = 422) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
export const jsonValue = (value, fallback = {}) =>
  typeof value === "string" ? JSON.parse(value) : (value ?? fallback);
export const money = (value) =>
  `Rs ${Number(value).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const initials = (name) =>
  String(name)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
export const titleCase = (value) =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export const boolean = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true" ||
  value === "on";
export function number(
  value,
  label,
  { min = 0, max = 100000000, integer = false } = {},
) {
  const result = Number(value);
  if (
    value === "" ||
    value == null ||
    !Number.isFinite(result) ||
    result < min ||
    result > max ||
    (integer && !Number.isInteger(result))
  )
    fail(`${label} is invalid.`);
  return result;
}
export function required(value, label, max = 191) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(`${label} is required (maximum ${max} characters).`);
  return value.trim();
}
