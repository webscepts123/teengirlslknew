import { daysFromNow, skipInProduction } from "../support.js";

const products = [
  { sku: "PROD-101", title: "Floral Tiered Smocked Mini Dress", category: "Dresses", price: 3499, stock: 18, image: "/public/images/products/floral-maxi-dress.jpg", colors: ["Blush Pink Floral"], sizes: ["XS", "S", "M", "L"] },
  { sku: "PROD-102", title: "Lavender Cable Knit Cardigan", category: "Outerwear & Knits", price: 2999, stock: 12, image: "/public/images/products/lavender-cardigan.jpg", colors: ["Lavender"], sizes: ["S", "M", "L"] },
  { sku: "PROD-103", title: "Pastel Pink Quilted Crossbody Bag", category: "Bags & Totes", price: 2500, stock: 9, image: "/public/images/products/pink-crossbody-bag.jpg", colors: ["Pastel Pink"], sizes: ["One Size"] },
  { sku: "PROD-104", title: "Velvet Lip Tint Trio Set", category: "Beauty", price: 1999, stock: 30, image: "/public/images/products/lip-tint-trio.jpg", colors: ["Rose & Berry"], sizes: ["One Size"] },
  { sku: "PROD-105", title: "Pastel Platform Casual Sneakers", category: "Footwear", price: 1999, stock: 14, image: "/public/images/products/pastel-sneakers.jpg", colors: ["Blush White"], sizes: ["36", "37", "38", "39", "40"] },
  { sku: "PROD-106", title: "Dainty Butterfly Hairpins & Clips Set", category: "Jewelry & Accessories", price: 2499, stock: 25, image: "/public/images/products/butterfly-hairpins.jpg", colors: ["Gold / Crystal"], sizes: ["One Size"] },
  { sku: "PROD-304", title: "Y2K Aesthetic Chunky Knit Cardigan", category: "Outerwear & Knits", price: 3450, originalPrice: 4200, badge: "18% OFF", stock: 4, image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=350&q=80", colors: ["Lavender", "Sage Green", "Oatmeal"], sizes: ["XS", "S", "M", "L"] },
  { sku: "PROD-309", title: "Pleated Pastel Tennis Mini Skirt", category: "Skirts & Bottoms", price: 2290, originalPrice: 2800, badge: "Flash Sale", stock: 20, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=350&q=80", colors: ["Baby Pink", "Lilac", "Crisp White"], sizes: ["S", "M", "L"] },
  { sku: "PROD-412", title: "Layered Dainty Butterfly Pendant Necklace", category: "Jewelry & Accessories", price: 950, originalPrice: 1200, badge: "Best Seller", stock: 40, image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=350&q=80", colors: ["18k Gold Plated", "Silver"], sizes: ["One Size"] },
  { sku: "PROD-510", title: "Retro Canvas Crossbody Tote Bag with Charms", category: "Bags & Totes", price: 1850, originalPrice: 2200, badge: "Trending", stock: 0, allowPreorder: true, image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=350&q=80", colors: ["Off-White", "Midnight Black"], sizes: ["Free Size"] }
];

const coupons = [
  { code: "TEEN10", title: "10% Off Everything", type: "percentage", value: 10, minSpend: 2500, badge: "Active", validDays: 90 },
  { code: "FREESHIP", title: "Islandwide Free Courier Delivery", type: "free_shipping", value: 0, minSpend: 3500, badge: "Popular", validDays: 105 },
  { code: "VIPGOLD15", title: "VIP Gold Tier Member Exclusive", type: "fixed", value: 1000, minSpend: 5000, badge: "VIP Perk", tier: "gold" }
];

export async function run(db) {
  if (skipInProduction("CatalogSeeder")) return;

  for (const product of products) {
    await db.query(
      `INSERT INTO products
         (sku, title, category, price, original_price, badge, stock, allow_preorder, image, colors, sizes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [
        product.sku, product.title, product.category, product.price, product.originalPrice ?? null,
        product.badge ?? null, product.stock, product.allowPreorder ?? false, product.image,
        JSON.stringify(product.colors), JSON.stringify(product.sizes)
      ]
    );
  }

  for (const coupon of coupons) {
    await db.query(
      `INSERT INTO coupons (code, title, discount_type, discount_value, min_spend, required_tier, badge, valid_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [
        coupon.code, coupon.title, coupon.type, coupon.value, coupon.minSpend, coupon.tier ?? null,
        coupon.badge, coupon.validDays ? daysFromNow(coupon.validDays) : null
      ]
    );
  }
}
