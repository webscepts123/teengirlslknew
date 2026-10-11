import { Controller } from "noderyx-framework";
import { normalizeSriLankanPhone, validateRegistration } from "../../../public/customer-registration-rules.js";

// In-memory customer repository for stateful interaction
export const customersDb = [
  {
    id: "CUST-1001",
    name: "Nethmi Perera",
    firstName: "Nethmi",
    lastName: "Perera",
    nic: "200254301234",
    referralCode: "NETHMI1001",
    email: "nethmi.perera@gmail.com",
    phone: "077 123 4567",
    avatar: "/public/images/avatars/nethmi-avatar.jpg",
    initials: "NP",
    tier: "Gold Member",
    tierColor: "gold",
    points: 560,
    totalOrders: 12,
    wishlistCount: 8,
    totalSpent: "LKR 24,350",
    voucherAway: "LKR 440",
    targetVoucher: "LKR 1,000",
    voucherTargetPoints: 1000,
    storeCredit: "LKR 1,000.00",
    joinedDate: "January 2024",
    password: "password123",
    preferences: {
      preferredTopSize: "M",
      preferredBottomSize: "28",
      preferredFootwear: "38 (EU)",
      styleAesthetics: ["Streetwear", "Pastel Aesthetic", "Floral Chic"]
    },
    addresses: [
      {
        id: "ADDR-1",
        label: "Home",
        isDefault: true,
        recipientName: "Nethmi Perera",
        phone: "077 123 4567",
        street: "No. 42/B, Flower Road",
        city: "Colombo 07",
        district: "Colombo",
        postalCode: "00700",
        notes: "Deliver to security desk if away"
      },
      {
        id: "ADDR-2",
        label: "Campus / Hostel",
        isDefault: false,
        recipientName: "Nethmi Perera (Hostel Room 304)",
        phone: "077 123 4567",
        street: "University Campus Residential Hall, High Level Road",
        city: "Nugegoda",
        district: "Colombo",
        postalCode: "10250",
        notes: "Call upon arrival at main gate"
      }
    ]
  },
  {
    id: "CUST-1002",
    name: "Kavindi Silva",
    firstName: "Kavindi",
    lastName: "Silva",
    nic: "985431234V",
    referralCode: "KAVINDI1002",
    email: "kavindi.silva@gmail.com",
    phone: "+94 77 892 3411",
    avatar: "/images/avatars/avatar-1.jpg",
    initials: "KS",
    tier: "Silver Member",
    tierColor: "silver",
    points: 420,
    storeCredit: "Rs 0.00",
    joinedDate: "May 2024",
    password: "password123",
    preferences: {
      preferredTopSize: "S",
      preferredBottomSize: "26",
      preferredFootwear: "37 (EU)",
      styleAesthetics: ["Floral & Feminine", "Y2K Trends"]
    },
    addresses: [
      {
        id: "ADDR-3",
        label: "Home",
        isDefault: true,
        recipientName: "Ananya Perera",
        phone: "+94 71 455 9012",
        street: "18 Peradeniya Road",
        city: "Kandy",
        district: "Kandy",
        postalCode: "20000",
        notes: "Near Botanical Gardens"
      }
    ]
  }
];

export class CustomerAuthController extends Controller {
  /**
   * Render Customer Login Page
   */
  async showLogin() {
    if (this.context.session?.customer) {
      return this.redirect("/customer/dashboard");
    }

    const error = this.query.error ?? null;
    const success = this.query.success ?? null;
    const returnUrl = this.query.returnUrl ?? "/customer/dashboard";

    return this.render("customer/login", {
      siteName: "TeenGirlsLK",
      pageTitle: "Customer Sign In",
      error,
      success,
      returnUrl,
      csrfToken: this.context.csrfToken
    });
  }

  /**
   * Process Standard Customer Login
   */
  async login() {
    const { emailOrPhone, password, returnUrl = "/customer/dashboard" } = this.body ?? {};

    if (!emailOrPhone || !password) {
      return this.render("customer/login", {
        siteName: "TeenGirlsLK",
        pageTitle: "Customer Sign In",
        error: "Please enter your email or phone number and password.",
        returnUrl,
        csrfToken: this.context.csrfToken
      }, 422);
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();
    const inputPhone = normalizeSriLankanPhone(cleanInput);
    const customer = customersDb.find(
      (c) =>
        (c.email.toLowerCase() === cleanInput || (inputPhone && normalizeSriLankanPhone(c.phone) === inputPhone)) &&
        c.password === password
    );

    if (customer) {
      if (this.context.session) {
        this.context.session.customer = {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          avatar: customer.avatar,
          initials: customer.initials,
          tier: customer.tier,
          tierColor: customer.tierColor,
          points: customer.points,
          storeCredit: customer.storeCredit
        };
      }
      return this.redirect(returnUrl || "/customer/dashboard");
    }

    return this.render("customer/login", {
      siteName: "TeenGirlsLK",
      pageTitle: "Customer Sign In",
      error: "Invalid email/phone or password. Please try again or use the 1-Click Demo Login.",
      returnUrl,
      csrfToken: this.context.csrfToken
    }, 401);
  }

  /**
   * 1-Click Instant Demo Login (for client testing)
   */
  async demoLogin() {
    const { customerId = "CUST-1001" } = this.body ?? this.query ?? {};
    const customer = customersDb.find((c) => c.id === customerId) || customersDb[0];

    if (this.context.session) {
      this.context.session.customer = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        avatar: customer.avatar,
        initials: customer.initials,
        tier: customer.tier,
        tierColor: customer.tierColor,
        points: customer.points,
        storeCredit: customer.storeCredit
      };
    }

    return this.redirect("/customer/dashboard");
  }

