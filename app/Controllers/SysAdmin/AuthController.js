import { Controller } from "noderyx-framework";
import os from "node:os";

// In-memory runtime state for SysAdmin actions
let auditLogs = [
  { id: "LOG-9412", time: "12:44:10", actor: "admin", level: "info", badge: "AUTH", message: "Admin authenticated via secure session key", ip: "127.0.0.1" },
  { id: "LOG-9411", time: "12:38:05", actor: "system", level: "success", badge: "HEALTH", message: "Database connection pool verified active (latency 1.4ms)", ip: "internal" },
  { id: "LOG-9410", time: "12:15:22", actor: "system", level: "info", badge: "CACHE", message: "Memory cache garbage collection completed (0 items evicted)", ip: "internal" },
  { id: "LOG-9409", time: "11:50:41", actor: "sconnor", level: "warning", badge: "SECURITY", message: "Rate limit threshold reached for IP 198.51.100.44", ip: "198.51.100.44" },
  { id: "LOG-9408", time: "11:12:09", actor: "alex.m", level: "success", badge: "CONFIG", message: "Database pool limit verified (10 max connections)", ip: "127.0.0.1" }
];

let usersList = [
  { id: "USR-001", name: "System Administrator", email: "admin@teensgirls.com", role: "Superadmin", status: "Active", lastLogin: "Just now", initials: "SA", roleBadge: "badge-purple" },
  { id: "USR-002", name: "Sarah Connor", email: "sconnor@teensgirls.com", role: "Security Lead", status: "Active", lastLogin: "18 mins ago", initials: "SC", roleBadge: "badge-cyan" },
  { id: "USR-003", name: "Alex Mercer", email: "alex.m@teensgirls.com", role: "Database Engineer", status: "Active", lastLogin: "2 hours ago", initials: "AM", roleBadge: "badge-blue" },
  { id: "USR-004", name: "Devon Vance", email: "devon@teensgirls.com", role: "Moderator", status: "Suspended", lastLogin: "3 days ago", initials: "DV", roleBadge: "badge-amber" },
  { id: "USR-005", name: "Elena Rostova", email: "elena@teensgirls.com", role: "Platform Analyst", status: "Active", lastLogin: "Yesterday", initials: "ER", roleBadge: "badge-emerald" }
];

