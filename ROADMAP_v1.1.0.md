# 🚀 OpenInvTI v1.1.0 — ROADMAP

> Versão de **maturidade**. Foco em experiência, robustez e integrações.
> Plano construído em junho/2026, lançamento estimado: agosto/2026.

---

## 🎯 Princípios da v1.1.0

1. **Fluidez acima de tudo** — cada toque deve ter resposta visual imediata
2. **Resiliência invisível** — usuário nunca perde dados, mesmo em crash
3. **Visual de produto pago** — design moderno, profissional, agradável
4. **IA como copiloto** — sugere, não atrapalha
5. **Comunicação nativa** — WhatsApp integrado sem fricção
6. **Onboarding zero atrito** — primeira experiência deve encantar

---

## 🏛️ Os 6 Pilares

### 1. 🌊 UX & Navegação Fluida
### 2. 🎨 Visual Moderno
### 3. 🛡️ Resiliência de Dados
### 4. 💬 Integração WhatsApp
### 5. 🤖 IA Avançada
### 6. 🎁 Onboarding Encantador

---

## 1. 🌊 UX & Navegação Fluida

### 1.1 View Transitions API
Transições suaves entre telas usando a nova `view-transition` do Chrome.
Tela atual desliza pra esquerda, próxima entra pela direita. Fade contextual.

**Antes:**
```
[Tela A] → instantâneo, sem feedback → [Tela B]
```

**Depois:**
```
[Tela A] → desliza/fade 200ms → [Tela B]
```

### 1.2 Swipe Gestures
- **Deslizar pra direita** → voltar tela
- **Deslizar pra esquerda em item da lista** → menu de ações (Editar / Excluir / Duplicar)
- **Deslizar pra baixo no topo** → pull-to-refresh do dashboard

### 1.3 Breadcrumb sempre visível
No header, mostrar o caminho:
```
📋 Inventário > Sessão 3 > Equipamento atual
```
Toca em qualquer nível → volta direto pra lá.

### 1.4 "Voltar de onde parou"
- Botão **"↻ Continuar de onde parei"** sempre visível na tela inicial
- Detecta sessão em andamento e retoma o wizard exatamente no passo anterior
- Toast: "Você estava cadastrando o Monitor 2 na sessão do João. Continuar?"

### 1.5 Bottom Navigation
Barra fixa inferior com 4 ícones:
```
┌────────────────────────────────────────┐
│                                        │
│       (conteúdo da tela)               │
│                                        │
├────────────────────────────────────────┤
│  🏠     📋     ➕     📊       ⚙️       │
│ Home  Lista  Novo  Dashb.   Config    │
└────────────────────────────────────────┘
```
Botão central "➕" maior, destacado.

### 1.6 Haptic Feedback
- Toque em botão = vibração curta de 10ms
- Salvar = vibração média de 20ms
- Erro = padrão de 3 vibrações
- Usa `navigator.vibrate()` (suportado em Android Chrome)

### 1.7 Skeleton Loading
Enquanto carrega lista de itens, mostra "esqueleto" da tela:
```
┌─────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓ ▓▓▓▓        │
│ ▓▓▓▓▓▓ ▓▓▓▓▓▓▓▓        │
│ ▓▓▓▓▓▓▓▓▓▓             │
└─────────────────────────┘
```
Em vez de tela branca + spinner.

### 1.8 Pull-to-refresh
Puxar pra baixo no topo do dashboard → recarrega contadores, mostra animação de loading suave.

### 1.9 Animações de entrada
Cards e listas entram com **stagger** (cada item 50ms depois do anterior).
Hover lift sutil em cards. Botões com ripple effect ao toque.

---

## 2. 🎨 Visual Moderno

### 2.1 Design System próprio
Documentar tokens (cores, espaçamentos, tipografia, sombras, raios) em variáveis CSS.

```css
:root {
  --color-primary: #0EA5E9;
  --color-accent: #34D399;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --radius-card: 16px;
  --shadow-soft: 0 4px 24px rgba(6, 182, 212, 0.12);
  --font-display: 'Inter', sans-serif;
}
```

### 2.2 Glassmorphism sutil
Cards e modais com:
- `backdrop-filter: blur(20px)`
- Bordas com gradiente sutil
- Transparência calculada por tema (dark/light)