  /**
   * Render Customer Registration Page
   */
  async showRegister() {
    if (this.context.session?.customer) {
      return this.redirect("/customer/dashboard");
    }

    return this.renderRegister({
      error: this.query.error ?? null,
      success: this.query.success ?? null,
      old: { referralCode: this.query.ref ?? "" }
    });
  }

  renderRegister({ error = null, success = null, errors = {}, old = {} } = {}, status = 200) {
    // Never echo passwords back into the form.
    const { password, confirmPassword, ...safeOld } = old;
    return this.render("customer/register", {
      siteName: "TeenGirlsLK",
      pageTitle: "Create Your Account",
      error,
      success,
      errors,
      old: safeOld,
      csrfToken: this.context.csrfToken
    }, status);
  }

  /**
   * Process Customer Registration
   */
  async register() {
    const { values, errors } = validateRegistration(this.body ?? {});

    if (!errors.email && customersDb.some((c) => c.email.toLowerCase() === values.email)) {
      errors.email = "An account with this e-mail already exists. Please sign in instead.";
    }
    if (!errors.phone && customersDb.some((c) => normalizeSriLankanPhone(c.phone) === values.phone)) {
      errors.phone = "This phone number is already registered.";
    }
    if (!errors.nic && customersDb.some((c) => c.nic?.toUpperCase() === values.nic)) {
      errors.nic = "This NIC number is already registered.";
    }

    const referrer = values.referralCode
      ? customersDb.find((c) => c.referralCode?.toUpperCase() === values.referralCode)
      : null;
    if (values.referralCode && !errors.referralCode && !referrer) {
      errors.referralCode = "This referral code is not valid.";
    }

    if (Object.keys(errors).length) {
      const conflict = errors.email?.includes("already") || errors.phone?.includes("already") || errors.nic?.includes("already");
      return this.renderRegister({
        error: "Please correct the highlighted fields and try again.",
        errors,
        old: values
      }, conflict ? 409 : 422);
    }

    const fullName = `${values.firstName} ${values.lastName}`;
    const initials = `${values.firstName[0]}${values.lastName[0]}`.toUpperCase();
    let id;
    do {
      id = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (customersDb.some((c) => c.id === id));

    const newCustomer = {
      id,
      name: fullName,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      nic: values.nic,
      referralCode: `${values.firstName.replace(/[^A-Za-z]/g, "").slice(0, 8).toUpperCase()}${id.slice(5)}`,
      referredBy: referrer?.id ?? null,
      avatar: "/public/images/placeholder.svg",
      initials,
      tier: "Bronze Member",
      tierColor: "bronze",
      points: 200, // Welcome gift points
      storeCredit: "Rs 500.00", // Welcome gift voucher
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      password: values.password,
      preferences: {
        preferredTopSize: "M",
        preferredBottomSize: "28",
        preferredFootwear: "38 (EU)",
        styleAesthetics: ["Casual Chic"]
      },
      addresses: [
        {
          id: `ADDR-${Date.now()}`,
          label: "Home",
          isDefault: true,
          recipientName: fullName,
          phone: values.phone,
          street: values.address,
          city: values.city,
          district: values.district,
          postalCode: values.postalCode,
          notes: ""
        }
      ]
    };

    customersDb.push(newCustomer);

    if (this.context.session) {
      this.context.session.customer = {
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        avatar: newCustomer.avatar,
        initials: newCustomer.initials,
        tier: newCustomer.tier,
        tierColor: newCustomer.tierColor,
        points: newCustomer.points,
        storeCredit: newCustomer.storeCredit
      };
    }

    return this.redirect("/customer/dashboard?welcome=true");
  }

  /**
   * Render Forgot Password Page
   */
  async showForgotPassword() {
    return this.render("customer/forgot_password", {
      siteName: "TeenGirlsLK",
      pageTitle: "Reset Password",
      error: this.query.error ?? null,
      success: this.query.success ?? null,
      csrfToken: this.context.csrfToken
    });
  }

  /**
   * Handle Forgot Password Submission
   */
  async handleForgotPassword() {
    const { emailOrPhone } = this.body ?? {};
    if (!emailOrPhone) {
      return this.render("customer/forgot_password", {
        siteName: "TeenGirlsLK",
        pageTitle: "Reset Password",
        error: "Please enter your registered email address or mobile number.",
        csrfToken: this.context.csrfToken
      }, 422);
    }

    return this.render("customer/forgot_password", {
      siteName: "TeenGirlsLK",
      pageTitle: "Reset Password",
      success: `A password reset link & 6-digit verification code has been sent to ${emailOrPhone}.`,
      csrfToken: this.context.csrfToken
    });
  }

  /**
   * Customer Logout
   */
  async logout() {
    if (this.context.session) {
      this.context.session.customer = null;
    }
    return this.redirect("/customer/login?success=" + encodeURIComponent("You have signed out safely. See you again soon!"));
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
