import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const API_BASE = "https://xylo-system-production.up.railway.app";
const STORE_URL = "https://xylobox.store";

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

function readIndexHtml() {
  // Intentar múltiples rutas posibles en el entorno Vercel
  const candidates = [
    join(__dirname, "..", "..", "dist", "index.html"),
    join(process.cwd(), "dist", "index.html"),
    join(__dirname, "dist", "index.html"),
  ];
  for (const p of candidates) {
    try {
      return readFileSync(p, "utf-8");
    } catch {}
  }
  return null;
}

function injectOGTags(html, { title, description, image, url }) {
  // 1. Actualizar <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  // 2. Eliminar todos los og: y twitter: meta tags existentes
  html = html.replace(/<meta\s+(?:property|name)="(?:og:|twitter:)[^"]*"[^>]*\/?>/g, "");

  // 3. Eliminar meta description genérica
  html = html.replace(/<meta\s+name="description"[^>]*>/g, "");

  // 4. Inyectar los meta tags del producto antes de </head>
  const tags = `
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Xylo" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />`;

  return html.replace("</head>", tags + "\n</head>");
}

export default async function handler(req, res) {
  const { id } = req.query;

  const [product, html] = await Promise.all([
    fetchProduct(id),
    Promise.resolve(readIndexHtml()),
  ]);

  if (!html) {
    // Fallback: redirigir al SPA directamente
    res.setHeader("Location", `${STORE_URL}/producto/${id}`);
    res.status(302).end();
    return;
  }

  let finalHtml = html;

  if (product) {
    const title = [product.model, product.storage, product.color]
      .filter(Boolean)
      .join(" · ") + " — Xylo";
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

    finalHtml = injectOGTags(html, { title, description, image, url });
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
  res.end(finalHtml);
}
