# Setup Cloudflare Workers — Proxy para Groq

Tutorial passo a passo (~15 minutos) para subir um proxy Cloudflare Worker que protege a chave Groq, permitindo que o OpenInvTI use IA sem que cada usuário precise configurar a própria chave.

## Por que fazer isso?

Sem proxy, a chave Groq ficaria exposta no `app.js` do GitHub público — qualquer pessoa poderia copiar e usar até esgotar seu limite. Com o proxy:

- A chave Groq fica como variável de ambiente **encriptada** no Cloudflare
- O app público chama o proxy, não a Groq direta
- Free tier Cloudflare: 100.000 requisições/dia (mais que suficiente)
- Rate limit por IP impede abuso

## Pré-requisitos

- Conta Google ou GitHub (para criar conta Cloudflare grátis)
- Sua chave Groq (a mesma `gsk_xxxxx` que você já criou em console.groq.com/keys)
- ~15 minutos

---

## Passo 1 — Criar conta Cloudflare (5 min)

1. Acesse **https://dash.cloudflare.com/sign-up**
2. Cadastre-se com seu email (recomendo o pessoal, não o corporativo)
3. Confirme o email
4. Pode pular qualquer tela de "adicionar domínio" — não precisamos disso para Workers

## Passo 2 — Criar o Worker (3 min)

1. No painel Cloudflare, clique em **Workers & Pages** no menu lateral
2. Clique em **Create application** (ou **Create Worker**)
3. Escolha **Create Worker** (não "Pages")
4. Dê um nome ao worker: `openinvti` (ele vai gerar URL `openinvti.SEU-USUARIO.workers.dev`)
5. Clique em **Deploy** (vai criar um worker padrão "Hello World")
6. Após o deploy, clique em **Edit code** (ou **Quick edit**)

## Passo 3 — Colar o código do proxy (2 min)

1. No editor que abrir, **apague tudo** que estiver lá (Ctrl+A → Delete)
2. Abra o arquivo `cloudflare-worker.js` deste projeto
3. **Copie todo o conteúdo** (Ctrl+A → Ctrl+C)
4. **Cole no editor** do Cloudflare (Ctrl+V)
5. Clique em **Save and Deploy** (canto superior direito)
6. Aguarde confirmar "Deployed successfully"

## Passo 4 — Configurar a chave Groq como variável protegida (3 min)

> Esta é a parte mais importante. A chave nunca aparecerá no código.

1. Volte ao painel do worker (clique no nome `openinvti` no topo)
2. Vá em **Settings** → **Variables and Secrets** (no menu lateral)
3. Em **Environment Variables**, clique em **Add variable**
4. Preencha:
   - **Variable name**: `GROQ_KEY`
   - **Value**: cole sua chave Groq completa (ex: `gsk_xxxxxxxxxxxxxxxx`)
   - **Type**: marque **Encrypted** / **Secret** (essencial!)
5. Clique em **Save** ou **Deploy** para aplicar

> Marcar como "Encrypted" significa que mesmo você não conseguirá ver o valor depois — apenas substituir.

## Passo 5 — Pegar a URL final do worker (1 min)

1. No painel do worker, no topo aparece algo como:
   ```
   openinvti.SEU-USUARIO.workers.dev
   ```
2. **Copie essa URL completa** (com `https://` na frente)
   - Exemplo: `https://openinvti.jeansanabia.workers.dev`

## Passo 6 — Testar o worker funcionando (1 min)

Abra no navegador: `https://openinvti.SEU-USUARIO.workers.dev`

Deve aparecer um JSON tipo:
```json
{
  "ok": true,
  "service": "openinvti-groq-proxy",
  "version": "1.0.0",
  "endpoints": { "chat": "POST /chat" },
  "rate_limit": "200 req/hora por IP"
}
```

Se aparecer isso, o worker está no ar.

## Passo 7 — Atualizar o app.js com a URL do worker

1. Abra o arquivo `app.js` do OpenInvTI
2. Procure por:
   ```javascript
   const PROXY_URL = '';
   ```
