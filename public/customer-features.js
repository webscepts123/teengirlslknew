import { api, escapeHtml as esc, message } from "./feature-client.js";
import { openBag, openProduct } from "./storefront.js";

const center = document.querySelector(".tg-center-content");
const tab = location.pathname.split("/").pop();
const input = (name, label, value = "", type = "text", required = true) =>
  `<label style="display:block;margin:12px 0">${esc(label)}<input class="tg-header-search-input" style="display:block;border:1px solid #e2e8f0;border-radius:8px;padding:10px;width:100%" name="${name}" type="${type}" value="${esc(value)}" ${required ? "required" : ""}></label>`;
const button = (text, attrs = "") =>
  `<button type="button" class="tg-btn-order-details" ${attrs}>${esc(text)}</button>`;
const card = (title, body) =>
  `<div class="tg-recent-orders-card"><div class="tg-card-header-flex"><h2 class="tg-card-title">${esc(title)}</h2></div>${body}</div>`;
const form = (action, content) =>
  `<form data-customer-action="${action}">${content}<p data-feature-message role="status"></p><button class="tg-btn-order-details" type="submit">Save</button></form>`;
let data;
async function show() {
  if (!center || ["customer", "dashboard"].includes(tab)) return;
  try {
    data = await api("/customer/api/dashboard");
    document
      .querySelectorAll(".tg-menu-item")
      .forEach((link) =>
        link.classList.toggle(
          "active",
          new URL(link.href).pathname === location.pathname,
        ),
      );
    if (tab === "orders") {
      const id = new URLSearchParams(location.search).get("id");
      const orders = id
        ? data.orders.filter((o) => o.orderNumber === id)
        : data.orders;
      center.innerHTML = card(
        "My Orders",
        orders
          .map(
            (o) =>
              `<div data-feature-row><h3>${esc(o.id)} · ${esc(o.status)} · ${esc(o.price)}</h3><p>${esc(o.date)} · ${esc(o.paymentMethod)} · ${esc(o.paymentStatus)}</p><p>${esc(o.courierName)} · ${esc(o.trackingNumber)}</p>${o.items.map((i) => `<p>${esc(i.title)} · ${esc(i.variant)} × ${i.quantity} · ${esc(i.price)}</p>`).join("")}${button("Print invoice", `data-print-order="${esc(o.orderNumber)}"`)}${o.status === "Delivered" ? button("Return / exchange", `data-return-order="${esc(o.orderNumber)}"`) : ""}</div>`,
          )
          .join("") || "<p>No orders found.</p>",
      );
    } else if (tab === "returns")
      center.innerHTML = card(
        "My Return Requests",
        data.returns
          .map(
            (r) =>
              "<p>" +
              esc(r.ticket) +
              " ? " +
              esc(r.order_number) +
              " ? " +
              esc(r.status) +
              " ? " +
              esc(r.reason) +
              "</p>",
          )
          .join("") ||
          "<p>No return requests yet. Open a delivered order to request a return.</p>",
      );
    else if (tab === "wishlist")
      center.innerHTML = card(
        "My Wishlist",
        data.wishlist
          .map(
            (p) =>
              `<div data-feature-row><h3>${esc(p.title)}</h3><p>${esc(p.price)} · ${esc(p.stockStatus)}</p>${button("Choose options / add to bag", `data-product="${esc(p.productId)}"`)} ${button("Remove", `data-remove-wish="${esc(p.id)}"`)}</div>`,
          )
          .join("") ||
          "<p>Your wishlist is empty. Browse the shop to save products.</p>",
      );
    else if (tab === "addresses")
      center.innerHTML = card(
        "My Addresses",
        data.addresses
          .map(
            (a) =>
              `<div data-feature-row><h3>${esc(a.label)}${a.isDefault ? " · Default" : ""}</h3><p>${esc(a.recipientName)} · ${esc(a.phone)}</p><p>${esc(a.street)}, ${esc(a.city)}, ${esc(a.district)}</p>${button("Edit", `data-edit-address="${esc(a.id)}"`)} ${button("Delete", `data-delete-address="${esc(a.id)}"`)}</div>`,
          )
          .join("") + button("Add address", "data-new-address"),
      );
    else if (tab === "profile")
      center.innerHTML =
        card(
          "My Profile",
          form(
            "profile",
            input("name", "Full name", data.customer.name) +
              input("phone", "Phone", data.customer.phone) +
              input(
                "preferredTopSize",
                "Top size",
                data.customer.preferences.preferredTopSize || "",
                "text",
                false,
              ) +
              input(
                "preferredBottomSize",
                "Bottom size",
                data.customer.preferences.preferredBottomSize || "",
                "text",
                false,
              ) +
              input(
                "preferredFootwear",
                "Footwear size",
                data.customer.preferences.preferredFootwear || "",
                "text",
                false,
              ) +
              input(
                "styleAesthetics",
                "Style preferences (comma separated)",
                (data.customer.preferences.styleAesthetics || []).join(", "),
                "text",
                false,
              ),
          ),
        ) +
        card(
          "Change Password",
          form(
            "password",
            input("currentPassword", "Current password", "", "password") +
              input("password", "New password", "", "password") +
              input("confirmPassword", "Confirm new password", "", "password"),
          ),
        );
    else if (tab === "rewards")
      center.innerHTML = card(
        "Rewards & Points",
        `<p>${data.stats.rewardPoints} points · ${esc(data.stats.storeCredit)} store credit</p>` +
          form(
            "rewards/redeem",
            input(
              "pointsToRedeem",
              "Points to redeem (minimum 100)",
              "100",
              "number",
            ),
          ) +
          data.coupons
            .map(
              (c) =>
                `<p><strong>${esc(c.code)}</strong> · ${esc(c.discount)} · ${esc(c.minSpend)} · ${esc(c.validTill)}</p>`,
            )
            .join(""),
      );
    else if (tab === "referrals")
      center.innerHTML = card(
        "Refer & Earn",
        `<p>Commission balance: ${esc(data.commissionBalance)}</p><p>Your referral code: <strong>${esc(data.customer.referralCode)}</strong></p><p>Share your registration link:</p><input class="tg-header-search-input" style="width:100%" readonly value="${esc(location.origin + "/register?ref=" + data.customer.referralCode)}"><p>Referral rewards are recorded after a referred customer completes a qualifying order.</p>`,
      );
    else if (tab === "support" || tab === "size-chat") {
      const { tickets } = await api("/customer/api/tickets");
      center.innerHTML = card(
        "Help & Support",
        form(
          "tickets",
          input("subject", "Subject") + input("message", "Message"),
        ) +
          tickets
            .map(
              (t) =>
                `<div data-feature-row><h3>#${t.id} · ${esc(t.subject)}</h3><p>${esc(t.message)} · ${esc(t.status)}</p>${t.status !== "closed" ? button("Close ticket", `data-close-ticket="${t.id}"`) : ""}</div>`,
            )
            .join(""),
      );
    } else if (tab === "cart") {
      center.innerHTML = card(
        "Shopping Bag",
        button("Open bag & checkout", "data-open-bag"),
      );
      await openBag();
    } else if (tab === "reviews")
      center.innerHTML = card(
        "My Reviews",
        form(
          "review",
          input("productId", "Purchased product SKU") +
            input("rating", "Rating (1–5)", "5", "number") +
            input("comment", "Review"),
        ),
      );
    else if (tab === "notifications")
      center.innerHTML = card(
        "Notifications",
        data.orders
          .map(
            (o) =>
              `<p>${esc(o.id)} is ${esc(o.status)}. ${esc(o.trackingNumber)}</p>`,
          )
          .join("") || "<p>No order updates yet.</p>",
      );
    else if (["bidding", "surprise-box"].includes(tab)) {
      const { records } = await api("/api/features?kind=" + tab);
      center.innerHTML = card(
        tab === "bidding" ? "Live Auctions" : "Surprise Boxes",
        records
          .map(
            (r) =>
              `<div data-feature-row><h3>${esc(r.name)}</h3>${tab === "bidding" ? `<p>${esc(r.data.currentBids)} / ${esc(r.data.targetBids)} point bids</p><a class="tg-btn tg-btn-primary" href="/#bid-and-win">View bids & claim prize</a>` : `<p>${esc(r.data.description)} ? ${esc(r.data.price)} points ? Free delivery</p><a class="tg-btn tg-btn-primary" href="/#surprise-box">Claim my surprise</a>`}</div>`,
          )
          .join("") || "<p>No active offers.</p>",
      );
    }
  } catch (error) {
    center.innerHTML = card("Unable to load", `<p>${esc(error.message)}</p>`);
  }
}
function addressForm(address = {}) {
  center.insertAdjacentHTML(
    "beforeend",
    card(
      address.id ? "Edit Address" : "Add Address",
      form(
        "address/save",
        `<input type="hidden" name="id" value="${esc(address.id || "")}">` +
          [
            "label",
            "recipientName",
            "phone",
            "street",
            "city",
            "district",
            "postalCode",
            "notes",
          ]
            .map((name) =>
              input(
                name,
                name.replace(/([A-Z])/g, " $1"),
                address[name] || "",
                "text",
                !["postalCode", "notes"].includes(name),
              ),
            )
            .join("") +
          `<label><input type="checkbox" name="isDefault" value="true" ${address.isDefault ? "checked" : ""}> Default address</label>`,
      ),
    ),
  );
}
document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-customer-action]");
  if (!form) return;
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const result = await api(
      "/customer/api/" + form.dataset.customerAction,
      Object.fromEntries(new FormData(form)),
    );
    message(result.message);
    await show();
  } catch (error) {
    form.querySelector("[data-feature-message]").textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});
