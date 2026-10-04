import { Controller } from "noderyx-framework";
import { customersDb } from "./CustomerAuthController.js";

// Mock customer orders repository matching exact reference mockup
export let customerOrders = [
  {
    id: "#TG12458",
    orderNumber: "TG12458",
    date: "May 10, 2024",
    rawDate: "2024-05-10",
    status: "Delivered",
    statusBadge: "badge-delivered",
    price: "LKR 3,499",
    itemsCount: "1 Item",
    paymentMethod: "Cash on Delivery (COD)",
    paymentStatus: "Paid on Delivery",
    courierName: "Domex Express LK",
    trackingNumber: "DMX-98214402-LK",
    image: "/public/images/products/floral-maxi-dress.jpg",
    items: [
      {
        id: "PROD-101",
        title: "Floral Tiered Smocked Mini Dress",
        variant: "Blush Pink Floral / Size M",
        price: "LKR 3,499",
        quantity: 1,
        image: "/public/images/products/floral-maxi-dress.jpg"
      }
    ]
  },
  {
    id: "#TG12420",
    orderNumber: "TG12420",
    date: "May 02, 2024",
    rawDate: "2024-05-02",
    status: "Shipped",
    statusBadge: "badge-shipped",
    price: "LKR 2,999",
    itemsCount: "1 Item",
    paymentMethod: "Visa / Mastercard",
    paymentStatus: "Paid Online",
    courierName: "Flash Express LK",
    trackingNumber: "FLS-882910-LK",
    image: "/public/images/products/lavender-cardigan.jpg",
    items: [
      {
        id: "PROD-102",
        title: "Lavender Cable Knit Cardigan",
        variant: "Lavender / Size S",
        price: "LKR 2,999",
        quantity: 1,
        image: "/public/images/products/lavender-cardigan.jpg"
      }
    ]
  },
  {
    id: "#TG12375",
    orderNumber: "TG12375",
    date: "Apr 28, 2024",
    rawDate: "2024-05-28",
    status: "Delivered",
    statusBadge: "badge-delivered",
    price: "LKR 4,499",
    itemsCount: "2 Items",
    paymentMethod: "Koko: 3 Installments",
    paymentStatus: "Completed",
    courierName: "Pronto Lanka Delivery",
    trackingNumber: "PRN-551029-LK",
    image: "/public/images/products/pink-crossbody-bag.jpg",
    items: [
      {
        id: "PROD-103",
        title: "Pastel Pink Quilted Crossbody Bag",
        variant: "Pastel Pink",
        price: "LKR 2,500",
        quantity: 1,
        image: "/public/images/products/pink-crossbody-bag.jpg"
      },
      {
        id: "PROD-104",
        title: "Velvet Lip Tint Trio Set",
        variant: "Rose & Berry",
        price: "LKR 1,999",
        quantity: 1,
        image: "/public/images/products/lip-tint-trio.jpg"
      }
    ]
  },
  {
    id: "#TG12312",
    orderNumber: "TG12312",
    date: "Apr 20, 2024",
    rawDate: "2024-04-20",
    status: "Delivered",
    statusBadge: "badge-delivered",
    price: "LKR 1,999",
    itemsCount: "1 Item",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Paid on Delivery",
    courierName: "Domex Express LK",
    trackingNumber: "DMX-772102-LK",
    image: "/public/images/products/pastel-sneakers.jpg",
    items: [
      {
        id: "PROD-105",
        title: "Pastel Platform Casual Sneakers",
        variant: "Blush White / Size 38",
        price: "LKR 1,999",
        quantity: 1,
        image: "/public/images/products/pastel-sneakers.jpg"
      }
    ]
  },
  {
    id: "#TG12280",
    orderNumber: "TG12280",
    date: "Apr 10, 2024",
    rawDate: "2024-04-10",
    status: "Cancelled",
    statusBadge: "badge-cancelled",
    price: "LKR 2,499",
    itemsCount: "1 Item",
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Cancelled",
    courierName: "N/A",
    trackingNumber: "N/A",
    image: "/public/images/products/butterfly-hairpins.jpg",
    items: [
      {
        id: "PROD-106",
        title: "Dainty Butterfly Hairpins & Clips Set",
        variant: "Gold / Crystal",
        price: "LKR 2,499",
        quantity: 1,
        image: "/public/images/products/butterfly-hairpins.jpg"
      }
    ]
  }
];

