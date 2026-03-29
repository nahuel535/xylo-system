import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, "dist");

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

createServer(async (req, res) => {
  let url = req.url.split("?")[0];
  if (url === "/") url = "/index.html";

  try {
    const content = await readFile(join(DIST, url));
    const mime = MIME[extname(url)] || "application/octet-stream";
    const ext = extname(url);
    const cacheHeader = ext === ".html"
      ? "no-cache, no-store, must-revalidate"
      : "public, max-age=31536000, immutable";
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": cacheHeader });
    res.end(content);
  } catch {
    // SPA fallback
    try {
      const content = await readFile(join(DIST, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-cache, no-store, must-revalidate" });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Serving on port ${PORT}`);
});
