import { Controller } from "noderyx-framework";

// Storefront highlights shown on the home page. Mirrors database/seeders/02_CatalogSeeder.js
// until the controllers read from the products table.
const featuredProducts = [
  { sku: "PROD-304", title: "Y2K Aesthetic Chunky Knit Cardigan", category: "Outerwear & Knits", price: 3450, originalPrice: 4200, badge: "18% OFF", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80" },
  { sku: "PROD-101", title: "Floral Tiered Smocked Mini Dress", category: "Dresses", price: 3499, image: "/public/images/products/floral-maxi-dress.jpg" },
  { sku: "PROD-309", title: "Pleated Pastel Tennis Mini Skirt", category: "Skirts & Bottoms", price: 2290, originalPrice: 2800, badge: "Flash Sale", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80" },
  { sku: "PROD-103", title: "Pastel Pink Quilted Crossbody Bag", category: "Bags & Totes", price: 2500, image: "/public/images/products/pink-crossbody-bag.jpg" },
  { sku: "PROD-412", title: "Layered Dainty Butterfly Pendant Necklace", category: "Jewelry & Accessories", price: 950, originalPrice: 1200, badge: "Best Seller", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80" },
  { sku: "PROD-104", title: "Velvet Lip Tint Trio Set", category: "Beauty", price: 1999, image: "/public/images/products/lip-tint-trio.jpg" },
  { sku: "PROD-105", title: "Pastel Platform Casual Sneakers", category: "Footwear", price: 1999, image: "/public/images/products/pastel-sneakers.jpg" },
  { sku: "PROD-106", title: "Dainty Butterfly Hairpins & Clips Set", category: "Jewelry & Accessories", price: 2499, image: "/public/images/products/butterfly-hairpins.jpg" }
];

const categories = [
  { name: "Dresses", icon: "fa-person-dress" },
  { name: "Outerwear & Knits", icon: "fa-shirt" },
  { name: "Bags & Totes", icon: "fa-bag-shopping" },
  { name: "Beauty", icon: "fa-wand-magic-sparkles" },
  { name: "Footwear", icon: "fa-shoe-prints" },
  { name: "Jewelry & Accessories", icon: "fa-gem" }
];

const formatLkr = (amount) => `Rs. ${amount.toLocaleString("en-LK")}`;

export class HomeController extends Controller {
  async index() {
    const customer = this.context.session?.customer ?? null;

    return this.render("home", {
      siteName: "TeenGirlsLK",
      pageTitle: "Trendy Fashion for Teen Girls",
      description: process.env.SITE_DESCRIPTION ?? "Trendy fashion, beauty and accessories for teen girls in Sri Lanka.",
      customer,
      categories,
      products: featuredProducts.map((product) => ({
        ...product,
        priceLabel: formatLkr(product.price),
        originalPriceLabel: product.originalPrice ? formatLkr(product.originalPrice) : null
      })),
      year: new Date().getFullYear()
    });
  }

  async health() {
    return this.json({ status: "ok", runtime: "Node.js" });
  }
}
