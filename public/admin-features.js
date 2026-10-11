import { featureSchemas } from "./admin-feature-schema.js";
import {
  api,
  escapeHtml as esc,
  field,
  message,
  downloadCsv,
} from "./feature-client.js";

const existingForms = {
  "tgl-product-form": "products",
  "tgl-category-form": "categories",
  "tgl-coupon-form": "coupons",
  "tgl-customer-form": "customers",
};
const schemas = {
  ...featureSchemas,
  settings: [
    ["siteName", "Store name", "text"],
    ["description", "Store description", "textarea"],
    ["returnDays", "Return window (days)", "number"],
    ["pointsPerLkr", "Reward points per LKR", "number"],
    ["shippingCharge", "Default shipping charge (LKR)", "number"],
    ["freeShippingAbove", "Free shipping threshold (LKR)", "number"],
    ["codFee", "Cash on delivery fee (LKR)", "number"],
    ["pointValue", "LKR value per checkout point", "number"],
    ["codEnabled", "Enable cash on delivery (1 or 0)", "number"],
    ["bankTransferEnabled", "Enable bank transfer (1 or 0)", "number"],
    ["pointsEnabled", "Enable points payment (1 or 0)", "number"],
    ["bankInstructions", "Bank transfer instructions", "textarea"],
  ],
  "manage-admin": [
    ["username", "Username", "text"],
    ["name", "Full name", "text"],
    ["email", "Email", "email"],
    ["password", "Password (required for new accounts)", "password", true],
    ["role", "Role", "select"],
  ],
  tickets: [
    ["name", "Ticket subject", "text"],
    ["reply", "Reply", "textarea", true],
  ],
  returns: [["name", "Return request", "text"]],
  reviews: [
    ["name", "Product", "text"],
    ["isApproved", "Approved (true / false)", "text"],
  ],
};
const cache = new Map();
const statusSelect = (kind, value = "active") => {
  const options =
    kind === "manage-admin"
      ? ["active", "suspended"]
      : kind === "tickets"
        ? ["open", "in_progress", "closed"]
        : kind === "returns"
          ? ["approved", "rejected", "completed"]
          : ["active", "paused", "scheduled", "completed"];
  return `<div class="tgl-form-group"><label class="tgl-form-label">Status</label><select class="tgl-select" name="status">${options.map((o) => `<option ${o === value ? "selected" : ""} value="${o}">${esc(o.replaceAll("_", " "))}</option>`).join("")}</select></div>`;
};
async function load(kind) {
  const { records } = await api(
    "/sysadmin/api/records?kind=" + encodeURIComponent(kind),
  );
  cache.set(kind, records);
  return records;
}

