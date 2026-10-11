import { skipInProduction } from "../support.js";

export async function run(db) {
  // Foundation settings and category navigation are safe in every environment.
  for (const [key, value] of Object.entries({
    siteName: "TeenGirlsLK",
    description:
      "Trendy fashion, beauty and accessories for teen girls in Sri Lanka.",
    returnDays: 7,
    pointsPerLkr: 0.01,
    shippingCharge: 350,
    freeShippingAbove: 3500,
  }))
    await db.query(
      "INSERT IGNORE INTO settings(setting_key,value) VALUES (?,?)",
      [key, JSON.stringify(value)],
    );
  const categories = [
    ["Dresses", "fa-person-dress"],
    ["Outerwear & Knits", "fa-shirt"],
    ["Bags & Totes", "fa-bag-shopping"],
    ["Beauty", "fa-wand-magic-sparkles"],
    ["Footwear", "fa-shoe-prints"],
    ["Jewelry & Accessories", "fa-gem"],
    ["Skirts & Bottoms", "fa-shirt"],
  ];
  for (const [index, [name, icon]] of categories.entries())
    await db.query(
      "INSERT IGNORE INTO categories(name,slug,icon,display_order) VALUES (?,?,?,?)",
      [
        name,
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-$/, ""),
        icon,
        index + 1,
      ],
    );
  if (skipInProduction("FeatureSeeder demo records")) return;
  const now = new Date();
  const start = new Date(now.getTime() - 86400000).toISOString().slice(0, 16);
  const end = new Date(now.getTime() + 30 * 86400000)
    .toISOString()
    .slice(0, 16);
  const records = [
    [
      "promotions",
      {
        name: "Pastel Season",
        discountPercent: 10,
        minSpend: 2500,
        startsAt: start,
        endsAt: end,
        category: "",
      },
    ],
    [
      "flash-sale",
      {
        name: "Cardigan Flash Sale",
        productSku: "PROD-304",
        salePrice: 2990,
        quantity: 4,
        startsAt: start,
        endsAt: end,
      },
    ],
    [
      "surprise-box",
      {
        name: "Teen Sparkle Box",
        price: 4800,
        stock: 10,
        productSkus: "PROD-103,PROD-104",
        description: "A curated bag and beauty surprise box.",
      },
    ],
    [
      "bidding",
      {
        name: "Butterfly Necklace Auction",
        productSku: "PROD-412",
        startingPrice: 500,
        increment: 50,
        startsAt: start,
        endsAt: end,
      },
    ],
    [
      "delivery",
      {
        name: "Islandwide Standard Courier",
        district: "",
        city: "",
        charge: 350,
        freeAbove: 3500,
        estimatedDays: 3,
      },
    ],
    [
      "faq",
      {
        name: "How long does delivery take?",
        answer:
          "Colombo deliveries usually take 1–2 working days. Other districts usually take 2–3 working days.",
        displayOrder: 1,
      },
    ],
    [
      "faq",
      {
        name: "What is the return policy?",
        answer:
          "Request a return or exchange within seven days of delivery. Items must be unworn with original tags.",
        displayOrder: 2,
      },
    ],
  ];
  for (const [kind, data] of records) {
    const [existing] = await db.query(
      "SELECT id FROM feature_records WHERE kind=? AND name=?",
      [kind, data.name],
    );
    if (!existing)
      await db.query(
        "INSERT INTO feature_records(kind,name,status,data) VALUES (?,?,'active',?)",
        [kind, data.name, JSON.stringify(data)],
      );
  }
  const [customer] = await db.query(
    "SELECT id FROM customers WHERE code='CUST-1001'",
  );
  if (customer) {
    const [ticket] = await db.query(
      "SELECT id FROM support_tickets WHERE customer_id=? AND subject=?",
      [customer.id, "Help choosing my size"],
    );
    if (!ticket)
      await db.query(
        "INSERT INTO support_tickets(customer_id,subject,message) VALUES (?,?,?)",
        [
          customer.id,
          "Help choosing my size",
          "Could you help me choose a cardigan size?",
        ],
      );
  }
}
