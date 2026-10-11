import { Controller } from "noderyx-framework";
import { database, fail } from "../Services/database.js";

export class AppController extends Controller {
  async customerRecord() {
    const id = this.context.session?.customer?.id;
    if (!id) fail("Please sign in.", 401);
    const db = await database();
    const [customer] = await db.query(
      "SELECT * FROM customers WHERE code = ? AND is_active = 1",
      [id],
    );
    if (!customer) fail("Please sign in.", 401);
    return customer;
  }
  async adminRecord() {
    const id = this.context.session?.adminId;
    if (!this.context.session?.isAdmin || !id)
      fail("Administrator sign in required.", 401);
    const [admin] = await (
      await database()
    ).query("SELECT * FROM admin_users WHERE id = ? AND status = ?", [
      id,
      "active",
    ]);
    if (!admin) fail("Administrator sign in required.", 401);
    return admin;
  }
  async api(work) {
    try {
      return this.json({ success: true, ...(await work()) });
    } catch (error) {
      if (!error.status && error.code !== "ER_DUP_ENTRY") console.error(error);
      return this.json(
        {
          success: false,
          error: error.status
            ? error.message
            : error.code === "ER_DUP_ENTRY"
              ? "This record already exists."
              : "Unable to save or load data. Check the database connection and migrations.",
        },
        error.status ?? (error.code === "ER_DUP_ENTRY" ? 409 : 503),
      );
    }
  }
  redirect(url, status = 302) {
    const response = this.context.response;
    if (!response || response.writableEnded) return;
    const locals = response.locals;
    if (locals?.finishSession) {
      locals.finishSession();
      locals.finishSession = null;
    }
    const headers = { ...(response.baseHeaders ?? {}), Location: url };
    if (locals?.cookies?.length) headers["set-cookie"] = locals.cookies;
    response.writeHead(status, headers);
    return response.end();
  }
}
