import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, "dist");
const API_BASE = "https://xylo-system-production.up.railway.app";
const STORE_URL = "https://xylobox.store";

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isCrawler(ua = "") {
  const u = ua.toLowerCase();
  return (
    u.includes("whatsapp") ||
    u.includes("facebookexternalhit") ||
    u.includes("twitterbot") ||
    u.includes("linkedinbot") ||
    u.includes("telegrambot") ||
    u.includes("slackbot") ||
    u.includes("discordbot") ||
    u.includes("googlebot") ||
    u.includes("bingbot") ||
    u.includes("applebot")
  );
}

async function fetchProduct(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.status === "in_stock" ? data : null;
  } catch {
    return null;
  }
}

function buildProductHTML(product, id) {
  const title = [product.model, product.storage, product.color].filter(Boolean).join(" · ");
  const batteryText = product.battery_health
    ? (product.battery_health >= 85
        ? "Batería excelente"
        : product.battery_health >= 70
        ? "Batería en buen estado"
        : "Batería con desgaste") + ` (${product.battery_health}%)`
    : "";
  const price = `USD ${Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}`;
  const description = [batteryText, price].filter(Boolean).join(" · ");
  const image = product.photo_url || `${STORE_URL}/logo.png`;
  const url = `${STORE_URL}/producto/${id}`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — Xylo</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="product" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title} — Xylo" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Xylo" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title} — Xylo" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
</head>
<body>
<script>window.location.href="${url}";</script>
</body>
</html>`;
}

createServer(async (req, res) => {
  let url = req.url.split("?")[0];
  const ua = req.headers["user-agent"] || "";

  // OG meta tags para bots en páginas de producto
  const productMatch = url.match(/^\/producto\/(\d+)$/);
  if (productMatch && isCrawler(ua)) {
    const id = productMatch[1];
    const product = await fetchProduct(id);
    if (product) {
      const html = buildProductHTML(product, id);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      });
      res.end(html);
      return;
    }
  }

  if (url === "/") url = "/index.html";

  try {
    const content = await readFile(join(DIST, url));
    const mime = MIME[extname(url)] || "application/octet-stream";
    const ext = extname(url);
    const cacheHeader =
      ext === ".html"
        ? "no-cache, no-store, must-revalidate"
        : "public, max-age=31536000, immutable";
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": cacheHeader });
    res.end(content);
  } catch {
    // SPA fallback
    try {
      const content = await readFile(join(DIST, "index.html"));
      res.writeHead(200, {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Serving on port ${PORT}`);
});