3. Substitua por sua URL real:
   ```javascript
   const PROXY_URL = 'https://openinvti.SEU-USUARIO.workers.dev';
   ```
4. Salve o arquivo

## Passo 8 — Push no GitHub

```bash
cd /c/OpenInvTI
git add app.js
git commit -m "v1.0.9: ativa proxy Cloudflare para IA Groq compartilhada"
git push
```

Em ~60 segundos o GitHub Pages atualiza sozinho. Pronto!

---

## Como compartilhar com os colegas

Agora o link para os colegas é:

```
https://jeansanabia-ai.github.io/OpenInvTI/?preset=far
```

Esse `?preset=far` faz com que o app:

- Pule a tela de setup
- Configure automaticamente nome da empresa (Farmanguinhos)
- Configure regex de patrimônio (F-FAR + numérico)
- Ative a IA via proxy sem precisar de chave

O badge **🤖 IA** aparece no canto superior direito quando tudo está funcionando.

---

## Como testar antes de mandar pros colegas

1. Limpa cache do app no seu celular (Configurações Android → Apps → OpenInvTI → Armazenamento → Limpar cache)
2. Abre `https://jeansanabia-ai.github.io/OpenInvTI/?preset=far`
3. Veja se já vai direto pra tela inicial (sem pedir empresa/regex)
4. Veja se aparece badge **🤖 IA** no topo
5. Tira foto de uma etiqueta — o status deve dizer "🤖 IA Groq extraiu: tipo, marca, modelo..."

Se aparecer erro de fetch (vermelho), o problema é o worker — abra os logs no painel Cloudflare → **Workers & Pages** → seu worker → **Logs**.

---

## Manutenção

### Rotacionar a chave Groq
Se desconfiar de vazamento ou abuso:

1. Console Groq → revogue a chave antiga
2. Crie chave nova
3. Cloudflare → seu worker → Settings → Variables → edite `GROQ_KEY` com a nova
4. Salve. Pronto — sem deploy de app, sem mexer no GitHub.

### Aumentar rate limit
Edite a constante `RATE_LIMIT` no `cloudflare-worker.js` e re-deploye no Cloudflare. Ou ajuste por IP via Cloudflare WAF.

### Adicionar mais empresas/presets
No `app.js`, dentro de `EMPRESA_PRESETS`, adicione:

```javascript
EMPRESA_PRESETS = {
  far: { /* ... */ },
  outra_empresa: {
    empresa: { nome: 'Outra Corp', titulo: 'INVENTÁRIO' },
    patrimonio: { regex_padroes: ['^OC-\\d{6}$'], exemplo: 'OC-123456' },
  },
};
```

Depois compartilhe com link `?preset=outra_empresa`.

---

## Troubleshooting

### O badge "🤖 IA" não aparece no header

- Confirme que `PROXY_URL` no app.js começa com `https://`
- Limpe o cache do Service Worker (Configurações → Apps → Limpar cache)
- Veja o console do navegador (F12) por erros

### "HTTP 500: Servidor mal configurado"

A variável `GROQ_KEY` não foi configurada no Cloudflare. Volte ao Passo 4.

### "HTTP 429: Limite de requisições atingido"

Esperado se alguém abusar. Espera 1 hora ou aumenta o `RATE_LIMIT` no worker.

### Worker funcionando mas IA não responde

- Acesse `https://api.groq.com/` para confirmar que o serviço está online
- Veja os logs do Cloudflare Worker (Settings → Logs)
- Verifique se o modelo `llama-3.3-70b-versatile` ainda está disponível no Groq

---

## Custos

- **Cloudflare Workers**: free tier 100.000 req/dia (deve cobrir centenas de usuários)
- **Groq**: free tier 14.400 req/dia (chave única, compartilhada)
- **Custo total**: R$ 0,00

Se algum dia precisar de mais, Cloudflare Workers Paid Plan é US$ 5/mês com 10 milhões de requisições.
