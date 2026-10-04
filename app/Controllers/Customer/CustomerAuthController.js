import { Controller } from "noderyx-framework";

// In-memory customer repository for stateful interaction
export const customersDb = [
  {
    id: "CUST-1001",
    name: "Nethmi Perera",
    firstName: "Nethmi",
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
    const customer = customersDb.find(
      (c) =>
        (c.email.toLowerCase() === cleanInput || c.phone.replace(/[\s-]/g, "") === cleanInput.replace(/[\s-]/g, "")) &&
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

    const error = this.query.error ?? null;
    const success = this.query.success ?? null;

    return this.render("customer/register", {
      siteName: "TeenGirlsLK",
      pageTitle: "Create Your Account",
      error,
      success,
      csrfToken: this.context.csrfToken
    });
  }

  /**
   * Process Customer Registration
   */
  async register() {
    const { firstName, lastName, email, phone, password, confirmPassword, topSize, styleInterest } = this.body ?? {};

    if (!firstName || !email || !password) {
      return this.render("customer/register", {
        siteName: "TeenGirlsLK",
        pageTitle: "Create Your Account",
        error: "Please fill in all required fields (Name, Email, and Password).",
        csrfToken: this.context.csrfToken
      }, 422);
    }

    if (password !== confirmPassword) {
      return this.render("customer/register", {
        siteName: "TeenGirlsLK",
        pageTitle: "Create Your Account",
        error: "Passwords do not match. Please verify and re-type.",
        csrfToken: this.context.csrfToken
      }, 422);
    }

    // Check if email already registered
    const existing = customersDb.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return this.render("customer/register", {
        siteName: "TeenGirlsLK",
        pageTitle: "Create Your Account",
        error: "An account with this email already exists. Please sign in instead.",
        csrfToken: this.context.csrfToken
      }, 409);
    }

    const fullName = `${firstName.trim()} ${lastName ? lastName.trim() : ""}`.trim();
    const initials = `${firstName[0]}${lastName ? lastName[0] : ""}`.toUpperCase();

    const newCustomer = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: fullName,
      email: email.trim(),
      phone: phone ? phone.trim() : "+94 77 000 0000",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80",
      initials,
      tier: "Bronze Member",
      tierColor: "bronze",
      points: 200, // Welcome gift points
      storeCredit: "Rs 500.00", // Welcome gift voucher
      joinedDate: "Just now",
      password: password,
      preferences: {
        preferredTopSize: topSize || "M",
        preferredBottomSize: "28",
        preferredFootwear: "38 (EU)",
        styleAesthetics: styleInterest ? [styleInterest] : ["Casual Chic"]
      },
      addresses: []
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