function makeForm(kind, record = null) {
  const data = record?.data || record || {};
  const pane = document.getElementById("tab-" + kind);
  let card = pane.querySelector("[data-editor]");
  if (!card) {
    card = document.createElement("div");
    card.className = "tgl-form-section-card";
    card.dataset.editor = kind;
    pane.querySelector(".tgl-section-hero")?.after(card);
    if (!card.isConnected) pane.prepend(card);
  }
  card.innerHTML = `<div class="tgl-section-card-head"><h3 class="tgl-section-card-title">${record ? "Edit" : "Add"} ${esc(kind.replaceAll("-", " "))}</h3></div><div class="tgl-section-card-body"><form data-feature-form="${kind}"><input type="hidden" name="id" value="${record?.id || ""}"><div class="tgl-form-grid">${schemas[kind].map(([key, label, type, optional]) => (type === "select" ? `<div class="tgl-form-group"><label class="tgl-form-label">Role</label><select class="tgl-select" name="role">${["Superadmin", "Catalog Manager", "Support Agent", "Analyst"].map((r) => `<option ${data.role === r ? "selected" : ""}>${r}</option>`).join("")}</select></div>` : field(key, label, type, key === "name" && kind === "tickets" ? record?.subject || "" : key === "isApproved" ? String(Boolean(record?.is_approved)) : (data[key] ?? ""), !optional))).join("")}${statusSelect(kind, record?.status)}</div>${record?.message ? "<p>" + esc(record.message) + "</p>" : ""}${record?.comment ? "<p>Rating " + esc(record.rating) + ": " + esc(record.comment) + "</p>" : ""}${(record?.messages || []).map((m) => "<p><strong>" + esc(m.actor) + "</strong>: " + esc(m.message) + "</p>").join("")}<p data-feature-message role="status"></p><div class="tgl-form-actions-bar"><button class="tgl-btn-outline" type="button" data-close-editor>Cancel</button><button class="tgl-btn-primary" type="submit">Save changes</button></div></form></div>`;
  card.querySelector("[data-close-editor]").onclick = () => card.remove();
  if (["tickets", "returns", "reviews"].includes(kind)) {
    card.querySelector('[name="name"]').readOnly = true;
  }
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}
async function refreshFeature(kind) {
  const pane = document.getElementById("tab-" + kind);
  if (!pane) return;
  try {
    const records = await load(kind);
    let list = pane.querySelector("[data-feature-list]");
    if (!list) {
      // Retain the hero and its styling; replace sample records with saved data.
      for (const child of [...pane.children])
        if (
          !child.classList.contains("tgl-section-hero") &&
          !child.dataset.editor
        )
          child.remove();
      list = document.createElement("div");
      list.className = "tgl-card";
      list.dataset.featureList = kind;
      pane.append(list);
    }
    list.innerHTML = `<div class="tgl-card-head"><h2 class="tgl-card-title">Saved ${esc(kind.replaceAll("-", " "))}</h2><button class="tgl-btn-primary" data-add-feature="${kind}" type="button">Add record</button></div><div class="tgl-summary-list">${records.map((r) => `<div class="tgl-summary-row"><div class="tgl-summary-left"><div><strong>${esc(r.name || r.subject || r.ticket || r.username)}</strong><p class="tgl-card-sub">${esc(r.status)}${r.customer_name ? " · " + esc(r.customer_name) : ""}</p></div></div><div class="tgl-summary-right"><button class="tgl-btn-table-action" data-edit-feature="${kind}" data-id="${r.id}" type="button">Edit</button>${featureSchemas[kind] ? `<button class="tgl-btn-table-action" data-delete-feature="${kind}" data-id="${r.id}" type="button">Delete</button>` : ""}</div></div>`).join("") || '<p class="tgl-card-sub">No saved records yet.</p>'}</div>`;
    if (["tickets", "returns", "reviews", "settings"].includes(kind))
      list.querySelector("[data-add-feature]").remove();
    pane.querySelectorAll(".tgl-hero-actions button").forEach((button) => {
      button.removeAttribute("onclick");
      button.dataset.addFeature = kind;
    });
  } catch (error) {
    message(error.message);
  }
}
// Capture existing forms before the demonstration submit handlers can mutate rows.
document.addEventListener(
  "submit",
  async (event) => {
    const form = event.target;
    const kind = existingForms[form.id] || form.dataset.featureForm;
    if (!kind) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const b = Object.fromEntries(new FormData(form));
    b.kind = kind;
    b.id ||= form.dataset.recordId;
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      if (kind === "products" && b.img?.startsWith("data:")) {
        b.img = (await api("/sysadmin/api/upload", { imageData: b.img })).url;
      }
      await api("/sysadmin/api/records/save", b);
      message("Changes saved.");
      if (existingForms[form.id] || kind === "orders") {
        location.hash = kind;
        location.reload();
      } else {
        form.closest("[data-editor]").remove();
        await refreshFeature(kind);
      }
    } catch (error) {
      const feedback = form.querySelector("[data-feature-message]");
      if (feedback) feedback.textContent = error.message;
      else message(error.message);
    } finally {
      if (submit) submit.disabled = false;
    }
  },
  true,
);

