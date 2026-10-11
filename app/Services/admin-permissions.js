import { fail } from "./database.js";

const access = {
  "Catalog Manager": [
    "products",
    "categories",
    "coupons",
    "promotions",
    "flash-sale",
    "surprise-box",
    "bidding",
    "faq",
    "delivery",
    "reviews",
  ],
  "Support Agent": ["customers", "orders", "returns", "tickets", "faq"],
  Analyst: ["reports"],
};
export function authorizeAdmin(admin, kind, write = false) {
  if (admin.role === "Superadmin") return;
  if (!write && kind === "reports") return;
  if (!access[admin.role]?.includes(kind))
    fail("Your role cannot access this feature.", 403);
}