// Mock customer wishlist items
export let customerWishlist = [
  {
    id: "WISH-101",
    productId: "PROD-304",
    title: "Y2K Aesthetic Chunky Knit Cardigan",
    category: "Outerwear & Knits",
    price: "Rs 3,450.00",
    originalPrice: "Rs 4,200.00",
    discountTag: "18% OFF",
    stockStatus: "In Stock (Only 4 left)",
    stockClass: "stock-low",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=350&q=80",
    colors: ["Lavender", "Sage Green", "Oatmeal"],
    sizes: ["XS", "S", "M", "L"]
  },
  {
    id: "WISH-102",
    productId: "PROD-309",
    title: "Pleated Pastel Tennis Mini Skirt",
    category: "Skirts & Bottoms",
    price: "Rs 2,290.00",
    originalPrice: "Rs 2,800.00",
    discountTag: "Flash Sale",
    stockStatus: "In Stock",
    stockClass: "stock-available",
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=350&q=80",
    colors: ["Baby Pink", "Lilac", "Crisp White"],
    sizes: ["S", "M", "L"]
  },
  {
    id: "WISH-103",
    productId: "PROD-412",
    title: "Layered Dainty Butterfly Pendant Necklace",
    category: "Jewelry & Accessories",
    price: "Rs 950.00",
    originalPrice: "Rs 1,200.00",
    discountTag: "Best Seller",
    stockStatus: "In Stock",
    stockClass: "stock-available",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=350&q=80",
    colors: ["18k Gold Plated", "Silver"],
    sizes: ["One Size"]
  },
  {
    id: "WISH-104",
    productId: "PROD-510",
    title: "Retro Canvas Crossbody Tote Bag with Charms",
    category: "Bags & Totes",
    price: "Rs 1,850.00",
    originalPrice: "Rs 2,200.00",
    discountTag: "Trending",
    stockStatus: "Pre-Order Restock",
    stockClass: "stock-preorder",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=350&q=80",
    colors: ["Off-White", "Midnight Black"],
    sizes: ["Free Size"]
  }
];

// Mock coupons and vouchers
export const customerCoupons = [
  {
    code: "TEEN10",
    title: "10% Off Everything",
    discount: "10% OFF",
    minSpend: "Min spend Rs 2,500",
    validTill: "Valid till Jun 30, 2025",
    type: "Percentage",
    badge: "Active",
    badgeClass: "badge-pink"
  },
  {
    code: "FREESHIP",
    title: "Islandwide Free Courier Delivery",
    discount: "FREE SHIPPING",
    minSpend: "Orders over Rs 3,500",
    validTill: "Valid till Jul 15, 2025",
    type: "Shipping",
    badge: "Popular",
    badgeClass: "badge-teal"
  },
  {
    code: "VIPGOLD15",
    title: "VIP Gold Tier Member Exclusive",
    discount: "Rs 1,000 OFF",
    minSpend: "Min spend Rs 5,000",
    validTill: "Exclusive to Gold Members",
    type: "VIP Reward",
    badge: "VIP Perk",
    badgeClass: "badge-gold"
  }
];

export class CustomerPanelController extends Controller {
  /**
   * Helper: ensure customer is authenticated, default to Nethmi Perera for seamless access
   */
  getAuthenticatedCustomer() {
    return customersDb[0];
  }