document.addEventListener(
  "click",
  async (event) => {
    const button = event.target.closest("button,a");
    if (!button) return;
    if (button.dataset.submitForm) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById(button.dataset.submitForm)?.requestSubmit();
      return;
    }
    if (button.id === "tgl-modal-action") {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelector('[data-feature-form="orders"]')?.requestSubmit();
      return;
    }
    if (button.id === "tgl-modal-print") {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.print();
      return;
    }
    const action = button.dataset.action;
    if (action === "new-order") {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.switchTab("order-form");
      document.getElementById("modal-order-title").textContent = "New Order";
      document.getElementById("tgl-modal-content").innerHTML =
        `<div class="tgl-form-section-card"><div class="tgl-section-card-body"><form data-feature-form="orders"><div class="tgl-form-grid">${field("customerCode", "Customer code")}${field("addressId", "Customer delivery address ID", "number")}${field("productSku", "Product SKU")}${field("quantity", "Quantity", "number", 1)}${field("color", "Color", "text", "", false)}${field("size", "Size", "text", "", false)}<label>Payment <select class="tgl-select" name="paymentMethod"><option value="cod">Cash on delivery</option><option value="bank_transfer">Bank transfer</option></select></label></div><p data-feature-message role="status"></p><button class="tgl-btn-primary" type="submit">Create order</button></form></div></div>`;
      return;
    }
    if (
      action &&
      /^(add|edit)-(product|category|coupon|customer)$/.test(action)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const kind = {
        product: "products",
        category: "categories",
        coupon: "coupons",
        customer: "customers",
      }[action.split("-")[1]];
      const form = document.getElementById(
        Object.keys(existingForms).find((id) => existingForms[id] === kind),
      );
      const row = button.closest("[data-record-id]");
      form.reset();
      form.dataset.recordId = action.startsWith("edit")
        ? row?.dataset.recordId || ""
        : "";
      const singular = action.split("-")[1];
      window.switchTab(singular + "-form");
      const title = document.getElementById(
        {
          product: "modal-prod-title",
          category: "modal-cat-title",
          coupon: "modal-coup-title",
          customer: "modal-cust-title",
        }[singular],
      );
      if (title)
        title.textContent =
          (action.startsWith("edit") ? "Edit " : "Add ") + singular;
      if (action.startsWith("edit") && row) {
        try {
          const records = cache.get(kind) || (await load(kind));
          const record = records.find(
            (r) => String(r.id) === row.dataset.recordId,
          );
          fillExisting(kind, form, record);
        } catch (error) {
          message(error.message);
        }
      }
      return;
    }
    const feature =
      button.dataset.addFeature ||
      button.dataset.editFeature ||
      button.dataset.deleteFeature;
    if (feature) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (button.dataset.deleteFeature) {
        if (!confirm("Delete this saved record?")) return;
        try {
          await api("/sysadmin/api/records/delete", {
            kind: feature,
            id: button.dataset.id,
          });
          await refreshFeature(feature);
        } catch (error) {
          message(error.message);
        }
        return;
      }
      const records = cache.get(feature) || (await load(feature));
      const record = button.dataset.editFeature
        ? records.find((r) => String(r.id) === button.dataset.id)
        : null;
      if (["tickets", "returns"].includes(feature) && !record) {
        message("Select a saved customer request.");
        return;
      }
      makeForm(feature, record);
      return;
    }
    if (
      button.dataset.orderView ||
      button.dataset.action === "view-order" ||
      button.dataset.action === "edit-order" ||
      (button.closest("#tab-orders") &&
        button.classList.contains("tgl-btn-table-action"))
    ) {
      const row = button.closest("[data-record-id]");
      if (row) {
        event.preventDefault();
        event.stopImmediatePropagation();
        await openOrder(row.dataset.recordId);
        return;
      }
    }
    if (["tgl-bulk-status", "tgl-bulk-delete"].includes(button.id)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const rows = [...document.querySelectorAll(".tgl-row-check:checked")]
        .map((c) => c.closest("[data-record-id]"))
        .filter(Boolean);
      if (!rows.length) return;
      if (!confirm(`Apply this action to ${rows.length} saved records?`))
        return;
      try {
        for (const row of rows) {
          const kind = row.closest(".tgl-tab-pane").id.replace("tab-", "");
          if (button.id === "tgl-bulk-status") {
            if (kind !== "orders")
              throw new Error("Completion applies to orders only.");
            await api("/sysadmin/api/records/save", {
              kind,
              id: row.dataset.recordId,
              status: "delivered",
            });
          } else
            await api("/sysadmin/api/records/delete", {
              kind,
              id: row.dataset.recordId,
            });
        }
        location.reload();
      } catch (error) {
        message(error.message);
      }
      return;
    }
    if (button.id === "tgl-date-picker-btn") {
      event.preventDefault();
      event.stopImmediatePropagation();
      showReportForm();
      return;
    }
    if (button.closest("#tab-reports")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showReportForm();
      return;
    }
  },
  true,
);

