import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, relative, isAbsolute } from "node:path";

const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
};

const port = Number(process.env.PORT) || 4173;

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://localhost:${port}`);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = normalize(join(root, pathname.replace(/^\/+/, "")));
    const fromRoot = relative(root, file);
    if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, () => {
  console.log(`http://localhost:${port}`);
});
