# 📖 Guia do Usuário — OpenInvTI

> Manual completo de uso do **OpenInvTI** para fazer inventário de TI da sua empresa.

---

## 📑 Sumário

1. [Instalação](#-instalação)
2. [Configuração inicial](#%EF%B8%8F-configuração-inicial)
3. [Como fazer um inventário](#-como-fazer-um-inventário)
4. [O wizard de captura](#-o-wizard-de-captura-6-passos)
5. [A câmera customizada](#-a-câmera-customizada)
6. [Gerar planilha e PDF](#-gerar-planilha-e-pdf)
7. [Compartilhar resultados](#-compartilhar-resultados)
8. [Dicas e boas práticas](#-dicas-e-boas-práticas)
9. [Solução de problemas](#-solução-de-problemas)

---

## 📥 Instalação

### Android (recomendado)

**Opção A — Como app instalado (PWA):**

1. No celular, abra o **Chrome**
2. Acesse a URL da sua instância (ex.: `https://sua-empresa.netlify.app`)
3. No menu do Chrome (3 pontinhos), toque em **Instalar app**
4. O ícone do OpenInvTI aparece na sua tela inicial

**Opção B — APK direto (se sua empresa distribuiu):**

1. Baixe o `OpenInvTI.apk` enviado pelo administrador
2. Toque no arquivo no celular
3. Permita "Instalar fontes desconhecidas" se solicitado
4. Confirme a instalação

### iPhone

1. Abra o **Safari** (precisa ser Safari, não Chrome)
2. Acesse a URL da sua instância
3. Toque no botão de compartilhar (caixa com seta)
4. Toque em **Adicionar à Tela de Início**

### Desktop / Notebook

Funciona pelo Chrome ou Edge. Útil para testes e para gerar planilhas grandes.

---

## ⚙️ Configuração inicial

Ao abrir o app pela primeira vez, você verá a **tela de boas-vindas** pedindo:

| Campo | O que preencher |
|---|---|
| **Nome da empresa** | Ex.: "Acme Corporation" |
| **Título do inventário** | Texto que aparece no topo da planilha gerada |
| **Padrão do nº de patrimônio (regex)** | Regex que valida seu formato de patrimônio (opcional) |
| **Marcas usadas** | Lista de fornecedores separados por vírgula |

### 🪄 Detector automático de padrão

Se você não sabe escrever regex, use o botão **"📸 Detectar padrão por foto"**:

1. Toque no botão
2. Fotografe **uma etiqueta exemplo** da sua empresa
3. O OpenInvTI analisa a foto e mostra **até 5 padrões candidatos**
4. Toque no que corresponde ao seu patrimônio
5. O regex é gerado automaticamente

### 🔧 Mudar configuração depois

Use o ícone **⚙️** no canto superior direito do app a qualquer momento.

---

## 📋 Como fazer um inventário

1. Na tela inicial, confira a **data** (vem preenchida com hoje)
2. Digite o **setor** que vai inventariar (ex.: "Sala 305", "Almoxarifado", "Diretoria")
3. Toque em **▶ Iniciar inventário**
4. Toque em **+ Nova captura** para registrar uma estação de trabalho
5. Siga o wizard de 6 passos (descrito abaixo)
6. Repita para cada estação até terminar
7. Toque em **✓ Finalizar** e depois em **📊 Gerar planilha .xlsx**

---

## 🪄 O wizard de captura (6 passos)

Cada captura segue uma sequência guiada — você pode pular etapas que não se aplicam.

### Passo 1 — Equipamento principal

CPU, notebook ou desktop. Tire foto da etiqueta de patrimônio.

### Passo 2 — Monitor 1

Foto da etiqueta do monitor principal. Pule se a estação não tem monitor.

### Passo 3 — Monitor 2

Para estações com dois monitores. Pule se só tem um.

### Passo 4 — Telefone IP

Equipamento de telefonia. Pule se a estação não tem telefone IP. **Se pular, o passo 5 (Ramal) também é pulado automaticamente.**

### Passo 5 — Ramal

Número do ramal do telefone (texto curto).

### Passo 6 — Usuário

Identificação de quem usa a estação. Você pode:
- 📸 Fotografar a tela do PC mostrando o nome do usuário (OCR identifica)
- ⌨️ Digitar o nome manualmente

**Botões no rodapé do wizard:**
- **← Voltar** — passo anterior
- **Pular** (cinza) — pula passo opcional
- **+ outro** — salva sessão e abre captura nova (modo lote)
- **✓ Finalizar captura** — salva e volta pra lista

---

## 📷 A câmera customizada

Quando você toca em "Tirar foto", abre uma câmera customizada com recursos avançados:

| Controle | Função |
|---|---|
| **Quadro guia** | Linhas azuis no centro — alinhe a etiqueta dentro |
| **Auto-captura ⊠** | Quando ligado, OCR roda no background. Se detectar a etiqueta, captura sozinho em 600ms |
| **Botão de captura** | Círculo branco grande no centro — toque para foto manual |
| **Zoom (− 1.0x +)** | Aproxime para etiquetas pequenas |
| **Flash ⚡** | Liga/desliga lanterna do celular (não disponível em todos os modelos) |
| **× (fechar)** | Cancela a captura |

### 🧠 Recursos automáticos durante a captura

- **Recorte inteligente** — Isola a região da etiqueta (ignora fundo)
- **Pré-processamento** — Aumenta contraste e converte para escala de cinza
- **Detecção de borrado** — Avisa se a foto saiu fora de foco
- **Auto-fill** — Patrimônio, marca, modelo, tipo e série são preenchidos automaticamente
- **Você sempre pode editar** os campos após a captura

---

## 📊 Gerar planilha e PDF

Quando terminar o inventário:

1. Toque em **✓ Finalizar** (rodapé da lista)
2. Veja o resumo de totais
3. Toque em **📊 Gerar planilha .xlsx**

A planilha gerada tem **4 abas**:

| Aba | Conteúdo |
|---|---|
| **Inventario** | Tabela completa com todos os equipamentos (#, tipo, marca, modelo, patrimônio, série, usuário, ramal, observações) |
| **Resumo** | Quantidade por tipo de equipamento |
| **Usuarios** | Lista de usuários únicos com contagem de equipamentos |
| **Dashboard** | Gráficos visuais — pizza por tipo, barras por marca, top usuários |

### 📄 Exportar em PDF

Use o botão **📄 Gerar PDF** para uma versão imprimível em paisagem A4. Inclui cabeçalho profissional e tabela colorida.

---

## 📤 Compartilhar resultados

Após gerar a planilha, toque em **📤 Compartilhar planilha**.

**No Android:**
- Abre o menu nativo de compartilhamento
- Escolha **WhatsApp, Outlook, Gmail, Teams, Drive** ou qualquer app

**No iPhone:**
- Mesma experiência, escolha o app

**Se o compartilhamento direto falhar:**
- Um modal customizado mostra **instruções passo a passo** de como anexar manualmente da pasta Downloads

---

## 💡 Dicas e boas práticas

### 📸 Fotografando etiquetas

✅ **FAÇA:**
- Aproxime a câmera (use zoom se precisar)
- Mantenha o celular paralelo à etiqueta
- Use boa iluminação (ligue flash em ambientes escuros)
- Espere a câmera focar (toque na tela na etiqueta)

❌ **EVITE:**
- Reflexos (ângulo causa brilho que apaga texto)
- Texto cortado pelas bordas
- Fundo bagunçado (cabos, papéis colados)
- Foto borrada (segure firme)

### 🏷️ Sem etiqueta? Não tem problema

Se o equipamento **não tem etiqueta de patrimônio**, fotografe a etiqueta do fabricante (marca, modelo, número de série). O app marca esse equipamento como **"⚠️ SEM ETIQUETA"** na planilha — útil para o time de TI etiquetar depois.

### 👥 Identificando usuários

A foto da tela do usuário só captura o nome se:
- A tela mostra um login claro (ex.: "Bem-vindo, JOÃO SILVA")
- Email visível (NOME.SOBRENOME@empresa.com)
- Nome em CAIXA ALTA na tela de bloqueio (típico do Windows)

Se nada disso, **digite manualmente** no campo Nome do usuário.

### 🔄 Trabalhando offline

O OpenInvTI funciona **100% offline** depois do primeiro acesso (graças ao Service Worker do PWA). Você pode:
- Andar pelo prédio inteiro coletando equipamentos sem internet
- Os dados ficam salvos no celular
- Quando voltar pra área com Wi-Fi, gera a planilha tranquilamente

### 💾 Os dados ficam só no seu celular

Importante: o OpenInvTI **não envia dados pra nenhum servidor**. Tudo fica salvo localmente (IndexedDB do navegador). Se você desinstalar o app ou limpar dados, **perde tudo**. Por isso, sempre gere a planilha ao terminar e mande pra você mesmo (email/Drive).

---

## 🆘 Solução de problemas

### "O app não abre" ou "tela em branco"

1. Force fechar o app (gerenciador de apps → arrastar pra cima)
2. Reabrir
3. Se persistir: Configurações Android → Apps → OpenInvTI → Limpar cache

### "Câmera não abre"

- Configurações Android → Apps → OpenInvTI → Permissões → libere **Câmera**

### "OCR não detecta meu patrimônio"

1. Vá em ⚙️ Configurações (topo direito)
2. Use **"📸 Detectar padrão por foto"** com sua etiqueta
3. Escolha o padrão correto
4. Salve

### "Quero testar como usuário novo"

Na tela de Configurações (⚙️), use o botão vermelho **"🗑️ Limpar tudo e recomeçar"**. Apaga toda configuração e inventários, voltando ao estado de primeira instalação.

### "Câmera abre mas não detecta nada"

- A primeira vez demora 30-60s (baixa pacote de idioma do OCR)
- Verifique se está com internet na primeira foto
- Em fotos seguintes, funciona offline

### "Compartilhamento dá erro"

- O modal customizado mostra como anexar manualmente
- A planilha sempre fica salva em **Downloads** do celular

---

## 📞 Suporte

Encontrou um bug? Abra uma issue no [repositório do GitHub](https://github.com/SEU-USUARIO/openinvti/issues).

Quer sugerir uma melhoria? Use o template "Feature Request" do GitHub.
