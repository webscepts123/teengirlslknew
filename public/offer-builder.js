import { api } from "/public/feature-client.js";

const root = document.querySelector("[data-offers]");
if (root) {
  const config = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(root.dataset.offers), (c) => c.charCodeAt(0))));
  const $ = (name) => root.querySelector(`[data-offer-${name}]`);
  const money = (n) => "Rs " + Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const { promotion, products, freeShippingMin } = config;

  // Same shape as the old promos table: a headline product plus partner products.
  // Flash-sale products never join another promotion.
  const inStock = (p) => p.stock > 0;
  const plain = (p) => inStock(p) && p.flashPrice === null;
  const percentOff = (total) => (promotion ? Math.round(total * (1 - promotion.percent / 100)) : total);
  const TYPES = {
    combo: {
      partners: 2,
      available: () => promotion && products.filter(plain).length >= 3,
      missing: "No active campaign right now",
      pool: (head) => products.filter((p) => plain(p) && p.sku !== head.sku),
      rule: () => `Combo Pack: pick this product plus 2 more and get ${promotion.percent}% off the pack.`,
      price: (items) => percentOff(items.reduce((s, p) => s + p.price, 0)),
    },
    bogo: {
      partners: 1,
      available: () => products.filter(plain).length >= 2,
      missing: "Needs at least 2 products in stock",
      pool: (head) => products.filter((p) => plain(p) && p.sku !== head.sku && p.price <= head.price),
      rule: () => "Buy One Get One Free: pay for this product, choose one item of equal or lower price free.",
      price: (items) => items[0].price,
    },
    flash: {
      partners: 0,
      available: () => products.some((p) => p.flashPrice !== null && inStock(p)),
      missing: "No flash deals right now",
      headPool: () => products.filter((p) => p.flashPrice !== null && inStock(p)),
      pool: () => [],
      rule: () => "Flash Sale: limited stock at the special price.",
      price: (items) => items[0].flashPrice,
    },
    gift: {
      partners: 1,
      available: () => promotion && products.filter(plain).length >= 2,
      missing: "No active campaign right now",
      pool: (head) => products.filter((p) => plain(p) && p.sku !== head.sku && p.price < head.price),
      rule: () => "Free Gift: choose a gift worth less than this product.",
      price: (items) => items[0].price,
    },
    three: {
      partners: 2,
      available: () => promotion && products.filter(plain).length >= 3,
      missing: "No active campaign right now",
      pool: (head) => products.filter((p) => plain(p) && p.sku !== head.sku),
      rule: () => `Any Three: pick any three products and get ${promotion.percent}% off.`,
      price: (items) => percentOff(items.reduce((s, p) => s + p.price, 0)),
    },
    shipping: {
      partners: 0,
      available: () => products.some(inStock),
      missing: "No products available",
      pool: () => [],
      rule: () => `Free Shipping on orders over ${money(freeShippingMin)}.`,
      price: (items) => items[0].price,
    },
    surprise: {
      partners: 0,
      available: () => config.hasSurprise,
      missing: "Our next surprise is on its way",
      pool: () => [],
      rule: () => "Surprise Box: claim a mystery gift with your reward points.",
    },
  };

  const state = { type: null, list: [], index: 0, head: null, partners: [] };
  const typeButtons = [...root.querySelectorAll("[data-offer-type]")];
  const picker = $("picker");
  const button = $("select");
  const say = (text, error = false) => {
    const el = $("message");
    el.textContent = text;
    el.classList.toggle("is-error", error);
  };

  typeButtons.forEach((b) => {
    const def = TYPES[b.dataset.offerType];
    if (!def.available()) {
      b.disabled = true;
      b.title = def.missing;
    }
  });

  const show = () => {
    const product = state.list[state.index];
    if (!product) return;
    $("image").src = product.image;
    $("image").alt = product.title;
    $("cat").textContent = product.category;
    $("title").textContent = product.title;
    const price = state.type === "flash" ? product.flashPrice : product.price;
    $("price").textContent = money(price);
    $("stock").textContent = `Stock: ${product.stock}`;
    $("count").textContent = `${state.index + 1} / ${state.list.length}`;
  };

  const summary = () => {
    const def = TYPES[state.type];
    const box = $("summary");
    box.textContent = "";
    if (!state.head) return;
    const items = [state.head, ...state.partners];
    const need = def.partners - state.partners.length;
    const lines = [];
    if (state.type === "shipping") {
      const gap = freeShippingMin - state.head.price;
      lines.push(gap <= 0 ? "This order ships free." : `Add ${money(gap)} more to your bag for free shipping.`);
    } else if (need > 0) {
      lines.push(`Choose ${need} more product${need > 1 ? "s" : ""} below.`);
    } else if (state.type !== "surprise") {
      const total = items.reduce((s, p) => s + (p.flashPrice ?? p.price), 0);
      const pay = def.price(items);
      lines.push(`You pay ${money(pay)}` + (pay < total ? ` instead of ${money(total)} (save ${money(total - pay)}).` : "."));
    }
    lines.forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line;
      box.append(p);
    });
    button.disabled = need > 0;
    button.textContent = state.type === "surprise" ? "Go to Surprise Box" : "Add to Bag";
  };

  const renderPartners = () => {
    const def = TYPES[state.type];
    const holder = $("partners");
    holder.textContent = "";
    holder.hidden = !def.partners;
    if (!def.partners) return;
    const pool = def.pool(state.head);
    if (pool.length < def.partners) {
      say("Not enough matching products for this offer.", true);
      state.head = null;
      return;
    }
    pool.forEach((p) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tgl-offer-chip";
      chip.setAttribute("aria-pressed", "false");
      const img = document.createElement("img");
      img.src = p.image;
      img.alt = "";
      img.width = 40;
      img.height = 50;
      const name = document.createElement("span");
      name.textContent = `${p.title} · ${money(p.price)}`;
      chip.append(img, name);
      chip.addEventListener("click", () => {
        const at = state.partners.indexOf(p);
        if (at >= 0) state.partners.splice(at, 1);
        else if (state.partners.length < def.partners) state.partners.push(p);
        else return say(`You can pick only ${def.partners}.`, true);
        say("");
        chip.setAttribute("aria-pressed", String(at < 0));
        chip.classList.toggle("is-active", at < 0);
        summary();
      });
      holder.append(chip);
    });
  };

  const reset = () => {
    state.head = null;
    state.partners = [];
    $("partners").hidden = true;
    $("partners").textContent = "";
    $("summary").textContent = "";
    button.disabled = false;
    button.textContent = "Select This Product";
    say("");
  };

  typeButtons.forEach((b) =>
    b.addEventListener("click", () => {
      state.type = b.dataset.offerType;
      const def = TYPES[state.type];
      typeButtons.forEach((x) => {
        const on = x === b;
        x.classList.toggle("is-active", on);
        x.setAttribute("aria-checked", String(on));
      });
      $("rule").textContent = def.rule();
      reset();
      if (state.type === "surprise") {
        picker.hidden = true;
        $("count").textContent = "";
        button.textContent = "Go to Surprise Box";
        button.disabled = false;
        return;
      }
      state.list = (def.headPool ? def.headPool() : products.filter((p) => inStock(p) && (state.type === "shipping" || plain(p))));
      state.index = 0;
      picker.hidden = false;
      show();
    }),
  );

  $("prev").addEventListener("click", () => {
    if (!state.list.length) return;
    state.index = (state.index - 1 + state.list.length) % state.list.length;
    reset();
    show();
  });
  $("next").addEventListener("click", () => {
    if (!state.list.length) return;
    state.index = (state.index + 1) % state.list.length;
    reset();
    show();
  });

  button.addEventListener("click", async () => {
    if (!state.type) return say("Choose a promotion type first.", true);
    if (state.type === "surprise") {
      document.getElementById("surprise-box")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!state.head) {
      state.head = state.list[state.index];
      state.partners = [];
      renderPartners();
      if (state.head) {
        summary();
        if (TYPES[state.type].partners === 0) button.disabled = false;
        say(TYPES[state.type].partners ? "Now choose your partner products." : "");
      }
      return;
    }
    const items = [state.head, ...state.partners];
    button.disabled = true;
    try {
      for (const p of items) await api("/customer/api/cart/save", { productId: p.sku, color: "", size: "", quantity: 1 });
      say("Added to your bag.");
      reset();
    } catch (error) {
      say(error.message, true);
      if (/log ?in|sign ?in|session|unauthor/i.test(error.message)) {
        const link = document.createElement("a");
        link.href = "/login?returnUrl=%2F";
        link.textContent = "Sign in";
        $("message").append(" ", link);
      }
      button.disabled = false;
    }
  });
}
