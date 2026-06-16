# 🚀 Publicar OpenInvTI no GitHub — Passo a Passo (Zero conhecimento Git)

Tutorial pra quem **nunca usou Git** publicar o app em ~30 minutos. Vai sair com:
- ✅ Código-fonte hospedado no GitHub (público, open source)
- ✅ Demo ao vivo no GitHub Pages (URL gratuita)
- ✅ APK novo apontando pro GitHub Pages (opcional)
- ✅ Post no LinkedIn pronto pra divulgar

---

## 📋 PARTE 1 — Preparação (5 minutos)

### Passo 1.1 — Criar conta no GitHub

1. Abre `https://github.com/signup`
2. Email: o seu (sugiro o pessoal, não o corporativo do trabalho)
3. Senha forte
4. Username: escolhe um curto, profissional, ex: `jeansanabia`, `jsanabia`, `jean-sanabia`
   - **Esse nome vai aparecer na URL pública** → `github.com/SEU-USER/openinvti`
5. Confirma email
6. Pula a "preferência" (pode marcar "free")

✅ **Pronto.** Anota seu **username** num lugar.

### Passo 1.2 — Instalar Git no Windows

1. Baixa: `https://git-scm.com/download/win`
2. Roda o `.exe` baixado
3. **Avança em tudo** clicando "Next" (configuração padrão tá ótima)
4. Na hora "Choosing the default editor" pode deixar Notepad++ ou Vim (não vai usar)
5. Termina a instalação

**Confirmar que instalou:**
- Abre o menu Iniciar → digita **"Git Bash"** → abre o terminal preto
- Digita: `git --version`
- Tem que aparecer: `git version 2.xx.x`

✅ **Pronto.**

### Passo 1.3 — Configurar Git (uma vez na vida)

No mesmo **Git Bash** que abriu, cola estes comandos (um por vez, Enter depois de cada):

```bash
git config --global user.name "Jean Sanabia"
git config --global user.email "seu-email@exemplo.com"
git config --global init.defaultBranch main
```

Substitua o email pelo mesmo que você usou na conta GitHub.

✅ **Pronto.**

---

## 📦 PARTE 2 — Criar o repositório no GitHub (3 minutos)

### Passo 2.1 — Criar repo vazio

1. Logado no GitHub, clica no **"+"** (canto superior direito) → **"New repository"**
2. Preenche assim:

| Campo | Valor |
|---|---|
| **Repository name** | `openinvti` |
| **Description** | `📦 Inventário de TI corporativo open-source — PWA com OCR, câmera customizada e configuração por empresa` |
| **Public** | ✅ MARCADO (open source) |
| **Add README** | ❌ DESMARCADO (já temos) |
| **Add .gitignore** | ❌ DESMARCADO (já temos) |
| **License** | None (já temos) |

3. Clica em **"Create repository"**

✅ Vai aparecer uma tela com comandos Git. **Não fecha essa aba**, vamos usar.

---

## 💻 PARTE 3 — Subir o código (10 minutos)

### Passo 3.1 — Abrir Git Bash na pasta do projeto

1. Abre o **Explorador de Arquivos** do Windows
2. Navega até a pasta `openinvti` (a que eu te entreguei descompactada)
3. **Clica com botão direito DENTRO da pasta** (espaço vazio)
4. Escolhe **"Open Git Bash here"** (ou "Git Bash Here")

Vai abrir o terminal já no caminho certo. Pra confirmar:
```bash
ls
```
Tem que listar: `app.js`, `index.html`, `style.css`, `README.md`, etc.

### Passo 3.2 — Inicializar o repositório local

Cola um por vez:

```bash
# Cria o repositório Git local
git init

# Adiciona TODOS os arquivos ao "stage" (preparado pra commitar)
git add .

# Faz o primeiro commit
git commit -m "🎉 Initial release v1.0.6 - OpenInvTI"

# Renomeia branch pra "main" (padrão moderno)
git branch -M main
```

Depois do último comando, deve aparecer algo parecido com:
```
[main (root-commit) a1b2c3d] 🎉 Initial release v1.0.6 - OpenInvTI
 17 files changed, 3000 insertions(+)
```

### Passo 3.3 — Conectar repo local ao GitHub

Volta na aba do GitHub que ficou aberta. Copia a URL que tá em "…or push an existing repository", algo assim:
```
https://github.com/SEU-USER/openinvti.git
```

Cola no Git Bash (trocando SEU-USER pelo seu usuário):

```bash
git remote add origin https://github.com/SEU-USER/openinvti.git
```

### Passo 3.4 — Subir o código (push)

```bash
git push -u origin main
```

**Vai pedir login:**
- Username: seu user do GitHub
- Senha: **NÃO é a senha da conta!** É um **Personal Access Token**

#### Como gerar o token (uma vez):

