<div align="center">

# 🔵 OpenInvTI

**Inventário de TI corporativo direto do celular — com OCR, offline e sem servidor.**

Leia etiquetas de patrimônio com a câmera, organize por usuário e gere a planilha Excel pronta no fim. Tudo no aparelho, sem backend, sem nuvem.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-yellow)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Stars](https://img.shields.io/github/stars/jeansanabia-ai/OpenInvTI?style=social)](https://github.com/jeansanabia-ai/OpenInvTI/stargazers)
[![Issues](https://img.shields.io/github/issues/jeansanabia-ai/OpenInvTI)](https://github.com/jeansanabia-ai/OpenInvTI/issues)
[![Last commit](https://img.shields.io/github/last-commit/jeansanabia-ai/OpenInvTI)](https://github.com/jeansanabia-ai/OpenInvTI/commits)

[**▶️ Testar agora**](#-demonstração) · [Funcionalidades](#-funcionalidades) · [Como rodar](#-como-rodar) · [Stack](#️-stack-técnica) · [Contribuir](#-contribuindo)

</div>

---

## 🎬 Demonstração

<!-- COLOQUE AQUI: um GIF curto (10–15s) mostrando o fluxo câmera → OCR → captura → planilha.
     Esse é o item de maior impacto do README. Grave a tela do celular e suba o .gif na pasta /docs.
     Ferramentas: ScreenToGif (Win) ou a própria gravação de tela do Android/iOS + conversão pra gif. -->

> ⚠️ _Adicionar GIF/print do fluxo aqui — é o que segura quem chega pelo LinkedIn._

<div align="center">

<!-- Substitua pelos seus prints reais -->
| Câmera + OCR | Wizard por usuário | Dashboard Excel |
|:---:|:---:|:---:|
| ![Câmera](docs/screenshot-camera.png) | ![Wizard](docs/screenshot-wizard.png) | ![Dashboard](docs/screenshot-dashboard.png) |

</div>

---

## 🤔 O problema

Inventário de TI corporativo ainda é feito no caneta-e-papel ou digitando patrimônio
à mão numa planilha — lento, sujeito a erro de digitação e refeito de forma corrida
no fim do prazo. O **OpenInvTI** troca isso por: apontar a câmera para a etiqueta,
deixar o OCR ler o número, agrupar os equipamentos por usuário e exportar a planilha
pronta. Sem instalar nada no servidor, sem expor dado nenhum para fora do aparelho.

---

## ✨ Funcionalidades

- 🤖 **OCR automático em tempo real** — detecta a etiqueta e captura sozinho, sem precisar tocar na tela
- 🧠 **Recorte inteligente** — isola a região da etiqueta antes de rodar o OCR (mais precisão)
- 📷 **Câmera customizada fullscreen** — zoom, flash/torch e foco contínuo
- 🪄 **Wizard guiado** — passos sequenciais: CPU → Monitor 1 → Monitor 2 → Telefone IP → Ramal → Usuário
- 👥 **Agrupamento por usuário** — uma sessão = um usuário e seus equipamentos
- 📊 **Planilha Excel** com 4 abas: Inventário, Resumo, Usuários e **Dashboard com gráficos**
- 📄 **Exportação PDF** profissional em paisagem
- 📤 **Compartilhamento direto** — WhatsApp · Outlook · Teams · Gmail
- 🌗 **Tema claro/escuro** com toggle
- 📵 **100% offline** após a primeira carga (PWA + Service Worker + IndexedDB)
- 🚫 **Sem servidor, sem backend** — os dados ficam no celular do usuário
- 🏢 **Configurável por empresa** — nome, padrão de patrimônio (regex) e lista de marcas

---

## 🔒 Privacidade por design

Nada sai do aparelho. Não há servidor, banco em nuvem nem telemetria: a captura, o OCR
e o armazenamento (IndexedDB) acontecem **localmente no navegador**. O usuário só
compartilha o resultado quando quiser, pelo canal que escolher (WhatsApp, Teams, e-mail).

Para ambientes corporativos brasileiros, isso simplifica a conformidade com a **LGPD** —
não há tratamento de dados por terceiros nem transferência para fora da organização.

---

## ▶️ Demonstração ao vivo

<!-- DEPLOY recomendado: GitHub Pages é grátis e em 2 cliques.
     Settings → Pages → Source: branch main → /root. A URL fica https://jeansanabia-ai.github.io/OpenInvTI -->

🔗 **[Acessar a demo](https://jeansanabia-ai.github.io/OpenInvTI)** _(publicar via GitHub Pages e atualizar este link)_

> Abra pelo **Chrome (Android)** ou **Safari (iOS)** e instale como app pela tela inicial.
> A câmera exige **HTTPS** — por isso o app precisa estar hospedado, não rodando como arquivo local.

---

## 🚀 Como rodar

O OpenInvTI é 100% estático: basta servir os arquivos por **HTTPS**.

### Opção 1 — GitHub Pages (mais rápido)
1. **Settings → Pages → Source:** branch `main`, pasta `/root`
2. Acesse a URL gerada pelo celular e instale como app

### Opção 2 — Netlify / Vercel / Cloudflare Pages
- **Netlify:** arraste a pasta do projeto em [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel / Cloudflare Pages:** conecte o repositório e faça deploy

### Opção 3 — Rodar localmente (dev)
```bash
git clone https://github.com/jeansanabia-ai/OpenInvTI.git
cd OpenInvTI
npx serve .          # ou: python -m http.server 8080
```
> ℹ️ Em `localhost` a câmera funciona; em rede/IP fixo é preciso HTTPS.

### Primeira configuração
Na tela de setup, informe:
- Nome da empresa
- Padrão do nº de patrimônio (regex)
- Lista de marcas comuns

Tudo fica salvo no aparelho.

---

## 🛠️ Stack técnica

| Camada | Tecnologia |
|---|---|
| Base | HTML5 + CSS3 + **Vanilla JavaScript** (zero framework) |
| OCR | **Tesseract.js v5** (pt-BR + en, local) |
| Planilha | **ExcelJS v4** (.xlsx) |
| Gráficos | **Chart.js v4** |
| PDF | **jsPDF + autoTable** |
| Câmera | **MediaDevices API** (`getUserMedia`) |
| Offline | **Service Worker** |
| Persistência | **IndexedDB** |
| Instalação | **PWA Manifest** (Android + iOS) |

---

## 📱 Compatibilidade

| Plataforma | Câmera + OCR | Instalável (PWA) | Observação |
|---|:---:|:---:|---|
| Chrome (Android) | ✅ | ✅ | Experiência completa |
| Safari (iOS 16.4+) | ✅ | ✅ | Instalar via "Adicionar à Tela de Início" |
| Edge / Chrome (Desktop) | ✅ | ✅ | Útil para webcam e testes |
| Firefox | ⚠️ | ⚠️ | Câmera ok; suporte a PWA limitado |

> Requer **HTTPS** (ou `localhost`) para acesso à câmera.

---

## 📁 Estrutura

```
openinvti/
├── index.html          # Estrutura visual + telas
├── app.js              # Lógica do app + OCR + câmera + exportação
├── style.css           # Visual + dark/light modes
├── manifest.json       # Manifest PWA
├── sw.js               # Service worker (offline)
├── config.json         # Configuração padrão (customizável)
├── icons/              # Ícones do app (192x192 e 512x512)
├── docs/               # Screenshots / GIF do README
├── _headers            # Headers HTTP (Netlify)
├── netlify.toml        # Config do Netlify
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## 🗺️ Roadmap

- [ ] Publicar demo ao vivo (GitHub Pages)
- [ ] Adicionar GIF de demonstração no README
- [ ] Importar/exportar configuração da empresa (JSON)
- [ ] Leitura de QR Code / código de barras como alternativa ao OCR
- [ ] Edição de itens já capturados antes de exportar
- [ ] Internacionalização (EN) da interface

_Sugestões são bem-vindas — abra uma [issue](https://github.com/jeansanabia-ai/OpenInvTI/issues)._

---

## 🤝 Contribuindo

Pull requests são bem-vindos. Para mudanças grandes, abra primeiro uma issue
descrevendo o que pretende fazer.

Procurando por onde começar? Veja as issues marcadas como
[`good first issue`](https://github.com/jeansanabia-ai/OpenInvTI/issues?q=label%3A%22good+first+issue%22).

1. Faça um fork
2. Crie sua branch: `git checkout -b minha-feature`
3. Commit: `git commit -m 'feat: minha feature'`
4. Push e abra o PR

---

## 📜 Licença

[MIT](LICENSE) — use, modifique e distribua livremente.

---

## 🙋‍♂️ Autor

**Jean Sanabia** — [GitHub](https://github.com/jeansanabia-ai) · [LinkedIn](https://www.linkedin.com/in/jean-sanabia-213a1b355/)

Idealizado e mantido para reduzir o tempo gasto em inventários corporativos de TI.

---

<div align="center">

### 🌟 Curtiu o projeto?

Dê uma **⭐ no repositório**, reporte bugs nas **Issues** e compartilhe com seu time de TI.

</div>
