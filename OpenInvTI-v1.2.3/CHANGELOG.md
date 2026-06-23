# Changelog OpenInvTI

Todas as mudanças notáveis serão documentadas neste arquivo.

## [1.2.3] - 2026-06-23 (PATCH — câmera mais clara + assistente IA na foto)

### 📷 Linha-guia vermelha só aparece onde faz sentido
- Antes a **linha vermelha animada** aparecia em **toda** abertura da câmera, inclusive em "Tirar foto da etiqueta", causando confusão visual. Agora ela está **fixa no centro** (sem animação) e **só aparece em modo barcode** (`#cameraModal.barcode-mode`). No modo "Tirar foto da etiqueta" a câmera fica limpa, com apenas o quadro-guia azul.
- No modo barcode, **as bordas do quadro também ficam vermelhas** e o rótulo muda pra vermelho, reforçando visualmente o que aquela câmera está fazendo.

### ← Botão "Retomar inventário" visível na câmera
- O `×` discreto no canto da câmera virou um botão **"← Retomar inventário"** com texto, claramente identificado como **voltar pro fluxo do inventário** sem perder o passo. Em telas pequenas (<360px) só o ícone aparece pra economizar espaço.

### 💡 Explicação curta embaixo de cada botão de captura
- Cada um dos três métodos do wizard agora tem uma linha de dica embaixo do título, explicando **quando** usar:
  - **🔲 Ler código de barras** → "Mais rápido e exato quando a etiqueta tem código de barras impresso"
  - **📷 Tirar foto da etiqueta** → "Foto da etiqueta — IA lê e preenche tipo, marca, modelo, patrimônio e nº de série"
  - **🤖 IA identifica (opcional)** → "Quando a etiqueta está ilegível — IA olha a foto do equipamento"

### 🤖 Assistente IA proativo na foto da etiqueta
- Ao tirar a foto, o assistente agora **roda dois modelos em paralelo**: extração de campos pelo texto (OCR + Llama) **e** análise visual da foto (Llama 4 Vision). Os resultados são **combinados** — Vision prioritário para tipo/marca/modelo; OCR-IA prioritário para patrimônio e nº de série.
- O status no formulário ficou mais granular: agora indica de onde veio o preenchimento (`🤖 Assistente IA (foto + texto)` / `(foto)` / `(texto)` / `OCR`), pra você saber o que conferir.
- Nova função interna `identificarEquipamentoComIAFromFile(file, silent)` permite usar a Vision IA tanto manualmente quanto automaticamente no pipeline de captura.

## [1.2.2] - 2026-06-22 (PATCH — tipo por passo + botões ativados)

### 🐛 Correção de tipo
- **Tipo do equipamento agora respeita o passo do wizard.** Nos passos de **Monitor** (1 e 2) o tipo é sempre "Monitor" e no passo de **Telefone IP** é sempre "Telefone IP" — o OCR/IA não pode mais sobrescrever para "Outro" (ex.: telefone Avaya que era classificado como "Outro"). No passo de **CPU** a autodetecção continua ativa (pode virar Notebook, etc.).

### 🔌 Botões que estavam inertes agora funcionam
- **🔲 Código de barras** (`wizBarcode`): lê o código pela câmera e preenche o campo Patrimônio.
- **🤖 IA identifica** (`wizVision`): identifica tipo/marca/modelo pela foto do equipamento (respeitando a trava de tipo em Monitor/Telefone; só preenche marca/modelo se estiverem vazios).
- **📥 Importar** (`btnImport`): importa um inventário de planilha .xlsx existente.
- **📊 Análise** (`btnAnalytics`): abre o dashboard analítico do inventário.
- **🤖 Copiloto** (`btnCopilot`): mostra sugestões inteligentes sobre o inventário.

Todos esses cinco botões existiam na interface mas não tinham nenhuma ação ligada no código (cliques não faziam nada). Agora estão conectados às suas funções.

