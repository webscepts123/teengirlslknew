import { hashPassword } from "noderyx-framework";
import { idFor, skipInProduction } from "../support.js";

// Both demo customers sign in with "password123".
const customers = [
  {
    code: "CUST-1001", name: "Nethmi Perera", firstName: "Nethmi", lastName: "Perera", nic: "200254301234", referralCode: "NETHMI1001", email: "nethmi.perera@gmail.com",
    phone: "077 123 4567", avatar: "/public/images/avatars/nethmi-avatar.jpg", tier: "gold", points: 560, storeCredit: 1000,
    preferences: { preferredTopSize: "M", preferredBottomSize: "28", preferredFootwear: "38 (EU)", styleAesthetics: ["Streetwear", "Pastel Aesthetic", "Floral Chic"] },
    addresses: [
      { label: "Home", isDefault: true, recipientName: "Nethmi Perera", phone: "077 123 4567", street: "No. 42/B, Flower Road", city: "Colombo 07", district: "Colombo", postalCode: "00700", notes: "Deliver to security desk if away" },
      { label: "Campus / Hostel", isDefault: false, recipientName: "Nethmi Perera (Hostel Room 304)", phone: "077 123 4567", street: "University Campus Residential Hall, High Level Road", city: "Nugegoda", district: "Colombo", postalCode: "10250", notes: "Call upon arrival at main gate" }
    ],
    wishlist: ["PROD-304", "PROD-309", "PROD-412", "PROD-510"],
    orders: [
      { number: "TG12458", placedAt: "2024-05-10 10:15:00", status: "delivered", paymentMethod: "Cash on Delivery (COD)", paymentStatus: "Paid on Delivery", courier: "Domex Express LK", tracking: "DMX-98214402-LK", items: [["PROD-101", "Blush Pink Floral / Size M", 3499, 1]] },
      { number: "TG12420", placedAt: "2024-05-02 16:40:00", status: "shipped", paymentMethod: "Visa / Mastercard", paymentStatus: "Paid Online", courier: "Flash Express LK", tracking: "FLS-882910-LK", items: [["PROD-102", "Lavender / Size S", 2999, 1]] },
      { number: "TG12375", placedAt: "2024-04-28 13:05:00", status: "delivered", paymentMethod: "Koko: 3 Installments", paymentStatus: "Completed", courier: "Pronto Lanka Delivery", tracking: "PRN-551029-LK", items: [["PROD-103", "Pastel Pink", 2500, 1], ["PROD-104", "Rose & Berry", 1999, 1]] },
      { number: "TG12312", placedAt: "2024-04-20 09:30:00", status: "delivered", paymentMethod: "Cash on Delivery", paymentStatus: "Paid on Delivery", courier: "Domex Express LK", tracking: "DMX-772102-LK", items: [["PROD-105", "Blush White / Size 38", 1999, 1]] },
      { number: "TG12280", placedAt: "2024-04-10 18:20:00", status: "cancelled", paymentMethod: "Cash on Delivery", paymentStatus: "Cancelled", courier: null, tracking: null, items: [["PROD-106", "Gold / Crystal", 2499, 1]] }
    ]
  },
  {
    code: "CUST-1002", name: "Kavindi Silva", firstName: "Kavindi", lastName: "Silva", nic: "985431234V", referralCode: "KAVINDI1002", email: "kavindi.silva@gmail.com",
    phone: "+94 77 892 3411", avatar: "/public/images/avatars/avatar-1.jpg", tier: "silver", points: 420, storeCredit: 0,
    preferences: { preferredTopSize: "S", preferredBottomSize: "26", preferredFootwear: "37 (EU)", styleAesthetics: ["Floral & Feminine", "Y2K Trends"] },
    addresses: [
      { label: "Home", isDefault: true, recipientName: "Ananya Perera", phone: "+94 71 455 9012", street: "18 Peradeniya Road", city: "Kandy", district: "Kandy", postalCode: "20000", notes: "Near Botanical Gardens" }
    ],
    wishlist: [],
    orders: []
  }
];

export async function run(db) {
  if (skipInProduction("DemoCustomerSeeder")) return;

  const passwordHash = await hashPassword("password123");

  for (const customer of customers) {
    // Profile fields are refreshed on every run; the password is set only once.
    await db.query(
      `INSERT INTO customers
         (code, name, first_name, last_name, email, phone, nic, referral_code, password_hash, avatar, tier, points, store_credit, preferences)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), first_name = VALUES(first_name), last_name = VALUES(last_name), phone = VALUES(phone),
         nic = VALUES(nic), referral_code = VALUES(referral_code), avatar = VALUES(avatar),
         tier = VALUES(tier), points = VALUES(points), store_credit = VALUES(store_credit),
         preferences = VALUES(preferences)`,
      [
        customer.code, customer.name, customer.firstName, customer.lastName, customer.email, customer.phone,
        customer.nic, customer.referralCode, passwordHash,
        customer.avatar, customer.tier, customer.points, customer.storeCredit, JSON.stringify(customer.preferences)
      ]
    );
    const customerId = await idFor(db, "customers", "code", customer.code);

    // Addresses have no natural key, so add each one only if that label is missing.
    for (const address of customer.addresses) {
      const [existing] = await db.query(
        "SELECT id FROM customer_addresses WHERE customer_id = ? AND label = ? LIMIT 1",
        [customerId, address.label]
      );
      if (existing) continue;
      await db.query(
        `INSERT INTO customer_addresses
           (customer_id, label, recipient_name, phone, street, city, district, postal_code, notes, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId, address.label, address.recipientName, address.phone, address.street,
          address.city, address.district, address.postalCode, address.notes, address.isDefault
        ]
      );
    }

    const [defaultAddress] = await db.query(
      "SELECT id FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id LIMIT 1",
      [customerId]
    );

    for (const sku of customer.wishlist) {
      await db.query(
        "INSERT IGNORE INTO wishlist_items (customer_id, product_id) VALUES (?, ?)",
        [customerId, await idFor(db, "products", "sku", sku)]
      );
    }

    for (const order of customer.orders) {
      const total = order.items.reduce((sum, [, , price, quantity]) => sum + price * quantity, 0);
      await db.query(
        `INSERT INTO orders
           (order_number, customer_id, shipping_address_id, status, total, payment_method,
            payment_status, courier_name, tracking_number, placed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status), total = VALUES(total), payment_method = VALUES(payment_method),
           payment_status = VALUES(payment_status), courier_name = VALUES(courier_name),
           tracking_number = VALUES(tracking_number), placed_at = VALUES(placed_at)`,
        [
          order.number, customerId, defaultAddress?.id ?? null, order.status, total, order.paymentMethod,
          order.paymentStatus, order.courier, order.tracking, order.placedAt
        ]
      );
      const orderId = await idFor(db, "orders", "order_number", order.number);

      // Seeded orders own their items, so replace them rather than duplicate them.
      await db.query("DELETE FROM order_items WHERE order_id = ?", [orderId]);
      for (const [sku, variant, unitPrice, quantity] of order.items) {
        const [product] = await db.query("SELECT id, title, image FROM products WHERE sku = ? LIMIT 1", [sku]);
        if (!product) throw new Error(`Product ${sku} not found; run 02_CatalogSeeder first`);
        await db.query(
          `INSERT INTO order_items (order_id, product_id, title, variant, unit_price, quantity, image)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, product.id, product.title, variant, unitPrice, quantity, product.image]
        );
      }
    }
  }
}
