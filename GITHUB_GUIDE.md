# 🐙 Guia de Publicação no GitHub — OpenInvTI

> Passo a passo completo para publicar o projeto no GitHub e disponibilizar uma demo pública gratuita.

---

## 🎯 O que você vai fazer

1. ✅ Criar conta no GitHub (se não tiver)
2. ✅ Criar repositório do OpenInvTI
3. ✅ Instalar Git no seu PC
4. ✅ Fazer o primeiro commit + push
5. ✅ Configurar GitHub Pages (demo gratuita ao vivo)
6. ✅ Adicionar badges + topics pra atrair contribuidores

Tempo estimado: **30-45 minutos** na primeira vez.

---

## 📦 Pré-requisitos

- **PC com internet**
- **Conta no GitHub** ([criar aqui](https://github.com/signup))
- **Pasta `openinvti` extraída** no seu computador (do ZIP que você baixou)

---

## 🛠️ Passo 1 — Instalar Git no seu computador

### Windows

1. Baixe o instalador: <https://git-scm.com/download/win>
2. Execute o instalador
3. Aceite as opções padrão
4. Abra o **Git Bash** (vem junto com a instalação)

### Verificação

No Git Bash, digite:

```bash
git --version
```

Deve aparecer algo como `git version 2.45.x`. Se aparecer, está pronto.

---

## 🔑 Passo 2 — Configurar Git com seu nome e email

No Git Bash, rode (substituindo pelo seu nome/email do GitHub):

```bash
git config --global user.name "Jean Sanabia"
git config --global user.email "jean.sanabia@gmail.com"
```

---

## 🏗️ Passo 3 — Criar o repositório no GitHub

1. Acesse <https://github.com/new>
2. Preencha:
   - **Repository name:** `openinvti`
   - **Description:** "Inventário de TI corporativo · OCR · PWA · Open Source"
   - **Public** (selecionado)
   - ❌ **NÃO** marque "Add README" (já temos um)
   - ❌ **NÃO** marque "Add .gitignore" (já temos)
   - ❌ **NÃO** marque "Choose a license" (já temos MIT)
3. Clique em **Create repository**
4. Anote a URL do repositório, será algo como:
   ```
   https://github.com/SEU-USUARIO/openinvti.git
   ```

---

## 📤 Passo 4 — Subir o projeto pro GitHub

### 4.1 — Abra o Git Bash NA PASTA do projeto

No Windows Explorer:
1. Vá até a pasta `openinvti` (descompactada)
2. **Clique com o botão direito dentro da pasta** (não em cima dela)
3. Escolha **Git Bash Here** (apareceu no menu após instalar o Git)

### 4.2 — Execute os comandos abaixo (um por vez)

```bash
# Inicializa o repositório local
git init

# Define o branch principal como "main"
git branch -M main

# Adiciona todos os arquivos ao "stage"
git add .

# Faz o primeiro commit com uma mensagem descritiva
git commit -m "feat: initial release v1.0.4 — OpenInvTI public"

# Conecta o repositório local ao GitHub (TROQUE pela URL do SEU repo)
git remote add origin https://github.com/SEU-USUARIO/openinvti.git

# Envia tudo pro GitHub
git push -u origin main
```

### 4.3 — Vai pedir autenticação

Na primeira vez que você der push, vai abrir uma janela do navegador pedindo pra autenticar com sua conta GitHub. Aceite e autorize.

**Pronto!** Recarregue a página do GitHub e os arquivos estarão lá.

---

## 🌐 Passo 5 — Ativar GitHub Pages (demo grátis)

Com o projeto no GitHub, ative o **GitHub Pages** pra ter uma URL pública grátis tipo `seu-usuario.github.io/openinvti`.

1. No repositório, vá em **Settings** (engrenagem no topo)
2. Menu lateral esquerdo: **Pages**
3. Em **Branch**, escolha:
   - Branch: **main**
   - Folder: **/ (root)**
4. Clique em **Save**
5. Aguarde 1-2 minutos
6. A URL aparece no topo da página (algo como `https://seu-usuario.github.io/openinvti/`)

Pronto, você tem uma **demo pública** que qualquer pessoa pode acessar.

---

## 🏷️ Passo 6 — Adicionar Topics (palavras-chave)

Topics ajudam pessoas a descobrirem seu projeto. No repositório:

1. Clique no ícone de engrenagem ⚙️ ao lado de "About" (lateral direita)
2. Adicione os topics:
   ```
   pwa
   inventory-management
   inventory
   ocr
   tesseract
   javascript
   open-source
   it-management
   ```
3. Salve

---

## 🎖️ Passo 7 — Adicionar badges no README (opcional, mas profissional)

Edite o `README.md` pra incluir badges no topo (já têm alguns que adicionei):

- License MIT ✓
- PWA Ready ✓
- Made with Vanilla JS ✓

Outros badges úteis pra adicionar:

```markdown
![GitHub stars](https://img.shields.io/github/stars/SEU-USUARIO/openinvti?style=social)
![GitHub forks](https://img.shields.io/github/forks/SEU-USUARIO/openinvti?style=social)
![GitHub issues](https://img.shields.io/github/issues/SEU-USUARIO/openinvti)
```

---

## 🔄 Passo 8 — Atualizar o projeto no futuro

Quando você fizer alterações no código, pra subir as mudanças:

```bash
# Vê o que mudou
git status

# Adiciona as mudanças
git add .

# Faz commit com mensagem descritiva
git commit -m "fix: corrigi bug no OCR de telefones IP"

# Sobe pro GitHub
git push
```

### 📝 Convenção de commits (recomendada)

Use prefixos no commit pra manter histórico organizado:

| Prefixo | Quando usar |
|---|---|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Mudança só em documentação |
| `style:` | Mudança visual/CSS |
| `refactor:` | Refatoração sem mudança de comportamento |
| `chore:` | Tarefas administrativas (deps, build, etc) |

Exemplos:
```
feat: adicionar exportação em CSV
fix: corrigir auto-detect em fotos escuras
docs: atualizar guia de configuração
```

---

## 🎨 Bônus — Personalizar a página do repositório

### Logo/banner

Crie uma imagem `banner.png` na pasta `.github/` e adicione no topo do README:

```markdown
<p align="center">
  <img src="./.github/banner.png" alt="OpenInvTI" width="600" />
</p>
```

### Screenshots

Tire prints do app rodando e crie uma pasta `docs/screenshots/`:

```
docs/
└── screenshots/
    ├── 01-setup.png
    ├── 02-wizard.png
    ├── 03-camera.png
    └── 04-dashboard.png
```

Linka no README.

---

## ⭐ Passo 9 — Divulgar (depois que tudo estiver no ar)

Lugares pra divulgar o projeto e atrair contribuidores:

1. **LinkedIn** — Post mostrando o app + link do repo + link da demo
2. **Reddit** — r/sysadmin, r/ITManagers, r/programming
3. **Hacker News** — `https://news.ycombinator.com/submit` (categoria "Show HN")
4. **dev.to** — Escreva um artigo "Como criei um inventário de TI Open Source com PWA"
5. **Indie Hackers** — Comunidade de devs solo
6. **Awesome lists do GitHub** — Adicionar em `awesome-pwa`, `awesome-selfhosted`

---

## 🚨 Problemas comuns

### "fatal: not a git repository"

Você não rodou `git init` ou está fora da pasta certa. `cd` pra dentro da pasta `openinvti`.

### "Permission denied (publickey)"

Use HTTPS em vez de SSH no `git remote add origin`. A URL do repo deve começar com `https://`.

### "Updates were rejected"

Aconteceu quando alguém (ou você mesmo no GitHub via web) editou algo que conflita com sua versão local. Resolva com:

```bash
git pull --rebase
git push
```

### "Push pede senha repetidamente"

Configure um Personal Access Token: <https://github.com/settings/tokens> → Generate new token → marque `repo` → Generate. Cole esse token quando o Git pedir senha.

---

## ✅ Checklist final

Marque conforme for completando:

- [ ] Git instalado e configurado com seu nome/email
- [ ] Repositório `openinvti` criado no GitHub
- [ ] Primeiro `git push` feito com sucesso
- [ ] README aparecendo corretamente na página do repo
- [ ] LICENSE MIT visível
- [ ] GitHub Pages ativo com URL pública funcionando
- [ ] Topics adicionados
- [ ] Botão "📸 Detectar padrão por foto" testado pelo menos 1 vez
- [ ] App rodando como PWA instalável no seu celular pela URL do GitHub Pages
- [ ] Post no LinkedIn divulgando o projeto

Pronto, **OpenInvTI está oficialmente publicado** e disponível pra qualquer pessoa do mundo testar, contribuir, ou usar na sua empresa. 🚀