### 🎨 Correção do modo claro
- **Modo claro estava quebrado** (textos invisíveis, cards escuros, botões sem texto legível). A causa eram seletores CSS inválidos no bloco "LIGHT MODE refinado": usavam `html.light-mode body, body.light-mode X`, mas o tema é aplicado com a classe em `<html>`, então a parte `body.light-mode X` nunca casava e os elementos mantinham as cores do modo escuro. Corrigidos 24 seletores para `html.light-mode X`.
- Agora ficam corretos no modo claro: título/subtítulo da home, cards do dashboard (Sessões/Itens/Usuários) e seus rótulos, campos do formulário e o modal de histórico.
- Adicionado estilo de modo claro para os botões de ação (`.btn-mini`: Importar/Análise/Copiloto) — antes ficavam escuros com texto ilegível.
- Contraste verificado automaticamente (WCAG): todos os elementos principais ≥ 4.5:1 (hero-title ~17:1, botões ~7.5:1).

### 🔲 Código de barras como método principal + IA atualizada
- **Código de barras** virou a ação **principal** de captura (disparo manual): botão grande "🔲 Ler código de barras (recomendado)" no topo. A **foto da etiqueta (OCR)** fica como alternativa e a **🤖 IA identifica** como ferramenta **opcional**.
- **Modelo de visão da IA atualizado** para os mais recentes da Groq: **Llama 4 Maverick** (mais inteligente) com **fallback automático** para **Llama 4 Scout**, usando JSON mode. O modelo anterior (`llama-3.2-11b-vision-preview`) foi descontinuado pela Groq.

### 🏷️ Leitura de etiqueta com prioridade no patrimônio
- Ao ler a etiqueta (OCR/IA), o **nº de patrimônio** agora é o foco: quando identificado, o campo é destacado e a tela rola até ele; quando NÃO é identificado, o app foca o campo e avisa claramente ("Digite o nº de patrimônio abaixo").
- **Linha-guia animada (estilo scanner)** na câmera de etiqueta, para ajudar a alinhar o código de barras / a etiqueta.

### 🧹 Limpeza
- **Removida a tela de captura manual avulsa** (`screen-capture` e funções órfãs `loadItemIntoForm`/`readForm`/`applyExtracted` + handler do botão "Cancelar"): era código morto sem caminho na interface. O cadastro é todo pelo wizard guiado.

### ✅ Testes
- Suíte automatizada (jsdom) ampliada: carregamento sem erros, todos os handlers de botão ligados após o init, modais de Copiloto e Análise renderizando, fluxo de nome opcional e trava de tipo. Todos passando.

## [1.2.1] - 2026-06-22 (PATCH — usabilidade + correções)

### ✏️ Melhorias de usabilidade
- **Nome do usuário agora é OPCIONAL.** O passo "Usuário" não bloqueia mais a finalização. É possível concluir a captura sem identificar o nome (a sessão fica registrada como "(sem usuário)"). Novo botão "Sem usuário", placeholder e textos atualizados deixam claro que o campo é opcional.
- **Exibição consistente de sessões sem nome:** o rótulo "(sem usuário)" aparece de forma padronizada na lista, na planilha Excel (aba principal) e no PDF.
- **Contagem de usuários únicos correta:** estações sem nome não são mais contadas como usuário no dashboard nem nos relatórios (já usavam filtro, validado nesta versão).

### 🐛 Correções
- **Bug crítico de TDZ no wizard:** `isEquip` era usado antes da declaração em `wizardRender()`, o que podia quebrar a renderização dos passos. Declarações movidas para o topo da função.
- **Arquivo `app.js` corrompido:** removidos 443 bytes nulos (NUL) no final do arquivo que invalidavam o JavaScript.
- Atualizado nome do cache do Service Worker (`openinvti-v1.2.1-prod`) para garantir que os usuários recebam a correção.

### ✅ Testes
- Suíte funcional automatizada (jsdom): 9 testes cobrindo carregamento sem erros, renderização de todos os passos, finalizar/pular/salvar-e-continuar sem nome, finalizar com nome, dashboard e lista. Todos passando.

## [1.2.0] - 2026-06-18 (versão MINOR — produto maduro)