document.addEventListener("click", async (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  try {
    if (b.hasAttribute("data-new-address")) addressForm();
    if (b.dataset.editAddress)
      addressForm(data.addresses.find((a) => a.id === b.dataset.editAddress));
    if (b.dataset.deleteAddress && confirm("Delete this address?")) {
      await api("/customer/api/address/delete", {
        addressId: b.dataset.deleteAddress,
      });
      await show();
    }
    if (b.dataset.removeWish) {
      await api("/customer/api/wishlist/remove", {
        itemId: b.dataset.removeWish,
      });
      await show();
    }
    if (b.dataset.closeTicket) {
      await api("/customer/api/tickets", {
        id: b.dataset.closeTicket,
        status: "closed",
      });
      await show();
    }
    if (b.dataset.product) await openProduct(b.dataset.product);
    if (b.hasAttribute("data-open-bag")) await openBag();
    if (b.dataset.printOrder) window.print();
    if (b.dataset.returnOrder)
      center.insertAdjacentHTML(
        "beforeend",
        card(
          "Return / Exchange",
          form(
            "order/return",
            `<input type="hidden" name="orderId" value="${esc(b.dataset.returnOrder)}"><label>Action <select name="actionType"><option value="return">Return</option><option value="exchange">Exchange</option></select></label>` +
              input("reason", "Reason") +
              input("comments", "Comments", "", "text", false),
          ),
        ),
      );
    if (b.dataset.specialId) {
      const { records } = await api("/api/features?kind=" + tab);
      const offer = records.find((r) => String(r.id) === b.dataset.specialId);
      center.insertAdjacentHTML(
        "beforeend",
        card(
          "Purchase " + offer.name,
          form(
            "special/purchase",
            '<input name="featureId" type="hidden" value="' +
              offer.id +
              '"><label>Delivery address <select name="addressId">' +
              data.addresses
                .map(
                  (a) =>
                    '<option value="' +
                    esc(a.id) +
                    '">' +
                    esc(a.label + ": " + a.street) +
                    "</option>",
                )
                .join("") +
              '</select></label><label>Payment <select name="paymentMethod"><option value="cod">Cash on Delivery</option><option value="bank_transfer">Bank Transfer</option><option value="points">Reward Points</option></select></label><p>' +
              (tab === "surprise-box"
                ? "Box price: Rs " +
                  esc(offer.data.price) +
                  "; delivery Rs " +
                  (offer.data.price >= 3500 ? 0 : 350)
                : "Only the winning bidder can purchase after the auction closes.") +
              "</p>",
          ),
        ),
      );
    }
    if (b.dataset.boxId) {
      const { records } = await api("/api/features?kind=surprise-box");
      const box = records.find((r) => String(r.id) === b.dataset.boxId);
      message("Box products: " + box.data.productSkus);
    }
  } catch (error) {
    message(error.message);
  }
});
show();