function fillExisting(kind, form, r) {
  if (!r) return;
  const set = (name, value) => {
    if (form.elements[name]) form.elements[name].value = value ?? "";
  };
  if (kind === "products") {
    set("name", r.title);
    set("sku", r.sku);
    set("category", r.category);
    set("price", r.price);
    set("stock", r.stock);
    set("status", r.is_active ? "Active" : "Hidden");
    set("img", r.image);
    set("description", r.description);
    set("colors", (r.colors || []).join(", "));
    set("sizes", (r.sizes || []).join(", "));
    set("allowPreorder", r.allow_preorder ? "true" : "false");
    for (let level = 1; level <= 3; level++)
      set("referralLevel" + level, r["referral_level_" + level]);
    const preview = document.getElementById("prod-img-preview");
    if (preview) preview.src = r.image;
  }
  if (kind === "categories") {
    set("catName", r.name);
    set("catSlug", r.slug);
    set("catIcon", r.icon);
    set("catDesc", r.description);
    set("catStatus", r.is_active ? "Active" : "Hidden");
    set("catOrder", r.display_order);
    set("parentId", r.parent_id);
  }
  if (kind === "coupons") {
    set("code", r.code);
    set(
      "type",
      r.discount_type === "percentage"
        ? "Percentage"
        : r.discount_type === "fixed"
          ? "Flat Deduction"
          : "Shipping",
    );
    set("val", r.discount_value);
    set("spend", r.min_spend);
    set("expiry", r.valid_until?.slice(0, 10));
    set("limit", `${r.redemption_count} / ${r.redemption_limit || 100}`);
    set("status", r.is_active ? "Active" : "Paused");
  }
  if (kind === "customers") {
    set("custName", r.name);
    set("custEmail", r.email);
    set("custPhone", r.phone);
    set(
      "custTier",
      r.tier === "gold"
        ? "VIP Gold"
        : r.tier === "silver"
          ? "Silver Club"
          : "Bronze",
    );
  }
}
async function openOrder(id) {
  try {
    const orders = await load("orders");
    const o = orders.find((r) => String(r.dbId) === String(id));
    if (!o) throw new Error("Order not found.");
    window.switchTab("order-form");
    document.getElementById("modal-order-title").textContent = `Order ${o.id}`;
    document.getElementById("tgl-modal-content").innerHTML =
      `<div class="tgl-form-section-card"><div class="tgl-section-card-body"><p>${esc(o.customer)} · ${esc(o.total)} · ${esc(o.payment)}</p>${o.items.map((i) => `<p>${esc(i.title)} — ${esc(i.variant)} × ${i.quantity} · ${esc(i.price)}</p>`).join("")}<form data-feature-form="orders"><input type="hidden" name="id" value="${o.dbId}"><div class="tgl-form-grid"><div class="tgl-form-group"><label class="tgl-form-label">Order status</label><select class="tgl-select" name="status">${["pending", "processing", "dispatched", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"].map((s) => `<option value="${s}" ${s.replaceAll("_", " ").toLowerCase() === o.status.toLowerCase() ? "selected" : ""}>${esc(s.replaceAll("_", " "))}</option>`).join("")}</select></div>${field("paymentStatus", "Payment status", "text", o.paymentStatus)}${field("courierName", "Courier", "text", o.courierName, false)}${field("trackingNumber", "Tracking / waybill number", "text", o.trackingNumber, false)}${field("notes", "Internal notes", "textarea", o.notes, false)}</div><p data-feature-message role="status"></p><button type="submit" class="tgl-btn-primary">Save order</button></form></div></div>`;
    const action = document.getElementById("tgl-modal-action");
    action.onclick = () =>
      document.querySelector('[data-feature-form="orders"]').requestSubmit();
    action.textContent = "Save order";
    document.getElementById("tgl-modal-print").onclick = () => window.print();
    document
      .querySelectorAll(
        "#tab-order-form .tgl-form-actions-bar .tgl-btn-primary",
      )
      .forEach((b) => {
        b.removeAttribute("onclick");
        b.onclick = () =>
          document
            .querySelector('[data-feature-form="orders"]')
            .requestSubmit();
      });
  } catch (error) {
    message(error.message);
  }
}
function showReportForm() {
  window.switchTab("reports");
  let card = document.querySelector("#tab-reports [data-report]");
  if (!card) {
    card = document.createElement("div");
    card.className = "tgl-form-section-card";
    card.dataset.report = "";
    document.getElementById("tab-reports").append(card);
  }
  card.innerHTML = `<div class="tgl-section-card-body"><form id="report-form"><div class="tgl-form-grid">${field("start", "Start date", "date", new Date(new Date().getFullYear(), 0, 1).toLocaleDateString("en-CA"))}${field("end", "End date", "date", new Date().toLocaleDateString("en-CA"))}</div><button class="tgl-btn-primary" type="submit">Export sales CSV</button></form><div data-report-result></div></div>`;
  card.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const values = new URLSearchParams(new FormData(e.target));
      const data = await api("/sysadmin/api/reports?" + values);
      downloadCsv(data.daily, "sales-report.csv");
      card.querySelector("[data-report-result]").textContent =
        `${data.daily.length} daily records exported.`;
    } catch (error) {
      message(error.message);
    }
  };
}
// Add variant inputs to the existing product form using the same form classes.
const productForm = document.getElementById("tgl-product-form");
const group = productForm?.querySelector(".tgl-form-grid");
if (group) {
  group.insertAdjacentHTML(
    "beforeend",
    field("colors", "Colors (comma separated)", "text", "", false) +
      field("sizes", "Sizes (comma separated)", "text", "", false) +
      [1, 2, 3]
        .map((level) =>
          field(
            "referralLevel" + level,
            "Referral level " + level + " (LKR)",
            "number",
            0,
          ),
        )
        .join("") +
      `<div class="tgl-form-group"><label class="tgl-form-label">Allow preorders</label><select class="tgl-select" name="allowPreorder"><option value="false">No</option><option value="true">Yes</option></select></div>`,
  );
}
document
  .querySelector("#tgl-category-form .tgl-form-grid")
  ?.insertAdjacentHTML(
    "beforeend",
    field(
      "parentId",
      "Parent category ID (blank for root)",
      "number",
      "",
      false,
    ),
  );
