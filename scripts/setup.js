// First-run setup: creates .env from .env.example and writes a secure APP_KEY.
// Safe to run again; an existing APP_KEY is never replaced.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const [major] = process.versions.node.split(".").map(Number);
if (major < 20) {
  console.error(`Node.js 20 or newer is required (found ${process.versions.node}).`);
  process.exit(1);
}

if (!existsSync("node_modules/noderyx-framework")) {
  console.error("Dependencies are missing. Run `npm install` first.");
  process.exit(1);
}

const hasKey = existsSync(".env") && /^APP_KEY=.+$/m.test(readFileSync(".env", "utf8"));
if (hasKey) {
  console.log(".env already has an APP_KEY; leaving it alone.");
} else {
  execFileSync(process.execPath, ["node_modules/noderyx-framework/framework/cli.js", "spark:key"], { stdio: "inherit" });
}

console.log("\nSetup complete. Start the app with `npm run dev` and open http://localhost:3000");
console.log("Admin panel: /sysadmin/login (set ADMIN_USER / ADMIN_PASSWORD in .env)");
