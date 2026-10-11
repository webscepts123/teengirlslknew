import { Controller } from "noderyx-framework";

import { settingsFor } from "../Services/settings.js";
import { database, money } from "../Services/database.js";
import { currentSurprise } from '../Services/surprise-box.js';

const ICONS = [
  [/cloth|dress|wear|frock|fashion/i, "fa-shirt"],
  [/beauty|health|cosmetic|skin/i, "fa-spa"],
  [/jewel|watch|ring|necklace/i, "fa-gem"],
  [/bag|shoe|foot|sandal/i, "fa-bag-shopping"],
  [/access/i, "fa-glasses"],
  [/gift|toy/i, "fa-gift"],
];
function categoryIcon(category) {
  const found = ICONS.find(([pattern]) => pattern.test(category.name));
  if (found) return found[1];
  return category.icon && category.icon !== "fa-bag-shopping" ? category.icon : "fa-tag";
}

export class HomeController extends Controller {
  async index() {
    const customer = this.context.session?.customer ?? null;
    const db = await database();
    const settings = await settingsFor(db);
    const categories = await db.query(
      "SELECT name,slug,icon FROM categories WHERE is_active=1 AND parent_id IS NULL ORDER BY display_order,id",
    );
    const values = [];
    let where = "is_active=1";
    if (this.query.category) {
      const descendants = await db.query(`WITH RECURSIVE selected AS (
        SELECT id,name FROM categories WHERE name=? AND is_active=1
        UNION ALL SELECT c.id,c.name FROM categories c JOIN selected s ON c.parent_id=s.id WHERE c.is_active=1
      ) SELECT name FROM selected`, [String(this.query.category)]);
      const names = descendants.length ? descendants.map(c => c.name) : [String(this.query.category)];
      where += " AND category IN (" + names.map(() => '?').join(',') + ")";
      values.push(...names);
    }
    if (this.query.q) {
      where += " AND (title LIKE ? OR sku LIKE ?)";
      values.push(
        "%" + String(this.query.q).slice(0, 100) + "%",
        "%" + String(this.query.q).slice(0, 100) + "%",
      );
    }
    const products = await db.query(
      "SELECT * FROM products WHERE " +
        where +
        " ORDER BY created_at DESC LIMIT 24",
      values,
    );

    const bestSellers = await db.query(
      "SELECT p.sku,p.title,p.price,p.image,(SELECT ROUND(AVG(r.rating),1) FROM product_reviews r WHERE r.product_id=p.id AND r.is_approved=1) AS rating FROM products p WHERE p.is_active=1 ORDER BY (p.badge='Best Seller') DESC,p.stock DESC,p.id LIMIT 4",
    );
    const categoryImages = {};
    for (const product of products)
      categoryImages[product.category] ??= product.image;

    const now = Date.now();
    const live = (data) =>
      (!data.startsAt || Date.parse(data.startsAt) <= now) &&
      (!data.endsAt || Date.parse(data.endsAt) > now);
    const records = await db.query(
      "SELECT kind,data FROM feature_records WHERE kind IN ('promotions','flash-sale') AND status='active'",
    );
    const parsed = records.map((row) => ({
      kind: row.kind,
      data: typeof row.data === "string" ? JSON.parse(row.data) : row.data ?? {},
    })).filter((row) => live(row.data));
    const promotion = parsed.find((row) => row.kind === "promotions")?.data ?? null;
    const flash = {};
    for (const row of parsed)
      if (row.kind === "flash-sale" && Number(row.data.quantity) > 0)
        flash[row.data.productSku] = Number(row.data.salePrice);
    const offerJson = Buffer.from(JSON.stringify({
      freeShippingMin: 5000,
      hasSurprise: Boolean(await currentSurprise(db)),
      promotion: promotion && {
        name: promotion.name,
        percent: Number(promotion.discountPercent) || 0,
        minSpend: Number(promotion.minSpend) || 0,
        category: promotion.category || "",
      },
      products: products.map((product) => ({
        sku: product.sku,
        slug: String(product.sku).replace(/\//g, "-"),
        title: product.title,
        price: Number(product.price),
        image: product.image,
        category: product.category,
        stock: Number(product.stock),
        flashPrice: flash[product.sku] ?? null,
      })),
    })).toString("base64");

    return this.render("home", {
      offerJson,
      siteName: settings.siteName || "TeenGirlsLK",
      pageTitle: "Trendy Fashion for Teen Girls",
      description:
        settings.description ||
        process.env.SITE_DESCRIPTION ||
        "Trendy fashion, beauty and accessories for teen girls in Sri Lanka.",
      customer,
      surpriseBox:await currentSurprise(db),
      csrfToken: this.context.csrfToken,
      categories: categories.map((category) => ({
        ...category,
        iconClass: categoryIcon(category),
        categoryQuery: encodeURIComponent(category.name),
        image: categoryImages[category.name] ?? null,
      })),
      navCategories: categories.slice(0, 5).map((category) => ({
        name: category.name,
        slug: category.slug,
        categoryQuery: encodeURIComponent(category.name),
      })),
      bestSellers: bestSellers.map((product) => ({
        ...product,
        slug: String(product.sku).replace(/\//g, "-"),
        priceLabel: money(product.price),
      })),
      products: products.slice(0, 8).map((product) => ({
        ...product,
        slug: String(product.sku).replace(/\//g, "-"),
        priceLabel: money(product.price),
        originalPriceLabel: product.original_price
          ? money(product.original_price)
          : null,
      })),
      year: new Date().getFullYear(),
    });
  }

  async health() {
    return this.json({ status: "ok", runtime: "Node.js" });
  }
}
