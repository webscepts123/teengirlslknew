// Shared field definitions: the server validates the same inputs the admin sees.
export const featureSchemas = {
  promotions: [
    ["name", "Campaign name", "text"],
    ["discountPercent", "Discount percentage", "number"],
    ["minSpend", "Minimum spend (LKR)", "number"],
    ["startsAt", "Starts at", "datetime-local"],
    ["endsAt", "Ends at", "datetime-local"],
    ["category", "Category (blank for all)", "text", true],
  ],
  "flash-sale": [
    ["name", "Sale name", "text"],
    ["productSku", "Product SKU", "text"],
    ["salePrice", "Sale price (LKR)", "number"],
    ["quantity", "Available quantity", "number"],
    ["startsAt", "Starts at", "datetime-local"],
    ["endsAt", "Ends at", "datetime-local"],
  ],
  "surprise-box": [
    ["name", "Box name", "text"],
    ["price", "Points required (whole number)", "number"],
    ["product", "Packing reference (private; no inventory link)", "text", true],
    ["description", "Description", "textarea"],
  ],
  bidding: [
    ["name", "Auction name", "text"],
    ["productSku", "Product SKU", "text"],
    ["targetBids", "Total point bids to end the round", "number"],
    ["cancelHours", "Cancellation window (hours; 0 = until round closes)", "number"],
    ["claimHours", "Winner claim window (hours)", "number"],
  ],
  delivery: [
    ["name", "Courier / service name", "text"],
    ["district", "District (blank for all)", "text", true],
    ["city", "City (blank for all)", "text", true],
    ["charge", "Delivery charge (LKR)", "number"],
    ["chargePerKg", "Extra weight charge per whole kg (LKR)", "number", true],
    ["freeAbove", "Free delivery above (LKR)", "number"],
    ["estimatedDays", "Estimated delivery days", "number"],
  ],
  payouts: [
    ["name", "Settlement reference", "text"],
    ["amount", "Amount (LKR)", "number"],
    ["method", "Payment method", "text"],
    ["paidAt", "Settlement date", "date"],
    ["notes", "Notes", "textarea", true],
  ],
  faq: [
    ["name", "Question", "text"],
    ["answer", "Answer", "textarea"],
    ["displayOrder", "Display order", "number"],
  ],
};