Efeito "vidro fosco" moderno, sem exagero.

### 2.3 Substituir emojis por ícones SVG profissionais
Onde emojis prejudicam consistência visual (variam entre Android/iOS):

| Emoji atual | Substituir por |
|---|---|
| 📋 prancheta no header | SVG custom logo OpenInvTI |
| 📦 sessões | Lucide `Box` icon |
| 💻 itens | Lucide `Monitor` icon |
| 👥 usuários | Lucide `Users` icon |
| ⚙️ configurações | Lucide `Settings` icon |
| 🌓 tema | Lucide `Sun/Moon` |
| 📷 câmera | Lucide `Camera` |
| 📊 planilha | Lucide `FileSpreadsheet` |

Emojis continuam em mensagens, status e contextos amigáveis (WhatsApp).

### 2.4 Tipografia variável
Adotar **Inter Variable** (open source, leve, ótima em mobile).
Hierarquia clara:
- Display 24px bold
- Headline 18px semibold
- Body 14px regular
- Caption 11px medium

### 2.5 Micro-animações Lottie
Em momentos chave:
- ✅ Sucesso após salvar = check animado verde
- ❌ Erro = X animado vermelho
- 🤖 IA processando = pulse animado
- 📤 Compartilhando = paper plane voando

Arquivos `.json` de Lottie (~5KB cada).

### 2.6 Paleta refinada
Manter cobalt/cyan/mint atual, mas adicionar:
- **Aurora gradients** sutis em backgrounds
- **Color tokens semânticos**: `--color-success`, `--color-warning`, `--color-danger`, `--color-info`
- **Modo automático** (segue sistema operacional)

### 2.7 Ilustrações vetoriais
Estados vazios ganham ilustrações suaves:
- "Nenhum inventário ainda" → desenho de prancheta amigável
- "Nenhum item registrado" → desenho de caixa vazia
- "Tudo concluído!" → desenho celebrativo

Pode usar **unDraw.co** (grátis, customizável).

### 2.8 Dark mode premium
Atual já é bom, mas:
- Bordas com gradient sutil (não só uma cor sólida)
- Sombras coloridas (cyan glow em vez de preto)
- Glassmorphism intensificado no dark

---

## 3. 🛡️ Resiliência de Dados

### 3.1 Auto-save por campo
Cada vez que o usuário digita ou tira foto, salva imediatamente no IndexedDB. Sem botão "Salvar" como dependência crítica.

```
Digitou marca "Dell" → salvou
Tirou foto → salvou (mesmo se sair antes do OCR)
Voltou tela → salvou estado da sessão
```

### 3.2 Snapshots automáticos (a cada 30s)
Background job que salva uma cópia do estado a cada 30 segundos. Mantém últimos 10 snapshots em rolagem (rotating).

Tela "Histórico de versões":
```
🕒 Há 30 segundos — 12 itens
🕒 Há 1 minuto — 11 itens  
🕒 Há 2 minutos — 10 itens
🕒 Há 5 minutos — 9 itens
[Restaurar este ponto]
```

### 3.3 Recovery automático pós-crash
Se o app crashou (Service Worker detecta `beforeunload` sem `unload`), na próxima abertura:
```
⚠️ O app fechou inesperadamente na última sessão.
Recuperamos seus dados automaticamente.
[Ver inventário recuperado] [OK]
```

### 3.4 Backup contínuo em background
Web Workers periodicamente comprimem o IndexedDB e oferecem download via `navigator.serviceWorker.postMessage`. Backup em `.openinvti-backup` (zip).

### 3.5 Alerta antes de fechar com pendências
Se tiver fotos não processadas OU itens não salvos:
```
⚠️ Você tem 2 itens não finalizados.
Sair sem salvar? 

[Salvar e sair] [Sair mesmo assim] [Cancelar]
```

### 3.6 Sync entre dispositivos (futuro)
Login opcional via Google → backup criptografado no Google Drive do próprio usuário (sem servidor próprio).
Permite continuar inventário no PC e finalizar no celular.

### 3.7 Histórico de alterações por item
Para cada equipamento, manter log:
```
Marca: criado "Dell" há 5 min
Patrimônio: criado "F-FAR-12345" há 3 min
Observação: editada "Sem etiqueta" há 1 min
[Desfazer última alteração]
```

