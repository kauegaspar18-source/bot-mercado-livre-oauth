
const http = require("node:http");

const PORT = Number(process.env.PORT || 10000);

const servidor = http.createServer((req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.url === "/") {
    res.writeHead(200);
    res.end("Bot Mercado Livre - servidor online!");
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
    return;
  }

  res.writeHead(404);
  res.end("Rota nao encontrada");
});

servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
