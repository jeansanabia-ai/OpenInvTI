# Changelog OpenInvTI

Todas as mudanças notáveis serão documentadas neste arquivo.

## [1.8.1] - 2026-07-15 (PATCH — fix CSS não aplicado + cache-busting definitivo)

### 🐛 Painel aparecia sem estilo
No celular, o painel novo da v1.8.0 renderizou como texto empilhado (sem CSS). Causa: o navegador servia `style.css` e `app.js` do cache antigo (pré-v1.8.0), mesmo com HTML novo. O topo mostrava "v1.7.0".

### 🔧 Cache-busting definitivo
Os assets agora carregam com query de versão: `style.css?v=1.8.1` e `app.js?v=1.8.1`. Quando a versão muda, o navegador trata como URL nova e baixa fresh — ignora cache do Service Worker E cache HTTP. Isso resolve de vez o problema recorrente de "app não atualiza no celular". A cada release, o `?v=` sobe junto.

### 🧹 Reparo do style.css
O `style.css` tinha uma regra `.barcode-cta` truncada desde versões antigas (nunca afetou nada por ser a última regra, mas deixava o arquivo desbalanceado). Completada e fechada corretamente. CSS agora balanceado (657/657 chaves).

## [1.8.0] - 2026-07-15 (MINOR — Redesenho do painel + Setores editável + Dispositivos + PDF executivo)

Redesenho grande do dashboard focado em experiência, navegação e exportação executiva.

### 🎛️ Painel unificado com abas de período
Os 3 cards empilhados (Mês fechado, Hoje, 4 métricas) viraram **um painel único** com toggle `Hoje · Este mês · Acumulado`. As 4 métricas (Postos / Ativos / Setores / Usuários) e o mini-gráfico de 14 dias se atualizam conforme o período escolhido. A preferência de aba fica salva. Cada métrica é clicável (drill-down).

Isso resolve o dado do dia E o acumulado no mesmo lugar — e **substituiu o botão "Zerar contadores"**, que ficou desnecessário (removido junto com o card Hoje, o card Mês e o banner de zerado).

### 🏢 Setores editável (consultar + renomear + mesclar)
Nova tela cheia (não mais lista morta). Cada setor mostra nº de inventários, ativos e última visita, com 3 ações:
- **Consultar** — abre o catálogo de dispositivos filtrado por aquele setor
- **Renomear** — corrige o nome em todos os registros de uma vez (atual + arquivados)
- **Mesclar** — junta setores duplicados escritos diferente ("Lab predio 70" → "Laboratório prédio 70") num só

Tem busca no topo.

### 🗂️ Catálogo de Dispositivos (registro central)
Tela nova com **todos os ativos já inventariados** num só lugar, pesquisável por patrimônio, série, usuário, tipo, setor ou ramal. Filtros por tipo (chips). Exportação Excel do resultado filtrado. É o "lugar pra manter os dispositivos" — dá pra achar "aquele monitor da Clara" na hora.

### 📄 PDF executivo redesenhado
O relatório mensal em PDF agora é uma **apresentação**: capa com faixa colorida e identidade, 4 KPI-cards visuais, gráfico de evolução embutido, barras de top setores e distribuição por tipo (desenhadas), tabela de inventários e rodapé paginado. Pronto pra levar pra reunião com gestor.

### 🧭 Navegação
Dois atalhos grandes no dashboard (Setores / Dispositivos) e menu lateral atualizado (🗂️ Dispositivos no lugar de Zerar contadores).

## [1.7.0] - 2026-07-14 (MINOR — Relatório Mensal do último mês fechado)

### 📅 Card "MÊS FECHADO" no dashboard

Novo card em destaque no topo da tela inicial (aparece só quando existe pelo menos 1 inventário arquivado no mês anterior). Mostra 4 métricas do último mês completo:

- **Inventários** realizados
- **Ativos** contabilizados
- **Setores** cobertos
- **Analistas** envolvidos

Botão `Ver relatório →` abre a tela completa.

### 📊 Tela "Relatório Mensal" completa

Nova tela `screen-relatorio-mensal` com:

1. **Título grande** com nome do mês e ano
2. **4 métricas destacadas** (mesmo estilo do resumo executivo)
3. **Gráfico de evolução dia-a-dia** — barras via Chart.js mostrando quantos ativos foram cadastrados em cada dia do mês
4. **Top 5 setores** — barras horizontais com quantidade de ativos por setor
5. **Distribuição por tipo** — CPUs, Monitores, Impressoras, etc, também em barras
6. **Timeline dos inventários** — lista clicável de cada inventário do mês, drill-down pra ver dispositivos

### 📤 3 formatos de exportação do relatório mensal

