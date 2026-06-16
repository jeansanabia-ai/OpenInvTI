# Changelog OpenInvTI

Todas as mudanças notáveis serão documentadas neste arquivo.

## [1.0.9] - 2026-06-16

### Adicionado
- **🔒 Proxy Cloudflare Workers para IA Groq**: arquivo `cloudflare-worker.js` que serve de intermediário entre o app e a API Groq, mantendo a chave protegida como variável de ambiente encriptada. Permite distribuir o app sem expor credenciais. Free tier: 100.000 req/dia.
- **🏷️ Presets de empresa via URL parameter**: `?preset=far` configura automaticamente nome da empresa (Farmanguinhos), regex de patrimônio (`^F-FAR-\d{5}$ | ^\d{6}$`) e pula tela de setup. Outros presets podem ser adicionados em `EMPRESA_PRESETS`.
- **🤖 Badge "IA" no header**: indicador visual discreto no canto superior direito quando IA está ativa (proxy ou chave manual). Glow animado em verde/ciano.
- **SETUP_CLOUDFLARE.md**: guia passo a passo (~15 min) para deploy do worker, configuração da env var GROQ_KEY e integração com o app.

### Mudado
- **Função `chamarIA()`** unifica chamadas para IA: usa proxy se `PROXY_URL` setado, fallback para chave Groq local caso contrário.
- **Campo "Chave Groq" no setup é ocultado** automaticamente quando `PROXY_URL` está configurado (usuário não precisa fazer nada).
- **`extrairCamposComIA()` e `sugerirRegexComIA()`** refatoradas para usar a nova função `chamarIA()`.
- Função `iaDisponivel()` checa proxy ou chave para ativar features de IA.
- Cache do SW: `openinvti-v1.0.9-prod`.

### Técnico
- `PROXY_URL` é uma constante no topo do `app.js`, vazia por padrão (modo legado).
- Para ativar: substitui pelo URL do worker Cloudflare e dá push.
- Worker tem rate limit de 200 req/hora por IP e whitelist de models para evitar abuso de custo.
- `EMPRESA_PRESETS` permite múltiplas configurações pré-prontas (escalável para outras empresas).

### Distribuição
- Link para colegas Farmanguinhos: `https://jeansanabia-ai.github.io/OpenInvTI/?preset=far`
- Após primeira abertura, app fica configurado permanentemente.

## [1.0.8] - 2026-06-16

### Adicionado
- **🤖 Extração inteligente com IA Groq (Llama 3.3 70B)**: ao informar uma chave Groq na tela de Configurações, o OCR é complementado por uma chamada à IA que extrai tipo, marca, modelo, patrimônio, série e observações de uma só vez, com muito mais precisão do que regex. Chave grátis em console.groq.com/keys.
- **📸 Detector de padrão multi-foto**: agora o setup aceita de 3 a 5 fotos de etiquetas para identificar padrões. Modo IA Groq (mais preciso) ou modo análise local (offline, ~85% precisão).
- **🧠 Auto-detecção de tipo do equipamento** via heurística + IA: ao ler a etiqueta, identifica automaticamente se é CPU, Monitor, Notebook, Telefone IP, Impressora etc.
- **🔢 Múltiplos regex de patrimônio**: o campo aceita vários padrões separados por `|` (ex: `^F-FAR-\d{5}$ | ^\d{6}$`). O parser tenta cada um na ordem.
- **🧭 Navegação intuitiva**: cards do hero (Sessões, Itens, Usuários) e badge do header agora são clicáveis. Abrem um modal com a listagem detalhada correspondente.
- **💬 Botão "Relatório WhatsApp"** na tela de finalização: gera um texto formatado (setor, data, total de itens, breakdown por tipo, usuários únicos) e dispara o compartilhamento com a planilha .xlsx em anexo via Web Share API.

### Mudado
- **WhatsApp share** agora envia somente o arquivo (sem link do GitHub no texto).
- **Placeholder do campo Setor** trocado de "Ex.: Metrologia / Validação / Almoxarifado" para o mais direto "Informe o setor".
- **Ícone do header** trocado de ⚡ (raio) para 📋 (prancheta), mais coerente com inventário.
- Texto de status do OCR ganha prefixo "🤖 IA Groq extraiu:" quando a IA é usada.
- Cache do SW: `openinvti-v1.0.8-prod`.

### Técnico
- Função `extrairCamposComIA()` chama `api.groq.com/openai/v1/chat/completions` com `response_format: json_object`.
- Função `detectarTipoPorOCR()` cobre 60+ palavras-chave em PT/EN para os 6 tipos suportados.
- Função `abrirHistoricoModal(tipo)` renderiza listagem detalhada de sessões/itens/usuários.
- DEFAULT_CONFIG ganhou bloco `ai: { groq_key, model }` persistido em localStorage.
- Fallback automático: se IA falhar ou não houver chave, usa `parseLabel` + heurísticas locais.

