# Changelog OpenInvTI

Todas as mudanças notáveis serão documentadas neste arquivo.

## [1.1.0] - 2026-06-18 (versão MAJOR — resposta ao bug de perda de inventário)

### 🛡️ PROTEÇÃO ANTI-PERDA DE INVENTÁRIO (resposta DIRETA à perda do setor Validação)
- **Confirmação reforçada ao arquivar SEM planilha**: alerta detalhado mostrando setor, total de itens e passo a passo correto. Recusa silenciosa não acontece mais.
- **Histórico SEMPRE com items detalhados** (garantia v1.0.14, reforçado): cópia profunda de todos os dispositivos no arquivamento.
- **Reset de blobs no arquivamento**: planilha, PDF e buffers são limpos pra evitar confusão entre inventários.

### 💬 WhatsApp Share ROBUSTO (planilha SEMPRE primeiro)
- ETAPA 1: gera planilha .xlsx **antes de qualquer compartilhamento** — backup automático em Downloads.
- ETAPA 2: monta texto resumido.
- ETAPA 3: tenta Web Share API com arquivo + texto.
- ETAPA 4: fallback inteligente (clipboard + WhatsApp Web).
- **Mesmo se share for cancelado, planilha já está salva.** Não tem como perder dados.

### 🗂️ Inventários arquivados NAVEGÁVEIS
- Toque em qualquer arquivado no card "📦 Sessões" → modal com TODOS os dispositivos.
- 4 botões de ação dentro do arquivado:
  - 💬 Enviar pelo WhatsApp
  - 📊 Regerar planilha .xlsx
  - 📄 Regerar PDF
  - ✏️ Editar este inventário (restaura pro modo edição)

### 🔍 OCR sem stale + Auto-detect corrigido
- RESET completo do estado de captura ANTES de cada nova foto: limpa imagem, status e progresso.
- **BUGFIX CRÍTICO no auto-detect**: removido fallback genérico `\d{8}` que capturava tomadas com "127V" + códigos de barras como etiqueta.
- Auto-captura agora SÓ dispara se um regex configurado da empresa bater.

### 🏷️ Padrão Farmanguinhos REAL corrigido
- Etiqueta real é `41810330` (8 dígitos começando com `41`), NÃO `F-FAR-12345` como estava configurado.
- Preset Far atualizado com `\b41\d{6}\b` como PRIMEIRO regex (prioritário).
- Mantém suporte ao formato antigo `F-FAR-XXXXX` como fallback.
- Auto-detecção de "Farmanguinhos"/"Fiocruz" no setup manual ativa regex Far + normalização.

### 🧭 UX do wizard
- **"+ outro" renomeado para "+ Adicionar outro"** — texto mais claro.
- **Novo botão "✓ Finalizar inventário"** no passo de usuário — salva sessão atual e vai direto pra tela final.

### Mudado
- Cache do SW: `openinvti-v1.1.0-prod`.
- Subtítulo header: `Inventário de TI Inteligente · v1.1.0`.

### Por que v1.1.0 (e não v1.0.15)?
Marca o salto de "MVP em iteração rápida" para "produto resiliente com proteção real contra perda de dados". 7 problemas críticos reportados pelo usuário foram atacados em sequência. **Compromisso: nunca mais perder inventário por bug do app.**


## [1.0.13] - 2026-06-17

### Adicionado
- **🔢 Versão visível no header**: o subtítulo agora mostra "Inventário de TI Inteligente · v1.0.13". Quando há setor ativo, mostra "DD/MM/AAAA · v1.0.13". Facilita identificar a versão sem abrir configurações.
- **🧠 Rebranding**: "Inventário de TI corporativo" virou **"Inventário de TI Inteligente"** — reflete o pilar de IA que define o produto. Aplicado no header, hero e descrição.
- **Constante `APP_VERSION`** centralizada no `app.js` — versão definida em 1 lugar só, propagada pra toda a UI.
- **Constante `APP_TAGLINE`** — facilita rebranding futuro (basta editar 1 linha).

### Mudado
- Hero da tela inicial: "Inventário de TI Inteligente · IA · OCR · Open Source" (substituiu "corporativo").
- Cache do SW: `openinvti-v1.0.13-prod`.

### Boa prática implementada
Padrão **VersionTag inline** — mesma estratégia usada por Linear, Vercel, Sentry e Stripe. Versão discreta no metadado (subtítulo), não no título principal. Mesma tipografia, mesma cor. Identifica sem poluir.

## [1.0.12] - 2026-06-17

