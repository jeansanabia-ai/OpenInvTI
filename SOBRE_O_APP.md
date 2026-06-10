# 📦 OpenInvTI — Sobre o aplicativo

**Inventário de TI corporativo** — open source, offline, com OCR e câmera customizada.

---

## 🎯 O problema que resolve

Equipes de TI em empresas, hospitais, prefeituras e universidades **precisam fazer inventário físico** de:
- Computadores e notebooks
- Impressoras
- Monitores
- Equipamentos de rede

E hoje fazem isso com:
- 📋 Planilha Excel anotada à mão → erros, retrabalho
- 📸 Foto da etiqueta + transcrição depois → lento, propenso a erro de digitação
- 💼 Software proprietário caro → US$ 30-100/mês por usuário
- 🏢 ERP/CMDB monstruoso → meses pra implantar

**O OpenInvTI elimina tudo isso.**

---

## ⚡ Como funciona

1. **Abre o app no celular** (PWA instalável)
2. **Tira foto da etiqueta** do equipamento (câmera custom dentro do app)
3. **OCR automático** lê o número de patrimônio, marca e modelo
4. **Preenche o formulário** com 1 toque (já vem auto-preenchido)
5. **Salva** → próximo equipamento

No fim do dia: **planilha .xlsx** completa + **PDF** + **dashboard** com gráficos.

---

## 🚀 Funcionalidades

### Captura inteligente
- **Câmera customizada** com zoom digital, flash, foco automático
- **Auto-captura** quando o OCR detecta o padrão de patrimônio em tempo real
- **Recorte inteligente** da etiqueta antes do OCR (mais precisão)
- **Detecção de foto borrada** (Laplaciano) — avisa antes de salvar

### OCR em Português
- **Tesseract.js v5** rodando no navegador (zero servidor)
- **Pré-processamento** (contraste + grayscale + auto-crop)
- Detecta automaticamente: nº de patrimônio, marca, modelo, nº de série, ramal

### Configurável por empresa
- **Tela de setup inicial** (rodada uma única vez)
- Define **regex do padrão de patrimônio** (ou aprende lendo uma foto)
- Marcas, modelos, prefixos, ramais — tudo configurável
- Funciona pra **qualquer empresa**, não tem hardcode

### Output profissional
- **Planilha Excel** com 4 abas: Inventário, Resumo, Usuários, Dashboard
- **PDF** com tabela formatada
- **Web Share API** pra mandar por WhatsApp/Email/Drive direto do celular
- **Dashboard com gráficos** (Chart.js): equipamentos por marca, por usuário, por sala

### Tecnologia
- **PWA instalável** (vira app no Android com ícone na home)
- **100% offline** após primeira carga
- **IndexedDB** local — dados não saem do dispositivo do usuário
- **Service Worker** com cache network-first (sempre atualiza)
- **Dark/Light mode** persistente
- **Sem login, sem servidor, sem custo**

---

## 🛠️ Stack técnica

| Camada | Tech |
|---|---|
| **Frontend** | Vanilla JavaScript (ES6+) — zero framework |
| **OCR** | Tesseract.js v5 (português + inglês) |
| **Câmera** | getUserMedia API + Canvas processing |
| **Excel** | ExcelJS (4 abas, formatação, formulas) |
| **PDF** | jsPDF + jsPDF-autoTable |
| **Charts** | Chart.js v4 |
| **Storage** | IndexedDB + localStorage |
| **PWA** | Service Worker + Web App Manifest |
| **Hosting** | GitHub Pages (grátis) |

**Linhas de código:** ~2.200 (app.js) + ~700 (CSS) + ~500 (HTML)
**Bundle inicial:** ~120 KB sem CDNs
**Tempo de carga:** <2s em 4G

---

## 📊 Origem do projeto

Criado por **Jean Sanabia** em junho de 2026, como solução interna para acelerar o trabalho de inventário de TI em uma instituição pública brasileira.

Em 2 meses, evoluiu de uma planilha bagunçada de inventário pra um app PWA full-featured em produção. Depois, foi refatorado pra ser **genérico**: zero hardcode, configurável por qualquer empresa via tela de setup.

Decidi **abrir o código** porque:
- 🏛️ Outras organizações enfrentam exatamente o mesmo problema
- 💸 Soluções comerciais são caras demais pra equipes pequenas
- 🤝 Open source é o jeito certo de retribuir o que a comunidade de TI livre me ensinou
- 🎓 Pode ajudar devs (juniores ou seniores) a aprender PWA, OCR e técnicas de processamento de imagem no browser

---

## 🌍 Quem pode usar

- 🏥 Hospitais públicos e privados
- 🏛️ Prefeituras, secretarias, autarquias
- 🎓 Universidades e escolas
- 🏢 Pequenas empresas que não justificam pagar SaaS
- 🔧 Equipes de TI internas de qualquer tamanho
- 👨‍💻 Devs que querem aprender PWA, OCR ou base pra fork comercial

**Não exige:** servidor, banco de dados, conhecimento técnico do usuário final.

---

## 🆓 Licença

**MIT** — pode usar, modificar, redistribuir, vender. Só não tira meu nome do crédito.

---

## 🤝 Como contribuir

- ⭐ **Star no repo** ajuda muito a visibilidade
- 🐛 **Issues** — reporta bugs ou 