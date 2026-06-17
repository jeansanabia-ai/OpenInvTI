# 💡 OpenInvTI — Banco de Ideias (Backlog)

Lugar pra guardar TODAS as ideias que aparecem, mesmo as malucas.
Triagem mensal pra decidir quais entram em próximas versões.

---

## 🎯 Convenções

- 🔥 = Alta confiança, alta valor — promover pra ROADMAP rápido
- ⭐ = Boa ideia, validar primeiro
- 🤔 = Interessante mas precisa pensar mais
- 🌱 = Ideia maluca / experimental

---

## 🚀 Funcionalidades Maiores

### 🔥 Multi-idioma (PT/EN/ES)
Adicionar i18n com JSON de strings. Detecta idioma do navegador automaticamente.
Permite vender pra empresas LatAm e exterior. Não muda código, só strings.

### 🔥 Geolocalização opcional
"Onde foi feito o inventário?" — GPS captura coordenadas (com permissão).
Permite gerar mapa visual de equipamentos por setor/andar.

### ⭐ Notas de voz nas observações
Botão 🎤 no campo Observações grava 30 segundos.
Áudio salvo localmente, transcrito por Whisper (via proxy).
Útil pra quando o técnico tá com as mãos ocupadas.

### ⭐ QR Code de compartilhamento de configuração
Configurações → "Compartilhar perfil de empresa".
Gera QR Code que outro usuário escaneia → recebe presets prontos.
Alternativa ao `?preset=` na URL.

### ⭐ Modo "vistoria assistida"
Antes de visitar a sala, app carrega lista de equipamentos esperados (último inventário).
No local, técnico só confirma "encontrado / não encontrado" + foto rápida.
3x mais rápido pra re-inventário.

### ⭐ Dashboard avançado
Gráficos comparativos entre inventários:
- Crescimento/redução de parque ao longo do tempo
- Idade média dos equipamentos
- Mapa de calor de uso por setor
- Predição de equipamentos a serem substituídos

### ⭐ Gamificação opcional
- Streaks de dias inventariando
- Recordes pessoais (mais equipamentos em 1 sessão)
- Badges por marcos (10, 50, 100, 500, 1000 equipamentos)
- Ranking entre técnicos da empresa (opt-in)

### ⭐ Comparativo entre inventários
"Quais equipamentos sumiram desde o último inventário?"
"Quais são novos?"
"Quais mudaram de usuário?"

### 🤔 Modo "auditoria certificada"
Inventário com hash criptográfico, timestamp e foto assinada (digital signature).
Aceito pra fins de auditoria fiscal/contábil sem precisar de cartório.

### 🤔 Marketplace de templates
Comunidade compartilha presets/templates:
- "Preset Hospitais SUS" (criado por João, 200 usos)
- "Preset Escolas Estaduais" (criado por Ana, 150 usos)
Cada template inclui regex, marcas comuns, layout de planilha.

### 🌱 Avatar 3D do usuário
Usuário tira selfie, app gera avatar low-poly. Avatar aparece no canto durante uso, faz reações engraçadas.

---

## 🤖 IA & Automação

### 🔥 Auto-aprendizado de empresa
Primeira vez, app pede 3 fotos. IA detecta nome empresa pelo logo, regex, padrão. Configura tudo sozinha. Zero pergunta ao usuário.

### 🔥 Sumário executivo gerado por IA
Ao final do inventário, IA escreve relatório executivo:
"Setor X tem 23 equipamentos, 80% ativos, 3 fora de garantia, recomendo renovar Z."

### ⭐ Detecção de anomalias
IA detecta padrões estranhos:
- "5 equipamentos sem etiqueta nessa sessão (geralmente 0)"
- "Modelo Dell registrado, mas foto mostra HP"
- "Número de série não bate com formato Dell padrão"

### ⭐ Chat de suporte com IA
Botão "?" sempre visível.
Usuário pergunta: "Como faço pra editar um item já salvo?"
IA responde com texto + screenshot animado destacando botões.

### ⭐ Voice control
"Hey OpenInv, próximo equipamento" → app avança no wizard.
"Salvar como Dell Latitude 7420" → app preenche e salva.

### 🤔 IA aprende com correções
Cada vez que usuário corrige campo extraído pela IA, sistema aprende.
Após N correções, modelo fine-tuned localmente (em background, sem custo extra).

### 🌱 Vision Llama 3.2 + análise de cena
IA olha foto inteira e infere contexto:
"Sala de servidores" → muitos racks, ar condicionado
"Sala de reunião" → mesa grande, monitor único
Sugere setor automaticamente.

---

## 💬 Integrações

### 🔥 WhatsApp Business completa
- Envio automatizado
- Recebimento (foto chega → IA cadastra)
- Templates aprovados pela Meta
- Catálogo de inventários no perfil

### 🔥 Integração com Active Directory / Azure AD
Login com conta corporativa. Permissions baseadas em grupo AD.
Auditoria de quem cadastrou o quê.

### ⭐ Integração com ERPs (Senior, Totvs, SAP)
Sincroniza inventário com módulo de patrimônio do ERP.
Evita digitação dupla.

### ⭐ Integração com Trello / Asana / Linear
Cria tasks automaticamente:
"Substituir Dell Optiplex F-FAR-12345 (>5 anos)" → vai pro board.

### ⭐ Slack notifications
Webhook no Slack pra alertas:
- Inventário finalizado por X
- Anomalia detectada em Y
- Equipamento perdido (não apareceu no novo inventário)

### ⭐ Microsoft Teams (canal de TI)
Igual Slack mas pra empresas Microsoft.

### 🤔 Email digest semanal
Domingo à noite, app gera resumo da semana e manda por email pro gestor.