document
  .querySelector("#tgl-customer-form .tgl-form-grid")
  ?.insertAdjacentHTML(
    "beforeend",
    field("password", "Password (new customers only)", "password", "", false) +
      field(
        "street",
        "Street (new customer delivery address)",
        "text",
        "",
        false,
      ) +
      field("district", "District", "text", "", false),
  );
// Ensure all catalog categories are selectable, including newly created ones.
load("categories")
  .then((records) => {
    const select = productForm.elements.category;
    select.innerHTML = records
      .map((c) => `<option>${esc(c.name)}</option>`)
      .join("");
  })
  .catch((error) => message(error.message));
const returnPane = document.createElement("div");
returnPane.id = "tab-returns";
returnPane.className = "tgl-tab-pane";
document.getElementById("tab-orders").after(returnPane);
const settingsPane = document.createElement("div");
settingsPane.id = "tab-settings";
settingsPane.className = "tgl-tab-pane";
returnPane.after(settingsPane);
const settingsLink = document.createElement("a");
settingsLink.className = "tgl-nav-item";
settingsLink.href = "#settings";
settingsLink.dataset.tab = "settings";
settingsLink.textContent = "Store Settings";
document.querySelector(".tgl-sidebar-footer").before(settingsLink);
const reviewPane = document.createElement("div");
reviewPane.id = "tab-reviews";
reviewPane.className = "tgl-tab-pane";
returnPane.after(reviewPane);
for (const [hash, tab] of [
  ["#inventory", "products"],
  ["#category-tree", "categories"],
  ["#orders-pending", "orders"],
  ["#orders-shipped", "orders"],
  ["#orders-returns", "returns"],
  ["#reviews", "reviews"],
])
  document.querySelectorAll(`a[href="${hash}"]`).forEach((link) => {
    link.removeAttribute("onclick");
    link.dataset.tab = tab;
    link.href = "#" + tab;
  });
const returnLink = document.createElement("a");
returnLink.className = "tgl-btn-outline";
returnLink.href = "#returns";
returnLink.dataset.tab = "returns";
returnLink.textContent = "Return requests";
document
  .querySelector("#tab-orders .tgl-card-head-actions")
  ?.append(returnLink);
