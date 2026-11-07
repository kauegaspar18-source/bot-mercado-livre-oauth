
const http = require("node:http");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 10000);
const TEMPO_MAXIMO = 10 * 60 * 1000;
const pendentes = new Map();

function responder(res, status, texto, tipo = "text/plain") {
  res.writeHead(status, {
    "Content-Type": `${tipo}; charset=utf-8`,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'"
  });
  res.end(texto);
}

function stateValido(state) {
  return typeof state === "string" &&
    /^[a-f0-9]{64}$/.test(state);
}

function limparExpirados() {
  const agora = Date.now();

  for (const [state, item] of pendentes) {
    if (agora - item.criadoEm > TEMPO_MAXIMO) {
      pendentes.delete(state);
    }
  }
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  limparExpirados();

  if (req.method !== "GET") {
    return responder(res, 405, "Metodo nao permitido.");
  }

  if (url.pathname === "/" || url.pathname === "/health") {
    return responder(res, 200, "Bot Mercado Livre - servidor online!");
  }

  if (url.pathname === "/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const erro = url.searchParams.get("error");

    if (!stateValido(state)) {
      return responder(res, 400, "State ausente ou invalido.");
    }

    if (!code && !erro) {
      return responder(res, 400, "Resposta OAuth incompleta.");
    }

    if (pendentes.has(state)) {
      return responder(res, 409, "Autorizacao ja recebida.");
    }

    if (pendentes.size >= 100) {
      return responder(res, 503, "Servidor temporariamente ocupado.");
    }

    pendentes.set(state, {
      code: code || null,
      erro: erro || null,
      criadoEm: Date.now()
    });

    console.log("Retorno OAuth recebido.");

    return responder(
      res,
      200,
      erro
        ? "Autorizacao recusada. Volte ao VS Code."
        : "Autorizacao recebida! Volte ao VS Code."
    );
  }

  if (url.pathname === "/resultado") {
    const state = url.searchParams.get("state");

    if (!stateValido(state)) {
      return responder(res, 400, "State invalido.");
    }

    const item = pendentes.get(state);

    if (!item) {
      return responder(
        res,
        200,
        JSON.stringify({ status: "aguardando" }),
        "application/json"
      );
    }

    pendentes.delete(state);

    return responder(
      res,
      200,
      JSON.stringify({
        status: "recebido",
        state,
        code: item.code,
        error: item.erro
      }),
      "application/json"
    );
  }

  responder(res, 404, "Rota nao encontrada.");
});

servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor OAuth ativo na porta ${PORT}`);
});
