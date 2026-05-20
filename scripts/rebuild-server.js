// Tiny webhook receiver: Strapi -> POST /rebuild -> runs `npm run build`.
//
// For local development only. In production, point Strapi at a Vercel deploy
// hook URL (or your CI's webhook) instead — no shared secret needed there.

const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

// We avoid a dotenv dependency by reading .env manually if present.
function loadDotEnv() {
  const fs = require("fs");
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadDotEnv();

const PORT = Number(process.env.REBUILD_PORT || 8787);
const SECRET = process.env.REBUILD_WEBHOOK_SECRET || "change-me";
const PROJECT_ROOT = path.join(__dirname, "..");

let building = false;
let pendingRebuild = false;

function triggerBuild() {
  if (building) {
    pendingRebuild = true;
    console.log("[rebuild] build already running — queued another");
    return;
  }
  building = true;
  console.log("[rebuild] starting `npm run build`");
  const proc = spawn("npm", ["run", "build"], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    env: process.env,
  });
  proc.on("close", (code) => {
    building = false;
    console.log(`[rebuild] build finished with code ${code}`);
    if (pendingRebuild) {
      pendingRebuild = false;
      triggerBuild();
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  if (req.method !== "POST" || req.url !== "/rebuild") {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  // Strapi sends the secret in a custom header. Strict equality is fine
  // because the secret is server-only and never exposed to clients.
  const provided = req.headers["x-webhook-secret"];
  if (provided !== SECRET) {
    console.warn("[rebuild] rejected: bad or missing X-Webhook-Secret");
    res.writeHead(401);
    res.end("unauthorized");
    return;
  }

  // Drain body (we don't use it, but avoid hanging the connection).
  req.on("data", () => {});
  req.on("end", () => {
    triggerBuild();
    res.writeHead(202);
    res.end("build triggered");
  });
});

server.listen(PORT, () => {
  console.log(`[rebuild] listening on http://localhost:${PORT}/rebuild`);
});
