import { AppController } from "./AppController.js";

import { settingsFor } from "../Services/settings.js";
import { database, money, jsonValue, transaction } from "../Services/database.js";
import {latestBidding} from '../Services/points-bidding.js';
import { currentSurprise } from '../Services/surprise-box.js';

const PAGE_SIZE = 12;
const SORTS = [
  ["new", "Newest"],
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["name", "Name A–Z"],
];
const STEPS = [
  ["pending", "Order Placed", "fa-receipt"],
  ["processing", "Processing", "fa-box-open"],
  ["shipped", "Shipped", "fa-truck-fast"],
  ["out_for_delivery", "Out for Delivery", "fa-motorcycle"],
  ["delivered", "Delivered", "fa-circle-check"],
];
const text = (value, max = 100) => String(value ?? "").trim().slice(0, max);
const cardOf = (product) => ({
  ...product,
  priceLabel: money(product.price),
  originalPriceLabel:
    Number(product.original_price) > Number(product.price)
      ? money(product.original_price)
      : null,
  discount:
    Number(product.original_price) > Number(product.price)
      ? Math.round((1 - product.price / product.original_price) * 100)
      : 0,
  soldOut: Number(product.stock) <= 0 && !product.allow_preorder,
});

export class ShopController extends AppController {
  async layout(db, pageTitle, extra = {}) {
    const settings = await settingsFor(db);
    const categories = await db.query(
      "SELECT name,slug,icon FROM categories WHERE is_active=1 AND parent_id IS NULL ORDER BY display_order,id",
    );
    return {
      siteName: settings.siteName || "TeenGirlsLK",
      description:
        settings.description ||
        "Trendy fashion, beauty and accessories for teen girls in Sri Lanka.",
      pageTitle,
      customer: this.context.session?.customer ?? null,
      csrfToken: this.context.csrfToken,
      categories,
      navCategories: categories.slice(0, 5),
      year: new Date().getFullYear(),
      ...extra,
    };
  }

  async category() {
    const db = await database();
    const all = await db.query(
      "SELECT id,name,slug,description,parent_id FROM categories WHERE is_active=1 ORDER BY display_order,id",
    );
    let slug = this.params.slug;
    if (!slug && this.query.category) {
      const byName = all.find((c) => c.name === String(this.query.category));
      if (byName) return this.redirect("/category/" + byName.slug);
    }
    const current = slug ? all.find((c) => c.slug === slug) : null;
    if (slug && !current) return this.abort(404, "Category not found");

    let names = null;
    if (current) {
      const ids = new Set([current.id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of all)
          if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
            ids.add(c.id);
            grew = true;
          }
      }
      names = all.filter((c) => ids.has(c.id)).map((c) => c.name);
    }

    const q = text(this.query.q);
    let rows = await db.query(
      "SELECT * FROM products WHERE is_active=1" +
        (names ? " AND category IN (" + names.map(() => "?").join(",") + ")" : "") +
        (q ? " AND (title LIKE ? OR sku LIKE ?)" : "") +
        " ORDER BY created_at DESC LIMIT 600",
      [...(names ?? []), ...(q ? [`%${q}%`, `%${q}%`] : [])],
    );
    rows = rows.map((p) => ({
      ...p,
      colors: jsonValue(p.colors, []),
      sizes: jsonValue(p.sizes, []),
    }));

    const facetSizes = [...new Set(rows.flatMap((p) => p.sizes))].slice(0, 20);
    const facetColors = [...new Set(rows.flatMap((p) => p.colors))].slice(0, 20);
    const f = {
      q,
      min: this.query.min === undefined || this.query.min === "" ? "" : Number(this.query.min),
      max: this.query.max === undefined || this.query.max === "" ? "" : Number(this.query.max),
      size: text(this.query.size, 30),
      color: text(this.query.color, 60),
      sale: this.query.sale === "1",
      stock: this.query.stock === "1",
      sort: SORTS.some(([key]) => key === this.query.sort) ? this.query.sort : "new",
      page: Math.max(1, parseInt(this.query.page, 10) || 1),
    };
    if (f.min !== "" && !Number.isFinite(f.min)) f.min = "";
    if (f.max !== "" && !Number.isFinite(f.max)) f.max = "";

