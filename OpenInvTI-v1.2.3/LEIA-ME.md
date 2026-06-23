# InventAI - Inventário de TI - PWA

App de inventário de equipamentos para Android (e qualquer celular/desktop), com captura de fotos da etiqueta e da tela do usuário, OCR automático para pré-preencher os campos, e geração da planilha `.xlsx` no mesmo formato do seu modelo (`Inv_TI_Metrologia_Validacao.xlsx`).

## Como usar

**Fluxo no celular:**

1. Abra o app → preencha **Data** e **Setor** → toque em **Iniciar inventário**.
2. Toque em **+ Adicionar equipamento**.
3. Tire a **foto da etiqueta** → o OCR tenta extrair patrimônio, marca, modelo, série.
4. Tire a **foto da tela do usuário** → o OCR tenta identificar o nome.
5. **Confira e corrija** os campos pré-preenchidos (sempre dá tempo de ajustar).
6. Toque em **Salvar item** → volta pra lista, próximo equipamento.
7. Ao terminar, toque em **✓ Finalizar** → veja o resumo → **📊 Gerar planilha .xlsx**.
8. O arquivo `Inventario_TI_<setor>_<data>.xlsx` é baixado.

Os dados ficam salvos no celular (IndexedDB), então mesmo que você feche o navegador no meio do inventário, ao reabrir aparece um botão **Retomar inventário em andamento**.

## Instalação no Android (3 opções, escolha a que preferir)

### Opção 1 - Netlify Drop (mais fácil, 1 minuto, recomendado)

1. No computador, abra: <https://app.netlify.com/drop>
2. Arraste a pasta `inventario-ti` inteira para a área da página.
3. Aguarde o upload (poucos segundos). O Netlify dá um link HTTPS tipo `https://xxx-xxx-xxx.netlify.app`.
4. Abra esse link no Chrome do celular Android.
5. No Chrome, toque nos 3 pontinhos do menu → **Instalar app** (ou **Adicionar à tela inicial**).
6. Pronto - o app aparece como um ícone normal na tela inicial.

> Não precisa criar conta no Netlify para usar o Drop. O link fica ativo por tempo indefinido.

### Opção 2 - GitHub Pages (gratuito, permanente)

1. Crie um repositório no GitHub (público).
2. Faça upload dos arquivos da pasta `inventario-ti`.
3. Em Settings → Pages → escolha branch `main` e pasta `/ (root)` → Save.
4. Em poucos minutos o GitHub dá um link `https://<seu-usuario>.github.io/<repo>/`.
5. Abra no Chrome do celular e instale como na opção 1.

### Opção 3 - Servidor local na rede da empresa (sem internet pública)

No computador da rede (com Python instalado):

```
cd inventario-ti
python -m http.server 8443 --bind 0.0.0.0
```

No celular conectado na mesma rede WiFi, abra `http://IP-DO-PC:8443`.
**Limitação:** alguns navegadores não permitem câmera em `http://` (sem HTTPS) - só `localhost` ou IP local. Se o Chrome bloquear, use uma das opções com HTTPS (1 ou 2).

## Por que não um APK direto?

Eu poderia empacotar como APK com Capacitor ou PWA Builder, mas o resultado seria praticamente o mesmo PWA que você instala pelo "Adicionar à tela inicial". A vantagem do PWA atual: zero instalação manual, atualizações automáticas (toda vez que você visita o link com internet, pega a versão nova). Se você quiser um `.apk` "de verdade" depois, dá pra gerar a partir desses mesmos arquivos com <https://www.pwabuilder.com/> (cole o link da opção 1 ou 2 e ele gera o APK assinado).

## O que o OCR consegue extrair (e o que não)

**Etiqueta do equipamento:**
- ✅ Patrimônio no formato configurado via regex (ex.: `ABC-12345`, `INV2024NNN`, 8 dígitos)
- ✅ Marca conhecida (Positivo, Dell, HP, LG, Lenovo, Samsung, Yealink, Cisco etc.)
- ✅ Modelo com palavras-chave (OptiPlex, EliteDesk, Master, SIP T31G etc.)
- ✅ Nº de série após `S/N`, `Serial`, `Service Tag`
- ✅ Códigos auxiliares, ramais, identificadores extras (vão para "Observações")
- ⚠️ Etiquetas com luz ruim, reflexo, ou texto muito pequeno podem falhar - o app deixa você editar tudo manualmente

**Tela do usuário:**
- ✅ Nome em padrões "Olá NOME", "Bem-vindo NOME", "Usuário: NOME"
- ✅ Nome completo na tela (3+ palavras com inicial maiúscula)
- ✅ Email tipo `nome.sobrenome@...` → converte para "Nome Sobrenome"
- ⚠️ Telas em modo escuro/baixo contraste podem confundir o OCR

A primeira foto demora um pouco mais porque o app baixa os pacotes de idioma do Tesseract (português + inglês ≈ 15MB), que ficam em cache. Depois disso, OCR offline e rápido.

## Formato da planilha gerada

Idêntico ao seu modelo: 3 abas (**Inventario**, **Resumo**, **Usuarios**), título mesclado azul `#1F4E78`, cabeçalho azul com texto branco, fórmulas `COUNTIF` e `SUM` na aba Resumo, agrupamento por usuário com contagem de equipamentos na aba Usuarios.

## Arquivos da pasta

```
inventario-ti/
├── index.html       ← tela principal
├── app.js           ← lógica (OCR, captura, planilha)
├── style.css        ← estilos
├── manifest.json    ← metadados PWA
├── sw.js            ← service worker (cache offline)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── LEIA-ME.md       ← este arquivo
```

## Dúvidas comuns

**Funciona offline?** Sim, depois da primeira carga - o service worker faz cache de tudo. Mas o primeiro acesso precisa de internet para baixar as bibliotecas (Tesseract + ExcelJS).

**Os dados ficam onde?** No próprio celular (IndexedDB). Não vão pra nenhum servidor. Se você desinstalar o app ou limpar os dados do Chrome, o inventário em andamento é perdido (mas planilhas já baixadas continuam no celular).

**Posso editar um item depois de salvar?** Sim - na lista, toque em **Editar** no item.

**Esqueci de tirar foto, posso preencher só digitando?** Sim - foto e OCR são opcionais. Você pode pular direto para os campos de texto.
