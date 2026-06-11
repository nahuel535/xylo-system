const API_BASE = "https://xylo-system-production.up.railway.app";
const STORE_URL = "https://xylobox.store";

async function fetchProduct(id) {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const { id } = req.query;
  const product = await fetchProduct(id);

  const productUrl = `${STORE_URL}/producto/${id}`;
  const spaUrl = `${STORE_URL}/producto/${id}?v=1`;

  let title = "Xylo — iPhones certificados";
  let description = "Equipos seleccionados, revisados y listos para usar. Precio justo, sin sorpresas.";
  let image = `${STORE_URL}/logo.png`;

  if (product) {
    const parts = [product.model, product.storage, product.color].filter(Boolean);
    title = parts.join(" · ") + " — Xylo";

    const batteryText = product.battery_health
      ? (product.battery_health >= 85
          ? "Batería excelente"
          : product.battery_health >= 70
          ? "Batería en buen estado"
          : "Batería con desgaste") + ` (${product.battery_health}%)`
      : "";
    const price = product.suggested_sale_price_usd
      ? `USD ${Number(product.suggested_sale_price_usd).toLocaleString("es-AR")}`
      : "";
    description = [batteryText, price].filter(Boolean).join(" · ");

    if (product.photo_url) {
      image = product.photo_url;
    }
  }

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${productUrl}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name" content="Xylo" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
</head>
<body>
<script>window.location.replace("${spaUrl}")</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
  res.end(html);
}
