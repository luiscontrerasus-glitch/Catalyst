import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const allowed = new Set([
  "a.html", "b.html", "home.css", "home.js", "project-data.js",
  "fonts/PlusJakartaSans.ttf", "fonts/Manrope.ttf",
]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
};
createServer(async (request, response) => {
  const path = new URL(request.url, "http://127.0.0.1:3101").pathname.slice(1) || "a.html";
  if (!allowed.has(path)) {
    response.writeHead(404).end();
    return;
  }
  try {
    const bytes = await readFile(resolve(root, path));
    response.writeHead(200, {
      "Content-Type": types[extname(path)],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'self'; img-src 'self'; frame-ancestors 'none'",
    }).end(bytes);
  } catch {
    response.writeHead(500).end("Local study unavailable");
  }
}).listen(3101, "127.0.0.1", () => {
  console.log("Homepage A: http://127.0.0.1:3101/a.html");
  console.log("Homepage B: http://127.0.0.1:3101/b.html");
});
