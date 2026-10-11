import { api } from "/public/feature-client.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const catToggle = $("[data-cat-toggle]");
const catMenu = $(".tgl-cat-dropdown");
if (catToggle && catMenu) {
  const setOpen = (open) => {
    catMenu.hidden = !open;
    catToggle.setAttribute("aria-expanded", String(open));
  };
  catToggle.addEventListener("click", () => setOpen(catMenu.hidden));
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".tgl-cat-menu")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

const filters = $("#filters");
if (filters) {
  const toggle = (open) => document.body.classList.toggle("tgl-filters-open", open);
  $$("[data-filter-open]").forEach((b) => b.addEventListener("click", () => toggle(true)));
  $$("[data-filter-close]").forEach((b) => b.addEventListener("click", () => toggle(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggle(false);
  });
}

const form = $("#pdp-form");
if (form) {
  const message = $("[data-feature-message]", form);
  const say = (text, error = false) => {
    message.textContent = text;
    message.classList.toggle("is-error", error);
  };
  $$("[data-pick]", form).forEach((button) =>
    button.addEventListener("click", () => {
      const name = button.dataset.pick;
      $$(`[data-pick="${name}"]`, form).forEach((b) => b.classList.toggle("is-active", b === button));
      form.elements[name].value = button.dataset.value;
    }),
  );
  $$("[data-qty]", form).forEach((button) =>
    button.addEventListener("click", () => {
      const input = form.elements.quantity;
      input.value = Math.min(99, Math.max(1, Number(input.value || 1) + Number(button.dataset.qty)));
    }),
  );
  const options = () => {
    const missing = ["color", "size"].find((name) => form.elements[name] && !form.elements[name].value);
    if (missing) say(`Please choose a ${missing}.`, true);
    return !missing;
  };
  const failure = (error) => {
    say(error.message, true);
    if (/log ?in|sign ?in|session|unauthor/i.test(error.message)) {
      const link = document.createElement("a");
      link.href = "/login?returnUrl=" + encodeURIComponent(location.pathname);
      link.textContent = "Sign in";
      message.append(" ", link);
    }
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!options()) return;
    try {
      const result = await api("/customer/api/cart/save", {
        productId: form.dataset.sku,
        color: form.elements.color?.value ?? "",
        size: form.elements.size?.value ?? "",
        quantity: form.elements.quantity.value,
        mode:'add',
      });
      say(result.message || "Added to your bag.");
    } catch (error) {
      failure(error);
    }
  });
  $("[data-wishlist]", form)?.addEventListener("click", async () => {
    try {
      const result = await api("/customer/api/wishlist/add", { productId: form.dataset.sku });
      say(result.message || "Saved to your wishlist.");
    } catch (error) {
      failure(error);
    }
  });
}

const timers = $$("[data-countdown]");
if (timers.length) {
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () =>
    timers.forEach((el) => {
      const left = Math.max(0, Math.floor((Date.parse(el.dataset.countdown) - Date.now()) / 1000));
      const days = Math.floor(left / 86400);
      el.textContent = left
        ? `Ends in ${days ? days + "d " : ""}${pad(Math.floor((left % 86400) / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`
        : "Ended";
    });
  tick();
  setInterval(tick, 1000);
}