### 3.8 Modo "offline-first" robusto
Cache de assets aumentado, IndexedDB criptografado opcionalmente, suporte completo a Background Sync API pra subir relatórios quando voltar online.

---

## 4. 💬 Integração WhatsApp

### 4.1 Envio direto para contato salvo
Ao final do inventário:
```
📤 Enviar relatório para:
┌──────────────────────────────┐
│ 👤 Gestor TI (cadastrado)   │
│ 👤 Almoxarifado             │
│ 👤 [+ Adicionar contato]    │
└──────────────────────────────┘
```
Salva números frequentes localmente.

### 4.2 Templates de mensagem
Em vez de só "Inventário - Setor - Data", oferece templates:

```
📝 Relatório Executivo (formal)
📝 Relatório Rápido (resumido)
📝 Apenas Estatísticas (números)
📝 Relatório + Anomalias (destaca diferenças do inventário anterior)
```

### 4.3 QR Code para adicionar gestor
Configurações → "Adicionar gestor":
- Gestor escaneia QR
- Recebe link único que cadastra o número dele
- Próximos relatórios incluem ele automaticamente

### 4.4 Recebimento via WhatsApp (futuro)
Worker Cloudflare integrado com WhatsApp Business API:
- Gestor manda "/status" pro número da empresa
- Worker responde com último relatório
- Gestor manda foto de etiqueta → IA cadastra automaticamente

### 4.5 Notificações de relatório agendadas
"Toda sexta-feira 17h, enviar resumo da semana pro grupo do TI".
Usa Scheduled Tasks via Cloudflare Workers Cron.

### 4.6 Status do inventário no WhatsApp Business
Empresa cadastra perfil oficial. Catálogo mostra "Inventário disponível" como serviço. Toque no botão → abre o app.

### 4.7 Grupos pré-cadastrados
Configurações → "Grupos":
- "Diretoria"
- "TI Operacional"
- "Auditoria"

Cada inventário pode ser enviado pra múltiplos grupos com 1 toque.

---

## 5. 🤖 IA Avançada

### 5.1 Modo Express
Tira 5 fotos seguidas (sem confirmar entre cada):
```
1. Foto da etiqueta A
2. Foto da etiqueta B
3. Foto da etiqueta C
4. Foto da etiqueta D
5. Foto da etiqueta E

→ IA processa as 5 em paralelo
→ Mostra resumo: "5 equipamentos detectados, confira:"
→ Usuário valida em 1 tela
```
**Reduz tempo de cadastro em 70%.**

### 5.2 Detecção de duplicatas inteligente
IA compara cada foto com inventários anteriores. Se a mesma etiqueta foi cadastrada antes, avisa:
```
⚠️ Esta etiqueta (F-FAR-12345) já foi cadastrada em 03/04/2026
no setor Laboratório por Maria Silva.

[Atualizar registro] [Criar duplicata mesmo assim] [Cancelar]
```

### 5.3 Sugestão de localização baseada em padrão
Se a IA detectar que 5 últimas etiquetas começam com "F-FAR-2", sugere:
```
💡 Você está cadastrando equipamentos do bloco F-FAR-2xxxx?
Esses geralmente ficam no 2º andar. Confirma o setor "2º andar"?
```

### 5.4 Modo "guiado por IA"
Conversacional, IA pergunta o próximo passo:
```
🤖 Tudo certo! Cadastrei o monitor Dell.
   Próximo equipamento da mesa? (S/N)
   
   [Sim, próximo] [Trocar de usuário] [Finalizar sessão]
```

### 5.5 Sumarização inteligente
Ao gerar PDF/planilha, IA escreve um sumário:
```
Resumo: Inventário do setor Laboratório, 23 equipamentos.
22 estão padronizados, 1 monitor Samsung sem etiqueta (provavelmente
substituição recente). 5 CPUs vencidas (>5 anos). Recomenda-se
renovar.
```

### 5.6 OCR + Visão Computacional
Usa Llama 3.2 Vision (Groq) pra ANALISAR a foto, não só o texto OCR:
- Detecta tipo do equipamento pela imagem (mesmo sem etiqueta legível)
- Identifica marca pelo logo visível
- Estima condição do equipamento (aparência, desgaste)

