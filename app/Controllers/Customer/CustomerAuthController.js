import { randomUUID, randomBytes, createHash } from "node:crypto";
import { hashPassword, verifyPassword } from "noderyx-framework";
import { AppController } from "../AppController.js";
import { database, transaction } from "../../Services/database.js";
import {
  customerForLogin,
  customerPhoneCandidates,
  customerView,
  normalizedCustomerPhoneSql,
} from "../../Services/customer.js";
import {
  normalizeSriLankanPhone,
  validateRegistration,
} from "../../../public/customer-registration-rules.js";

const safeReturn = (value) =>
  typeof value === "string" &&
  /^\/(?!\/)/.test(value) &&
  !/[\\\r\n]/.test(value)
    ? value
    : "/customer/dashboard";
export class CustomerAuthController extends AppController {
  async showLogin() {
    if (this.context.session?.customer)
      return this.redirect("/customer/dashboard");
    return this.render("customer/login", {
      siteName: "TeenGirlsLK",
      pageTitle: "Customer Sign In",
      error: this.query.error ?? null,
      success: this.query.success ?? null,
      returnUrl: safeReturn(this.query.returnUrl),
      allowDemoLogin: process.env.NODE_ENV !== "production",
      csrfToken: this.context.csrfToken,
    });
  }
  async login() {
    const b = this.body ?? {};
    const db = await database();
    const input = String(b.emailOrPhone || "")
      .trim()
      .toLowerCase();
    const row = await customerForLogin(input, db);
    if (row && (await verifyPassword(b.password || "", row.password_hash))) {
      this.context.session.customer = customerView(row);
      return this.redirect(safeReturn(b.returnUrl));
    }
    return this.render(
      "customer/login",
      {
        siteName: "TeenGirlsLK",
        pageTitle: "Customer Sign In",
        error: "Invalid email/phone or password.",
        returnUrl: safeReturn(b.returnUrl),
        allowDemoLogin: process.env.NODE_ENV !== "production",
        csrfToken: this.context.csrfToken,
      },
      401,
    );
  }
  async demoLogin() {
    if (process.env.NODE_ENV === "production") return this.redirect("/login");
    const [row] = await (
      await database()
    ).query("SELECT * FROM customers WHERE code=? AND is_active=1", [
      this.body?.customerId || this.query.customerId || "CUST-1001",
    ]);
    if (!row)
      return this.redirect("/login?error=Run%20the%20demo%20seeder%20first");
    this.context.session.customer = customerView(row);
    return this.redirect("/customer/dashboard");
  }
  async showRegister() {
    return this.renderRegister({ old: { referralCode: this.query.ref || "" } });
  }
  renderRegister({ error = null, errors = {}, old = {} } = {}, status = 200) {
    const { password, confirmPassword, ...safeOld } = old;
    return this.render(
      "customer/register",
      {
        siteName: "TeenGirlsLK",
        pageTitle: "Create Your Account",
        error,
        errors,
        old: safeOld,
        csrfToken: this.context.csrfToken,
      },
      status,
    );
  }
  async register() {
    const { values: v, errors } = validateRegistration(this.body ?? {});
    const db = await database();
    const phoneCandidates = customerPhoneCandidates(v.phone);
    const phonePlaceholders = phoneCandidates.map(() => "?").join(", ");
    const existing = await db.query(
      `SELECT email,phone,nic FROM customers WHERE email=? OR nic=? OR phone IN (${phonePlaceholders}) OR ${normalizedCustomerPhoneSql} IN (${phonePlaceholders})`,
      [v.email, v.nic, ...phoneCandidates, ...phoneCandidates],
    );
    for (const row of existing) {
      if (row.email.toLowerCase() === v.email)
        errors.email = "This email is already registered.";
      if (normalizeSriLankanPhone(row.phone) === v.phone)
        errors.phone = "This phone is already registered.";
      if (row.nic === v.nic) errors.nic = "This NIC is already registered.";
    }
    const [referrer] = v.referralCode
      ? await db.query(
          "SELECT id FROM customers WHERE referral_code=? AND is_active=1",
          [v.referralCode],
        )
      : [];
    if (v.referralCode && !referrer)
      errors.referralCode = "Invalid referral code.";
    if (Object.keys(errors).length)
      return this.renderRegister(
        { error: "Please correct the highlighted fields.", errors, old: v },
        422,
      );
    const code = `CUST-${randomUUID().slice(0, 12)}`;
    const name = `${v.firstName} ${v.lastName}`;
    const referral = `${v.firstName.slice(0, 6).toUpperCase()}${randomBytes(4).toString("hex").toUpperCase()}`;
    try {
      await transaction(async (tx) => {
        const result = await tx.query(
          "INSERT INTO customers(code,name,first_name,last_name,email,phone,nic,referral_code,referred_by_customer_id,password_hash,points,store_credit,preferences) VALUES (?,?,?,?,?,?,?,?,?,?,200,500,?)",
          [
            code,
            name,
            v.firstName,
            v.lastName,
            v.email,
            v.phone,
            v.nic,
            referral,
            referrer?.id ?? null,
            await hashPassword(v.password),
            JSON.stringify({}),
          ],
        );
        await tx.query(
          "INSERT INTO customer_addresses(customer_id,label,recipient_name,phone,street,city,district,postal_code,is_default) VALUES (?,'Home',?,?,?,?,?,?,1)",
          [
            result.insertId,
            name,
            v.phone,
            v.address,
            v.city,
            v.district,
            v.postalCode || "",
          ],
        );
        await tx.query(
          "INSERT INTO reward_transactions(customer_id,amount,reason) VALUES (?,200,'Welcome gift')",
          [result.insertId],
        );
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY")
        return this.renderRegister(
          { error: "An account with these details already exists.", old: v },
          409,
        );
      throw error;
    }
    const [row] = await db.query("SELECT * FROM customers WHERE code=?", [
      code,
    ]);
    this.context.session.customer = customerView(row);
    return this.redirect("/customer/dashboard?welcome=true");
  }
  async showForgotPassword() {
    return this.render("customer/forgot_password", {
      siteName: "TeenGirlsLK",
      pageTitle: "Reset Password",
      error: this.query.error ?? null,
      success: this.query.success ?? null,
      csrfToken: this.context.csrfToken,
    });
  }
  async handleForgotPassword() {
    const input = String(this.body?.emailOrPhone || "")
      .trim()
      .toLowerCase();
    const db = await database();
    const [row] = await db.query(
      "SELECT id,email FROM customers WHERE email=? OR phone=?",
      [input, normalizeSriLankanPhone(input) || input],
    );
    if (row) {
      const token = randomBytes(32).toString("hex");
      await db.query(
        "INSERT INTO password_resets(customer_id,token_hash,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 30 MINUTE))",
        [row.id, createHash("sha256").update(token).digest("hex")],
      );
      // Delivery is delegated to the configured application mail service.
      const mail = this.service("mail");
      if (mail?.send)
        await mail.send({
          to: row.email,
          subject: "Reset your TeenGirlsLK password",
          text: `${process.env.APP_URL || "http://localhost:3000"}/customer/reset-password?token=${token}`,
        });
      else if (process.env.NODE_ENV !== "production")
        console.info(
          `Password reset for ${row.email}: /customer/reset-password?token=${token}`,
        );
      else
        return this.render(
          "customer/forgot_password",
          {
            siteName: "TeenGirlsLK",
            pageTitle: "Reset Password",
            error:
              "Password reset delivery is unavailable. Please contact support.",
            csrfToken: this.context.csrfToken,
          },
          503,
        );
    }
    return this.render("customer/forgot_password", {
      siteName: "TeenGirlsLK",
      pageTitle: "Reset Password",
      success:
        "If your account exists, reset instructions have been requested.",
      csrfToken: this.context.csrfToken,
    });
  }
  async resetPassword() {
    return this.api(async () => {
      const b = this.body ?? {};
      if (
        typeof b.password !== "string" ||
        b.password.length < 8 ||
        b.password !== b.confirmPassword
      ) {
        const error = new Error(
          "Use matching passwords of at least 8 characters.",
        );
        error.status = 422;
        throw error;
      }
      await transaction(async (db) => {
        const [reset] = await db.query(
          "SELECT * FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",
          [
            createHash("sha256")
              .update(String(b.token || ""))
              .digest("hex"),
          ],
        );
        if (!reset) {
          const error = new Error("Reset link is invalid or expired.");
          error.status = 422;
          throw error;
        }
        await db.query("UPDATE customers SET password_hash=? WHERE id=?", [
          await hashPassword(b.password),
          reset.customer_id,
        ]);
        await db.query(
          "UPDATE password_resets SET used_at=NOW() WHERE customer_id=?",
          [reset.customer_id],
        );
      });
      return { message: "Password reset. You can sign in now." };
    });
  }
  async logout() {
    this.context.session.customer = null;
    return this.redirect("/login");
  }
}
