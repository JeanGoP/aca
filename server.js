const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '127.0.0.1';
const port = Number(process.env.PORT || 8765);
const root = __dirname;
const logPath = path.join(root, 'server.log');

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFile(logPath, line, () => {});
}

process.on('uncaughtException', (error) => {
  log(`uncaughtException: ${error.stack || error.message}`);
});

process.on('unhandledRejection', (error) => {
  log(`unhandledRejection: ${error && error.stack ? error.stack : error}`);
});

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function send(response, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  response.end(body);
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${host}:${port}`);
  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const resolved = path.resolve(root, `.${decodeURIComponent(pathname)}`);

  if (!resolved.startsWith(root)) {
    send(response, 403, 'Forbidden');
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      send(response, 404, 'Not found');
      return;
    }

    send(response, 200, data, mimeTypes[path.extname(resolved)] || 'application/octet-stream');
  });
});

server.listen(port, host, () => {
  log(`Validador disponible en http://${host}:${port}/`);
});
