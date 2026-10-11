import { database, jsonValue, money, initials, titleCase } from "./database.js";

export function customerView(row, addresses = []) {
  return {
    id: row.code,
    name: row.name,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    nic: row.nic,
    referralCode: row.referral_code,
    avatar: row.avatar || "/public/images/placeholder.svg",
    initials: initials(row.name),
    tier: `${titleCase(row.tier)} Member`,
    tierColor: row.tier,
    points: Number(row.points),
    storeCredit: money(row.store_credit),
    joinedDate: new Date(row.created_at).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    preferences: jsonValue(row.preferences),
    addresses,
  };
}
export async function addressesFor(id, db) {
  db ??= await database();
  return (
    await db.query(
      "SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, id",
      [id],
    )
  ).map((row) => ({
    id: `ADDR-${row.id}`,
    label: row.label,
    recipientName: row.recipient_name,
    phone: row.phone,
    street: row.street,
    city: row.city,
    district: row.district,
    postalCode: row.postal_code,
    notes: row.notes,
    isDefault: Boolean(row.is_default),
  }));
}
export function couponView(row) {
  return {
    code: row.code,
    title: row.title,
    discount:
      row.discount_type === "percentage"
        ? `${Number(row.discount_value)}% OFF`
        : row.discount_type === "free_shipping"
          ? "FREE SHIPPING"
          : `${money(row.discount_value)} OFF`,
    minSpend: `Min spend ${money(row.min_spend)}`,
    validTill: row.valid_until
      ? `Valid till ${new Date(row.valid_until).toLocaleDateString("en-GB")}`
      : "No expiry",
    type: row.customer_id ? "Points Redemption" : titleCase(row.discount_type),
    badge: row.badge || "Active",
    badgeClass: "badge-pink",
  };
}
export async function ordersFor(id = null, db) {
  db ??= await database();
  const rows = await db.query(
    `SELECT o.*, c.name AS customer_name, c.email, c.phone FROM orders o JOIN customers c ON c.id=o.customer_id ${id ? "WHERE o.customer_id = ?" : ""} ORDER BY o.placed_at DESC`,
    id ? [id] : [],
  );
  if (!rows.length) return [];
  const items = await db.query(
    `SELECT i.*, p.sku FROM order_items i LEFT JOIN products p ON p.id=i.product_id WHERE i.order_id IN (${rows.map(() => "?").join(",")})`,
    rows.map((row) => row.id),
  );
  return rows.map((row) => {
    const orderItems = items
      .filter((item) => item.order_id === row.id)
      .map((item) => ({
        id: item.sku,
        title: item.title,
        variant: item.variant,
        price: money(item.unit_price),
        quantity: item.quantity,
        image: item.image,
      }));
    const count = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    return {
      id: `#${row.order_number}`,
      dbId: row.id,
      orderNumber: row.order_number,
      date: new Date(row.placed_at).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      rawDate: new Date(row.placed_at).toISOString().slice(0, 10),
      status: titleCase(row.status),
      statusBadge: `badge-${row.status === "out_for_delivery" ? "delivery" : row.status}`,
      price: money(row.total),
      total: money(row.total),
      itemsCount: `${count} ${count === 1 ? "Item" : "Items"}`,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      payment: row.payment_method,
      paymentBadge: "badge-cod",
      courierName: row.courier_name || "Awaiting assignment",
      trackingNumber: row.tracking_number || "Awaiting assignment",
      image: orderItems[0]?.image || "/public/images/placeholder.svg",
      items: orderItems,
      customer: row.customer_name,
      email: row.email,
      phone: row.phone,
      initials: initials(row.customer_name),
      notes: row.notes,
      numericTotal: Number(row.total),
    };
  });
}