- **WhatsApp executivo** (`gerarMensagemWhatsAppMensal`) — mensagem formatada estilo boletim, com métricas, TOP setores e distribuição por tipo. Envia via `api.whatsapp.com/send`.
- **Excel consolidado** (`exportarRelatorioMensalExcel`) — arquivo `Relatorio-Mensal_AAAA-MM.xlsx` com 2 abas: **Resumo** (métricas + TOP setores + tipos) e **Ativos** (todos os itens do mês, coluna Data + Setor + campos padrão).
- **PDF apresentação** (`exportarRelatorioMensalPDF`) — arquivo `Relatorio-Mensal_AAAA-MM.pdf` com capa (empresa + data), box com métricas em destaque, gráfico de evolução embutido via `chart.toBase64Image()`, TOP setores, distribuição por tipo e lista dos inventários. Pronto pra levar pra reunião.

### 🎯 Como usar

Todo dia 1º de mês, o card muda automaticamente pra mostrar o mês recém-fechado. É só o analista tocar em `Ver relatório` no dashboard, e todos os dados do mês passado ficam à mão. Exporta pelo formato que precisar.

Base de dados: o cálculo agrega tudo de `STATE.historicoSessoes[]` filtrando por `data` dentro do range `primeiroDiaDoMes..ultimoDiaDoMes`.

## [1.6.3] - 2026-07-14 (PATCH — Card HOJE + auto-reset diário + fix zerar + ícone posto)

### 🌅 Card "HOJE" no dashboard
Novo card em destaque no topo da tela inicial mostra **três métricas do dia corrente**:
- Postos cadastrados hoje
- Ativos registrados hoje
- Setores visitados hoje

A contagem soma inventário atual (se `STATE.data === hoje`) + arquivados com `data === hoje`.

### ⏰ Auto-reset diário às 06:00
Checkbox `Auto-reset diário` no próprio card. Quando ligado:
- Se o app já estiver aberto às 06h → zera automaticamente (via `setTimeout` que se reagenda)
- Se o usuário abrir o app depois das 06h de um novo dia (`STATE.ultimoAutoResetIso !== hoje`) → zera no boot
- Só o dashboard é zerado (modo visual). Nenhum dado é apagado — histórico inteiro continua acessível.

Ideal pro analista que faz varredura em vários setores por dia: cada dia começa "limpo" no painel, mas o histórico acumulado continua todo lá.

### 🐛 Fixes
- **"Erro ao zerar" pelo menu lateral** — o try/catch síncrono não pegava throws de função async. Agora navega pra home ANTES de chamar `zerarContadoresDashboard()`, com `.catch()` no promise pra logar erro real.
- **Ícone de "Postos de trabalho"** — trocado 📦 (caixa) por 🧑‍💻 (pessoa com notebook), mais representativo de posto de trabalho com usuário atribuído.

## [1.6.2] - 2026-07-14 (PATCH — PDF garantido + menu reconstruído + Zerar sem apagar)

### 🐛 Fixes críticos

- **PDF `t.map is not a function` (FINAL)** — o gerador de PDF agora tem **fallback manual completo**. Se o plugin `jspdf-autotable` falhar por qualquer motivo (versão bugada, quirks do CDN, dados malformados), o app desenha a tabela linha-por-linha usando `doc.text()` + `doc.rect()`. **Nunca mais dá erro.** Se cair no fallback, o PDF sai em modo simples (sem cores alternadas), mas sai.
- **Menu lateral com SVG gigante** — bug real encontrado: o `<button data-menu="historico">` tinha sido arrancado numa edição anterior, deixando o `<svg>` do relógio ÓRFÃO. Sem wrapper, o SVG ocupava a largura toda. **Menu reconstruído do zero** usando emojis 🏠 📦 🏢 📊 🔄 ⚙️ ❓ (evita depender de SVG/CSS complexo).

### ✨ Novidades no menu lateral

Agora com 7 itens organizados:

- 🏠 Início
- 📦 Inventários salvos
- 🏢 **Setores inventariados** (novo)
- 📊 Análise / Dashboard
- 🔄 **Zerar contadores** (novo)
- ⚙️ Configurações
- ❓ Sobre / Ajuda

### 🔄 Zerar contadores — agora NÃO-DESTRUTIVO

Feedback do Jean: o "Zerar" não precisa apagar histórico, só limpar a visão do painel pra ajudar a organizar. Reimplementado como **modo visual**:

- Botão zera apenas o dashboard (postos/ativos/usuários/setores voltam pra 0)
- **Nenhum inventário é apagado** — histórico continua intacto e acessível em Sessões
- Banner amarelo "👁️ Contadores zerados (histórico oculto)" aparece com botão **Restaurar**
- Flag `STATE.dashboardZerado` persistida, então funciona entre sessões

Isso permite ao analista fazer "contagem por setor" ou "contagem por dia" sem confundir com o total acumulado.

## [1.6.1] - 2026-07-14 (PATCH — hotfixes UX + zerar contadores)

### 🐛 Fixes

- **PDF `t.map is not a function`** — reescrito o gerador com `columns` + body de objetos (formato robusto do jspdf-autotable 3.8+). Todo valor é convertido pra string antes de entrar na tabela.
- **Menu lateral com SVG gigante** — o ícone do relógio (Inventários salvos) escapava pra 300px de largura. Adicionadas regras CSS com `!important` forçando 20×20px em todos os SVGs do menu, seletor específico `.side-menu .side-menu-item > svg`, e visual do menu redesenhado (padding menor, radius nos itens, gradient sutil no ativo).

