import os from "node:os";
import {
  hashPassword,
  verifyPassword,
  clearCompilerCache,
} from "noderyx-framework";
import { AppController } from "../AppController.js";
import {
  database,
  transaction,
  fail,
  required,
  number,
  money,
  initials,
  jsonValue,
  boolean,
} from "../../Services/database.js";
import { ordersFor } from "../../Services/customer.js";
import { validateFeature, featureRows } from "../../Services/features.js";
import { settingsFor } from "../../Services/settings.js";
import { saveProductImage } from "../../Services/uploads.js";
import { createManualOrder } from "../../Services/manual-order.js";
import { normalizeSriLankanPhone } from "../../../public/customer-registration-rules.js";
import { randomUUID } from "node:crypto";
import { authorizeAdmin } from "../../Services/admin-permissions.js";
import { updateOrder } from "../../Services/order-status.js";

const metrics = () => ({
  nodeVersion: process.version,
  platform: os.platform(),
  cpuCount: os.cpus().length,
  memPercent: `${Math.round((1 - os.freemem() / os.totalmem()) * 100)}%`,
  usedMemGB: `${((os.totalmem() - os.freemem()) / 1024 ** 3).toFixed(2)} GB`,
  totalMemGB: `${(os.totalmem() / 1024 ** 3).toFixed(2)} GB`,
  uptime: `${Math.floor(process.uptime() / 60)}m`,
});
export class AuthController extends AppController {
  async showLogin() {
    return this.render("sysadmin/login", {
      siteName: "TeenGirlsLK",
      pageTitle: "Admin Login",
      error: this.query.error ?? null,
      success: null,
      csrfToken: this.context.csrfToken,
    });
  }
  async login() {
    const b = this.body ?? {};
    const db = await database();
    const [admin] = await db.query(
      "SELECT * FROM admin_users WHERE (username=? OR email=?) AND status='active' LIMIT 1",
      [String(b.username || "").trim(), String(b.username || "").trim()],
    );
    if (
      admin?.password_hash &&
      (await verifyPassword(b.password || "", admin.password_hash))
    ) {
      this.context.session.isAdmin = true;
      this.context.session.adminId = admin.id;
      this.context.session.adminUser = admin.username;
      await db.query("UPDATE admin_users SET last_login_at=NOW() WHERE id=?", [
        admin.id,
      ]);
      await this.audit(db, "AUTH", "Administrator signed in");
      return this.redirect("/sysadmin/dashboard");
    }
    return this.render(
      "sysadmin/login",
      {
        siteName: "TeenGirlsLK",
        pageTitle: "Admin Login",
        error: "Invalid administrator credentials.",
        csrfToken: this.context.csrfToken,
      },
      401,
    );
  }
  async logout() {
    this.context.session.isAdmin = false;
    this.context.session.adminId = null;
    return this.redirect("/sysadmin/login");
  }
  async audit(db, badge, message) {
    await db.query(
      "INSERT INTO audit_logs(actor,level,badge,message,ip) VALUES (?,'info',?,?,?)",
      [
        this.context.session.adminUser || "admin",
        badge,
        message,
        this.request?.socket?.remoteAddress || "internal",
      ],
    );
  }
  async dashboard() {
    let admin;
    try {
      admin = await this.adminRecord();
    } catch (error) {
      if (error.status === 401) return this.redirect("/sysadmin/login");
      throw error;
    }
    const db = await database();
    const orders = await ordersFor();
    const products = (
      await db.query("SELECT * FROM products ORDER BY id DESC")
    ).map((p) => ({
      ...p,
      priceLabel: money(p.price),
      statusLabel: p.is_active ? "Active" : "Hidden",
    }));
    const categories = await db.query(
      "SELECT c.*,COUNT(p.id) AS productCount FROM categories c LEFT JOIN products p ON p.category=c.name GROUP BY c.id ORDER BY c.display_order,c.id",
    );
    const customerRows = (
      await db.query(
        "SELECT c.id,c.code,c.name,c.email,c.phone,c.tier,c.created_at,COUNT(o.id) AS orderCount,COALESCE(SUM(CASE WHEN o.status='delivered' THEN o.total ELSE 0 END),0) AS spent FROM customers c LEFT JOIN orders o ON o.customer_id=c.id GROUP BY c.id ORDER BY c.id DESC",
      )
    ).map((c) => ({
      ...c,
      initials: initials(c.name),
      tierLabel:
        c.tier === "gold"
          ? "VIP Gold"
          : c.tier === "silver"
            ? "Silver Club"
            : "Bronze",
      spentLabel: money(c.spent),
    }));
    const coupons = (
      await db.query("SELECT * FROM coupons ORDER BY id DESC")
    ).map((c) => ({
      ...c,
      typeLabel:
        c.discount_type === "percentage"
          ? "Percentage"
          : c.discount_type === "fixed"
            ? "Flat Deduction"
            : "Shipping",
      discountLabel:
        c.discount_type === "percentage"
          ? c.discount_value + "%"
          : money(c.discount_value),
      spendLabel: money(c.min_spend),
      quotaLabel:
        c.redemption_count + " / " + (c.redemption_limit ?? "Unlimited"),
      expiryLabel: c.valid_until
        ? new Date(c.valid_until).toLocaleDateString("en-GB")
        : "No expiry",
      statusLabel: c.is_active ? "Active" : "Paused",
    }));
    const [customers] = await db.query(
      "SELECT COUNT(*) AS total,SUM(is_active) AS active FROM customers",
    );
    const [catalog] = await db.query(
      "SELECT COUNT(*) AS products,COUNT(DISTINCT category) AS categories FROM products",
    );
    const [{ total: promotions }] = await db.query(
      "SELECT COUNT(*) AS total FROM feature_records WHERE kind='promotions' AND status='active'",
    );
    const [{ total: flashSale }] = await db.query(
      "SELECT COUNT(*) AS total FROM feature_records WHERE kind='flash-sale' AND status='active'",
    );
    const [{ total: returns }] = await db.query(
      "SELECT COUNT(*) AS total FROM return_requests",
    );
    const delivered = orders.filter((o) => o.status === "Delivered");
    const revenue = delivered.reduce((sum, o) => sum + o.numericTotal, 0);
    const kpi = (value) => ({
      value: String(value),
      trend: "Current totals",
      isDown: false,
      isNeutral: true,
    });
    const counts = (status) => orders.filter((o) => o.status === status).length;
    return this.render("sysadmin/dashboard", {
      siteName: "TeenGirlsLK",
      pageTitle: "Dashboard",
      adminUser: admin.name,
      adminRole: admin.role,
      adminInitials: initials(admin.name),
      csrfToken: this.context.csrfToken,
      dateRange: "All time",
      metrics: metrics(),
      services: [],
      users: [],
      logs: await db.query(
        "SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50",
      ),
      config: {},
      totalUsersCount: customers.total,
      activeUsersCount: customers.active,
      systemHealthScore: "",
      kpis: {
        totalCustomers: kpi(customers.total),
        activeUsers: kpi(customers.active || 0),
        totalRevenue: kpi(money(revenue)),
        totalSales: kpi(delivered.length),
        totalOrders: kpi(orders.length),
        returnOrders: kpi(returns),
      },
      fulfillment: {
        dispatched: {
          count: counts("Dispatched"),
          label: "Dispatched",
          sub: "Packed, awaiting pickup",
        },
        shipped: {
          count: counts("Shipped"),
          label: "Shipped",
          sub: "With the courier",
        },
        outForDelivery: {
          count: counts("Out For Delivery"),
          label: "Out for Delivery",
          sub: "After shipped",
        },
        delivered: {
          count: delivered.length,
          label: "Delivered",
          sub: "Handed to customer",
        },
      },
      quickSummary: { ...catalog, promotions, flashSale },
      recentOrders: orders,
      recentActivities: [],
      products,
      categories,
      customers: customerRows,
      coupons,
    });
  }
  async getMetrics() {
    return this.api(async () => {
      await this.adminRecord();
      return { metrics: metrics(), timestamp: new Date().toISOString() };
    });
  }
  async clearCache() {
    return this.api(async () => {
      await this.adminRecord();
      const app = this.service("app");
      app.assetCache.clear();
      app.viewCache.clear();
      clearCompilerCache();
      await this.audit(await database(), "CACHE", "Application cache cleared");
      return { message: "Application cache cleared." };
    });
  }
  async saveSettings() {
    return this.api(async () => {
      const admin = await this.adminRecord();
      if (admin.role !== "Superadmin") fail("Superadmin access required.", 403);
      const db = await database();
      const allowed = [
        "siteName",
        "description",
        "returnDays",
        "pointsPerLkr",
        "shippingCharge",
        "freeShippingAbove",
        "codFee", "pointValue", "codEnabled", "bankTransferEnabled", "pointsEnabled", "bankInstructions",
      ];
      for (const [key, value] of Object.entries(this.body ?? {})) {
        if (!allowed.includes(key)) continue;
        const validated = ["siteName", "description", "bankInstructions"].includes(key)
          ? required(value, key, 500)
          : number(value, key);
        await db.query(
          "INSERT INTO settings(setting_key,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
          [key, JSON.stringify(validated)],
        );
      }
      await this.audit(db, "CONFIG", "Store settings updated");
      return { message: "Settings saved." };
    });
  }
  async records() {
    return this.api(async () => {
      const admin = await this.adminRecord();
      const db = await database();
      const kind = this.query.kind;
      authorizeAdmin(admin, kind);
      if (kind === "settings") {
        if (admin.role !== "Superadmin")
          fail("Superadmin access required.", 403);
        return {
          records: [
            { id: 1, name: "Store Settings", data: await settingsFor(db) },
          ],
        };
      }
      if (kind === "products")
        return {
          records: (
            await db.query("SELECT * FROM products ORDER BY id DESC")
          ).map((p) => ({
            ...p,
            colors: jsonValue(p.colors, []),
            sizes: jsonValue(p.sizes, []),
          })),
        };
      if (kind === "categories")
        return {
          records: await db.query(
            "SELECT * FROM categories ORDER BY display_order,id",
          ),
        };
      if (kind === "coupons")
        return {
          records: await db.query("SELECT * FROM coupons ORDER BY id DESC"),
        };
      if (kind === "customers") {
        const records = await db.query(
          "SELECT id,code,name,email,phone,tier,points,store_credit,is_active FROM customers ORDER BY id DESC",
        );
        const addresses = await db.query(
          "SELECT id,customer_id,label,street,city,is_default FROM customer_addresses ORDER BY is_default DESC,id",
        );
        return {
          records: records.map((c) => ({
            ...c,
            addresses: addresses.filter((a) => a.customer_id === c.id),
          })),
        };
      }
      if (kind === "reviews")
        return {
          records: await db.query(
            "SELECT r.*,p.title AS name,c.name AS customer_name FROM product_reviews r JOIN products p ON p.id=r.product_id JOIN customers c ON c.id=r.customer_id ORDER BY r.id DESC",
          ),
        };
      if (kind === "orders" || kind === "returns")
        return {
          records:
            kind === "orders"
              ? await ordersFor()
              : await db.query(
                  "SELECT r.*,o.order_number FROM return_requests r JOIN orders o ON o.id=r.order_id ORDER BY r.id DESC",
                ),
        };
      if (kind === "tickets") {
        const records = await db.query(
          "SELECT t.*,c.name AS customer_name FROM support_tickets t JOIN customers c ON c.id=t.customer_id ORDER BY t.updated_at DESC",
        );
        const messages = await db.query(
          "SELECT ticket_id,actor,message,created_at FROM ticket_messages ORDER BY id",
        );
        return {
          records: records.map((t) => ({
            ...t,
            messages: messages.filter((m) => m.ticket_id === t.id),
          })),
        };
      }
      if (kind === "manage-admin") {
        if (admin.role !== "Superadmin")
          fail("Superadmin access required.", 403);
        return {
          records: await db.query(
            "SELECT id,username,name,email,role,status,last_login_at FROM admin_users ORDER BY id",
          ),
        };
      }
      return { records: await featureRows(db, kind) };
    });
  }
  async saveRecord() {
    return this.api(async () => {
      const admin = await this.adminRecord();
      const b = this.body ?? {};
      const kind = b.kind;
      authorizeAdmin(admin, kind, true);
      const id = b.id
        ? number(b.id, "Record ID", { integer: true, min: 1 })
        : null;
      await transaction(async (db) => {
        if (kind === "settings") {
          if (admin.role !== "Superadmin")
            fail("Superadmin access required.", 403);
          for (const key of [
            "siteName",
            "description",
            "returnDays",
            "pointsPerLkr",
            "shippingCharge",
            "freeShippingAbove",
        "codFee", "pointValue", "codEnabled", "bankTransferEnabled", "pointsEnabled", "bankInstructions",
          ]) {
            const value = ["siteName", "description", "bankInstructions"].includes(key)
              ? required(b[key], key, 500)
              : number(b[key], key, {
                  max:
                    key === "returnDays"
                      ? 30
                      : key === "pointsPerLkr"
                        ? 1
                        : 100000000,
                });
            await db.query(
              "INSERT INTO settings(setting_key,value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
              [key, JSON.stringify(value)],
            );
          }
        } else if (kind === "products") {
          const colors = String(b.colors || "")
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          const sizes = String(b.sizes || "")
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          const image = String(
            b.img || b.image || "/public/images/placeholder.svg",
          );
          if (!/^(https?:\/\/|\/public\/)/.test(image) || image.length > 500)
            fail("Use an image URL or a public asset path.");
          const vals = [
            required(b.sku, "SKU", 30),
            required(b.name || b.title, "Product name"),
            required(b.category, "Category", 100),
            number(b.price, "Price"),
            number(b.stock, "Stock", { integer: true }),
            image,
            JSON.stringify(colors),
            JSON.stringify(sizes),
            String(b.description || "").slice(0, 4000),
            b.status !== "Hidden",
            boolean(b.allowPreorder),
            ...["referralLevel1", "referralLevel2", "referralLevel3"].map(
              (key) => number(b[key] || 0, key),
            ),
          ];
          if (id)
            await db.query(
              "UPDATE products SET sku=?,title=?,category=?,price=?,stock=?,image=?,colors=?,sizes=?,description=?,is_active=?,allow_preorder=?,referral_level_1=?,referral_level_2=?,referral_level_3=? WHERE id=?",
              [...vals, id],
            );
          else
            await db.query(
              "INSERT INTO products(sku,title,category,price,stock,image,colors,sizes,description,is_active,allow_preorder,referral_level_1,referral_level_2,referral_level_3) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
              vals,
            );
        } else if (kind === "categories") {
          const parent = b.parentId
            ? number(b.parentId, "Parent category", { min: 1, integer: true })
            : null;
          if (parent) {
            let current = parent;
            const visited = new Set(id ? [id] : []);
            while (current) {
              if (visited.has(current))
                fail("Category hierarchy cannot contain a cycle.");
              visited.add(current);
              const [ancestor] = await db.query(
                "SELECT parent_id FROM categories WHERE id=?",
                [current],
              );
              if (!ancestor) fail("Parent category not found.");
              current = ancestor.parent_id;
            }
          }
          if (id) {
            const [old] = await db.query(
              "SELECT name FROM categories WHERE id=?",
              [id],
            );
            if (!old) fail("Category not found.", 404);
            await db.query("UPDATE products SET category=? WHERE category=?", [
              b.catName || b.name,
              old.name,
            ]);
          }

          const vals = [
            required(b.catName || b.name, "Category name", 100),
            required(b.catSlug || b.slug, "Slug", 120),
            required(b.catIcon || b.icon || "fa-bag-shopping", "Icon", 60),
            String(b.catDesc || b.description || ""),
            b.catStatus !== "Hidden",
            number(b.catOrder || b.display_order || 1, "Display order", {
              integer: true,
            }),
            parent,
          ];
          if (id)
            await db.query(
              "UPDATE categories SET name=?,slug=?,icon=?,description=?,is_active=?,display_order=?,parent_id=? WHERE id=?",
              [...vals, id],
            );
          else
            await db.query(
              "INSERT INTO categories(name,slug,icon,description,is_active,display_order,parent_id) VALUES (?,?,?,?,?,?,?)",
              vals,
            );
        } else if (kind === "coupons") {
          const type =
            {
              Percentage: "percentage",
              "Flat Deduction": "fixed",
              Shipping: "free_shipping",
            }[b.type] || b.discount_type;
          if (!["percentage", "fixed", "free_shipping"].includes(type))
            fail("Invalid discount type.");
          const value =
            type === "free_shipping"
              ? 0
              : number(
                  String(b.val ?? b.discount_value).replace(/[^0-9.]/g, ""),
                  "Discount",
                  { max: type === "percentage" ? 100 : 100000000 },
                );
          if (b.expiry && !/^\d{4}-\d{2}-\d{2}$/.test(b.expiry))
            fail("Invalid expiry.");
          const quota = String(b.limit || "0 / 100")
            .split("/")
            .pop()
            .trim();
          const vals = [
            required(b.code, "Coupon code", 40).toUpperCase(),
            b.title || b.code,
            type,
            value,
            number(b.spend ?? b.min_spend ?? 0, "Minimum spend"),
            b.expiry || null,
            number(quota, "Redemption limit", { integer: true, min: 1 }),
            b.status === "Active",
          ];
          if (id)
            await db.query(
              "UPDATE coupons SET code=?,title=?,discount_type=?,discount_value=?,min_spend=?,valid_until=?,redemption_limit=?,is_active=? WHERE id=?",
              [...vals, id],
            );
          else
            await db.query(
              "INSERT INTO coupons(code,title,discount_type,discount_value,min_spend,valid_until,redemption_limit,is_active) VALUES (?,?,?,?,?,?,?,?)",
              vals,
            );
        } else if (kind === "customers") {
          const tier = String(b.custTier || b.tier || "").toLowerCase();
          const normalized = tier.includes("gold")
            ? "gold"
            : tier.includes("silver")
              ? "silver"
              : "bronze";
          const email = required(b.custEmail || b.email, "Email");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Invalid email.");
          const phone = normalizeSriLankanPhone(b.custPhone || b.phone);
          if (!phone) fail("Enter a valid Sri Lankan phone number.");
          const name = required(b.custName || b.name, "Name", 120);
          if (id)
            await db.query(
              "UPDATE customers SET name=?,email=?,phone=?,tier=? WHERE id=?",
              [name, email, phone, normalized, id],
            );
          else {
            if (String(b.password || "").length < 8)
              fail("A new customer password must have at least 8 characters.");
            const code = "CUST-" + randomUUID().slice(0, 12);
            const result = await db.query(
              "INSERT INTO customers(code,name,first_name,last_name,email,phone,password_hash,tier,referral_code) VALUES (?,?,?,?,?,?,?,?,?)",
              [
                code,
                name,
                name.split(" ")[0],
                name.split(" ").slice(1).join(" "),
                email,
                phone,
                await hashPassword(b.password),
                normalized,
                randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
              ],
            );
            if (b.custCity && b.street)
              await db.query(
                "INSERT INTO customer_addresses(customer_id,recipient_name,phone,street,city,district,is_default) VALUES (?,?,?,?,?,?,1)",
                [
                  result.insertId,
                  name,
                  phone,
                  required(b.street, "Street", 255),
                  required(b.custCity, "City", 100),
                  required(b.district, "District", 100),
                ],
              );
          }
        } else if (kind === "orders") {
          if (id) await updateOrder(db, id, b);
          else await createManualOrder(db, b);
        } else if (kind === "returns") {
          const [r] = await db.query(
            "SELECT * FROM return_requests WHERE id=? FOR UPDATE",
            [id],
          );
          if (!r) fail("Return not found.", 404);
          if (!["approved", "rejected", "completed"].includes(b.status))
            fail("Invalid return status.");
          if (b.status === "completed" && r.status !== "approved")
            fail("Approve the return before completion.");
          if (r.status === "completed" || r.status === "rejected")
            fail("Return is already closed.");
          await db.query("UPDATE return_requests SET status=? WHERE id=?", [
            b.status,
            id,
          ]);
          if (b.status === "completed")
            await updateOrder(db, r.order_id, { status: "returned" });
        } else if (kind === "reviews") {
          const result = await db.query(
            "UPDATE product_reviews SET is_approved=? WHERE id=?",
            [boolean(b.isApproved), id],
          );
          if (!result.affectedRows) fail("Review not found.", 404);
        } else if (kind === "manage-admin") {
          if (admin.role !== "Superadmin")
            fail("Superadmin access required.", 403);
          if (
            ![
              "Superadmin",
              "Catalog Manager",
              "Support Agent",
              "Analyst",
            ].includes(b.role)
          )
            fail("Invalid role.");
          if (!["active", "suspended"].includes(b.status))
            fail("Invalid status.");
          if (
            id === Number(admin.id) &&
            (b.status !== "active" || b.role !== "Superadmin")
          )
            fail("You cannot remove your own administrator access.");
          const vals = [
            required(b.username, "Username", 60),
            required(b.name, "Name", 120),
            required(b.email, "Email"),
            b.role,
            b.status,
          ];
          if (id)
            await db.query(
              "UPDATE admin_users SET username=?,name=?,email=?,role=?,status=? WHERE id=?",
              [...vals, id],
            );
          else {
            if (String(b.password || "").length < 8)
              fail(
                "New administrator password must have at least 8 characters.",
              );
            await db.query(
              "INSERT INTO admin_users(username,name,email,role,status,password_hash) VALUES (?,?,?,?,?,?)",
              [...vals, await hashPassword(b.password)],
            );
          }
          if (id && b.password) {
            if (b.password.length < 8) fail("Password too short.");
            await db.query(
              "UPDATE admin_users SET password_hash=? WHERE id=?",
              [await hashPassword(b.password), id],
            );
          }
        } else if (kind === "tickets") {
          if (!id) fail("Select an existing customer ticket.");
          if (!["open", "in_progress", "closed"].includes(b.status))
            fail("Invalid ticket status.");
          const [ticket] = await db.query(
            "SELECT id FROM support_tickets WHERE id=?",
            [id],
          );
          if (!ticket) fail("Ticket not found.", 404);
          if (b.reply)
            await db.query(
              "INSERT INTO ticket_messages(ticket_id,actor,message) VALUES (?,?,?)",
              [id, admin.name, required(b.reply, "Reply", 4000)],
            );
          await db.query("UPDATE support_tickets SET status=? WHERE id=?", [
            b.status,
            id,
          ]);
        } else {
          const data = await validateFeature(kind, b, db);
          if (id && kind === "bidding") {
            const [auction] = await db.query(
              "SELECT data FROM feature_records WHERE id=? AND kind=? FOR UPDATE",
              [id, kind],
            );
            if (auction && jsonValue(auction.data).orderId)
              fail("Purchased auctions cannot be edited.");
            if(auction){
              const [bids]=await db.query('SELECT COUNT(*) count FROM auction_bids WHERE auction_id=?',[id]);
              if(bids.count>0)fail('A round with bids cannot be edited. Finish the round or have participants cancel their bids first.');
            }
          }
          if (id) {
            const result = await db.query(
              "UPDATE feature_records SET name=?,status=?,data=? WHERE id=? AND kind=?",
              [data.name, b.status || "active", JSON.stringify(data), id, kind],
            );
            if (!result.affectedRows) fail("Record not found.", 404);
          } else
            await db.query(
              "INSERT INTO feature_records(kind,name,status,data) VALUES (?,?,?,?)",
              [kind, data.name, b.status || "active", JSON.stringify(data)],
            );
          if (kind==='surprise-box' && (b.status || 'active')==='active') {
            const [published] = await db.query("SELECT id FROM feature_records WHERE kind='surprise-box' AND name=? ORDER BY id DESC LIMIT 1",[data.name]);
            await db.query("UPDATE feature_records SET status='paused' WHERE kind='surprise-box' AND id<>? AND status='active'",[id || published.id]);
          }
          if (kind==='bidding' && (b.status || 'active')==='active') {
            const [published]=await db.query("SELECT id FROM feature_records WHERE kind='bidding' AND name=? ORDER BY id DESC LIMIT 1",[data.name]);
            const chosen=id||published.id;
            const [pending]=await db.query("SELECT b.id FROM auction_bids b JOIN feature_records f ON f.id=b.auction_id WHERE f.kind='bidding' AND f.status='active' AND f.id<>? LIMIT 1",[chosen]);
            if(pending)fail('Finish the current bidding round before publishing another.');
            await db.query("UPDATE feature_records SET status='paused' WHERE kind='bidding' AND id<>? AND status='active'",[chosen]);
          }
        }
        await this.audit(db, "SAVE", `${kind} ${id || "new"} saved`);
      });
      return { message: "Changes saved." };
    });
  }
  async deleteRecord() {
    return this.api(async () => {
      const admin = await this.adminRecord();
      const b = this.body ?? {};
      authorizeAdmin(admin, b.kind, true);
      const id = number(b.id, "Record ID", { min: 1, integer: true });
      const db = await database();
      if(b.kind==='bidding') {
        await transaction(async q=>{
          const [round]=await q.query("SELECT id FROM feature_records WHERE id=? AND kind='bidding' FOR UPDATE",[id]);
          if(!round)fail('Bidding round not found.',404);
          const [bids]=await q.query('SELECT COUNT(*) count FROM auction_bids WHERE auction_id=?',[id]);
          if(bids.count>0)fail('Rounds with bids cannot be deleted because participants have spent points.');
          await q.query('DELETE FROM feature_records WHERE id=?',[id]);
          await this.audit(q,'DELETE',`bidding ${id} removed`);
        });
        return {message:'Record removed.'};
      }
      if (b.kind === "products")
        await db.query("UPDATE products SET is_active=0 WHERE id=?", [id]);
      else if (b.kind === "coupons")
        await db.query("UPDATE coupons SET is_active=0 WHERE id=?", [id]);
      else if (b.kind === "categories")
        await db.query("UPDATE categories SET is_active=0 WHERE id=?", [id]);
      else if (
        [
          "promotions",
          "flash-sale",
          "surprise-box",
          "bidding",
          "delivery",
          "payouts",
          "faq",
        ].includes(b.kind)
      )
        await db.query("DELETE FROM feature_records WHERE id=? AND kind=?", [
          id,
          b.kind,
        ]);
      else fail("This record cannot be deleted.");
      await this.audit(db, "DELETE", `${b.kind} ${id} removed`);
      return { message: "Record removed." };
    });
  }
  async upload() {
    return this.api(async () => {
      const admin = await this.adminRecord();
      authorizeAdmin(admin, "products", true);
      return { url: await saveProductImage(this.body.imageData) };
    });
  }
  async reports() {
    return this.api(async () => {
      await this.adminRecord();
      const db = await database();
      const start = this.query.start || "2000-01-01",
        end = this.query.end || "2100-01-01";
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
        start > end
      )
        fail("Invalid date range.");
      return {
        daily: await db.query(
          "SELECT DATE(placed_at) AS day,COUNT(*) AS orders,SUM(CASE WHEN status='delivered' THEN total ELSE 0 END) AS revenue FROM orders WHERE placed_at>=? AND placed_at<DATE_ADD(?,INTERVAL 1 DAY) GROUP BY DATE(placed_at) ORDER BY day",
          [start, end],
        ),
        categories: await db.query(
          "SELECT p.category,SUM(i.quantity) AS quantity,SUM(i.quantity*i.unit_price) AS revenue FROM order_items i JOIN products p ON p.id=i.product_id JOIN orders o ON o.id=i.order_id WHERE o.status='delivered' AND o.placed_at>=? AND o.placed_at<DATE_ADD(?,INTERVAL 1 DAY) GROUP BY p.category",
          [start, end],
        ),
      };
    });
  }
}