  /**
   * Main Customer Portal View
   */
  async dashboard() {
    const customer = this.getAuthenticatedCustomer();

    const activeTab = this.query.tab || "dashboard";
    const welcome = this.query.welcome === "true";

    // Active in-transit order
    const activeOrder = customerOrders.find((o) => o.status === "Out for Delivery" || o.status === "Shipped") || customerOrders[0];

    // Compute stats matching exact mockup
    const stats = {
      totalOrders: customer.totalOrders || 12,
      activeOrders: customerOrders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled").length,
      wishlistCount: customer.wishlistCount || 8,
      rewardPoints: customer.points || 560,
      totalSpent: customer.totalSpent || "LKR 24,350",
      voucherAway: customer.voucherAway || "LKR 440",
      targetVoucher: customer.targetVoucher || "LKR 1,000",
      voucherTargetPoints: customer.voucherTargetPoints || 1000,
      voucherProgressPercent: Math.min(100, Math.round(((customer.points || 560) / 1000) * 100)),
      voucherProgressLabel: `${customer.points || 560} / 1000`,
      pointsValueLKR: `LKR ${(customer.points || 560).toLocaleString()}.00`,
      storeCredit: customer.storeCredit || "LKR 1,000.00",
      tier: customer.tier,
      tierProgress: 56,
      nextTierPoints: 440
    };

    return this.render("customer/dashboard", {
      siteName: "teengirls.lk",
      pageTitle: "Customer Dashboard",
      customer,
      stats,
      activeOrder,
      orders: customerOrders,
      wishlist: customerWishlist,
      coupons: customerCoupons,
      addresses: customer.addresses,
      activeTab,
      welcome,
      csrfToken: this.context.csrfToken
    });
  }

  /**
   * Dedicated sub-routes rendering dashboard with specific tabs open
   */
  async orders() {
    this.query.tab = "orders";
    return this.dashboard();
  }

  async wishlist() {
    this.query.tab = "wishlist";
    return this.dashboard();
  }

  async addresses() {
    this.query.tab = "addresses";
    return this.dashboard();
  }

  async rewards() {
    this.query.tab = "rewards";
    return this.dashboard();
  }

  async profile() {
    this.query.tab = "profile";
    return this.dashboard();
  }

  async support() {
    this.query.tab = "support";
    return this.dashboard();
  }

  /**
   * API: Save / Add Address
   */
  async saveAddress() {
    const customer = this.getAuthenticatedCustomer();
    if (!customer) return this.json({ success: false, error: "Unauthorized" }, 401);

    const { id, label, recipientName, phone, street, city, district, postalCode, notes, isDefault } = this.body ?? {};

    if (!recipientName || !phone || !street || !city) {
      return this.json({ success: false, error: "Recipient name, phone, street address, and city are required." }, 422);
    }

    if (id) {
      // Edit existing
      const addrIndex = customer.addresses.findIndex((a) => a.id === id);
      if (addrIndex !== -1) {
        if (isDefault) {
          customer.addresses.forEach((a) => (a.isDefault = false));
        }
        customer.addresses[addrIndex] = {
          ...customer.addresses[addrIndex],
          label: label || "Other",
          recipientName,
          phone,
          street,
          city,
          district: district || "Colombo",
          postalCode: postalCode || "",
          notes: notes || "",
          isDefault: isDefault === true || isDefault === "true" || isDefault === "1"
        };
      }
    } else {
      // Add new
      if (isDefault || customer.addresses.length === 0) {
        customer.addresses.forEach((a) => (a.isDefault = false));
      }
      const newAddr = {
        id: `ADDR-${Math.floor(100 + Math.random() * 900)}`,
        label: label || "Home",
        isDefault: isDefault === true || isDefault === "true" || isDefault === "1" || customer.addresses.length === 0,
        recipientName,
        phone,
        street,
        city,
        district: district || "Colombo",
        postalCode: postalCode || "",
        notes: notes || ""
      };
      customer.addresses.push(newAddr);
    }

    return this.json({
      success: true,
      message: "Address saved successfully.",
      addresses: customer.addresses
    });
  }

  /**
   * API: Delete Address
   */
  async deleteAddress() {
    const customer = this.getAuthenticatedCustomer();
    if (!customer) return this.json({ success: false, error: "Unauthorized" }, 401);

    const { addressId } = this.body ?? {};
    if (!addressId) return this.json({ success: false, error: "Address ID required" }, 422);

    customer.addresses = customer.addresses.filter((a) => a.id !== addressId);
    if (customer.addresses.length > 0 && !customer.addresses.some((a) => a.isDefault)) {
      customer.addresses[0].isDefault = true;
    }

    return this.json({
      success: true,
      message: "Address removed from your address book.",
      addresses: customer.addresses
    });
  }

