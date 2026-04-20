import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import entry from './dist/server/server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = join(__dirname, 'dist/client', url.pathname);
  
  if (url.pathname === '/') {
    filePath = join(__dirname, 'dist/client', 'index.html');
  }

  // Try serving static files first
  try {
    const s = await stat(filePath);
    if (s.isFile()) {
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }
  } catch (e) {
    // File not found in dist/client, proceed to TanStack Start SSR
  }

  // TanStack Start SSR / API handling
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const fullUrl = new URL(req.url, `${protocol}://${host}`);
    
    // Headers must be a HeadersInit, node headers wait, some values can be array so let's flatmap them
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
        } else if (value) {
            headers.append(key, value);
        }
    }

    const requestOptions = {
        method: req.method,
        headers,
    };
    
    // Convert Node incoming message to web stream for body
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        const buffers = [];
        for await (const chunk of req) {
            buffers.push(chunk);
        }
        requestOptions.body = Buffer.concat(buffers);
    }

    const fetchReq = new Request(fullUrl.toString(), requestOptions);
    const response = await entry.fetch(fetchReq);

    res.statusCode = response.status;
    res.statusMessage = response.statusText;
    
    for (const [key, value] of response.headers) {
      if (key.toLowerCase() === 'set-cookie') {
         res.appendHeader('set-cookie', value);
      } else {
         res.setHeader(key, value);
      }
    }

    if (response.body) {
        // Stream the web response body back to Node response
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } else {
        res.end();
    }
  } catch (err) {
    console.error('SSR Error:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`VenueIQ server listening on port ${PORT}`);
});