## [1.0.7] - 2026-06-10

### Corrigido (bugs reportados no primeiro teste em produção)
- **Bug #1**: Dashboard (SESSÕES / ITENS / USUÁRIOS) agora soma o histórico de inventários arquivados, não zera ao começar novo. O botão "Encerrar e iniciar novo" foi renomeado para "Arquivar e começar novo" e agora preserva o resumo.
- **Bug #2**: Botão "+ outro" no wizard não mostra mais "Identifique o usuário" sem contexto. Agora navega automaticamente para a etapa do usuário e mostra mensagem clara explicando o que fazer.
- **Bug #3**: Após gerar planilha (.xlsx) ou PDF, exibe modal com botões diretos pra **WhatsApp**, **Email** e **Compartilhar** (Web Share API). Não precisa mais ir em Downloads manualmente.
- **Bug #4**: OCR demorando >8s agora mostra botão "Preencher manualmente" pra pular o reconhecimento sem perder a foto.

### Melhorado
- Compartilhamento integrado: planilha e PDF abrem menu nativo do sistema (WhatsApp / Teams / Outlook / Gmail / Drive).
- Modal pós-download com instruções claras de onde encontrar o arquivo (Android / Chrome / PC).
- Persistência do histórico de inventários no IndexedDB.

### Mudado
- Cache do SW: `openinvti-v1.0.7-prod`.

## [1.0.6] - 2026-06-09

### Mudado
- **Zero menções a empresa/instituição específica** em toda a documentação pública.
- Origem do projeto agora citada genericamente ("instituição pública brasileira") com crédito ao criador **Jean Sanabia**.
- Cache do SW: `openinvti-v1.0.6-prod`.

### Removido
- Exemplos com prefixos específicos (`F-FAR-NNNNN`) substituídos por exemplos genéricos (`ABC-12345`, `INV2024NNN`).
- Email corporativo `@far.fiocruz.br` removido das instruções.


## [1.0.5] - 2026-06-09

### Corrigido
- **Caminhos relativos** em `index.html`, `manifest.json`, `sw.js` e registro do Service Worker.
- Agora roda corretamente em **GitHub Pages**, Netlify, Cloudflare Pages, Vercel e qualquer subpasta.

### Mudado
- `start_url`, `scope` e `id` do manifest passaram de `/` para `./`.
- Cache do SW: `openinvti-v1.0.5-prod`.

### Adicionado
- `PUBLICAR_GITHUB.md` — Passo a passo Git/GitHub do zero (40 min).
- `SOBRE_O_APP.md` — Descrição completa do aplicativo (stack, casos de uso, origem).
- `POST_LINKEDIN.md` — 3 versões de post + dicas de divulgação.

## [1.0.4] - 2026-06-09

### Corrigido
- Removidos hardcodes residuais de empresa específica no `parseLabel`.
- `parseLabel` agora usa exclusivamente `APP_CONFIG.patrimonio.regex_padroes`.

### Adicionado
- Botão "🗑️ Limpar tudo e recomeçar" na tela de Configurações (reset total).
- `USER_GUIDE.md` (manual de uso) + `GITHUB_GUIDE.md` (publicação).

### Mudado
- Cache do SW: `openinvti-v1.0.4-prod`.

## [1.0.3] - 2026-06-09

### Corrigido
- Tela Hero + Dashboard cards no fluxo inicial.
- Removidas referências a "InventAI" remanescentes.

### Mudado
- Identidade visual: paleta cobalt + cyan + mint.
- Ícone novo: cubo azul + colchetes [ ] + scanner verde-ciano.

## [1.0.2] - 2026-06-09

### Adicionado
- Detector automático de padrão de etiqueta via foto + OCR.
- Botão de Configurações no topbar.

## [1.0.1] - 2026-06-08

### Adicionado
- Placeholder genérico de patrimônio.
- Polimento da tela de setup.

## [1.0.0] - 2026-06-08

### Adicionado
- Primeira versão genérica do produto, derivada de projeto interno em uma instituição pública brasileira.
- Tela de setup inicial (nome da empresa, regex patrimônio, marcas).
- Configuração persistente em localStorage.
- Wizard de captura de 6 passos.
- Câmera customizada com getUserMedia (zoom, flash, auto-foco).
- OCR Tesseract.js com pré-processamento (contraste + grayscale + auto-crop).
- Auto-captura por detecção em tempo real.
- Detecção de foto borrada (Laplaciano).
- Alerta de patrimônio duplicado.
- Tema Dark/Light persistente.
- Exportação Excel (4 abas) + PDF + Web Share API.
- 100% offline após primeira carga.

### Origem
Esta versão genérica foi derivada de um projeto interno desenvolvido por Jean Sanabia em uma instituição pública brasileira
após mais de 2 meses de iteração em produção. O código foi refatorado
para remover customizações específicas e tornar-se configurável para qualquer empresa.
