const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Node.js server working!\n');
});

server.listen(3007, 'localhost', () => {
  console.log('Server running at http://localhost:3007/');
});