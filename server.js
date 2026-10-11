import { ai, loadEnvironment, loadPackages, noderyx } from "noderyx-framework";
import { fileURLToPath } from "node:url";
import { HomeController } from "./app/Controllers/HomeController.js";
import { AuthController } from "./app/Controllers/SysAdmin/AuthController.js";
import { CustomerAuthController } from "./app/Controllers/Customer/CustomerAuthController.js";
import { CustomerPanelController } from "./app/Controllers/Customer/CustomerPanelController.js";

loadEnvironment();
const { default: config } = await import("./noderyx.config.js");

const app = noderyx({
  requireAppKey: true,
  name: config.app.name,
  environment: config.app.environment,
  debug: config.app.debug,
  cache: config.cache,
  views: fileURLToPath(new URL("./resources/views", import.meta.url)),
  public: fileURLToPath(new URL("./public", import.meta.url)),
  security: {
    ...config.security,
    cors: config.security.cors.length
      ? { origins: config.security.cors, credentials: true }
      : null
  }
});

app.provide("ai", ai(config.ai));

app.get("/", HomeController.handle("index"));
app.get("/health", HomeController.handle("health"));

// Customer Authentication Routes
app.get("/login", CustomerAuthController.handle("showLogin"));
app.get("/customer/login", CustomerAuthController.handle("showLogin"));
app.post("/customer/login", CustomerAuthController.handle("login"));
app.post("/customer/demo-login", CustomerAuthController.handle("demoLogin"));
app.get("/customer/demo-login", CustomerAuthController.handle("demoLogin"));
app.get("/register", CustomerAuthController.handle("showRegister"));
app.get("/customer/register", CustomerAuthController.handle("showRegister"));
app.post("/customer/register", CustomerAuthController.handle("register"));
app.get("/customer/forgot-password", CustomerAuthController.handle("showForgotPassword"));
app.post("/customer/forgot-password", CustomerAuthController.handle("handleForgotPassword"));
app.get("/customer/logout", CustomerAuthController.handle("logout"));
app.get("/logout", CustomerAuthController.handle("logout"));

// Customer Portal / Dashboard Routes
app.get("/customer", CustomerPanelController.handle("dashboard"));
app.get("/customer/dashboard", CustomerPanelController.handle("dashboard"));
app.get("/customer/orders", CustomerPanelController.handle("orders"));
app.get("/customer/wishlist", CustomerPanelController.handle("wishlist"));
app.get("/customer/addresses", CustomerPanelController.handle("addresses"));
app.get("/customer/rewards", CustomerPanelController.handle("rewards"));
app.get("/customer/profile", CustomerPanelController.handle("profile"));
app.get("/customer/support", CustomerPanelController.handle("support"));

// Customer API endpoints
app.post("/customer/api/address/save", CustomerPanelController.handle("saveAddress"));
app.post("/customer/api/address/delete", CustomerPanelController.handle("deleteAddress"));
app.post("/customer/api/profile", CustomerPanelController.handle("updateProfile"));
app.post("/customer/api/wishlist/remove", CustomerPanelController.handle("removeWishlistItem"));
app.post("/customer/api/rewards/redeem", CustomerPanelController.handle("redeemPoints"));
app.post("/customer/api/order/return", CustomerPanelController.handle("submitReturn"));

// SysAdmin routes
app.get("/sysadmin/login", AuthController.handle("showLogin"));
app.post("/sysadmin/login", AuthController.handle("login"));
app.get("/sysadmin/logout", AuthController.handle("logout"));
app.get("/sysadmin/dashboard", AuthController.handle("dashboard"));
app.get("/sysadmin/api/metrics", AuthController.handle("getMetrics"));
app.post("/sysadmin/api/cache/clear", AuthController.handle("clearCache"));
app.post("/sysadmin/api/settings", AuthController.handle("saveSettings"));

await loadPackages(app, config.packages, { config });

// Phusion Passenger (cPanel) may hand the application a unix socket path in
// PORT instead of a number, so only treat a numeric value as a TCP port.
const requestedPort = String(process.env.PORT ?? 3000);
const socketPath = /^\d+$/.test(requestedPort) ? null : requestedPort;
const host = process.env.HOST ?? "0.0.0.0";
const port = Number(requestedPort);
let closing = false;

if (socketPath) app.listen(socketPath, () => console.log(`Listening on ${socketPath}`));
else {
  let bindAttempts = 0;
  const server = app.listen(port, host, () => console.log(`Running at http://localhost:${port}`));
  server.on("error", (error) => {
    // A watch restart can fire before the old process frees the socket. Retry
    // the same port instead of moving the app to a different one, which would
    // leave the browser tab you already opened pointing at nothing.
    if (!closing && error.code === "EADDRINUSE" && bindAttempts++ < 20) {
      setTimeout(() => server.listen(port, host), 250).unref();
      return;
    }
    console.error(`Server error: ${error.message}`);
    process.exit(1);
  });
  const stop = () => {
    if (closing) return;
    closing = true;
    server.close(() => process.exit(0));
    // The dev live-reload stream never ends on its own and would block close.
    server.closeAllConnections?.();
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
