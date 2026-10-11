import test from "node:test";
import assert from "node:assert/strict";
import { randomInt, randomUUID } from "node:crypto";
import { customerForLogin } from "../app/Services/customer.js";

const base = process.env.FEATURE_TEST_URL;

test("customer login finds legacy phone numbers with formatting", async () => {
  const calls = [];
  const customer = { id: 42, email: "customer@example.com" };
  const db = {
    async query(sql, values) {
      calls.push({ sql, values });
      if (sql.includes("REPLACE(")) return [customer];
      return [];
    },
  };

  assert.equal(
    await customerForLogin("+94 (77) 123-4567", db),
    customer,
  );
  assert.deepEqual(calls[1].values, [
    "94771234567",
    "771234567",
    "0771234567",
  ]);
  assert.match(calls[2].sql, /is_active = 1/);
});

test("customer login checks normalized email before phone lookup", async () => {
  const calls = [];
  const customer = { id: 43, email: "customer@example.com" };
  const db = {
    async query(sql, values) {
      calls.push({ sql, values });
      return sql.includes("email = ?") ? [customer] : [];
    },
  };

  assert.equal(
    await customerForLogin(" CUSTOMER@EXAMPLE.COM ", db),
    customer,
  );
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].values, ["customer@example.com"]);
});

test(
  "customer registration persists an account that can sign in by phone",
  { skip: !base },
  async () => {
    const jar = new Map();
    let token = "";
    const request = async (path, body) => {
      const response = await fetch(base + path, {
        redirect: "manual",
        headers: {
          Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join("; "),
          ...(body
            ? {
                "Content-Type": "application/json",
                "x-csrf-token": token,
              }
            : {}),
        },
        ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const separator = cookie.indexOf("=");
        jar.set(
          cookie.slice(0, separator),
          cookie.slice(separator + 1).split(";")[0],
        );
      }
      const text = await response.text();
      token = text.match(/name="_csrf" value="([^"]+)"/)?.[1] ?? token;
      return {
        status: response.status,
        data: response.headers.get("content-type")?.includes("application/json")
          ? JSON.parse(text)
          : text,
        location: response.headers.get("location"),
      };
    };

    await request("/customer/register");
    const suffix = randomUUID();
    const email = `auth-test-${suffix}@example.com`;
    const phone = `947${randomInt(10000000, 99999999)}`;
    const registration = await request("/customer/register", {
      firstName: "Auth",
      lastName: "Test",
      email,
      phone,
      nic: String(randomInt(100000000000, 999999999999)),
      district: "Colombo",
      city: "Colombo",
      address: "42 Test Road",
      postalCode: "00100",
      password: "RegistrationTest123",
      confirmPassword: "RegistrationTest123",
    });
    assert.equal(registration.status, 302);
    assert.equal(registration.location, "/customer/dashboard?welcome=true");

    await request("/customer/logout");
    const login = await request("/customer/login", {
      emailOrPhone: `+${phone.slice(0, 2)} ${phone.slice(2, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`,
      password: "RegistrationTest123",
    });
    assert.equal(login.status, 302);
    const dashboard = await request("/customer/api/dashboard");
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.data.customer.email, email);
  },
);