### Corrigido
- **🔍 Captura do "F-" no padrão F-FAR**: OCR estava perdendo o prefixo "F-" e capturando só "FAR-12345". Agora o regex aceita variações (`F-FAR`, `FFAR`, `F FAR`, `FAR` sem F-) e a função `normalizarPatrimonio()` reconstrói o formato correto **F-FAR-XXXXX** automaticamente.
- **⚡ Auto-captura mais ágil**: intervalo do loop de detecção reduzido de **2.2s → 1.2s** (quase 2x mais rápido). Captura efetiva em **400ms** após detectar (antes era 600ms).

### Adicionado
- **🤖 IA Groq em tempo real durante a câmera**: quando o OCR detecta texto mas o regex local não bate, o app manda pra IA decidir se identificou patrimônio válido. Limitado a 1 chamada a cada 6s pra economizar tokens. Status mostra "🤖 IA encontrou: F-FAR-XXXXX — capturando...".
- **🎨 Pré-processamento agressivo da imagem**: binarização adaptativa antes do OCR (threshold baseado no brilho médio). Letras escuras viram preto puro, fundo vira branco — OCR melhora drasticamente em etiquetas com pouco contraste ou impressas em fundo metálico.
- **📷 Feedback visual durante a câmera**: status agora mostra 3 estados:
  - `📷 Aproxime a etiqueta` (sem texto detectado)
  - `👁 Procurando padrão...` (texto detectado, ainda não bate)
  - `✓ Patrimônio detectado: F-FAR-12345 — capturando...` (match!)
  - `🤖 IA encontrou: F-FAR-12345 — capturando...` (IA bateu)

### Mudado
- **Preset `?preset=far`** com regex muito mais tolerantes:
  - `F[-_\s]?FAR[-_\s]?\d{5}` (variações de hífen/espaço)
  - `\bFAR[-_\s]?\d{5}\b` (OCR perdeu o F-)
  - `\b\d{6}\b` (só números)
  - Campo `normalizar: 'far'` ativa a normalização automática.
- **PROXY_URL hardcoded** no `app.js`: `https://openinvti.jean-sanabia.workers.dev` — não precisa mais editar manualmente após cada update.
- Cache do SW: `openinvti-v1.0.12-prod`.

### Técnico
- `normalizarPatrimonio(match)` — função que recebe um match cru do OCR e retorna o formato canônico (F-FAR-XXXXX).
- `camPreprocessForOcr(canvas)` — binariza canvas com threshold adaptativo antes de mandar pro Tesseract.
- `camStartAutoDetect` ganhou variáveis `ultimaConsultaIA` e `consultandoIA` pra rate-limit do fallback IA.

## [1.0.11] - 2026-06-17

### Adicionado
- **✏️ Botão Editar dentro dos modais** (Sessões / Itens / Usuários e modais por tipo): cada item agora mostra um lápis ✏️ no canto direito. Clicar abre o wizard pra editar a estação. Clicar no item inteiro também funciona.
- **🤖 Auto-título do inventário** a partir do setor: ao digitar SETOR, o TÍTULO se preenche automaticamente como `INVENTÁRIO DO SETOR X`. Se o usuário editar manualmente o título, o auto-fill desliga (não sobrescreve).

### Mudado
- **📁 Formato do nome do arquivo** Excel e PDF agora é `AAAA-MM-DD_NomeDoSetor.xlsx` (ex: `2026-06-17_Controle_de_Qualidade.xlsx`). Ordenação cronológica natural na pasta Downloads.
- **🏷️ Renomeado** o campo "Nome do responsável" no wizard de Usuário para **"Nome do usuário"** — evita confusão com "Analista responsável" da tela inicial.
- **🎴 Chips de usuário simplificados**: de 4 pra 3 chips (removido "Multiusuário" que confundia). Agora é claro: Pessoa específica · Estação compartilhada · Sem usuário fixo. Cada chip com tooltip explicativo no longo press.
- Cache do SW: `openinvti-v1.0.11-prod`.

### Técnico
- `editarSessaoDoModal(sessionId)` — helper que fecha modal e reaproveita `startWizard(sid)` existente.
- `.hm-item-editable` / `.hm-item-edit` — classes CSS dedicadas pra item com botão editar inline.
- Listener `input` no `setorInv` atualiza `tituloInv` se `dataset.manual !== '1'`.

## [1.0.10] - 2026-06-17

### Adicionado
- **👤 Campo "Analista responsável"** na tela inicial. Aparece no relatório WhatsApp, na planilha e na tela final. Autocomplete com últimos 20 valores usados.
- **🎴 Resumo executivo redesenhado**: cards modernos com ícones de cada tipo (CPU, Monitor, Telefone, Notebook, Impressora, Usuários). **Cada card é clicável** e abre a lista filtrada daquele tipo.
- **🧩 Chips rápidos na tela de Usuário**: "Pessoa específica", "Compartilhada", "Sem usuário", "Multiusuário". Pré-preenchimento com 1 toque.
- **🔢 Contadores de Notebook e Impressora** no resumo final (antes só mostrava CPU/Monitor/Telefone).
- **← Botão Voltar** na tela "Estações registradas" (volta pra tela inicial).
- **Transições suaves** entre telas (slide + fade 280ms, cubic-bezier).
- **Datalist de analistas e usuários** — autocomplete inteligente baseado no histórico.