    const priceRange = rows.length
      ? [Math.floor(Math.min(...rows.map((p) => Number(p.price)))), Math.ceil(Math.max(...rows.map((p) => Number(p.price))))]
      : [0, 0];

    let list = rows.filter(
      (p) =>
        (f.min === "" || Number(p.price) >= f.min) &&
        (f.max === "" || Number(p.price) <= f.max) &&
        (!f.size || p.sizes.includes(f.size)) &&
        (!f.color || p.colors.includes(f.color)) &&
        (!f.sale || Number(p.original_price) > Number(p.price)) &&
        (!f.stock || Number(p.stock) > 0),
    );
    const sorters = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      name: (a, b) => a.title.localeCompare(b.title),
    };
    if (sorters[f.sort]) list = list.sort(sorters[f.sort]);

    const base = current ? "/category/" + current.slug : "/shop";
    const href = (override = {}) => {
      const next = { ...f, ...override };
      const params = new URLSearchParams();
      for (const key of ["q", "min", "max", "size", "color"])
        if (next[key] !== "" && next[key] !== undefined) params.set(key, next[key]);
      if (next.sale) params.set("sale", "1");
      if (next.stock) params.set("stock", "1");
      if (next.sort !== "new") params.set("sort", next.sort);
      if (next.page > 1) params.set("page", next.page);
      const query = params.toString();
      return base + (query ? "?" + query : "");
    };
    const toggle = (key, value) => (f[key] === value ? "" : value);

    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const page = Math.min(f.page, pages);
    const children = current
      ? all.filter((c) => c.parent_id === current.id)
      : all.filter((c) => !c.parent_id);
    const parent = current?.parent_id ? all.find((c) => c.id === current.parent_id) : null;
    const activeFilters = [
      f.q && { label: `Search: ${f.q}`, href: href({ q: "", page: 1 }) },
      (f.min !== "" || f.max !== "") && {
        label: `Price: ${f.min === "" ? "0" : f.min} – ${f.max === "" ? "Any" : f.max}`,
        href: href({ min: "", max: "", page: 1 }),
      },
      f.size && { label: `Size: ${f.size}`, href: href({ size: "", page: 1 }) },
      f.color && { label: f.color, href: href({ color: "", page: 1 }) },
      f.sale && { label: "On sale", href: href({ sale: false, page: 1 }) },
      f.stock && { label: "In stock", href: href({ stock: false, page: 1 }) },
    ].filter(Boolean);

    return this.render(
      "store",
      await this.layout(db, current ? current.name : "Shop All", {
        view: "category",
        isCategory: true,
        heading: current ? current.name : q ? `Results for “${q}”` : "Shop All",
        intro: current?.description || "Discover trendy picks for every day.",
        formAction: base,
        filters: f,
        hasFilters: activeFilters.length > 0,
        activeFilters,
        clearHref: base,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
        total: list.length,
        resultLabel: list.length === 1 ? "1 product" : `${list.length} products`,
        products: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(cardOf),
        sortOptions: SORTS.map(([key, label]) => ({
          label,
          href: href({ sort: key, page: 1 }),
          active: f.sort === key,
        })),
        sizeOptions: facetSizes.map((value) => ({
          value,
          href: href({ size: toggle("size", value), page: 1 }),
          active: f.size === value,
        })),
        colorOptions: facetColors.map((value) => ({
          value,
          href: href({ color: toggle("color", value), page: 1 }),
          active: f.color === value,
        })),
        saleHref: href({ sale: !f.sale, page: 1 }),
        stockHref: href({ stock: !f.stock, page: 1 }),
        saleActive: f.sale,
        stockActive: f.stock,
        children: children.map((c) => ({
          name: c.name,
          href: "/category/" + c.slug,
        })),
        childrenTitle: current ? "Subcategories" : "Categories",
        parentName: parent?.name ?? "",
        parentHref: parent ? "/category/" + parent.slug : "",
        hasParent: Boolean(parent),
        pagination:
          pages > 1
            ? Array.from({ length: pages }, (_, i) => ({
                number: i + 1,
                href: href({ page: i + 1 }),
                active: i + 1 === page,
              }))
            : [],
        hasPrev: page > 1,
        hasNext: page < pages,
        prevHref: href({ page: page - 1 }),
        nextHref: href({ page: page + 1 }),
      }),
    );
  }

  async product() {
    const db = await database();
    const [row] = await db.query(
      "SELECT * FROM products WHERE REPLACE(sku,'/','-')=? AND is_active=1",
      [text(this.params.sku, 30)],
    );
    if (!row) return this.abort(404, "Product not found");
    const product = {
      ...cardOf(row),
      colors: jsonValue(row.colors, []),
      sizes: jsonValue(row.sizes, []),
    };
    const [category] = await db.query(
      "SELECT name,slug FROM categories WHERE name=?",
      [row.category],
    );
    const reviews = await db.query(
      "SELECT r.rating,r.comment,r.created_at,COALESCE(c.first_name,c.name) AS author FROM product_reviews r JOIN customers c ON c.id=r.customer_id WHERE r.product_id=? AND r.is_approved=1 ORDER BY r.created_at DESC LIMIT 10",
      [row.id],
    );
    const average = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
    const related = await db.query(
      "SELECT * FROM products WHERE is_active=1 AND category=? AND id<>? ORDER BY created_at DESC LIMIT 4",
      [row.category, row.id],
    );
    const stockLabel =
      product.stock <= 0
        ? product.allow_preorder ? "Pre-order available" : "Out of stock"
        : product.stock <= 5 ? `Only ${product.stock} left` : "In stock";

    return this.render(
      "store",
      await this.layout(db, product.title, {
        view: "product",
        isProduct: true,
        product,
        stockLabel,
        canBuy: product.stock > 0 || Boolean(product.allow_preorder),
        categoryName: row.category,
        categoryHref: category ? "/category/" + category.slug : "/shop",
        about:
          product.description ||
          `${product.title} from the ${row.category} collection. Made for everyday teen style.`,
        hasColors: product.colors.length > 0,
        hasSizes: product.sizes.length > 0,
        reviews: reviews.map((r) => ({
          ...r,
          stars: stars(r.rating),
          date: new Date(r.created_at).toLocaleDateString("en-GB"),
        })),
        hasReviews: reviews.length > 0,
        averageLabel: average ? average.toFixed(1) : "",
        averageStars: stars(Math.round(average)),
        reviewCount: reviews.length,
        related: related.map(cardOf),
        hasRelated: related.length > 0,
      }),
    );
  }

  async track(error = "", order = null, old = {}) {
    const db = await database();
    return this.render(
      "store",
      await this.layout(db, "Track Your Order", {
        view: "track",
        isTrack: true,
        error,
        order,
        old,
      }),
    );
  }

  async trackForm() {
    return this.track("", null, { number: text(this.query.order, 20) });
  }

  async trackLookup() {
    const body = this.body ?? {};
    const number = text(body.orderNumber, 20).toUpperCase().replace(/^#/, "");
    const contact = text(body.contact, 120).toLowerCase();
    const old = { number, contact };
    if (!number || !contact)
      return this.track("Enter your order number and the email or phone used for the order.", null, old);
    const db = await database();
    const [row] = await db.query(
      "SELECT o.*,c.email,c.phone FROM orders o JOIN customers c ON c.id=o.customer_id WHERE o.order_number=?",
      [number],
    );
    const digits = (v) => String(v ?? "").replace(/\D/g, "").slice(-9);
    const matches =
      row &&
      ((row.email && row.email.toLowerCase() === contact) ||
        (digits(contact).length >= 9 && digits(row.phone) === digits(contact)));
    if (!matches)
      return this.track("We couldn't find an order matching those details.", null, old);

    const items = await db.query(
      "SELECT title,variant,unit_price,quantity,image FROM order_items WHERE order_id=?",
      [row.id],
    );
    const closed = ["cancelled", "returned"].includes(row.status);
    const reached = STEPS.findIndex(([key]) => key === row.status);
    return this.track("", {
      number: row.order_number,
      status: row.status.replace(/_/g, " "),
      closed,
      placed: new Date(row.placed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      courier: row.courier_name || "",
      trackingNumber: row.tracking_number || "",
      hasCourier: Boolean(row.courier_name || row.tracking_number),
      totalLabel: money(row.total),
      steps: STEPS.map(([key, label, icon], index) => ({
        label,
        icon,
        done: !closed && index <= reached,
        current: !closed && index === reached,
      })),
      items: items.map((item) => ({
        ...item,
        priceLabel: money(item.unit_price),
        totalLabel: money(item.unit_price * item.quantity),
      })),
    }, old);
  }

  async rows(db, kind) {
    return (
      await db.query(
        "SELECT id,name,data,status FROM feature_records WHERE kind=? AND status IN ('active','completed') ORDER BY id DESC",
        [kind],
      )
    ).map((r) => ({ ...r, data: jsonValue(r.data) }));
  }

  async infoPage(view, title, extra) {
    const db = await database();
    return this.render(
      "store",
      await this.layout(db, title, { view, [`is${view}`]: true, infoTitle: title, ...(await extra(db)) }),
    );
  }

  faq() {
    return this.infoPage("Faq", "Frequently Asked Questions", async (db) => {
      const rows = (await this.rows(db, "faq")).sort(
        (a, b) => Number(a.data.displayOrder) - Number(b.data.displayOrder),
      );
      return { faqs: rows.map((r) => ({ question: r.name, answer: r.data.answer })), hasItems: rows.length > 0 };
    });
  }

  delivery() {
    return this.infoPage("Delivery", "Delivery Information", async (db) => {
      const rows = await this.rows(db, "delivery");
      return {
        hasItems: rows.length > 0,
        services: rows.map((r) => ({
          name: r.name,
          area: [r.data.city, r.data.district].filter(Boolean).join(", ") || "Islandwide",
          charge: money(r.data.charge),
          freeAbove: Number(r.data.freeAbove) > 0 ? money(r.data.freeAbove) : "—",
          days: r.data.estimatedDays ? `${r.data.estimatedDays} day(s)` : "—",
        })),
      };
    });
  }

  offers() {
    return this.infoPage("Offers", "Offers & Promotions", async (db) => {
      const now = Date.now();
      const rows = (await this.rows(db, "promotions")).filter(
        (r) => r.status === "active" && Date.parse(r.data.endsAt) > now,
      );
      return {
        hasItems: rows.length > 0,
        offers: rows.map((r) => ({
          name: r.name,
          discount: r.data.discountPercent,
          minSpend: Number(r.data.minSpend) > 0 ? money(r.data.minSpend) : "No minimum",
          category: r.data.category || "All categories",
          ends: new Date(r.data.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        })),
      };
    });
  }

  flash() {
    return this.infoPage("Flash", "Flash Sale", async (db) => {
      const now = Date.now();
      const rows = (await this.rows(db, "flash-sale")).filter(
        (r) => r.status === "active" && Date.parse(r.data.endsAt) > now,
      );
      const sales = [];
      for (const r of rows) {
        const [p] = await db.query("SELECT sku,title,image,price FROM products WHERE sku=? AND is_active=1", [r.data.productSku]);
        if (!p) continue;
        sales.push({
          name: r.name,
          sku: p.sku,
          title: p.title,
          image: p.image,
          saleLabel: money(r.data.salePrice),
          oldLabel: money(p.price),
          discount: Math.max(0, Math.round((1 - r.data.salePrice / p.price) * 100)),
          left: r.data.quantity,
          endsAt: r.data.endsAt,
          started: Date.parse(r.data.startsAt) <= now,
        });
      }
      return { hasItems: sales.length > 0, sales };
    });
  }

  auctions() {
    return this.infoPage('Auctions','Bid & Win',async()=>{
      const round=await transaction(db=>latestBidding(db));
      return {hasItems:Boolean(round),auctions:round?[{name:round.name,title:round.product?.title,image:round.product?.image,currentLabel:round.highest+' points',nextLabel:'1 point',bids:round.total,claimHours:round.claimHours}]:[]};
    });
  }

  surprise() {
    return this.infoPage("Surprise", "Surprise Boxes", async (db) => {
      const box=await currentSurprise(db);
      const rows=box?[box]:[];
      return {
        hasItems: rows.length > 0,
        boxes: rows.map((r) => ({
          name: r.name,
          priceLabel: `${r.points} points`,
          description: r.description,
        })),
      };
    });
  }
}