### 🤔 Webhook genérico
Configurações → "Webhook URL". App posta JSON em cada evento (inventário finalizado, item adicionado, etc).

---

## 📊 Analytics & Insights

### ⭐ Tempo médio de cadastro por usuário
Métricas internas (privadas) pra usuário ver evolução.

### ⭐ Mapa de calor de uso
Mostra setores/horários mais inventariados.

### ⭐ Comparativo entre técnicos
Anônimo, opt-in. "Você cadastra 15% mais rápido que a média do setor."

### 🤔 Predição de tempo restante
Durante inventário: "Estimativa: faltam 12 equipamentos, ~18 minutos no seu ritmo atual."

---

## 🛡️ Segurança & Privacidade

### 🔥 Criptografia opcional do IndexedDB
Senha mestra protege todos os dados localmente.

### ⭐ Modo "sigilo"
Equipamentos sensíveis (sala de servidores, dados de segurança) podem ser marcados como sigilosos.
Não aparecem em relatórios padrão. Acesso só com 2FA.

### ⭐ Audit log
Quem mudou o quê, quando. Imutável.

### 🤔 Federated learning
Modelos de IA aprendem com dados de várias empresas SEM ver dados específicos.
Privacy-preserving ML.

---

## 🎨 Visual & Experiência

### ⭐ Modo "minimalista"
Sem dashboard, sem dicas, sem nada. Só wizard limpo. Pra power users.

### ⭐ Temas customizáveis
Empresa coloca sua paleta + logo. Vira "OpenInvTI da Empresa X".

### ⭐ Adaptive UI
Smartphone segurando com 1 mão? Bottom navigation. Tablet em landscape? Sidebar.
PWA adapta layout automaticamente.

### 🤔 AR para visualização de equipamentos
Aponta câmera pra sala → ARKit/ARCore destaca equipamentos cadastrados sobrepostos.

### 🌱 Modo "papel" pra impressão
CSS específico que transforma a tela em layout otimizado pra impressão B&W.

---

## 🔧 Técnico / Infra

### 🔥 Testes E2E com Playwright
Cobertura > 80%. Roda no CI antes de cada deploy.

### ⭐ Storybook pros componentes
Documentar e testar componentes isoladamente.

### ⭐ Migração pra TypeScript
Mais segurança em refactors. Não muda comportamento, melhora manutenção.

### ⭐ Web Workers pra OCR
OCR roda em thread separada, não trava UI.

### 🤔 WebAssembly otimizado pra Tesseract
~2x mais rápido. Implementação mais complexa.

### 🤔 Migrar de Vanilla JS pra Lit ou Svelte
Componentização melhor sem framework pesado. Manter <150KB bundle.

---

## 📱 Plataformas

### ⭐ APK na Play Store
Publicar versão TWA na Google Play. Maior alcance, instalação familiar.

### ⭐ iOS PWA otimizada
Hoje funciona mas é tosca. Suporte completo a Safari quirks.

### 🤔 Versão Desktop nativa (Tauri ou Electron)
Pra empresas que não querem celular.

### 🤔 Apple Watch / Wear OS
Tira foto pelo relógio? Talvez exagero, mas seria icônico.

---

## 💼 Modelo de Negócio (caso queira monetizar no futuro)

### Modelo Freemium possível:

**Free**: Como está hoje. Sempre.

**Pro (R$ 19/mês)**:
- Sync entre dispositivos
- Backup automático em nuvem
- Logo/cores customizadas
- Sem rate limit Groq (chave dedicada)
- Suporte prioritário

**Team (R$ 99/mês)**:
- Tudo do Pro
- Multi-usuário com permissões
- Audit log
- Integração ERP
- Webhook personalizado
- Dashboard executivo

**Enterprise (custom)**:
- White label completo
- On-premises ou nuvem dedicada
- Compliance LGPD/GDPR avançado
- Treinamento e SLA

> **Mas o core open source continua grátis pra sempre.** ✊

---

## 🎬 Marketing / Crescimento

### ⭐ Demo no LinkedIn
Vídeo de 30s mostrando OCR + IA em ação. Repost mensal.

### ⭐ Casos de uso
3 artigos no blog/Medium:
1. "Como uma instituição pública inventariou 500 equipamentos em 3 dias"
2. "Substituindo R$ 40 mil/ano em SaaS por software open source"
3. "Construindo um PWA com IA gratuita em vanilla JS"

### ⭐ Hackathon interno na Far
Convida times pra contribuir com features. Top 3 ganham reconhecimento + R$.

### 🤔 Podcast convidando outros devs
Conversar sobre os desafios técnicos. Bom pra carreira.

---

## ❌ Anti-features (NÃO fazer)

Lista do que **decidi NÃO implementar**, mesmo se solicitarem:

- ❌ **Login obrigatório** — mata a privacidade e o uso casual
- ❌ **Anúncios** — destrói a experiência
- ❌ **Tracking de uso individual** — quebra a confiança
- ❌ **Sincronização automática sem permissão explícita** — viola privacidade
- ❌ **Modal "Avalie esse app!"** invasivo — irritante
- ❌ **Notificações push de marketing** — banimento certo
- ❌ **Dependência de cloud proprietária paga** — perde o "open source na essência"
- ❌ **Funcionalidades que SÓ funcionam online** — quebra promessa offline

---

## 📅 Triagem mensal

Toda primeira segunda do mês, revisar este backlog:
1. Quais ideias amadureceram? → promover pra ROADMAP
2. Quais perderam relevância? → arquivar
3. Quais surgiram? → adicionar aqui
4. Quais foram solicitadas por usuários? → priorizar

---

**Mantido por Jean Sanabia. Atualizado em junho/2026.**
**Contribuições via Issues no GitHub: https://github.com/jeansanabia-ai/OpenInvTI/issues**