### 5.7 Templates de inventário por setor
IA aprende perfis:
- **Almoxarifado**: muitos itens iguais, foco em quantidade
- **Datacenter**: poucos itens, alta criticidade
- **Escritório**: 1 CPU + 1-2 monitores + telefone IP por usuário

Adapta o fluxo do wizard automaticamente.

### 5.8 Validação cruzada
Após cadastrar, IA confere:
- Modelo Dell Optiplex existe? (sim/não)
- Patrimônio F-FAR-99999 está na faixa válida da empresa?
- Marca informada bate com a marca do modelo?

Avisa inconsistências sem bloquear.

---

## 6. 🎁 Onboarding Encantador

### 6.1 Tour interativo na primeira abertura
4 telas rápidas, swipe horizontal:
```
1. Bem-vindo! [imagem de pessoa fotografando etiqueta]
2. Tire foto e a IA preenche tudo
3. Gere planilha e envie por WhatsApp
4. Funciona offline, seus dados são seus
```

Cada tela tem 1 ilustração + 1 frase + indicador de progresso (••○○).

### 6.2 Setup conversacional (sem regex!)
Em vez de pedir regex direto:
```
🤖 Bora configurar seu OpenInvTI!

1. Qual o nome da sua empresa?
   [_____________]

2. Tem alguma etiqueta de equipamento por perto?
   [📷 Tirar foto] [Pular]
   
3. Eu detectei o padrão "F-FAR-XXXXX". Tá certo?
   [Sim, perfeito!] [Quase, deixa eu corrigir]
   
4. Pronto! Você está configurado. Bora começar?
```

### 6.3 Modo demonstração
Botão "▶ Ver demo" na tela inicial.
- Carrega dados fake (5 equipamentos, 3 usuários, 2 sessões)
- Usuário navega à vontade
- Botão "Limpar demo" deixa tudo pristine

### 6.4 Tooltips contextuais
Primeira vez que usuário entra numa tela nova, pequeno balão explica:
```
👋 Esta é a tela de wizard. 
Cada passo cadastra 1 equipamento.
[Entendi]
```

Aparece só 1 vez por tela. Pode ser reativado em Configurações.

### 6.5 Empty states acolhedores
Em vez de "Nenhum item":
```
   📦
   Nada por aqui ainda.
   Que tal cadastrar o primeiro equipamento?
   
   [+ Começar agora]
```

### 6.6 Achievements opcionais
Pequenos avisos motivadores (não invasivos):
```
🎉 10 equipamentos cadastrados!
🚀 Primeiro inventário concluído!
💪 5 sessões em um dia — produtividade!
```

Pode desligar em Configurações.

### 6.7 Help contextual
Ícone ❓ flutuante no canto inferior direito. Toca → abre chat com IA local que responde dúvidas usando o histórico de uso do próprio app.

---

## 📊 Priorização (MoSCoW)

### 🔴 MUST HAVE (sem isso, não lança)
- [ ] **3.1** Auto-save por campo
- [ ] **3.3** Recovery automático pós-crash
- [ ] **3.5** Alerta antes de fechar com pendências
- [ ] **1.4** Botão "Continuar de onde parei"
- [ ] **2.3** Substituir emojis-chave por SVGs
- [ ] **1.1** View Transitions API
- [ ] **6.1** Tour de onboarding
- [ ] **4.2** Templates WhatsApp

### 🟡 SHOULD HAVE (importante, vale a pena)
- [ ] **1.2** Swipe gestures
- [ ] **1.5** Bottom navigation
- [ ] **2.2** Glassmorphism
- [ ] **2.5** Micro-animações Lottie
- [ ] **3.2** Snapshots automáticos
- [ ] **5.1** Modo Express
- [ ] **5.2** Detecção de duplicatas
- [ ] **4.1** Envio direto WhatsApp
- [ ] **6.2** Setup conversacional

### 🟢 NICE TO HAVE (se sobrar tempo)
- [ ] **1.6** Haptic feedback
- [ ] **1.7** Skeleton loading
- [ ] **2.7** Ilustrações vetoriais
- [ ] **3.7** Histórico de alterações por item
- [ ] **5.3** Sugestão de localização
- [ ] **5.6** Visão Computacional (Llama Vision)
- [ ] **6.3** Modo demonstração
- [ ] **6.6** Achievements

