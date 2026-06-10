# Changelog OpenInvTI

Todas as mudanças notáveis serão documentadas neste arquivo.

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
