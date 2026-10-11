import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Run only against an explicitly selected, migrated and seeded test application.
const base = process.env.FEATURE_TEST_URL;
async function client(path, credentials) {
  const jar = new Map();
  let token;
  const request = async (path, body) => {
    const r = await fetch(base + path, {
      redirect: "manual",
      headers: {
        Cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "),
        ...(body
          ? { "Content-Type": "application/json", "x-csrf-token": token || "" }
          : {}),
      },
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
    });
    for (const cookie of r.headers.getSetCookie()) {
      const separator = cookie.indexOf("=");
      jar.set(
        cookie.slice(0, separator),
        cookie.slice(separator + 1).split(";")[0],
      );
    }
    const text = await r.text();
    token = text.match(/name="_csrf" value="([^"]+)"/)?.[1] || token;
    return {
      status: r.status,
      data: r.headers.get("content-type")?.includes("application/json")
        ? JSON.parse(text)
        : text,
      location: r.headers.get("location"),
    };
  };
  await request(path);
  assert.equal((await request(path, credentials)).status, 302);
  return request;
}
test(
  "authenticated features preserve customer isolation, points and inventory",
  { skip: !base },
  async () => {
    const a = await client("/sysadmin/login", {
      username: process.env.FEATURE_ADMIN_USER || "admin",
      password: process.env.FEATURE_ADMIN_PASSWORD || "admin123",
    });
    const n = await client("/customer/login", {
      emailOrPhone: "nethmi.perera@gmail.com",
      password: "password123",
    });
    const k = await client("/customer/login", {
      emailOrPhone: "kavindi.silva@gmail.com",
      password: "password123",
    });
    const anon = await fetch(base + "/sysadmin/api/records?kind=customers");
    assert.equal(anon.status, 401);
    const csrf = await fetch(base + "/customer/api/rewards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"pointsToRedeem":100}',
    });
    assert.equal(csrf.status, 419);
    const before = (await n("/customer/api/dashboard")).data;
    const other = (await k("/customer/api/dashboard")).data;
    assert.equal(other.orders.length, 0);
    assert.equal(
      (
        await k("/customer/api/address/delete", {
          addressId: before.addresses[0].id,
        })
      ).status,
      404,
    );
    assert.equal(
      (await n("/customer/api/rewards/redeem", { pointsToRedeem: -500 }))
        .status,
      422,
    );
    assert.equal(
      (await n("/customer/api/rewards/redeem", { pointsToRedeem: 100000000 }))
        .status,
      422,
    );
    const sku = "TEST-" + randomUUID().slice(0, 10);
    assert.equal(
      (
        await a("/sysadmin/api/records/save", {
          kind: "products",
          sku,
          name: "Integration dress",
          category: "Dresses",
          price: 1000,
          stock: 1,
          img: "/public/images/placeholder.svg",
          colors: "Pink",
          sizes: "M,L",
          status: "Active",
        })
      ).status,
      200,
    );
    const product = (
      await a("/sysadmin/api/records?kind=products")
    ).data.records.find((p) => p.sku === sku);
    assert.equal(
      (
        await n("/customer/api/cart/save", {
          productId: sku,
          color: "Pink",
          size: "INVALID",
          quantity: 1,
        })
      ).status,
      422,
    );
    assert.equal(
      (
        await n("/customer/api/cart/save", {
          productId: sku,
          color: "Pink",
          size: "M",
          quantity: 1,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await n("/customer/api/cart/save", {
          productId: sku,
          color: "Pink",
          size: "L",
          quantity: 1,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await n("/customer/api/checkout", {
          addressId: before.addresses[0].id,
          paymentMethod: "cod",
        })
      ).status,
      422,
    );
    let cart = (await n("/customer/api/cart")).data.items;
    const extra = cart.find((i) => i.sku === sku && i.size === "L");
    await n("/customer/api/cart/remove", { id: extra.id });
    // Remove unrelated demo/test shopping items so the subtotal is deterministic.
    for (const item of cart)
      if (item.sku !== sku)
        await n("/customer/api/cart/remove", { id: item.id });
    const quote = await n("/customer/api/checkout/quote", {
      addressId: before.addresses[0].id,
      paymentMethod: "cod",
    });
    assert.equal(quote.status, 200);
    assert.equal(quote.data.subtotal, 1000);
    const checkout = await n("/customer/api/checkout", {
      addressId: before.addresses[0].id,
      paymentMethod: "cod",
      expectedTotal: quote.data.total,
    });
    assert.equal(checkout.status, 200);
    const order = (await n("/customer/api/dashboard")).data.orders.find(
      (o) => o.orderNumber === checkout.data.orderNumber,
    );
    assert.ok(order);
    assert.equal(
      (
        await k("/customer/api/order/return", {
          orderId: order.id,
          reason: "Wrong size",
          actionType: "return",
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await a("/sysadmin/api/records/save", {
          kind: "orders",
          id: order.dbId,
          status: "delivered",
        })
      ).status,
      422,
    );
    for (const status of [
      "processing",
      "dispatched",
      "shipped",
      "out_for_delivery",
      "delivered",
    ])
      assert.equal(
        (
          await a("/sysadmin/api/records/save", {
            kind: "orders",
            id: order.dbId,
            status,
          })
        ).status,
        200,
      );
    const after = (await n("/customer/api/dashboard")).data;
    assert.ok(after.stats.rewardPoints > before.stats.rewardPoints);
    await a("/sysadmin/api/records/save", {
      kind: "orders",
      id: order.dbId,
      status: "delivered",
    });
    assert.equal(
      (await n("/customer/api/dashboard")).data.stats.rewardPoints,
      after.stats.rewardPoints,
    );
    assert.equal(
      (
        await n("/customer/api/order/return", {
          orderId: order.id,
          reason: "Wrong size",
          actionType: "exchange",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await n("/customer/api/order/return", {
          orderId: order.id,
          reason: "Wrong size",
          actionType: "exchange",
        })
      ).status,
      409,
    );
    const savedProduct = (
      await a("/sysadmin/api/records?kind=products")
    ).data.records.find((p) => p.id === product.id);
    assert.equal(savedProduct.stock, 0);
    await a("/sysadmin/api/records/delete", {
      kind: "products",
      id: product.id,
    });
  },
);
