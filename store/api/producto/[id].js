import { readFileSync } from "fs";
import { join } from "path";

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
  try {
    return readFileSync(join(process.cwd(), "dist", "index.html"), "utf-8");
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const { id } = req.query;
  const product = await fetchProduct(id);

  let html = readIndexHtml();

  if (!html) {
    res.setHeader("Location", `/producto/${id}`);
    res.status(302).end();
    return;
  }

  if (product) {
    const title = [product.model, product.storage, product.color]
      .filter(Boolean)
      .join(" · ");
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

    // Reemplazar título genérico y OG tags con los del producto
    html = html
      .replace(
        "<title>Xylo — iPhones certificados</title>",
        `<title>${title} — Xylo</title>`
      )
      .replace(
        'content="https://xylobox.store"',
        `content="${url}"`
      )
      .replace(
        /content="Xylo — iPhones certificados"/g,
        `content="${title} — Xylo"`
      )
      .replace(
        /content="Equipos seleccionados, revisados y listos para usar\. Precio justo, sin sorpresas\."/g,
        `content="${description}"`
      )
      .replace(
        /content="https:\/\/xylobox\.store\/logo\.png"/g,
        `content="${image}"`
      )
      .replace(
        'name="twitter:card" content="summary"',
        'name="twitter:card" content="summary_large_image"'
      );
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60");
  res.end(html);
}
