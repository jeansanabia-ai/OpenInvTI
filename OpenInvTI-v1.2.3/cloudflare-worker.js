// =============================================================================
// OpenInvTI — Cloudflare Worker Proxy para Groq API
// =============================================================================
// Este worker recebe requests do app OpenInvTI e encaminha pra api.groq.com
// adicionando a chave de autenticação que fica SEGURA no Cloudflare (variável
// de ambiente), nunca expondo a chave no código público do app.
//
// COMO USAR (deploy):
// 1. Criar conta grátis em cloudflare.com
// 2. Workers & Pages → Create Worker
// 3. Colar todo este código no editor
// 4. Settings → Variables → Add: GROQ_KEY = sua_chave_gsk_xxxxx (Encrypted)
// 5. Deploy → copiar a URL final (ex: openinvti.SEU-USER.workers.dev)
// 6. No app.js da OpenInvTI, atualizar a constante PROXY_URL com essa URL
//
// FREE TIER: 100.000 requests/dia (mais que suficiente).
// =============================================================================

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Lista de origens permitidas a chamar este worker.
// Adicione mais URLs aqui se distribuir o app em outros domínios.
const ALLOWED_ORIGINS = [
  'https://jeansanabia-ai.github.io',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
];

// Rate limit simples por IP (anti-abuso). Cloudflare conta IPs no header cf-connecting-ip.
const RATE_LIMIT = {
  maxRequestsPerHour: 200, // por IP
  windowMs: 60 * 60 * 1000,
};
const ipRateState = new Map(); // memória do worker (zera em redeploy)

function corsHeaders(origin) {
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-OpenInvTI-Client',
    'Access-Control-Max-Age': '86400',
  };
}

function isRateLimited(ip) {
  const now = Date.now();
  const rec = ipRateState.get(ip) || { count: 0, resetAt: now + RATE_LIMIT.windowMs };
  if (now > rec.resetAt) {
    rec.count = 0;
    rec.resetAt = now + RATE_LIMIT.windowMs;
  }
  rec.count++;
  ipRateState.set(ip, rec);
  return rec.count > RATE_LIMIT.maxRequestsPerHour;
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Health check (GET na raiz)
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        ok: true,
        service: 'openinvti-groq-proxy',
        version: '1.0.0',
        endpoints: { chat: 'POST /chat' },
        rate_limit: RATE_LIMIT.maxRequestsPerHour + ' req/hora por IP',
      }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Verifica se a env var GROQ_KEY foi configurada
    if (!env.GROQ_KEY) {
      return new Response(JSON.stringify({
        error: 'Servidor mal configurado: GROQ_KEY não definida nas variáveis de ambiente do worker',
      }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit por IP
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({
        error: 'Limite de requisições atingido. Tente novamente em ~1 hora.',
        limit: RATE_LIMIT.maxRequestsPerHour,
      }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Body do request do app
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'JSON inválido no body' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Sanitização — limita tokens para evitar abuso de custo
    body.max_tokens = Math.min(body.max_tokens || 600, 1500);
    body.temperature = Math.max(0, Math.min(body.temperature ?? 0.2, 1));
    if (!body.model) body.model = 'llama-3.3-70b-versatile';

    // Whitelist de models permitidos (evita pedir model caro)
    const MODELS_OK = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ];
    if (!MODELS_OK.includes(body.model)) {
      body.model = 'llama-3.3-70b-versatile';
    }

    // Encaminha pra Groq adicionando a auth
    try {
      const groqResp = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + env.GROQ_KEY,
        },
        body: JSON.stringify(body),
      });

      const respText = await groqResp.text();
      return new Response(respText, {
        status: groqResp.status,
        headers: {
          ...cors,
          'Content-Type': groqResp.headers.get('Content-Type') || 'application/json',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({
        error: 'Erro ao chamar Groq: ' + (err.message || String(err)),
      }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