### 🆕 8 features novas

#### 🔲 Reconhecimento de código de barras (BarcodeDetector API)
- Botão **"🔲 Código de barras"** no wizard de captura
- Lê CODE_128, EAN-13, EAN-8, CODE_39, QR Code, Codabar via API nativa do Chrome (instantâneo, <1s)
- Preenche o campo Patrimônio automaticamente
- Funciona melhor que OCR pra etiquetas com código de barras impresso
- Fallback: se browser não suportar, avisa pra usar OCR

#### 🤖 IA Vision — identifica equipamento pela foto
- Botão **"🤖 IA identifica"** no wizard
- Tira foto do equipamento (não da etiqueta) — útil quando etiqueta é ilegível
- IA Llama 3.2 11B Vision via Groq identifica: tipo + marca + modelo
- Preenche os campos automaticamente, você confere e ajusta

#### 📊 Dashboard analítico dentro do app
- Botão **"📊 Análise"** na tela inicial
- Visualiza em tempo real (sem precisar abrir planilha):
  - Total de equipamentos (atual + arquivados)
  - **Distribuição por tipo** com barras coloridas
  - **Top 8 marcas** com gráfico horizontal
  - **Top 5 usuários** com mais equipamentos
  - Lista de **inventários arquivados** com totais

#### 📥 Importar planilha .xlsx existente
- Botão **"📥 Importar"** na tela inicial
- Aceita .xlsx existente (do próprio app ou planilha externa com colunas padrão: Tipo, Marca, Modelo, Patrimônio, Série, Usuário)
- Detecta cabeçalho automaticamente (linha 1 ou 2)
- Confirma antes de importar e ADICIONA ao inventário atual
- Cada item importado vem com obs "Importado da planilha XXX.xlsx"

#### 🤖 Copiloto IA — sugestões proativas
- Botão **"🤖 Copiloto"** na tela inicial
- Analisa o inventário atual e dá dicas:
  - "Você cadastrou X equipamentos em Y sessões"
  - "Razão monitor/CPU = 1.2 (normal é 1-2)"
  - "Você cadastrou 5 CPUs mas nenhum monitor — conferir se faltou"
  - "3 itens SEM ETIQUETA — lembre-se de etiquetar depois"
  - "Mais de 30 equipamentos! Gera a planilha antes de arquivar"

#### 💾 Indicador de auto-save visual
- Pequena bolha verde **"💾 Salvo"** aparece no canto inferior direito **a cada save automático**
- Confiança visual de que os dados estão seguros
- Some sozinha após 2s

#### 🖥️ Versão desktop otimizada
- Media queries pra telas >= 900px:
  - App expande pra 980px de largura
  - Padding generoso (24px x 32px)
  - Hero title 32px (mais imponente)
  - Exec grid em 6 colunas
  - Cards do dashboard maiores
  - Fonte 14px (legível em monitor)
- **Atalhos de teclado** (PC):
  - `Enter` → avança no wizard
  - `Esc` → fecha modais abertos
  - `Ctrl+S` → força salvamento manual (toast "Salvo manual")
- Aviso discreto no header com os atalhos

#### 🛠️ Modo colaborativo (preparação)
- Arquitetura documentada no `ROADMAP_v1.2.0.md`
- Próxima minor (v1.3.0): implementação completa via Cloudflare Durable Objects
- Por enquanto: presets compartilháveis (`?preset=` já funciona)

### Mudado
- Cache do SW: `openinvti-v1.2.0-prod`
- Subtítulo: `Inventário de TI Inteligente · v1.2.0`

### Versão MINOR
v1.2.0 marca o salto de "produto resiliente" pra "produto rico em recursos". 8 features novas + base sólida pra modo colaborativo futuro.


## [1.1.2] - 2026-06-18 (foco: captura manual + aprendizado)

### Removido
- **🚫 Auto-detect contínuo da câmera**: removido o loop OCR que rodava a cada 1.2s. Causava falsos positivos (tomadas, códigos de barras) e gastava bateria. **A câmera agora é puramente manual**: você aponta, posiciona, aperta o botão central → foto é tirada e processada.