  /**
   * API: Update Customer Profile & Style Preferences
   */
  async updateProfile() {
    const customer = this.getAuthenticatedCustomer();
    if (!customer) return this.json({ success: false, error: "Unauthorized" }, 401);

    const { name, phone, preferredTopSize, preferredBottomSize, preferredFootwear, styleAesthetics } = this.body ?? {};

    if (name) customer.name = name;
    if (phone) customer.phone = phone;

    if (!customer.preferences) customer.preferences = {};
    if (preferredTopSize) customer.preferences.preferredTopSize = preferredTopSize;
    if (preferredBottomSize) customer.preferences.preferredBottomSize = preferredBottomSize;
    if (preferredFootwear) customer.preferences.preferredFootwear = preferredFootwear;
    if (styleAesthetics) {
      customer.preferences.styleAesthetics = Array.isArray(styleAesthetics) ? styleAesthetics : [styleAesthetics];
    }

    if (this.context.session?.customer) {
      this.context.session.customer.name = customer.name;
      this.context.session.customer.phone = customer.phone;
    }

    return this.json({
      success: true,
      message: "Profile preferences updated successfully!",
      customer
    });
  }

  /**
   * API: Wishlist Item Removal
   */
  async removeWishlistItem() {
    const customer = this.getAuthenticatedCustomer();
    if (!customer) return this.json({ success: false, error: "Unauthorized" }, 401);

    const { itemId } = this.body ?? {};
    customerWishlist = customerWishlist.filter((w) => w.id !== itemId);

    return this.json({
      success: true,
      message: "Item removed from your wishlist.",
      wishlistCount: customerWishlist.length
    });
  }

  /**
   * API: Redeem Loyalty Points for Discount Voucher
   */
  async redeemPoints() {
    const customer = this.getAuthenticatedCustomer();
    if (!customer) return this.json({ success: false, error: "Unauthorized" }, 401);

    const { pointsToRedeem } = this.body ?? {};
    const pts = parseInt(pointsToRedeem, 10) || 500;

    if (customer.points < pts) {
      return this.json({ success: false, error: `Insufficient points. You currently have ${customer.points} points.` }, 400);
    }

    customer.points -= pts;
    const generatedVoucherCode = `REDEEM${pts}-${Math.floor(100 + Math.random() * 900)}`;

    const newCoupon = {
      code: generatedVoucherCode,
      title: `Rs ${pts}.00 Instant Cash Discount`,
      discount: `Rs ${pts}.00 OFF`,
      minSpend: `Min spend Rs ${(pts * 2).toLocaleString()}`,
      validTill: "Valid for 30 days",
      type: "Points Redemption",
      badge: "Redeemed",
      badgeClass: "badge-purple"
    };

    customerCoupons.unshift(newCoupon);

    return this.json({
      success: true,
      message: `Successfully redeemed ${pts} points for a Rs ${pts}.00 discount voucher!`,
      newBalance: customer.points,
      coupon: newCoupon
    });
  }

  /**
   * API: Submit Return / Exchange Request
   */
  async submitReturn() {
    const customer = this.getAuthenticatedCustomer();
    if (!customer) return this.json({ success: false, error: "Unauthorized" }, 401);

    const { orderId, reason, comments, actionType } = this.body ?? {};
    if (!orderId || !reason) {
      return this.json({ success: false, error: "Order ID and return reason are required." }, 422);
    }

    return this.json({
      success: true,
      message: `Your ${actionType || "Return / Exchange"} request for Order ${orderId} has been submitted! Our customer care team will contact you on WhatsApp within 2 hours.`,
      ticketId: `RET-${Math.floor(1000 + Math.random() * 9000)}`
    });
  }

  /**
   * Helper for HTTP redirection
   */
  redirect(url, status = 302) {
    const response = this.context.response;
    if (response && !response.writableEnded) {
      const locals = response.locals;
      if (locals?.finishSession) {
        locals.finishSession();
        locals.finishSession = null;
      }
      const headers = { ...(response.baseHeaders ?? {}), Location: url };
      if (locals?.cookies?.length) {
        headers["set-cookie"] = locals.cookies;
      }
      response.writeHead(status, headers);
      return response.end();
    }
  }
}