1. GitHub → clica na foto (canto superior direito) → **Settings**
2. Rola até o final → **Developer settings** (último item da esquerda)
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token** → **Generate new token (classic)**
5. Note: `openinvti push`
6. Expiration: `90 days`
7. Marca a caixinha **`repo`** (única necessária)
8. Lá embaixo: **Generate token**
9. **COPIA O TOKEN** (vai aparecer uma vez só, tipo `ghp_xxxxxxxxxxxxxxxxxxxx`)
10. Cola no Git Bash quando pedir "Password"

✅ Depois do push aparecer "done", **dá F5 na página do repo no GitHub** → todos os arquivos vão estar lá.

---

## 🌐 PARTE 4 — Ativar GitHub Pages (demo ao vivo grátis) (3 minutos)

### Passo 4.1

1. No repo no GitHub → **Settings** (aba no topo)
2. Menu esquerdo → **Pages**
3. Em "Build and deployment":
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)` → **Save**

### Passo 4.2 — Aguardar build

- Vai aparecer um aviso "Your site is live at..." em ~1-2 minutos
- A URL será: `https://SEU-USER.github.io/openinvti/`

✅ **Pronto, app no ar!** Abre essa URL no celular pra testar.

---

## 🎨 PARTE 5 — Polir o repo (5 minutos)

### Passo 5.1 — Adicionar tópicos (ajuda gente encontrar)

No repo → topo direito tem **⚙️ ao lado de "About"** → clica.

Em **Topics**, adiciona:
```
pwa  inventario  ocr  tesseract-js  ti  open-source  vanilla-javascript  excel  pdf  camera-api  portuguese
```

Em **Website**: cola a URL do GitHub Pages `https://SEU-USER.github.io/openinvti/`

Clica **Save changes**.

### Passo 5.2 — Adicionar descrição visual (banner social)

Settings → **Social preview** → Upload uma imagem 1280x640 com:
- Logo OpenInvTI
- Texto: "Inventário de TI Open Source"
- URL

(opcional, mas chama atenção quando alguém compartilha o link)

---

## 📱 PARTE 6 — Gerar APK novo (apontando pro GitHub Pages) (10 minutos)

### Passo 6.1 — PWABuilder

1. Abre `https://www.pwabuilder.com`
2. Cola a URL: `https://SEU-USER.github.io/openinvti/`
3. **Start**

### Passo 6.2 — Aguardar análise

Deve dar score alto (90+). Se aparecer algum aviso de manifest, **ignora** — o app funciona.

### Passo 6.3 — Gerar Android Package

1. Aba **Android**
2. **Generate Package**
3. **Other Android (recommended)**
4. Preenche:
   - **Package ID**: `app.openinvti.web` (não pode mudar depois!)
   - **App name**: `OpenInvTI`
   - **App version**: `1.0.6`
5. Em "Signing key": **Generate new** (ele cria uma keystore)
6. ⚠️ **Baixa o arquivo `.zip` E o `signing.keystore`** — guarda os dois!
7. Dentro do ZIP tem o `app-release-signed.apk`

### Passo 6.4 — Instalar no celular

1. Manda o `.apk` pro celular (Google Drive, WhatsApp Web pra você mesmo, etc)
2. No celular: clica no APK → "Instalar"
3. Se pedir "permitir fontes desconhecidas": Permite só essa vez
4. Abre o app → vai funcionar normal

✅ **Pronto.** Agora tem versão de código + demo ao vivo + APK assinado.

---

## 🔁 Como atualizar depois (versão futura)

Toda vez que você (ou eu) editar arquivos do app:

```bash
# Abre Git Bash dentro da pasta openinvti
git add .
git commit -m "✨ Descrição do que mudou"
git push
```

**Em 30 segundos** o GitHub Pages atualiza sozinho. Você não precisa fazer mais nada.

**APK só precisa ser regerado se mudar:** ícone, nome, package ID, URL do site, ou permissões.

---

## ❓ Problemas comuns

### "git: command not found"
→ Reinstala o Git e marca a opção "Use Git from the Windows Command Prompt"

### "Permission denied (publickey)" no push
→ Você usou senha em vez de Personal Access Token. Volta no Passo 3.4

### Demo aparece em branco em `seu-user.github.io/openinvti`
→ Espera 2-3 minutos. GitHub Pages demora um pouco no primeiro build.
→ Se persistir: limpa cache do navegador (Ctrl+Shift+R)

### Esqueci o Personal Access Token
→ Gera outro (Passo 3.4) — o antigo não é recuperável, mas você pode revogar

### "fatal: remote origin already exists"
→ Você já adicionou. Use: `git remote set-url origin https://github.com/SEU-USER/openinvti.git`

---

## 🎯 Resumo executivo

```
1. Conta GitHub        → 5 min
2. Instalar Git        → 5 min  
3. Criar repo          → 3 min
4. git init/add/push   → 10 min
5. Ativar Pages        → 3 min
6. Tópicos+sociais     → 5 min
7. APK PWABuilder      → 10 min
                        ─────
                        ~40 min total
```

Bora pra cima. 🚀