### Adicionado
- **🏷️ Botão "Sem etiqueta - etiquetar depois"**: visível só nos passos de equipamento (CPU/Monitor/etc). Marca patrimônio como "SEM ETIQUETA" e adiciona observação "PENDENTE ETIQUETAR" — fica fácil filtrar depois na planilha pra etiquetar fisicamente.
- **🧠 Autocomplete inteligente**: o app agora **APRENDE** com cada marca/modelo que você digita. Salva em base local persistente. Próximas vezes sugere automaticamente:
  - **Marcas mais usadas** aparecem primeiro
  - **Modelos por marca** (digita "Lenovo" → sugere modelos Lenovo cadastrados antes)
  - Tudo offline, instantâneo, sem precisar de IA
- **🤖 IA Groq** continua disponível pra sugerir modelo via OCR quando você tira foto (fallback inteligente).

### Mudado
- Cache do SW: `openinvti-v1.1.2-prod`.
- Subtítulo: `Inventário de TI Inteligente · v1.1.2`.
- Checkbox "Auto" da câmera está oculto (não tem mais função).

### Por quê dessa mudança
A auto-captura era ambiciosa demais — gerava falsos positivos e consumia muita bateria. A captura manual + OCR robusto após foto + autocomplete inteligente é **muito mais eficiente** na prática:
1. Você posiciona a foto exatamente como quer
2. Tira a foto quando estiver pronta
3. OCR roda 1 vez (rápido) e preenche os campos
4. Se patrimônio não bater, você digita e o app aprende pra próxima

### Como confirmar
1. Limpa dados do app
2. Abre câmera — **não tem mais loop de "Procurando padrão..."**
3. Aponta pra etiqueta, aperta botão central
4. OCR roda 1x, preenche campos
5. Digita modelo novo "Lenovo M75Q" → na próxima captura Lenovo, sugere "M75Q" automaticamente


## [1.1.1] - 2026-06-18 (hotfix OCR — pós teste real)

### 🔴 BUGFIX CRÍTICO — OCR não capturava etiquetas claras
- **Etiqueta `F-FAR-26856` perfeitamente legível NÃO era detectada**. Causa: o pré-processamento agressivo da v1.0.12 (binarização com threshold 0.85x do brilho médio) destruía etiquetas claras com fundo branco — caracteres finos como "F-" desapareciam.

### ✅ Correções aplicadas
- **Pré-processamento SUAVIZADO**: substituída binarização agressiva por curva de contraste suave (multiplicador 1.25, sem clipping extremo). Mantém detalhes finos.
- **OCR de 2 passos**: primeiro tenta IMAGEM LIMPA (Tesseract já tem pré-processamento interno excelente). Se texto vazio/curto, aplica nosso pré-processamento como reforço.
- **Resolução aumentada 900→1100 px**: melhor precisão sem prejuízo notável de velocidade.
- **Status visível em tempo real**: agora mostra `👁 Lendo: "TEXTO DETECTADO..."` em vez do genérico "Procurando padrão". Você vê EXATAMENTE o que o OCR está lendo.
- **Mensagens de erro úteis**: quando OCR lê mas regex não bate, mostra prévia do texto e instrui "preencha abaixo".

### Técnico
- `camPreprocessForOcr` reescrito: grayscale com curva de contraste linear (1.25x amplificação) em vez de binarização threshold.
- `camStartAutoDetect` agora tenta `worker.recognize(small)` ANTES de `worker.recognize(processed)`.
- Cache do SW: `openinvti-v1.1.1-prod`.

### Como confirmar o fix
1. Limpa dados do app no Android
2. Abre câmera apontando pra etiqueta `F-FAR-XXXXX` ou `41XXXXXX`
3. ✅ Status agora mostra `👁 Lendo: "MONITOR HP ELITEDISPLAY..."` (texto real)
4. ✅ Quando detectar padrão: `✓ Patrimônio detectado: F-FAR-26856 — capturando...`


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
- Cache do SW: `o