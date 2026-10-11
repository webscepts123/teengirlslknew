import { api, escapeHtml as esc, message } from "./feature-client.js";

const money = (value) =>
  "Rs " + Number(value).toLocaleString("en-LK", { minimumFractionDigits: 2 });
function dialog(title, content) {
  document.getElementById("store-dialog")?.remove();
  const d = document.createElement("dialog");
  d.id = "store-dialog";
  d.style.cssText =
    "border:0;border-radius:18px;padding:28px;max-width:620px;width:90%;font-family:inherit;color:#1e293b";
  d.innerHTML = `<button type="button" data-close style="float:right" aria-label="Close">×</button><h2>${esc(title)}</h2>${content}<p data-feature-message role="status"></p>`;
  document.body.append(d);
  d.querySelector("[data-close]").onclick = () => d.close();
  d.showModal();
  return d;
}
export async function openProduct(sku) {
  const { products } = await api("/api/products?q=" + encodeURIComponent(sku));
  const product = products.find((p) => p.sku === sku);
  if (!product) throw new Error("Product unavailable.");
  const d = dialog(
    product.title,
    `<img src="${esc(product.image)}" alt="${esc(product.title)}" style="width:150px;border-radius:12px"><p>${esc(product.description || "")}</p><p>${money(product.price)} · ${product.stock} in stock</p><form id="product-options"><input type="hidden" name="productId" value="${esc(sku)}">${[
      ["color", product.colors],
      ["size", product.sizes],
    ]
      .filter(([, options]) => options.length)
      .map(
        ([name, options]) =>
          `<label style="display:block;margin:12px 0">${name}<select name="${name}" required style="margin-left:10px">${options.map((o) => `<option>${esc(o)}</option>`).join("")}</select></label>`,
      )
      .join(
        "",
      )}<label>Quantity <input type="number" name="quantity" min="1" max="99" value="1" required></label><div style="margin-top:16px"><button class="tgl-btn tgl-btn-primary" type="submit">Add to bag</button> <button class="tgl-btn tgl-btn-outline" type="button" data-wishlist>Save to wishlist</button></div></form><p><button type="button" data-open-bag>View bag & checkout</button></p>`,
  );
  d.querySelector("form").onsubmit = async (event) => {
    event.preventDefault();
    try {
      const result = await api(
        "/customer/api/cart/save",
        Object.fromEntries(new FormData(event.target)),
      );
      d.querySelector("[data-feature-message]").textContent = result.message;
    } catch (error) {
      showError(d, error);
    }
  };
  d.querySelector("[data-wishlist]").onclick = async () => {
    try {
      const result = await api("/customer/api/wishlist/add", {
        productId: sku,
      });
      d.querySelector("[data-feature-message]").textContent = result.message;
    } catch (error) {
      showError(d, error);
    }
  };
  d.querySelector("[data-open-bag]").onclick = () =>
    openBag().catch((error) => showError(d, error));
}
function showError(d, error) {
  d.querySelector("[data-feature-message]").textContent = error.message;
  if (/sign in/i.test(error.message)) {
    const link = document.createElement("a");
    link.href = "/login?returnUrl=" + encodeURIComponent(location.pathname);
    link.textContent = "Sign in to continue";
    d.querySelector("[data-feature-message]").append(" ", link);
  }
}
export async function openBag() { location.href="/cart"; }
document.querySelectorAll("[data-open-bag]").forEach((button) => {
  button.addEventListener("click", () =>
    openBag().catch((error) => message(error.message)),
  );
});
document.querySelectorAll(".tgl-product[data-sku]").forEach((card) => {
  card.addEventListener("click", () =>
    (location.href = "/product/" + encodeURIComponent(card.dataset.sku.replace(/\//g, "-"))),
  );
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      (location.href = "/product/" + encodeURIComponent(card.dataset.sku.replace(/\//g, "-")));
    }
  });
});