window.addEventListener("hashchange", () => {
  if (location.hash === "#returns") window.switchTab("returns");
});
const initial = location.hash.slice(1);
if (schemas[initial]) refreshFeature(initial);
for (const kind of Object.keys(schemas)) {
  const pane = document.getElementById("tab-" + kind);
  if (pane && kind !== initial) {
    for (const child of [...pane.children])
      if (!child.classList.contains("tgl-section-hero")) child.remove();
    pane.insertAdjacentHTML(
      "beforeend",
      '<div class="tgl-card"><p class="tgl-card-sub">Open this feature to load saved records.</p></div>',
    );
  }
}

window.addEventListener("hashchange", () => {
  const kind = location.hash.slice(1);
  if (schemas[kind]) refreshFeature(kind);
});

async function charts() {
  try {
    const data = await api("/sysadmin/api/reports");
    const revenueMount = document.getElementById("tgl-revenue-chart-mount");
    const rows = data.daily.slice(-31);
    const max = Math.max(1, ...rows.map((r) => Number(r.revenue)));
    const points = rows
      .map(
        (r, i) =>
          `${65 + (i * 585) / Math.max(1, rows.length - 1)},${125 - (Number(r.revenue) / max) * 105}`,
      )
      .join(" ");
    revenueMount.innerHTML = `<svg class="tgl-revenue-chart" viewBox="0 0 680 160" width="100%" height="160"><line x1="55" y1="125" x2="660" y2="125" stroke="#E2E8F0"/><text x="8" y="24" fill="#94A3B8" font-size="11">Rs ${esc(max)}</text><text x="8" y="129" fill="#94A3B8" font-size="11">Rs 0</text><polyline points="${points}" fill="none" stroke="#FF2A7A" stroke-width="2.5"/></svg><div class="tgl-chart-xaxis">${rows
      .filter((_, i) => i % Math.max(1, Math.ceil(rows.length / 7)) === 0)
      .map((r) => `<span>${esc(String(r.day).slice(0, 10))}</span>`)
      .join("")}</div>`;
    const categories = data.categories;
    const total = categories.reduce((sum, r) => sum + Number(r.quantity), 0);
    const colors = [
      "#FF2A7A",
      "#8B5CF6",
      "#06B6D4",
      "#F59E0B",
      "#10B981",
      "#EC4899",
    ];
    let offset = 0;
    document.getElementById("tgl-donut-chart-mount").innerHTML =
      `<div class="tgl-donut-visual"><svg viewBox="0 0 160 160" width="135" height="135"><circle cx="80" cy="80" r="50" fill="none" stroke="#F1F5F9" stroke-width="24"/>${categories
        .map((r, i) => {
          const arc = total ? (Number(r.quantity) / total) * 314.16 : 0;
          const circle = `<circle cx="80" cy="80" r="50" fill="none" stroke="${colors[i % colors.length]}" stroke-width="24" stroke-dasharray="${arc} 314.16" stroke-dashoffset="${-offset}" transform="rotate(-90 80 80)"/>`;
          offset += arc;
          return circle;
        })
        .join(
          "",
        )}</svg></div><div>${categories.map((r, i) => `<p><span style="color:${colors[i % colors.length]}">●</span> ${esc(r.category)} · ${esc(r.quantity)} units</p>`).join("") || "<p>No delivered sales yet.</p>"}</div>`;
    const pills = document.querySelectorAll(".tgl-revenue-stats .tgl-pill-val");
    if (pills[1]) pills[1].textContent = "All time";
    if (pills[2])
      pills[2].textContent =
        "Rs " +
        (rows.length
          ? rows.reduce((sum, r) => sum + Number(r.revenue), 0) / rows.length
          : 0
        ).toFixed(2);
    const comparison = document.querySelectorAll(
      ".tgl-revenue-stats .tgl-pill-label",
    )[1];
    if (comparison) comparison.textContent = "Selected period";
    const leaderboard = document.querySelector(".tgl-empty-leaderboard");
    if (leaderboard)
      leaderboard.innerHTML =
        categories
          .map((r) => `<p>${esc(r.category)} · ${esc(r.quantity)} units</p>`)
          .join("") || "<p>No delivered sales yet.</p>";
  } catch (error) {
    message(error.message);
  }
}
// Deferred legacy chart markup runs on DOMContentLoaded; draw saved data after it.
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", charts, { once: true });
else charts();