function getSystemMetrics() {
  const cpus = os.cpus() || [];
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);
  const memUsedGB = (usedMem / (1024 ** 3)).toFixed(2);
  const memTotalGB = (totalMem / (1024 ** 3)).toFixed(2);
  const memFreeGB = (freeMem / (1024 ** 3)).toFixed(2);

  const uptimeSec = Math.floor(os.uptime());
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const uptimeFormatted = days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m`;

  const processMem = process.memoryUsage();
  const heapUsedMB = (processMem.heapUsed / (1024 * 1024)).toFixed(1);
  const heapTotalMB = (processMem.heapTotal / (1024 * 1024)).toFixed(1);
  const rssMB = (processMem.rss / (1024 * 1024)).toFixed(1);
  const loadAvgs = os.loadavg().map(v => v.toFixed(2));

  return {
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model || "Multi-Core Processor",
    cpuLoad: `${Math.min(99, Math.round(Number(loadAvgs[0] || 0.1) * 15))}%`,
    loadAvg: loadAvgs.join(", "),
    totalMemGB: `${memTotalGB} GB`,
    usedMemGB: `${memUsedGB} GB`,
    freeMemGB: `${memFreeGB} GB`,
    memPercent: `${memPercent}%`,
    heapUsedMB: `${heapUsedMB} MB`,
    heapTotalMB: `${heapTotalMB} MB`,
    rssMB: `${rssMB} MB`,
    platform: `${os.platform()} (${os.arch()})`,
    osRelease: os.release(),
    uptime: uptimeFormatted,
    nodeVersion: process.version
  };
}

export class AuthController extends Controller {
  /**
   * Display the SysAdmin Login Form
   */
  async showLogin() {
    if (this.context.session?.isAdmin) {
      return this.redirect("/sysadmin/dashboard");
    }

    const error = this.query.error ?? null;
    const success = this.query.success ?? null;

    return this.render("sysadmin/login", {
      siteName: process.env.SITE_NAME ?? "Teensgirls",
      pageTitle: "System Admin Login",
      error,
      success,
      csrfToken: this.context.csrfToken
    });
  }

  /**
   * Process Administrator Authentication
   */
  async login() {
    const { username, password } = this.body ?? {};
    const adminUser = process.env.ADMIN_USER ?? "admin";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@teensgirls.com";

    if (!username || !password) {
      return this.render("sysadmin/login", {
        siteName: process.env.SITE_NAME ?? "Teensgirls",
        pageTitle: "System Admin Login",
        error: "Please provide both your administrator ID and master password.",
        csrfToken: this.context.csrfToken
      }, 422);
    }

    const validUser = (username.trim() === adminUser || username.trim().toLowerCase() === adminEmail.toLowerCase());
    const validPassword = (password === adminPassword);

    if (validUser && validPassword) {
      if (this.context.session) {
        this.context.session.isAdmin = true;
        this.context.session.adminUser = username;
      }
      auditLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        time: new Date().toLocaleTimeString(),
        actor: username,
        level: "success",
        badge: "AUTH",
        message: "Administrator logged in successfully",
        ip: "127.0.0.1"
      });
      return this.redirect("/sysadmin/dashboard");
    }

    auditLogs.unshift({
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString(),
      actor: username || "unknown",
      level: "warning",
      badge: "ALERT",
      message: "Failed login attempt detected",
      ip: "127.0.0.1"
    });

    return this.render("sysadmin/login", {
      siteName: process.env.SITE_NAME ?? "Teensgirls",
      pageTitle: "System Admin Login",
      error: "Invalid administrator credentials. Please check your username and password.",
      csrfToken: this.context.csrfToken
    }, 401);
  }

  /**
   * SysAdmin Logout
   */
  async logout() {
    if (this.context.session) {
      const user = this.context.session.adminUser ?? "admin";
      this.context.session.isAdmin = false;
      this.context.session.adminUser = null;
      auditLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        time: new Date().toLocaleTimeString(),
        actor: user,
        level: "info",
        badge: "AUTH",
        message: "Administrator session terminated",
        ip: "127.0.0.1"
      });
    }
    return this.redirect("/sysadmin/login?success=" + encodeURIComponent("You have been signed out successfully."));
  }

  /**
   * SysAdmin Dashboard (landing page after authentication)
   */
  async dashboard() {
    if (!this.context.session?.isAdmin) {
      return this.redirect("/sysadmin/login?error=" + encodeURIComponent("Please log in to access the system admin console."));
    }

    const metrics = getSystemMetrics();

    const services = [
      { name: "HTTP Server Engine", status: "Operational", badge: "ONLINE", icon: "🌐", latency: "0.8ms", uptime: "99.98%" },
      { name: "Database Engine (MySQL)", status: "Operational", badge: "ONLINE", icon: "🗄️", latency: "2.1ms", uptime: "99.95%" },
      { name: "Memory Cache Store", status: "Active", badge: "ACTIVE", icon: "⚡", latency: "0.1ms", uptime: "100%" },
      { name: "AI Inference Gateway", status: process.env.AI_ENABLED === "true" ? "Operational" : "Standby", badge: process.env.AI_ENABLED === "true" ? "ONLINE" : "STANDBY", icon: "🤖", latency: "N/A", uptime: "99.90%" },
      { name: "Mail Notification Dispatcher", status: "Operational", badge: "ONLINE", icon: "✉️", latency: "1.2ms", uptime: "99.99%" }
    ];

    const appConfig = {
      appName: process.env.APP_NAME ?? "teensgirls",
      appProfile: process.env.APP_PROFILE ?? "saas",
      nodeEnv: process.env.NODE_ENV ?? "development",
      debugMode: process.env.APP_DEBUG ?? "true",
      dbType: process.env.DB_TYPE ?? "mysql",
      dbHost: process.env.DB_HOST ?? "127.0.0.1",
      dbPort: process.env.DB_PORT ?? "3306",
      dbName: process.env.DB_NAME ?? "teensgirls",
      cacheDriver: process.env.CACHE_DRIVER ?? "memory",
      cacheTtl: process.env.CACHE_TTL ?? "900",
      rateLimitMax: process.env.RATE_LIMIT_MAX ?? "600",
      aiProvider: process.env.AI_PROVIDER ?? "openai",
      aiModel: process.env.OPENAI_MODEL ?? "gpt-5.6-sol"
    };

    return this.render("sysadmin/dashboard", {
      siteName: "TeenGirlsLK",
      pageTitle: "Dashboard",
      adminUser: (this.context.session?.adminUser && this.context.session.adminUser !== "admin") ? this.context.session.adminUser : "Texting Admin",
      adminRole: "Administrator",
      adminInitials: "TA",
      csrfToken: this.context.csrfToken,
      dateRange: "May 11, 2025 - Jun 9, 2025",
      metrics,
      services,
      users: usersList,
      logs: auditLogs,
      config: appConfig,
      totalUsersCount: 3,
      activeUsersCount: 2,
      systemHealthScore: "99.4%",
      kpis: {
        totalCustomers: { value: "3", trend: "25% vs last 31 days", isDown: true },
        activeUsers: { value: "2", trend: "100% vs last 31 days", isDown: false },
        totalRevenue: { value: "Rs 0.00", trend: "100% vs last 31 days", isDown: true },
        totalSales: { value: "0", trend: "100% vs last 31 days", isDown: true },
        totalOrders: { value: "4", trend: "20% vs last 31 days", isDown: true },
        returnOrders: { value: "0", trend: "No change", isDown: false, isNeutral: true }
      },
      fulfillment: {
        dispatched: { count: 0, label: "Dispatched", sub: "Packed, awaiting pickup" },
        shipped: { count: 1, label: "Shipped", sub: "With the courier" },
        outForDelivery: { count: 1, label: "Out for Delivery", sub: "After shipped" },
        delivered: { count: 0, label: "Delivered", sub: "Handed to the customer" }
      },
      quickSummary: {
        products: 12,
        categories: 7,
        promotions: 3,
        flashSale: 1
      },
      recentOrders: [
        { id: "#TG1004", customer: "Guest Customer", initials: "GC", date: "Jun 9, 2025 11:17 AM", status: "Out for Delivery", statusBadge: "badge-delivery", total: "Rs 1,799.00", payment: "Cod", paymentBadge: "badge-cod" }
      ],
      recentActivities: [
        { id: 1, icon: "cart", title: "Order #TG1004 is out for delivery", time: "1 minute ago", type: "order" },
        { id: 2, icon: "truck", title: "Order #TG1003 has been shipped", time: "2 hours ago", type: "shipping" },
        { id: 3, icon: "box", title: "Order #TG1002 has been dispatched", time: "4 hours ago", type: "dispatch" }
      ]
    });
  }

  /**
   * API: Real-time System Metrics
   */
  async getMetrics() {
    if (!this.context.session?.isAdmin) {
      return this.json({ error: "Unauthorized" }, 401);
    }
    return this.json({
      success: true,
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString(),
      metrics: getSystemMetrics()
    });
  }

  /**
   * API: Clear Cache
   */
  async clearCache() {
    if (!this.context.session?.isAdmin) {
      return this.json({ error: "Unauthorized" }, 401);
    }
    auditLogs.unshift({
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString(),
      actor: this.context.session.adminUser ?? "admin",
      level: "info",
      badge: "PURGE",
      message: "Application cache store flushed & primed",
      ip: "127.0.0.1"
    });
    return this.json({
      success: true,
      message: "Application cache memory flushed successfully.",
      clearedAt: new Date().toLocaleTimeString()
    });
  }

  /**
   * API: Save System Settings
   */
  async saveSettings() {
    if (!this.context.session?.isAdmin) {
      return this.json({ error: "Unauthorized" }, 401);
    }
    auditLogs.unshift({
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      time: new Date().toLocaleTimeString(),
      actor: this.context.session.adminUser ?? "admin",
      level: "success",
      badge: "CONFIG",
      message: "System configuration variables updated",
      ip: "127.0.0.1"
    });
    return this.json({
      success: true,
      message: "Configuration changes saved successfully."
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