### ✨ Melhorias

- **Editar cabeçalho direto na tela final** (#03 refinado) — botão ✏️ no header do resumo executivo. Abre o mesmo modal (título + setor + analista) e atualiza os textos da tela final em tempo real.
- **Zerar contadores no dashboard** (novo) — botão `🔄 Zerar contadores (começar do zero)` na tela inicial. Arquiva o inventário atual (se houver) e **apaga o histórico contábil** pra que Postos/Ativos/Usuários/Setores voltem pra zero. Útil pro analista organizar melhor: começa uma nova contagem "limpa" a partir dali, sem perder a configuração da empresa nem os regexes de patrimônio. Confirmação dupla protege contra clique acidental.

## [1.6.0] - 2026-07-14 (MINOR — fluxo em cadeia + share unificado + fixes críticos)

Release grande focada em **produtividade em campo** (menos cliques entre setores) e **correção de 3 bugs críticos** reportados por uso real.

### 🐛 Fixes críticos

- **#01 PDF quebrado** (`doc.autoTable is not a function`) — o `jspdf-autotable` 3.5+ mudou a API. Agora o app detecta as duas versões (`window.autoTable(doc, opts)` ou `doc.autoTable(opts)`) e usa a que estiver disponível. CDN adicionado no HTML.
- **#11 IA foto não preenchia campos** — a condição usava `groqKey` diretamente, ignorando quem usa o proxy Cloudflare. Trocado por `iaDisponivel()`.
- **#10 "Sem monitor" pulava só 1 passo** — agora pula 2 (Monitor1 + Monitor2), indo direto pra Telefone.

### 🏢 Card "Setores" clicável no dashboard (#02)

Novo 4º card no dashboard: **Setores** — mostra a contagem de setores únicos inventariados (atuais + arquivados) e, ao clicar, abre modal com detalhamento de quantos inventários e quantos ativos por setor.

### ✏️ Editar cabeçalho do inventário em qualquer momento (#03)

Novo botão de lápis (✏️) no header da tela de lista. Abre modal onde o usuário pode alterar **título + setor + analista** de uma vez, sem sair do inventário. Um preview compacto do cabeçalho aparece na tela de lista.

### 📤 Compartilhamento unificado + fluxo em cadeia (#05, #07, e Jean's suggestion)

A tela final foi reformulada:
- **Compartilhar**: 3 botões grandes lado a lado (WhatsApp, Excel, PDF) com cores identificáveis
- **E agora?**: 3 cards de próximo passo:
  1. **Continuar em outro setor** — digita o próximo setor e o app arquiva o atual + inicia novo (mantém analista e template do título, data = hoje)
  2. **Novo inventário completo** — arquiva e volta pra tela inicial
  3. **Só arquivar** — arquiva e volta ao menu

O campo do próximo setor tem autocomplete e mostra um badge "ℹ️ Setor já inventariado 2x · última visita: 05/07" se já foi visitado. Confirma se já foi inventariado no mesmo dia.

Isso mata os 3-4 cliques de fricção entre setores em varredura de prédio inteiro.

### 📦 Arquivar direto do dashboard (#06)

Botão "Arquivar e iniciar novo" aparece no dashboard quando há inventário em andamento (só nesse caso).

### 👥 Remover "Sem usuário fixo" (#04)

Unificado com "Estação compartilhada" (mesmo conceito, gerava dúvida).

### 📱 Compartilhar direto nos inventários arquivados (#14)

Cada inventário arquivado agora tem **3 mini-botões** (💬 📊 📄) direto no card, sem precisar entrar. Faz swap temporário do STATE, regenera o artefato e restaura.

### 🎨 Polish visual (#08)

- Título do topbar (`h1`) com ellipsis de 2 linhas (não estica infinito com títulos longos)
- Card de sessão com `-webkit-line-clamp: 2` no nome do usuário

### 💾 Retomar inventário garantido (#12)

Agora o STATE é restaurado **automaticamente no boot** (não só ao clicar Retomar). Botão Retomar continua visível, mas agora mostra a contagem: "Retomar inventário (12 ativos salvos)".

### 🧠 Autocomplete que aprende em runtime (#13)

`popularSugestoesHistoricas()` é chamado **a cada `saveState()`**, ou seja: cada novo item cadastrado já vira sugestão pros próximos campos.

## [1.5.3] - 2026-07-08 (PATCH — autocomplete geral + emoji seguro no título)

### 🔄 Autocomplete de TODOS os campos com valores já usados
Todos os campos livres do wizard e da home agora oferecem **sugestões automáticas** com base no que já foi digitado antes (dentro do inventário atual E de inventários arquivados). O usuário digita a primeira letra e o navegador mostra a lista de opções.

Novos `<datalist>` adicionados e populados pela função `popularSugestoesHistoricas()`:

- `setoresList` (campo Setor na home) — lista de todos os setores já usados
- `obsList` (campo Observações no wizard) — comentários comuns
- `ramaisList` (campo Ramal do telefone IP) — ramais já registrados

E os que já existiam (`analistasList`, `marcasList`, `modelosList`, `usuariosList`) agora também fazem merge dos valores dos inventários arquivados.

A função roda automaticamente:
- Ao entrar na tela home (`popularAnalistasDatalist()` já existente, agora complementado)
- Ao entrar no wizard (novo hook no `startWizard`)

Limite de 40 sugestões por campo, ordenadas alfabeticamente (locale pt-BR), truncadas em 120 caracteres.

### 📋 Emoji seguro no título do relatório
O título do relatório WhatsApp agora tem `📋` no início:

```
📋 *INVENTÁRIO DE ATIVOS DE TI*
```

`📋` (CLIPBOARD, Unicode 6.0) é o único emoji adicionado — testado como muito comum em fontes modernas do Android/iOS. Se algum cliente antigo renderizar como losango, o resto do relatório continua limpo (só símbolos Unicode 1.1). O emoji fica como "cereja no topo", opcional.

### Mudado
- Cache do SW: `openinvti-v1.5.3-prod`.
- Subtítulo: `Gestão de Ativos de TI · v1.5.3`.

## [1.5.2] - 2026-07-08 (PATCH — relatório WhatsApp com símbolos Unicode 1.1 universais)

### 🔧 Emojis coloridos removidos do relatório WhatsApp
Os emojis coloridos (`📋 🏢 📍 📅 👤 ✅ 🏭 👥 🏷️ 💻 📺 📞 📓 📠 📎 ⚙️`) que estavam no relatório da v1.5.1 podem virar `❖` (losango) ou `?` no WhatsApp Web / Desktop quando o cliente do destinatário usa fonte antiga que não tem essas glyphs Unicode.

Reescrito para usar **apenas símbolos Unicode 1.1 (do ano 1993)**, que TODA fonte tem — mesmo as mais antigas:

- `▪` (BLACK SMALL SQUARE, U+25AA) — bullet dos campos
- `✓` (CHECK MARK, U+2713) — marcador do resumo executivo
- `→` (RIGHTWARDS ARROW, U+2192) — separador campo→valor
- `─` (BOX DRAWINGS LIGHT HORIZONTAL, U+2500) — linha divisora
- Formatação `*negrito*` e `_itálico_` (nativa do WhatsApp)

Resultado — mesma organização visual, **zero risco de losango em qualquer cliente**:

```
*INVENTÁRIO DE ATIVOS DE TI*
─────────────────────

▪ *Empresa:*  Farmanguinhos
▪ *Setor:*    Laboratório Controle de Qualidade
▪ *Data:*     07/07/2026
▪ *Analista:* Jean Sanabia

─────────────────────
*RESUMO EXECUTIVO*
─────────────────────

✓ Total de ativos          →  *36*
✓ Postos de trabalho       →  *12*
✓ Usuários únicos          →  *1*
✓ Ativos com patrimônio    →  *31* (86%)

─────────────────────
*ATIVOS POR TIPO*
─────────────────────

▪ CPUs                 →  *0*
▪ Monitores            →  *36*
▪ Telefones IP         →  *0*
▪ Notebooks            →  *0*
▪ Impressoras          →  *0*

─────────────────────

*Planilha completa em anexo (.xlsx)*
_Contém detalhes de patrimônio, nº de série, observações e usuário de cada ativo._

_OpenInvTI v1.5.2 · Gestão de Ativos de TI_
```

### Mudado
- Cache do SW: `openinvti-v1.5.2-prod`.
- Subtítulo: `Gestão de Ativos de TI · v1.5.2`.
- `montarRelatorioTexto` reescrita: helper `fmtLinha(label, valor, extra)` e `fmtTipo(nome, label)` sem parâmetro de emoji.

## [1.5.1] - 2026-07-08 (PATCH — QR Code + wizard enxuto + relatório WhatsApp reformulado)

### 📱 Botão QR Code no wizard (3º método de captura)
Ao lado dos botões **Código de barras** e **Foto da etiqueta**, agora aparece o botão **📱 QR Code**. Abre a câmera em modo `qr` — com o **frame quadrado guia** já desenhado na v1.5.0, mesma câmera e detector do barcode (a API `BarcodeDetector` já suporta `qr_code`).

Após ler, o app pergunta onde salvar o valor lido:
- **OK** → preenche como **Patrimônio**
- **Cancelar** → preenche como **Nº de Série**

Se o QR contém URL, o app extrai automaticamente o último segmento do path (comum em etiquetas HP/Dell que codificam serial number numa URL).

### 🎯 Wizard visualmente mais limpo
- **3 botões compactos** (barcode / QR / foto) em linha, cada um com **1 linha só** (ícone + título + tag opcional)
- **Removido o subtítulo redundante** (`wizStepSub`) que duplicava o título do passo
- **Removido o hint gigante** embaixo dos botões (o guia já está no próprio botão)
- **Cores por método** — azul-ciano (barcode) · roxo (QR) · verde-mint (foto)
- Efeito de shine no hover em cada botão

### 💬 Relatório WhatsApp reformulado (emojis universais + layout tabular)
O relatório enviado pelo WhatsApp foi todo reformulado para:

1. **Usar apenas emojis Unicode 6.0** (compatíveis com qualquer Android/WhatsApp, mesmo os mais antigos que renderizavam os emojis novos como `?`):
   - `🖥️` → `💻` (CPU)
   - `🖼️` → `📺` (Monitor)
   - `🖨️` → `📠` (Impressora)
   - `━━━━` → `─────` (separador ASCII compatível)
2. **Alinhamento tabular** com setas `→` pra separar campo do valor
3. **Blocos com título em MAIÚSCULAS** e delimitadores claros
4. Novo formato:

```
📋 *INVENTÁRIO DE ATIVOS DE TI*
─────────────────

🏢 *Empresa* → Farmanguinhos
📍 *Setor*   → Laboratório Controle de Qualidade
📅 *Data*    → 07/07/2026
👤 *Analista* → Jean Sanabia

─────────────────
📊 *RESUMO EXECUTIVO*
─────────────────

✅ Total de ativos          →  *36*
🏭 Postos de trabalho       →  *12*
👥 Usuários únicos          →  *1*
🏷️ Ativos com patrimônio    →  *31* (86%)

─────────────────
💻 *ATIVOS POR TIPO*
─────────────────

💻 CPUs               →  *0*
📺 Monitores          →  *36*
📞 Telefones IP       →  *0*
📓 Notebooks          →  *0*
📠 Impressoras        →  *0*

─────────────────

📎 *Planilha completa em anexo (.xlsx)*
_Contém detalhes de patrimônio, nº de série,
observações e usuário de cada ativo._

⚙️ _OpenInvTI v1.5.1 · Gestão de Ativos de TI_
```

### Mudado
- Cache do SW: `openinvti-v1.5.1-prod`.
- Subtítulo: `Gestão de Ativos de TI · v1.5.1`.

## [1.5.0] - 2026-07-08 (MINOR — fluxo em massa turbinado + menu lateral + QR Code)

### 🐛 BUG CRÍTICO CORRIGIDO — caixa de captura nos 3 modos novos
Na v1.4.0 os modos **Vários do mesmo tipo**, **Itens avulsos** e **Contagem rápida** abriam com a tela do wizard **sem os botões de captura** (só texto e "Próximo →"). Causa: `isEquip` no `wizardRender()` reconhecia apenas os keys antigos (`cpu`, `monitor1`, `monitor2`, `telefone`). Adicionados os keys `lote_eq`, `individual_eq` e `rapida` à lista — agora os 3 modos mostram os botões 🔲 Ler código de barras + 📷 Tirar foto normalmente.

### 📦 CADASTRO EM LOTE turbinado (câmera contínua estilo leitor de supermercado)
Ao escolher **Vários do mesmo tipo**, o app agora pergunta uma única vez os **padrões** (marca + modelo + usuário comum) e abre a câmera em **modo contínuo**:

- Câmera **fica aberta** durante todo o lote — cada código lido vira 1 ativo cadastrado sem sair da tela de captura
- **Vibração curta** (60ms) a cada leitura
- **Contador visível** no topo: "**12 CPUs lidos**"
- **Últimos 3 patrimônios** exibidos no rodapé em tempo real
- **Anti-duplicata**: mesmo código lido nos últimos 2.5s é ignorado
- Marca/modelo/usuário do padrão são aplicados a todos os ativos do lote
- Ao encerrar (botão ← Voltar), toast confirma: "✓ Lote encerrado: N CPUs cadastrados"

Resultado: cadastro de **50 telefones IP em ~3 minutos** vs. os ~45 minutos do fluxo anterior.

### ⚡ CONTAGEM RÁPIDA modo perene
Ao escolher **Contagem rápida**, câmera abre e **fica aberta permanentemente**:

- Cada leitura de código de barras/QR salva o patrimônio direto no inventário
- Categoria automática: tipo="Outro", usuário="Contagem rápida", observação com data de coleta
- Ideal para **auditoria de presença** (valida se ativos estão fisicamente no local)
- Dedup em nível de STATE (mesmo patrimônio nunca é cadastrado 2x)
- Vibração + contador + últimos 3 na tela em tempo real

### 📱 Frame guia para QR Code
Novo overlay `.cam-qr-frame` (quadrado central com cantos ciano brilhantes + animação de pulso suave). Ativado com `#cameraModal.qr-mode`. Segue a mesma filosofia da linha vermelha do barcode: **guia visual para alinhar o QR no centro** e conseguir leitura consistente. O leitor de código de barras (linha vermelha) foi mantido intocado como pedido.

### 🍔 Menu lateral (hamburger)
Botão **☰** no topo esquerdo abre painel lateral com 5 items:

- 🏠 **Home** — volta pra tela inicial
- 🕐 **Inventários salvos** — abre modal do histórico
- 📊 **Análise / Dashboard** — abre gráficos e estatísticas
- ⚙️ **Configurações** — abre tela de setup
- ❓ **Sobre / Ajuda** — mostra versão + FAQ rápida

Painel desliza da esquerda com transição suave (`cubic-bezier(.4,0,.2,1)`), fundo escurecido com `backdrop-filter: blur(4px)`. Ícones em SVG inline (não emojis), coerentes com o design moderno. Suporta modo claro.

### 🎨 Ícones SVG modernos nos cards do modal de escolha
Os 4 cards do modal "Como você quer cadastrar?" agora usam **ícones SVG inline** em vez de emojis:

- 🖥️ Emoji → SVG de mesa com monitor + torre
- 📦 Emoji → SVG de caixas empilhadas
- 🎯 Emoji → SVG de grid 2×2 (representa "vários tipos diferentes")
- ⚡ Emoji → SVG de raio dinâmico

Ícones em `#67E8F9` (ciano) com `drop-shadow` sutil, hover mais claro, tamanho 26×26 fixo. Aparência de app moderno em vez de "app hobby com emojis".

### 🏷️ Modos renomeados e descrições focadas em cenário real
- ~~Cadastro em Lote~~ → **Vários do mesmo tipo** *(Ex.: 50 Telefones IP · 100 monitores novos)*
- ~~Cadastro Individual~~ → **Itens avulsos** *(Ex.: sobras da manutenção, itens em conserto)*
- ~~Coleta Rápida~~ → **Contagem rápida** *(Ex.: auditoria de presença, fechamento anual)*
- **Posto de Trabalho** mantido (nome ok pela análise)

Cada descrição agora começa com **exemplo prático** ("Ex.: ...") pra o inventariante identificar o cenário em segundos.

### Mudado
- Cache do SW: `openinvti-v1.5.0-prod`.
- Subtítulo do header: `Gestão de Ativos de TI · v1.5.0`.
- `openCustomCamera(stepKey, opts)` aceita `opts.mode = 'qr'` (mesmo motor do barcode com frame diferente) e `opts.continuous = true` (loop de detecção que chama `opts.onDetect(raw)` a cada leitura sem fechar a câmera).
- STATE ganha `loteConfig` (marca/modelo/usuário padrão do lote atual, persistido no IndexedDB).
- Toast de mudança de modo mostra o nome novo ("📦 Vários do mesmo tipo · CPU").

### Não mexido (por pedido explícito)
- Leitor de código de barras (linha vermelha animada) — permanece exatamente como estava, pois estava funcionando perfeitamente conforme feedback do teste em campo.

## [1.4.0] - 2026-06-24 (MINOR — 4 modos de inventário + vocabulário corporativo + WhatsApp executivo)

### 📋 4 modos de inventário (modal após "▶ Iniciar inventário")
Ao tocar **▶ Iniciar inventário**, o app agora abre um modal pra o inventariante escolher o **modo de cadastro** mais adequado à situação. Cada modo aciona um fluxo otimizado:

- **🖥️ Posto de Trabalho** *(recomendado, default)* — Inventarie todos os ativos vinculados a uma estação de trabalho por usuário (Ex.: CPU, Monitor, Telefone IP). Fluxo original preservado.
- **📦 Cadastro em Lote** — Registre vários ativos do mesmo tipo de forma contínua. Pergunta qual tipo (CPU/Monitor/Telefone IP/Notebook/Impressora) e pula direto pro step desse tipo em loop. Usuário atribuído opcionalmente no fim.
- **🎯 Cadastro Individual** — Cadastre ativos diferentes um a um. Wizard com tipo editável a cada item, sem fluxo fixo.
- **⚡ Coleta Rápida** — Capture apenas o patrimônio para validação de presença física. Step único focado no patrimônio (compatível com a auto-leitura de código de barras).

O modal tem o card "Posto de Trabalho" destacado como recomendado, e os outros 3 abaixo com descrições. Funciona em modo escuro e claro.

### 🏷️ Vocabulário corporativo "Gestão de Ativos"
Refinamento de toda a interface para o vocabulário mais profissional pedido pelo time:

- Tagline: `Inventário de TI Inteligente` → `Gestão de Ativos de TI`
- Dashboard: `Itens registrados` → `Ativos registrados`
- Dashboard: `Sessões` → `Postos de trabalho`
- Wizard: `Equipamento principal` → `Ativo principal`
- Wizard: `Dados do equipamento` → `Dados do ativo`
- Lista: `Estações registradas` → `Postos de trabalho registrados`

### 💬 Mensagem WhatsApp executiva
A função `montarRelatorioTexto` foi totalmente reescrita pra gerar um relatório com aparência executiva, usando separadores `━━━━━━` pra blocos visuais e métricas de qualidade:

```
📋 *INVENTÁRIO DE TI*
━━━━━━━━━━━━━━━━━━━━
🏢 Empresa · 📍 Setor · 📅 Data · 👤 Analista
━━━━━━━━━━━━━━━━━━━━
📦 Resumo executivo
✅ N ativos · 🖥️ N postos · 👥 N usuários · 🏷️ N% com patrimônio
━━━━━━━━━━━━━━━━━━━━
💻 Ativos por tipo
🖥️ CPUs ............... N
🖼️ Monitores .......... N
📞 Telefones IP ....... N
💻 Notebooks .......... N
🖨️ Impressoras ........ N
━━━━━━━━━━━━━━━━━━━━
📊 Planilha completa em anexo (.xlsx)
⚙️ OpenInvTI v1.4.0 · Gestão de Ativos de TI
```

Inclui **taxa de etiquetagem** automática (% de ativos com patrimônio cadastrado) — métrica útil pra avaliar qualidade do levantamento.

### ❌ Botão "🤖 IA identifica" removido
O botão "IA identifica (opcional)" foi removido do wizard, conforme feedback de uso real (gerava mais confusão do que valor agregado quando comparado ao OCR da foto da etiqueta). O **assistente IA continua rodando automaticamente** dentro do fluxo "📷 Tirar foto da etiqueta" — onde já é mais útil, analisando foto + texto em paralelo e preenchendo os campos.

A função `mostrarModalSugestoesIA` ficou disponível internamente pra uso em futuras integrações (p.ex. assistente conversacional na v1.5.0).

### 🎨 Visual moderno dos 2 botões de captura
Os dois botões principais do wizard ganharam visual mais sofisticado:

- **🔲 Ler código de barras** — gradient cyan→azul-cobalto com glassmorphism, padding generoso, borda sutil de luz, sombra colorida em camadas, animação de "shine" diagonal no hover e micro-interação de press (scale 0.97).
- **📷 Tirar foto da etiqueta** — gradient azul-cobalto→mint mais elegante, padding alinhado ao botão principal, mesma sombra em camadas, glassmorphism e shine sutil.

Ambos com transições `cubic-bezier` pra movimento natural e profissional.

### Mudado
- Cache do SW: `openinvti-v1.4.0-prod`.
- Subtítulo: `Gestão de Ativos de TI · v1.4.0`.
- `WIZARD_STEPS` agora é `let` em vez de `const`, pra permitir reatribuição conforme o modo escolhido. A cópia imutável `WIZARD_STEPS_POSTO` preserva o fluxo padrão.
- `STATE` ganha campos `modoInventario` e `tipoLote` (persistidos no IndexedDB junto com o resto do estado).

## [1.3.0] - 2026-06-24 (MINOR — UX em massa + auto-barcode + IA TOP 3)

### 🔲 Auto-leitura de código de barras estilo leitor de supermercado
- A câmera customizada de **🔲 Ler código de barras** agora roda `BarcodeDetector` em loop a 4fps sobre o `<video>` ao vivo. Assim que o código entra no quadro, o app **vibra** (80ms), fecha a câmera e preenche o nº de patrimônio automaticamente.
- A captura manual (botão branco no centro) continua funcionando como fallback pra etiquetas difíceis.
- A linha vermelha fixa continua sendo o guia de alinhamento.

### 🔲 Botão de barcode também no nº de série
- Novo botão `🔲` ao lado do campo **Nº de Série** no wizard. Mesmo fluxo do patrimônio: aponta câmera → auto-detecta → preenche o número de série.

### 🤖 IA Identifica com TOP 3 sugestões pra escolher
- Prompt da IA Vision (Llama 4 Maverick/Scout) reescrito pra retornar **até 3 sugestões prováveis** de tipo+marca+modelo com nível de confiança (em % de 0–100).
- Novo **modal de escolha** com tema roxo: 3 botões com cada sugestão e um botão "✏️ Nenhuma dessas — vou digitar manualmente". Ao escolher uma opção, o app preenche os campos com flash de destaque.
- Continua opcional — só dispara se você apertar 🤖 IA identifica.

### ✏️ Renomeação de botões pra eliminar confusão
- **"✓ Finalizar captura"** virou **"✓ Salvar estação"** (mais claro: salva o equipamento atual e avança o wizard).
- **"✓ Finalizar inventário"** virou **"🏁 Encerrar inventário"** com tooltip explicando que vai pro relatório final.

### 🗑️ Botão Excluir individual nos itens dos modais
- Cada item das listas (Sessões / Itens / Usuários / Inventários arquivados) ganha um botão **🗑️** vermelho ao lado do **✏️**. Confirma antes de remover e atualiza dashboard + lista.
- Botão **Fechar ×** dos modais ficou com fundo sólido (`#0d1424` + box-shadow) pra não ficar mais "atrás" do lápis dos itens ao rolar.
- Itens sem patrimônio E sem série ganham borda esquerda âmbar + sufixo "· sem dados" no título — fica óbvio que precisa de revisão.

### 🚨 Alerta de itens vazios ao encerrar inventário
- Ao tocar **🏁 Encerrar inventário**, se houver itens sem patrimônio E sem nº de série, o app pergunta: "Você tem N item(ns) sem dados. OK = excluir vazios e seguir | Cancelar = voltar e revisar". Evita relatório poluído por cadastros incompletos.

### Mudado
- Cache do SW: `openinvti-v1.3.0-prod`.
- Subtítulo: `Inventário de TI Inteligente · v1.3.0`.
- Cada item ganha um `id` único na hora do `STATE.items.push(it)` pra permitir exclusão precisa.

## [1.2.6] - 2026-06-23 (HOTFIX DECISIVO — Farmanguinhos é o DEFAULT, sem mais race)

### 🎯 Decisão de produto
Em vez de depender de `?preset=far` na URL (race condition no boot do PWA, expira ao limpar dados), o **default do app agora É Farmanguinhos**. Quem abre o link **direto na raiz** (`https://jeansanabia-ai.github.io/OpenInvTI/`) cai imediatamente na tela home configurada com:
- Empresa: **Farmanguinhos**
- Título: INVENTARIO DE EQUIPAMENTOS DE TI
- Regex: `\b41\d{6}\b`, `F[-_\s]?FAR[-_\s]?\d{5}`, `\bFAR[-_\s]?\d{5}\b`, `\b\d{6}\b`
- Marcas pré-carregadas (HP, Dell, Lenovo, Positivo, Itautec, Yealink, Cisco, Avaya etc.)
- Normalização Far ativa (FAR-12345 → F-FAR-12345)
- `setup_done = true` (pula tela de Bem-vindo)

### 🔄 Migração automática
- Se já existe localStorage com `empresa.nome === 'Sua Empresa'` (default antigo) ou nome vazio, **descarta e reaplica o default novo** (sem precisar limpar dados manualmente).

### 🔧 Por que isso resolve "nenhum botão funciona"
- Antes: usuário caía na tela `screen-setup` sem campos preenchidos. Os botões "Salvar" e "Iniciar inventário" são de **outras telas** — então parecia que "nada funcionava" porque o app estava em modo setup esperando input.
- Agora: pula direto pra `screen-start` com tudo pronto, os botões da home (📥 Importar, 📊 Análise, 🤖 Copiloto, ▶ Iniciar inventário) ficam visíveis e ativos no primeiro carregamento.

### Mudado
- Cache do SW: `openinvti-v1.2.6-prod`.
- `?preset=far` continua funcionando (compatibilidade pra outros links), mas não é mais necessário.

## [1.2.5] - 2026-06-23 (HOTFIX — preset Far agora preenche tudo, sem race condition)

### 🐛 Preset Far não chegava na tela de setup
- Mesmo com `?preset=far` na URL, o usuário caía na tela de Bem-vindo com **Nome da empresa vazio**, **Padrão regex vazio** e **Marcas vazias** (só o título vinha por causa do default).
- Causa: race condition no boot — `aplicarPresetEmpresa()` chamava `saveConfig()` que escrevia no localStorage de forma assíncrona, mas o failsafe lia `APP_CONFIG.setup_done` antes desse save propagar; o failsafe então mostrava `screen-setup` com os campos vazios porque os listeners de tela de setup ainda não tinham puxado do `APP_CONFIG` atualizado.

### ✅ Hardening (defesa em profundidade)
- Sinalizador `_presetAplicado` em escopo do listener `DOMContentLoaded`: quando o preset é aplicado, o failsafe **força `screen-start`** mesmo se `setup_done` ainda não persistiu.
- Quando o preset é aplicado, **preenche imediatamente os campos visuais** da tela de setup (`#cfgEmpresa`, `#cfgTitulo`, `#cfgRegex`, `#cfgMarcas`) — se por algum motivo a tela de setup for mostrada mesmo assim, os campos já vêm corretos.

### Mudado
- Cache do SW: `openinvti-v1.2.5-prod`.

## [1.2.4] - 2026-06-23 (HOTFIX — subtítulo mostrava versão velha + preset Far não reaplicava)

### 🐛 Subtítulo do header mostrava `v1.2.2` mesmo em v1.2.3
- Causa: `index.html` linha 21 tinha o subtítulo **hardcoded** como `Inventário de TI Inteligente · v1.2.2`. O JS sobrescreve esse texto via `updateTopbar()` — mas essa função só roda na tela home (`screen-start`), nunca na tela de boas-vindas (`screen-setup`). Quando o usuário limpava dados e caía na tela de setup, ficava com a versão velha visível.
- Fix: HTML atualizado para `v1.2.4` + novo bloco de boot no `DOMContentLoaded` que escreve `APP_TAGLINE + ' · v' + APP_VERSION` no `topSub` **antes** de qualquer outra coisa, garantindo que toda tela inicial mostre a versão real.

### 🔁 Preset Far (`?preset=far`) agora pode ser reaplicado
- Antes, o preset só era aplicado quando `APP_CONFIG.setup_done === false`. Resultado: depois de limpar dados (que zera `setup_done`), o preset deveria rodar — mas em alguns cenários de timing (race condition no boot, localStorage tardio em aba anônima) o app caía na tela de setup com campos vazios mesmo com `?preset=far` na URL.
- Fix: removida a condição `!APP_CONFIG.setup_done`. Agora o preset reaplica sempre que o link com `?preset=far` é aberto — o usuário pode reusar o QR Code a qualquer momento.

### Mudado
- Cache do SW: `openinvti-v1.2.4-prod` (força puxar o `index.html` corrigido e o `app.js` novo).

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