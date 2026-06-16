# 🔵 OpenInvTI

> **Inventário de TI Corporativo · Open Source · Sem servidor · PWA instalável**

Solução leve e offline-first para fazer inventário de equipamentos de TI usando
apenas o smartphone. OCR automático para ler etiquetas de patrimônio, câmera
inteligente com zoom/flash, planilha Excel pronta no final.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![Made with](https://img.shields.io/badge/Made%20with-Vanilla%20JS-yellow)](https://developer.mozilla.org/docs/Web/JavaScript)

---

## ✨ Funcionalidades

- 📷 **Câmera customizada fullscreen** com zoom, flash/torch e foco contínuo
- 🤖 **OCR automático em tempo real** — detecta etiquetas e auto-captura
- 🧠 **Recorte inteligente** — isola a região da etiqueta antes do OCR
- 🪄 **Wizard guiado** — passos sequenciais: CPU → Monitor 1 → Monitor 2 → Telefone IP → Ramal → Usuário
- 👥 **Agrupamento por usuário** — uma sessão = um usuário e seus equipamentos
- 📊 **Planilha Excel** pronta com 4 abas: Inventário, Resumo, Usuários e **Dashboard com gráficos**
- 📄 **Exportação PDF** profissional em paisagem
- 📤 **Compartilhamento direto** via WhatsApp / Outlook / Teams / Gmail
- 🌗 **Tema claro/escuro** com toggle
- 📵 **100% offline** após primeira carga (PWA + Service Worker + IndexedDB)
- 🚫 **Sem servidor / sem backend** — dados ficam no celular do usuário
- 🛡️ **Sem dependência de nuvem** — privacidade total

## 🏢 Para qualquer empresa

Diferente de outras soluções de inventário, o **OpenInvTI** é **configurável**:
no primeiro acesso a empresa preenche seu nome, padrão de patrimônio (regex)
e lista de marcas. Tudo fica salvo no aparelho.

## 🚀 Início rápido

### 1. Hospede em qualquer servidor estático

Faça upload da pasta do projeto em:

- [Netlify](https://app.netlify.com) (drag-and-drop)
- [Vercel](https://vercel.com)
- [GitHub Pages](https://pages.github.com)
- Cloudflare Pages
- ou qualquer servidor HTTPS

### 2. Acesse pelo celular

Abra a URL no Chrome (Android) ou Safari (iOS) e instale como app pela tela inicial.

### 3. Configure pela primeira vez

Tela de setup pede:
- Nome da empresa
- Padrão do nº de patrimônio (regex)
- Lista de marcas comuns

## 🛠️ Stack técnica

- **HTML5 + CSS3 + Vanilla JavaScript** — zero framework, ultra-leve
- **Tesseract.js v5** — OCR local (pt-BR + en)
- **ExcelJS v4** — geração da planilha .xlsx
- **Chart.js v4** — gráficos do dashboard
- **jsPDF + autoTable** — geração de PDF
- **MediaDevices API** (getUserMedia) — câmera customizada
- **Service Worker** — modo offline
- **IndexedDB** — persistência local
- **PWA Manifest** — instalável Android + iOS

## 📁 Estrutura

```
openinvti/
├── index.html          # Estrutura visual + telas
├── app.js              # Lógica do app + OCR + câmera + exportação
├── style.css           # Visual + dark/light modes
├── manifest.json       # Manifest PWA
├── sw.js               # Service worker para offline
├── config.json         # Configuração padrão (cliente pode customizar)
├── icons/              # Ícones do app (192x192 e 512x512)
├── _headers            # Headers HTTP (Netlify)
├── netlify.toml        # Config do Netlify
├── README.md           # Este arquivo
├── LICENSE             # Licença MIT
└── CHANGELOG.md        # Histórico de versões
```

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças grandes, abra primeiro uma issue
descrevendo o que pretende mudar.

## 📜 Licença

[MIT](LICENSE) — Use, modifique e distribua livremente.

## 🙋‍♂️ Autor

**Jean Sanabia** — [GitHub](https://github.com/) · Idealizado e mantido como solução
para reduzir o tempo gasto em inventários corporativos de TI.

---

### 🌟 Curtiu o projeto?

- Dê uma ⭐ no repositório
- Reporte bugs via Issues
- Compartilhe com seu time de TI

