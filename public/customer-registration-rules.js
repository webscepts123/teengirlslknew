import { SRI_LANKA_LOCATIONS } from "./sri-lanka-locations.js";

// Field rules for customer registration. The register page runs these before
// submitting and CustomerAuthController runs them again on the server, so both
// always agree. Uniqueness (email, phone, NIC) and referral lookups are
// server-only because they need the customer store.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[\p{L}][\p{L} .'-]*$/u;

// Accepts 0771234567, 771234567, 94771234567 or +94 77 123 4567 and returns
// the canonical 94XXXXXXXXX form, or null when it is not a Sri Lankan mobile.
export function normalizeSriLankanPhone(value) {
  const digits = String(value ?? "").replace(/[\s()+-]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const local = digits.replace(/^(94|0)/, "");
  return /^7\d{8}$/.test(local) ? `94${local}` : null;
}

// Old NIC: 9 digits + V/X (e.g. 980545355V). New NIC: 12 digits.
export function normalizeNic(value) {
  const nic = String(value ?? "").replace(/\s/g, "").toUpperCase();
  return /^(\d{9}[VX]|\d{12})$/.test(nic) ? nic : null;
}

export function normalizeRegistration(input = {}) {
  const text = (key) => String(input[key] ?? "").trim();
  return {
    referralCode: text("referralCode").toUpperCase(),
    firstName: text("firstName").replace(/\s+/g, " "),
    lastName: text("lastName").replace(/\s+/g, " "),
    email: text("email").toLowerCase(),
    phone: text("phone"),
    nic: text("nic").toUpperCase(),
    district: text("district"),
    city: text("city"),
    address: text("address").replace(/\s+/g, " "),
    postalCode: text("postalCode"),
    password: String(input.password ?? ""),
    confirmPassword: String(input.confirmPassword ?? "")
  };
}

// Returns { values, errors } where errors maps field name -> message.
export function validateRegistration(input) {
  const values = normalizeRegistration(input);
  const errors = {};

  if (values.referralCode && !/^[A-Z0-9]{4,20}$/.test(values.referralCode)) {
    errors.referralCode = "Referral code should be 4-20 letters or numbers.";
  }

  for (const [key, label] of [["firstName", "First name"], ["lastName", "Last name"]]) {
    if (!values[key]) errors[key] = `${label} is required.`;
    else if (values[key].length > 60 || !NAME_PATTERN.test(values[key])) errors[key] = `Enter a valid ${label.toLowerCase()}.`;
  }

  if (!values.email) errors.email = "E-mail address is required.";
  else if (values.email.length > 191 || !EMAIL_PATTERN.test(values.email)) errors.email = "Enter a valid e-mail address.";

  if (!values.phone) errors.phone = "Phone number is required.";
  else {
    const phone = normalizeSriLankanPhone(values.phone);
    if (phone) values.phone = phone;
    else errors.phone = "Enter a valid Sri Lankan mobile number, e.g. 94771234567.";
  }

  if (!values.nic) errors.nic = "NIC number is required.";
  else {
    const nic = normalizeNic(values.nic);
    if (nic) values.nic = nic;
    else errors.nic = "Enter a valid NIC: 9 digits + V/X, or 12 digits.";
  }

  const cities = SRI_LANKA_LOCATIONS[values.district];
  if (!values.district) errors.district = "Please select your district.";
  else if (!cities) errors.district = "Please select a district from the list.";

  if (!values.city) errors.city = "Please select your city.";
  else if (cities && !cities.includes(values.city)) errors.city = "Please select a city from the list.";

  if (!values.address) errors.address = "Address is required.";
  else if (values.address.length > 255) errors.address = "Address is too long (max 255 characters).";

  if (!values.postalCode) errors.postalCode = "Postal code is required.";
  else if (!/^\d{5}$/.test(values.postalCode)) errors.postalCode = "Postal code must be 5 digits.";

  if (!values.password) errors.password = "Password is required.";
  else if (values.password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) errors.password = "Use at least one letter and one number.";

  if (!values.confirmPassword) errors.confirmPassword = "Please confirm your password.";
  else if (values.password !== values.confirmPassword) errors.confirmPassword = "Passwords do not match.";

  return { values, errors };
}