### ⚪ FUTURO (v1.2+)
- [ ] **3.6** Sync entre dispositivos
- [ ] **4.4** Recebimento via WhatsApp
- [ ] **4.5** Notificações agendadas
- [ ] **5.7** Templates por setor

---

## 📅 Cronograma sugerido

```
🗓️ Junho/2026  →  v1.0.9 (atual) — proxy + presets
🗓️ Julho/2026  →  Pesquisa UX + protótipos visuais (Figma)
🗓️ Agosto/2026 →  Sprint Resiliência (auto-save, snapshots, recovery)
🗓️ Setembro    →  Sprint Visual (design system, glass, ícones SVG)
🗓️ Outubro     →  Sprint UX (transições, swipe, bottom nav)
🗓️ Novembro    →  Sprint IA Express + WhatsApp templates
🗓️ Dezembro    →  Sprint Onboarding + polish + beta interno
🗓️ Janeiro/2027 →  Beta público + ajustes
🗓️ Fevereiro   →  v1.1.0 lançada 🚀
```

8 sprints de ~1 mês. Cada sprint entrega features completas e testáveis.

---

## 🎯 Métricas de sucesso

| Métrica | v1.0.9 (hoje) | Meta v1.1.0 |
|---|---|---|
| Tempo médio pra cadastrar 1 equipamento | ~90 segundos | **<30 segundos** |
| Taxa de inventários completos (não abandonados) | ?? | **>95%** |
| Erro de cadastro (campos errados) | ?? | **<5%** |
| Taxa de uso da IA | ?? | **>80%** |
| Usuários ativos retidos (DAU/MAU) | ?? | **>40%** |
| Score Lighthouse | 95 | **>98** |
| Tamanho do bundle inicial | 120 KB | **<150 KB** |
| Tempo de carga em 4G | <2s | **<1s** |

---

## 🛠️ Stack adicional necessária

### Frontend
- **View Transitions API** (nativa Chrome, fallback CSS)
- **CSS @scroll-driven animations** (nova spec)
- **Lottie-web** (~10KB) — micro-animações
- **Web Vitals** lib pra métricas reais

### Backend / Proxy
- **Cloudflare Workers KV** — armazenar contatos compartilhados, presets dinâmicos
- **Cloudflare D1** (SQLite serverless) — opcional, para sync entre dispositivos
- **Cloudflare Pages Functions** — handlers webhook WhatsApp

### IA
- **Llama 3.2 Vision** via Groq (quando disponível) — análise de imagens
- **Múltiplos modelos** — usuário escolhe: rápido (8B) ou preciso (70B)

### Integrações
- **WhatsApp Business API** via Meta — envio direto, recebimento
- **Google Drive API** (opcional) — backup
- **OneSignal** (grátis até 10k) — notificações push

---

## 🎁 Bônus — Easter eggs

- 🎂 Aniversário do app: animação confete
- 🌃 Modo "modo madrugada" se usar app entre 0h-4h: paleta extra escura, fonte maior
- 🦸 100º equipamento cadastrado: badge especial
- 🎨 Sequência de toques especial nas Configurações: modo desenvolvedor com stats

---

## 📋 Próximos passos imediatos (próximas 2 semanas)

1. ✅ ROADMAP documentado (este arquivo)
2. 🔄 Pesquisa de referências visuais (apps que admiramos: Linear, Things, Notion, Reflect)
3. 🔄 Coleta de feedback dos colegas Far usando v1.0.9 atual
4. 🔄 Wireframes baixa fidelidade (papel/Figma)
5. 🔄 Prototipo da nova navegação (clickable mockup)
6. 🔄 Validação técnica das APIs novas (View Transitions tem cobertura suficiente?)

---

## 💡 Princípios para guiar decisões

> Quando estiver em dúvida sobre uma feature, pergunte:
> 1. **Isso reduz fricção?** (se não, descarta)
> 2. **Funciona offline?** (se não, repensa)
> 3. **É bonito sem comprometer performance?** (se não, simplifica)
> 4. **Um colega Far vai entender em 5 segundos?** (se não, refaz)
> 5. **Vale a pena cobrar por isso?** (mesmo sendo grátis, deve ter qualidade premium)

---

**Construído com ❤️ por Jean Sanabia em junho/2026**
**Para revisar e atualizar conforme avançamos.**