### Mudado
- **Tela de Usuário do wizard NÃO obriga mais foto da tela**. Foto era pouco eficaz e travava o fluxo. Agora só campo de texto + chips rápidos.
- **Texto "Identifique o usuário desta estação..." removido** da tela do wizard. Substituído por título mais claro "Quem usa essa estação?".
- **Tela de Finalização** com botão WhatsApp em destaque (gradiente verde, ícone SVG), Excel e PDF em linha dupla secundária, "Compartilhar planilha (mais opções)" colapsado.
- **"Voltar para a lista"** virou **"↻ Retomar inventário"** — mais claro o que faz.
- **"Encerrar e iniciar novo"** virou **"🗑️ Arquivar e iniciar novo"** — coerente com a função (arquiva no histórico).
- **Lista screen-list** ganhou header com botão Voltar e título "Estações registradas".
- Cache do SW: `openinvti-v1.0.10-prod`.

### Visual
- Glass effect nos cards (backdrop-filter blur 20px).
- Gradiente colorido no topo do card de resumo executivo.
- Animação suave nos botões (lift 1-2px no hover, scale 0.97 no active).
- Tipografia hierárquica no big-number do total.
- Botão WhatsApp com box-shadow verde, logo SVG oficial.
- Ícone do dispositivo em cada exec-tile com fundo gradient sutil.

### Técnico
- `STATE.analista` adicionado ao estado global e persistido.
- `registrarAnalista()`, `popularAnalistasDatalist()`, `popularUsuariosDatalist()` — helpers de autocomplete.
- `abrirItensPorTipo(tipo)` — modal genérico filtrado por tipo de equipamento.
- `inicializarChipsUsuario()` — sincroniza chip ativo com valor do campo.

### Visual refinado (polish completo)
- **🎨 Design System completo**: variáveis CSS (`--c-bg-app`, `--c-accent`, `--shadow-glow-*`, `--radius-*`, `--ease-out`) padronizadas em todo o app.
- **🌌 Background com gradient radial sutil** (em vez de cor chapada): camadas de cobalt e cyan no fundo dão profundidade.
- **🔘 Botões aprimorados**: gradients de 3 paradas, sombras coloridas (glow), ripple shine no topo, hover lift de 1px, press scale 0.98 + brightness 0.95.
- **📝 Inputs com focus elegante**: ring cyan de 3px + shadow externa quando focado, hover sutil em borda, placeholder com opacity ajustada.
- **🪟 Header glassmorphism**: backdrop-filter blur + saturate 180%, título com gradient text (branco → cinza), botões de ação em pílulas glass.
- **📊 Dashboard cards refinados**: gradient direcional, top border com 3 cores (azul/cyan/mint), ícones com drop-shadow glow, animação stagger entrada (40/120/200ms).
- **🎴 Lista de estações**: hover lift de 2px + ring cyan, action buttons em uppercase compactos, stagger animation (60ms entre cards).
- **📸 Photo section**: bordas mais suaves, transição cor/background suave ao detectar foto.
- **🍞 Toast glassmorphism**: blur 18px, border interno semi-transparente, sombra colorida cyan, padding mais generoso.
- **🎴 Modal de histórico polido**: handle "puxar pra fechar" no topo (estilo iOS), gradient de fundo, itens com hover translate suave.
- **✨ Animação shine** no card de resumo executivo: brilho diagonal sutil passando a cada 6s.
- **📜 Scrollbar refinada**: thin com cor cyan transparente.
- **♿ Focus ring acessível**: `*:focus-visible` com outline 2px cyan em qualquer elemento.
- **🌗 Light mode harmonizado**: card backgrounds brancos, gradient text adaptado, contraste calibrado.
- **🎯 prefers-reduced-motion**: respeitado — desliga animações para usuários sensíveis.
- **🎬 Stagger animations**: entrada escalonada nos dash-cards, exec-tiles, user-chips e session-cards (50ms entre cada).
- **🔤 Tipografia hierárquica**: hero-title 28px/900/-0.6px tracking, wizard-step-title gradient text.
- **🎁 Empty state mais acolhedor**: caixa dashed com mais padding e tom suave.
- **📐 Section title divisor**: linha gradient suave após o texto.

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
