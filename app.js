/* Inventário de TI — PWA
 * Captura → OCR → Confirmação → Planilha .xlsx
 */

// ============================================================
// PROXY IA — v1.0.9 — Cloudflare Worker que protege a chave Groq
// ============================================================
// Para distribuir o app sem expor a chave Groq, hospedamos um worker
// Cloudflare que adiciona a auth header e encaminha pra api.groq.com.
// Deixe vazio ('') pra desabilitar o proxy e voltar ao modo "chave manual".
// Veja SETUP_CLOUDFLARE.md para o passo a passo do deploy.
const PROXY_URL = 'https://openinvti.jean-sanabia.workers.dev'; // v1.0.12: proxy Cloudflare já fixado

// v1.2.2: modelos de VISÃO da Groq (mais recentes). Maverick = mais inteligente;
// Scout = fallback mais rápido. Usados pelo botão "IA identifica".
const GROQ_VISION_MODELS = [
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];

// v1.0.13: Versão do app — exibida no subtítulo do header pra rastreabilidade
const APP_VERSION = '1.2.4';
const APP_TAGLINE = 'Inventário de TI Inteligente';

// ============================================================
// PRESETS DE EMPRESA — v1.0.9 — aplicados via ?preset=NOME na URL
// ============================================================
const EMPRESA_PRESETS = {
  far: {
    empresa: { nome: 'Farmanguinhos', titulo: 'INVENTARIO DE EQUIPAMENTOS DE TI' },
    patrimonio: {
      // v1.0.12: regex MUITO mais tolerante ao OCR — aceita variações de espaço/hífen e captura "FAR" sem "F-"
      regex_padroes: [
        '\\b41\\d{6}\\b',                // v1.1.0: NOVO padrão Fiocruz 41810330
        'F[-_\\s]?FAR[-_\\s]?\\d{5}',
        '\\bFAR[-_\\s]?\\d{5}\\b',
        '\\b\\d{6}\\b'
      ],
      exemplo: '41810330 ou F-FAR-12345',
      // Normalização: se match começar com "FAR" (sem F-), prefixa "F-"
      normalizar: 'far',
    },
  },
};

// v1.0.12: normaliza patrimônio capturado conforme regras da empresa
function normalizarPatrimonio(match) {
  if (!match) return '';
  let v = match.toString().toUpperCase().replace(/[\s_\.]/g, '-').replace(/-+/g, '-');
  const norm = (APP_CONFIG && APP_CONFIG.patrimonio && APP_CONFIG.patrimonio.normalizar) || '';
  if (norm === 'far') {
    // Adiciona "F-" se o match veio sem ele (ex: "FAR-12345" → "F-FAR-12345")
    if (/^FAR[-]?\d{5}$/.test(v) && !v.startsWith('F-')) {
      v = 'F-' + v.replace(/^FAR/, 'FAR');
    }
    // Garante hífens corretos (FFAR12345 → F-FAR-12345)
    const mFar = v.match(/^F-?FAR-?(\d{5})$/);
    if (mFar) v = 'F-FAR-' + mFar[1];
  }
  return v;
}

// ============================================================
// CONFIGURAÇÃO (carregada de localStorage, fallback config.json)
// ============================================================
const DEFAULT_CONFIG = {
  empresa: { nome: 'Sua Empresa', titulo: 'INVENTARIO DE EQUIPAMENTOS DE TI' },
  patrimonio: {
    regex_padroes: ['[A-Z]{2,5}-?\\d{3,8}', '\\d{6,10}'],
    exemplo: 'Ex.: ABC-12345 ou 12345678',
  },
  marcas: ['HP', 'Dell', 'Lenovo', 'Acer', 'Asus', 'Apple', 'Samsung', 'LG',
           'Positivo', 'Itautec', 'Yealink', 'Cisco', 'Avaya', 'Polycom',
           'Philips', 'AOC', 'BenQ', 'Brother', 'Epson', 'Canon', 'Xerox'],
  ocr_regex_extras: [],
  ai: { groq_key: '', model: 'llama-3.3-70b-versatile' }, // v1.0.8: detecção de regex com IA
  setup_done: false,
};

// v1.0.9: helper — verdadeiro se IA está disponível (via proxy ou chave manual)
function iaDisponivel() {
  if (PROXY_URL && PROXY_URL.startsWith('http')) return true;
  if (APP_CONFIG && APP_CONFIG.ai && APP_CONFIG.ai.groq_key) return true;
  return false;
}

// v1.0.9: aplica preset de empresa por nome (chamado via ?preset=)
function aplicarPresetEmpresa(nomePreset) {
  const preset = EMPRESA_PRESETS[(nomePreset || '').toLowerCase()];
  if (!preset) return false;
  APP_CONFIG.empresa = Object.assign({}, APP_CONFIG.empresa || {}, preset.empresa || {});
  if (preset.patrimonio) APP_CONFIG.patrimonio = Object.assign({}, APP_CONFIG.patrimonio || {}, preset.patrimonio);
  if (preset.marcas) APP_CONFIG.marcas = preset.marcas;
  APP_CONFIG.setup_done = true; // pula tela de setup
  saveConfig(APP_CONFIG);
  return true;
}

function loadConfig() {
  try {
    const saved = localStorage.getItem('openinvti-config');
    if (saved) return Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved));
  } catch (e) {}
  return Object.assign({}, DEFAULT_CONFIG);
}
function saveConfig(cfg) {
  localStorage.setItem('openinvti-config', JSON.stringify(cfg));
}

let APP_CONFIG = loadConfig();

// ============================================================
// Estado global
// ============================================================
const STATE = {
  data: '',         // yyyy-mm-dd
  setor: '',
  analista: '',     // v1.0.10: analista responsável pelo inventário
  titulo: '',
  // items: cada item tem sessionId = id da sessão (1 usuário e seus equipamentos)
  items: [],        // {id, sessionId, tipo, marca, modelo, patrimonio, serie, usuario, ramal, obs}
  editingId: null,
  // Wizard
  wizardActive: false,
  wizardStep: 0,        // 0=CPU, 1=Monitor 1, 2=Monitor 2, 3=Telefone, 4=Ramal, 5=Usuário
  wizardSessionId: null,
  wizardItems: [],      // itens temporários da sessão atual
  wizardRamal: '',
  wizardUsuario: '',
  // Historico de inventarios finalizados (alimenta dashboard cumulativo)
  historicoSessoes: [],  // [{id, data, setor, totalItens, totalUsuarios, dataArquivamento}]
};

// Definição dos passos do wizard
const WIZARD_STEPS = [
  { key: 'cpu', titulo: 'Equipamento principal', sub: 'Tire foto da etiqueta com nº de patrimônio. Se não tem etiqueta, fotografe a do fabricante (marca/modelo/série) — o app marca pra etiquetar depois.', cam: 'Tirar foto da etiqueta', tipoDefault: 'CPU', skippable: true, skipLabel: 'Sem CPU' },
  { key: 'monitor1', titulo: 'Monitor 1', sub: 'Tire foto da etiqueta do monitor principal.', cam: 'Tirar foto do monitor', tipoDefault: 'Monitor', skippable: true, skipLabel: 'Sem monitor' },
  { key: 'monitor2', titulo: 'Monitor 2', sub: 'Tire foto da etiqueta do segundo monitor (se existir).', cam: 'Tirar foto do monitor 2', tipoDefault: 'Monitor', skippable: true, skipLabel: 'Só 1 monitor' },
  { key: 'telefone', titulo: 'Telefone IP', sub: 'Tire foto da etiqueta do telefone IP (se existir).', cam: 'Tirar foto do telefone', tipoDefault: 'Telefone IP', skippable: true, skipLabel: 'Sem telefone IP' },
  { key: 'ramal', titulo: 'Ramal', sub: 'Digite o ramal do telefone IP. Se não tem ramal, pode pular.', cam: '', tipoDefault: '', skippable: true, skipLabel: 'Sem ramal' },
  { key: 'usuario', titulo: 'Usuário (opcional)', sub: 'Opcional: tire foto da tela com o nome do usuário OU digite manualmente. Pode finalizar sem preencher.', cam: 'Tirar foto da tela', tipoDefault: '', skippable: true, skipLabel: 'Sem usuário' },
];

const DB_NAME = 'inventario-ti';
const DB_STORE = 'sessao';

// ============================================================
// IndexedDB (persistência)
// ============================================================
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveState() {
  // v1.2.0: indicador visual de auto-save (não-bloqueante)
  try { setTimeout(() => { if (typeof mostrarIndicadorSave === 'function') mostrarIndicadorSave('💾 Salvo', 'ok'); }, 100); } catch (e) {}
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ ...STATE }, 'state');
    await new Promise((r, e) => { tx.oncomplete = r; tx.onerror = () => e(tx.error); });
  } catch (err) { console.warn('Falha ao salvar', err); }
}
async function loadState() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get('state');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}
async function clearState() {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete('state');
    await new Promise((r) => { tx.oncomplete = r; tx.onerror = r; });
  } catch {}
}

// ============================================================
// Helpers UI
// ============================================================
const $ = (id) => document.getElementById(id);
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function toast(msg, ms = 2200) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), ms);
}
function fmtDateBR(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function updateDashboard() {
  const dashSes = document.getElementById('dashSessoes');
  const dashItn = document.getElementById('dashItens');
  const dashUsr = document.getElementById('dashUsuarios');
  if (!dashSes && !dashItn && !dashUsr) return;
  // Conta sessoes/usuarios do inventario ATUAL em andamento
  const sessoes = new Set();
  const usuarios = new Set();
  for (const it of (STATE.items || [])) {
    if (it.sessionId) sessoes.add(it.sessionId);
    else sessoes.add('legacy-' + (it.usuario || ''));
    if (it.usuario) usuarios.add(it.usuario);
  }
  // Soma com o historico de inventarios JA FINALIZADOS
  let totSessoes = sessoes.size;
  let totItens = (STATE.items || []).length;
  let totUsuarios = usuarios.size;
  const usuariosUnicos = new Set(usuarios);
  for (const h of (STATE.historicoSessoes || [])) {
    totSessoes += (h.totalSessoes || 0);
    totItens += (h.totalItens || 0);
    if (Array.isArray(h.usuarios)) {
      for (const u of h.usuarios) usuariosUnicos.add(u);
    }
  }
  totUsuarios = usuariosUnicos.size;
  if (dashSes) dashSes.textContent = totSessoes;
  if (dashItn) dashItn.textContent = totItens;
  if (dashUsr) dashUsr.textContent = totUsuarios;
  // v1.0.8: Cards clicáveis com navegação para histórico
  const cards = document.querySelectorAll('#screen-start .dash-card');
  const tipos = ['sessoes', 'itens', 'usuarios'];
  cards.forEach((card, i) => {
    if (!card.classList.contains('clickable')) {
      card.classList.add('clickable');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('click', () => abrirHistoricoModal(tipos[i]));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirHistoricoModal(tipos[i]); } });
    }
  });
}

// Arquiva o inventario atual no historico antes de limpar
function arquivarInventarioAtual() {
  if (!STATE.items || STATE.items.length === 0) return;
  const sessoesSet = new Set();
  const usuariosSet = new Set();
  for (const it of STATE.items) {
    if (it.sessionId) sessoesSet.add(it.sessionId);
    else sessoesSet.add('legacy-' + (it.usuario || ''));
    if (it.usuario) usuariosSet.add(it.usuario);
  }
  const resumo = {
    id: 'inv-' + Date.now(),
    data: STATE.data || todayIso(),
    setor: STATE.setor || '(sem setor)',
    titulo: STATE.titulo || '',
    analista: STATE.analista || '',
    totalSessoes: sessoesSet.size,
    totalItens: STATE.items.length,
    totalUsuarios: usuariosSet.size,
    usuarios: Array.from(usuariosSet),
    items: JSON.parse(JSON.stringify(STATE.items || [])), // v1.1.0: cópia profunda
    dataArquivamento: new Date().toISOString(),
  };
  if (!Array.isArray(STATE.historicoSessoes)) STATE.historicoSessoes = [];
  STATE.historicoSessoes.push(resumo);
}

// v1.1.0: Modal de detalhes do inventário ARQUIVADO — lista items + ações
function abrirInventarioArquivado(id) {
  const historico = STATE.historicoSessoes || [];
  const inv = historico.find(h => h.id === id);
  if (!inv) { toast('Inventário não encontrado.'); return; }
  const items = Array.isArray(inv.items) ? inv.items : [];
  const old = document.getElementById('historyModal');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'historyModal';
  overlay.className = 'history-modal-bg';
  const dataBR = fmtDateBR(inv.data || '');
  const nomeArq = (inv.data || '') + '_' + (inv.setor || '').replace(/[^a-zA-Z0-9_-]/g, '_') + '.xlsx';
  let conteudo = '';
  if (items.length === 0) {
    conteudo = '<div class="hm-empty">⚠️ Este inventário foi arquivado em uma versão anterior (antes da v1.1.0) e não tem os itens detalhados salvos.<br><br>' +
      'A planilha .xlsx que você gerou está em <strong>Downloads</strong>:<br><br>' +
      '<code style="font-size:11px;color:#67E8F9;word-break:break-all">' + nomeArq + '</code></div>';
  } else {
    conteudo = items.map((it, i) => (
      '<div class="hm-item"><strong>' + (i+1) + '. ' + (it.tipo || 'Item') + ' — ' + (it.marca || '-') + ' ' + (it.modelo || '') + '</strong>' +
      '<div class="hm-sub">' + (it.patrimonio ? 'Patr: ' + it.patrimonio + ' · ' : '') +
      (it.serie ? 'SN: ' + it.serie + ' · ' : '') +
      (it.usuario ? '👤 ' + it.usuario : '(sem usuário)') + '</div></div>'
    )).join('');
  }
  const acoes = items.length > 0 ?
    '<div class="hm-actions">' +
      '<button class="hm-action-btn hm-act-whats" data-act="whats">💬 Enviar pelo WhatsApp</button>' +
      '<button class="hm-action-btn" data-act="xlsx">📊 Regerar planilha .xlsx</button>' +
      '<button class="hm-action-btn" data-act="pdf">📄 Regerar PDF</button>' +
      '<button class="hm-action-btn" data-act="edit">✏️ Editar este inventário</button>' +
    '</div>' : '';
  overlay.innerHTML = '<div class="history-modal">' +
    '<button class="hm-close" id="hmCloseBtn">Fechar ×</button>' +
    '<h3>📋 ' + (inv.setor || '(sem setor)') + '</h3>' +
    '<div class="hm-arch-meta">📅 ' + dataBR + ' · ' + (inv.totalSessoes || 0) + ' sessão(ões) · ' +
    (inv.totalItens || 0) + ' item(ns) · ' + (inv.totalUsuarios || 0) + ' usuário(s)' +
    (inv.analista ? '<br>👤 Analista: ' + inv.analista : '') + '</div>' +
    acoes + conteudo + '</div>';
  document.body.appendChild(overlay);
  document.getElementById('hmCloseBtn').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelectorAll('.hm-action-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const act = btn.dataset.act;
      if (act === 'edit') {
        if (!confirm('Editar este inventário arquivado?\n\nEle volta pro modo edição. O histórico será recriado quando você arquivar de novo.')) return;
        STATE.historicoSessoes = (STATE.historicoSessoes || []).filter(h => h.id !== inv.id);
        STATE.data = inv.data; STATE.setor = inv.setor; STATE.titulo = inv.titulo;
        STATE.analista = inv.analista || ''; STATE.items = inv.items.slice(); STATE.editingId = null;
        await saveState();
        if ($('setorInv')) $('setorInv').value = inv.setor || '';
        if ($('analistaInv')) $('analistaInv').value = inv.analista || '';
        if ($('dataInv')) $('dataInv').value = inv.data || todayIso();
        if ($('tituloInv')) $('tituloInv').value = inv.titulo || '';
        window._lastPlanilhaBlob = null; window._lastPlanilhaBuf = null; window._lastPdfBlob = null;
        updateTopbar(); updateDashboard(); refreshList();
        overlay.remove();
        toast('✏️ Inventário restaurado. Edite e finalize quando terminar.', 4500);
        showScreen('screen-list');
        return;
      }
      const BAK = { data: STATE.data, setor: STATE.setor, titulo: STATE.titulo, analista: STATE.analista, items: STATE.items };
      try {
        STATE.data = inv.data; STATE.setor = inv.setor; STATE.titulo = inv.titulo;
        STATE.analista = inv.analista || ''; STATE.items = inv.items.slice();
        if (act === 'xlsx') { await gerarPlanilha(); toast('✓ Planilha regerada em Downloads', 3500); }
        else if (act === 'pdf') { if ($('btnPdf')) $('btnPdf').click(); }
        else if (act === 'whats') { await enviarRelatorioWhatsApp(); }
      } catch (e) { console.error(e); toast('Erro: ' + (e.message || e)); }
      finally { Object.assign(STATE, BAK); }
    });
  });
}

function updateTopbar() {
  const total = STATE.items.length;
  const badge = $('topBadge');
  badge.style.display = total > 0 ? 'inline-flex' : 'none';
  badge.textContent = `${total} ${total === 1 ? 'item' : 'itens'}`;
  // v1.0.9: Badge "IA" no header quando proxy ou chave Groq estão ativos
  const iaBadge = document.getElementById('iaBadge');
  if (iaBadge) {
    if (iaDisponivel()) {
      iaBadge.style.display = 'inline-flex';
      const viaProxy = PROXY_URL && PROXY_URL.startsWith('http');
      iaBadge.title = viaProxy ? 'IA ativa via Cloudflare Workers (chave protegida)' : 'IA ativa via chave Groq local';
    } else {
      iaBadge.style.display = 'none';
    }
  }
  // v1.0.8: badge clicável -> abre lista de itens da sessão atual
  if (!badge.dataset.bound) {
    badge.classList.add('clickable');
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.addEventListener('click', () => abrirHistoricoModal('itens-atuais'));
    badge.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirHistoricoModal('itens-atuais'); } });
    badge.dataset.bound = '1';
  }
  if (STATE.setor) {
    $('topTitle').textContent = STATE.setor;
    $('topSub').textContent = fmtDateBR(STATE.data) + ' · v' + APP_VERSION;
  } else {
    $('topTitle').textContent = 'OpenInvTI';
    $('topSub').textContent = APP_TAGLINE + ' · v' + APP_VERSION;
  }
}

// v1.0.11: helper — fecha modal e abre wizard pra editar
function editarSessaoDoModal(sessionId) {
  const m = document.getElementById('historyModal');
  if (m) m.remove();
  if (typeof startWizard === 'function') startWizard(sessionId);
}
// v1.0.8/v1.0.11: Modal de histórico — abre lista clicando em qualquer contador
function abrirHistoricoModal(tipo) {
  const old = document.getElementById('historyModal');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'historyModal';
  overlay.className = 'history-modal-bg';
  let titulo = '';
  let icone = '';
  let conteudo = '';
  const itensAtuais = STATE.items || [];
  const historico = STATE.historicoSessoes || [];

  // v1.0.11: helper de item clicável com botão editar
  function renderItem(it, indice) {
    const sid = it.sessionId || ('legacy-' + (it.usuario || ''));
    return '<div class="hm-item hm-item-editable" data-sid="' + sid + '">' +
      '<div class="hm-item-body">' +
        '<strong>' + (indice ? indice + '. ' : '') + (it.tipo || 'Item') + ' — ' + (it.marca || '-') + ' ' + (it.modelo || '') + '</strong>' +
        '<div class="hm-sub">' +
          (it.patrimonio ? 'Patr: ' + it.patrimonio + ' · ' : '') +
          (it.serie ? 'SN: ' + it.serie + ' · ' : '') +
          (it.usuario ? '👤 ' + it.usuario : '(sem usuário)') +
        '</div>' +
      '</div>' +
      '<button type="button" class="hm-item-edit" data-sid="' + sid + '" title="Editar esta estação">✏️</button>' +
    '</div>';
  }

  if (tipo === 'itens-atuais') {
    titulo = 'Itens da sessão atual';
    icone = '📦';
    if (itensAtuais.length === 0) {
      conteudo = '<div class="hm-empty">Nenhum item registrado nesta sessão ainda.</div>';
    } else {
      conteudo = itensAtuais.map((it, i) => renderItem(it, i+1)).join('');
    }
  } else if (tipo === 'sessoes') {
    titulo = 'Sessões / Inventários';
    icone = '📦';
    const sessoesAgrupadas = {};
    for (const it of itensAtuais) {
      const key = it.sessionId || ('legacy-' + (it.usuario || ''));
      if (!sessoesAgrupadas[key]) sessoesAgrupadas[key] = { usuario: it.usuario, qtd: 0, tipos: new Set() };
      sessoesAgrupadas[key].qtd++;
      sessoesAgrupadas[key].tipos.add(it.tipo || 'Outro');
    }
    let partes = [];
    if (Object.keys(sessoesAgrupadas).length > 0) {
      partes.push('<div style="font-size:12px;color:#67E8F9;font-weight:700;margin:6px 0">▸ Em andamento</div>');
      partes.push(Object.entries(sessoesAgrupadas).map(([key, s]) => (
        '<div class="hm-item hm-item-editable" data-sid="' + key + '">' +
          '<div class="hm-item-body">' +
            '<strong>' + (s.usuario || '(sem usuário)') + '</strong>' +
            '<div class="hm-sub">' + s.qtd + ' item(ns) · ' + Array.from(s.tipos).join(', ') + '</div>' +
          '</div>' +
          '<button type="button" class="hm-item-edit" data-sid="' + key + '" title="Editar estação">✏️</button>' +
        '</div>'
      )).join(''));
    }
    if (historico.length > 0) {
      partes.push('<div style="font-size:12px;color:#34D399;font-weight:700;margin:14px 0 6px">▸ Inventários arquivados (toque pra ver dispositivos)</div>');
      partes.push(historico.map((h) => (
        '<div class="hm-item hm-item-archived" data-arch-id="' + (h.id || '') + '" style="cursor:pointer">' +
        '<div class="hm-item-body"><strong>' + (h.setor || '(sem setor)') + '</strong>' +
        '<div class="hm-sub">' +
          (h.data ? fmtDateBR(h.data) + ' · ' : '') +
          (h.totalSessoes || 0) + ' sessão(ões) · ' +
          (h.totalItens || 0) + ' item(ns) · ' +
          (h.totalUsuarios || 0) + ' usuário(s)' +
        '</div></div>' +
        '<button type="button" class="hm-item-edit" style="background:rgba(52,211,153,0.14);color:#34D399;border-color:rgba(52,211,153,0.32);" title="Ver dispositivos">👁</button>' +
        '</div>'
      )).join(''));
    }
    if (partes.length === 0) partes.push('<div class="hm-empty">Nenhuma sessão registrada ainda.</div>');
    conteudo = partes.join('');
  } else if (tipo === 'itens') {
    titulo = 'Itens registrados';
    icone = '💻';
    const partes = [];
    if (itensAtuais.length > 0) {
      partes.push('<div style="font-size:12px;color:#67E8F9;font-weight:700;margin:6px 0">▸ Inventário atual (' + itensAtuais.length + ')</div>');
      partes.push(itensAtuais.map((it, i) => renderItem(it, i+1)).join(''));
    }
    if (historico.length > 0) {
      const totHist = historico.reduce((acc, h) => acc + (h.totalItens || 0), 0);
      partes.push('<div style="font-size:12px;color:#34D399;font-weight:700;margin:14px 0 6px">▸ Itens em inventários arquivados (' + totHist + ')</div>');
      partes.push('<div class="hm-empty" style="padding:10px 4px;font-size:11px">Os detalhes individuais ficam nos arquivos .xlsx que você gerou para cada inventário.</div>');
    }
    if (partes.length === 0) partes.push('<div class="hm-empty">Nenhum item registrado ainda.</div>');
    conteudo = partes.join('');
  } else if (tipo === 'usuarios') {
    titulo = 'Usuários únicos';
    icone = '👥';
    const usuariosUnicos = new Set();
    for (const it of itensAtuais) { if (it.usuario) usuariosUnicos.add(it.usuario); }
    for (const h of historico) { if (Array.isArray(h.usuarios)) h.usuarios.forEach(u => usuariosUnicos.add(u)); }
    const lista = Array.from(usuariosUnicos).sort();
    if (lista.length === 0) {
      conteudo = '<div class="hm-empty">Nenhum usuário registrado ainda.</div>';
    } else {
      conteudo = lista.map((u, i) => {
        const itensDoUser = itensAtuais.filter(it => it.usuario === u);
        const tipos = new Set(itensDoUser.map(it => it.tipo));
        return '<div class="hm-item">' +
          '<strong>' + (i+1) + '. ' + u + '</strong>' +
          '<div class="hm-sub">' + itensDoUser.length + ' item(ns) na sessão atual' +
            (tipos.size > 0 ? ' · ' + Array.from(tipos).join(', ') : '') +
          '</div></div>';
      }).join('');
    }
  }

  overlay.innerHTML =
    '<div class="history-modal">' +
      '<button class="hm-close" id="hmCloseBtn">Fechar ×</button>' +
      '<h3>' + icone + ' ' + titulo + '</h3>' +
      conteudo +
    '</div>';
  document.body.appendChild(overlay);
  document.getElementById('hmCloseBtn').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  // v1.0.11: clica em item OU no lápis ✏️ → abre wizard pra editar a estação
  overlay.querySelectorAll('.hm-item-edit, .hm-item-editable').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const archEl = e.target.closest('[data-arch-id]');
      if (archEl) { abrirInventarioArquivado(archEl.dataset.archId); return; }
      const sid = (e.currentTarget.dataset && e.currentTarget.dataset.sid)
                 || (e.target.closest('[data-sid]') && e.target.closest('[data-sid]').dataset.sid);
      if (sid) editarSessaoDoModal(sid);
    });
  });
  // v1.1.0: clicar no item arquivado inteiro
  overlay.querySelectorAll('.hm-item-archived').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = el.dataset.archId;
      if (id) abrirInventarioArquivado(id);
    });
  });
}

// ============================================================
// OCR (Tesseract.js v5) — usa worker.recognize() corretamente
// ============================================================
let _tessWorker = null;
let _tessLoadingPromise = null;
let _tessProgressCb = null;
let _tessStatusCb = null;

async function getTessWorker() {
  if (_tessWorker) return _tessWorker;
  if (_tessLoadingPromise) return _tessLoadingPromise;
  _tessLoadingPromise = (async () => {
    if (typeof Tesseract === 'undefined') {
      throw new Error('Tesseract.js não carregou (verifique sua internet ou bloqueios de CDN)');
    }
    // O logger é definido na criação do worker e dispara para CADA chamada.
    // Usamos callbacks de módulo (_tessProgressCb / _tessStatusCb) para
    // permitir que cada recognize() informe seu próprio progresso/status.
    const worker = await Tesseract.createWorker(['por', 'eng'], 1, {
      logger: (m) => {
        if (!m) return;
        if (_tessStatusCb) _tessStatusCb(m);
        if (m.status === 'recognizing text' && _tessProgressCb) {
          _tessProgressCb(Math.round((m.progress || 0) * 100));
        }
      },
      errorHandler: (e) => console.error('[Tesseract worker]', e),
    });
    _tessWorker = worker;
    return worker;
  })();
  try {
    return await _tessLoadingPromise;
  } finally {
    _tessLoadingPromise = null;
  }
}

async function ocrImage(file, onProgress, onStatus) {
  // Redimensiona se for muito grande, mantendo legibilidade
  const dataUrl = await fileToResizedDataUrl(file, 2400);
  if (onStatus) onStatus('preparando');
  const worker = await getTessWorker();
  _tessProgressCb = onProgress || null;
  _tessStatusCb = (m) => {
    if (!onStatus) return;
    if (m.status === 'loading tesseract core') onStatus('carregando motor OCR...');
    else if (m.status === 'initializing tesseract') onStatus('iniciando OCR...');
    else if (m.status === 'loading language traineddata') onStatus('baixando idioma (~15MB, só na primeira vez)...');
    else if (m.status === 'initializing api') onStatus('preparando reconhecimento...');
    else if (m.status === 'recognizing text') onStatus('lendo texto da foto...');
  };
  try {
    const ret = await worker.recognize(dataUrl);
    const text = (ret && ret.data && ret.data.text) ? ret.data.text : '';
    return { text, dataUrl };
  } finally {
    _tessProgressCb = null;
    _tessStatusCb = null;
  }
}

// Aquece o worker em segundo plano assim que o usuário inicia o inventário,
// para que a primeira foto não tenha que esperar o download dos pacotes.
function warmupOcr() {
  getTessWorker().catch((e) => console.warn('Pre-load OCR falhou (será retry):', e));
}

function computeBlurScore(ctx, w, h) {
  // Calcula variancia do Laplaciano em uma amostra central
  const sw = Math.min(w, 600);
  const sh = Math.min(h, 600);
  const sx = Math.max(0, Math.floor((w - sw) / 2));
  const sy = Math.max(0, Math.floor((h - sh) / 2));
  const d = ctx.getImageData(sx, sy, sw, sh).data;
  let sum = 0, sumSq = 0, n = 0;
  // Kernel Laplaciano simplificado [0 -1 0; -1 4 -1; 0 -1 0] no canal R (ja eh grayscale)
  for (let y = 1; y < sh - 1; y += 2) {
    for (let x = 1; x < sw - 1; x += 2) {
      const i = (y * sw + x) * 4;
      const c = d[i];
      const t = d[((y - 1) * sw + x) * 4];
      const b = d[((y + 1) * sw + x) * 4];
      const l = d[(y * sw + (x - 1)) * 4];
      const r = d[(y * sw + (x + 1)) * 4];
      const v = 4 * c - t - b - l - r;
      sum += v; sumSq += v * v; n++;
    }
  }
  if (n === 0) return null;
  const mean = sum / n;
  return sumSq / n - mean * mean;  // variancia
}

function detectLabelCrop(ctx, w, h) {
  // Detecta retângulo de etiqueta via projeção de contraste
  // Retorna { x, y, w, h } ou null se nao achou
  try {
    const d = ctx.getImageData(0, 0, w, h).data;
    // Threshold via mediana
    const histY = new Array(h).fill(0);
    const histX = new Array(w).fill(0);
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const i = (y * w + x) * 4;
        const gray = d[i]; // ja eh grayscale apos preprocess
        // Score alto = pixel claro (etiqueta clara em fundo escuro tipico)
        if (gray > 180) { histY[y]++; histX[x]++; }
      }
    }
    // Encontra a faixa mais "brilhante" vertical e horizontal
    function findRange(arr, minScore) {
      let bestStart = -1, bestEnd = -1, bestSum = 0;
      let curStart = -1, curSum = 0;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] >= minScore) {
          if (curStart === -1) curStart = i;
          curSum += arr[i];
        } else {
          if (curStart !== -1 && curSum > bestSum) {
            bestStart = curStart; bestEnd = i; bestSum = curSum;
          }
          curStart = -1; curSum = 0;
        }
      }
      if (curStart !== -1 && curSum > bestSum) {
        bestStart = curStart; bestEnd = arr.length; bestSum = curSum;
      }
      return [bestStart, bestEnd];
    }
    const minY = Math.max(3, Math.floor(w * 0.05));
    const minX = Math.max(3, Math.floor(h * 0.05));
    const [y0, y1] = findRange(histY, minY);
    const [x0, x1] = findRange(histX, minX);
    if (y0 < 0 || x0 < 0) return null;
    const cropW = x1 - x0;
    const cropH = y1 - y0;
    // Valida que crop é razoavel (nao muito pequeno nem muito grande)
    if (cropW < w * 0.15 || cropH < h * 0.05) return null;
    if (cropW > w * 0.95 && cropH > h * 0.95) return null;
    // Adiciona margem
    const m = 10;
    return {
      x: Math.max(0, x0 - m),
      y: Math.max(0, y0 - m),
      w: Math.min(w, cropW + 2*m),
      h: Math.min(h, cropH + 2*m),
    };
  } catch (e) { return null; }
}

function fileToResizedDataUrl(file, maxDim) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      // Pré-processamento: aumenta contraste e converte pra grayscale (ajuda OCR)
      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const contrast = 1.4;
        const intercept = 128 * (1 - contrast);
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          let v = gray * contrast + intercept;
          v = Math.max(0, Math.min(255, v));
          data[i] = data[i + 1] = data[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (e) { /* canvas tainted ou similar — segue sem preprocess */ }
      // Detecta foto borrada (variancia de Laplaciano)
      try {
        window._lastBlurScore = computeBlurScore(ctx, w, h);
      } catch (e) { window._lastBlurScore = null; }
      // Tenta recortar regiao da etiqueta automaticamente
      try {
        const crop = detectLabelCrop(ctx, w, h);
        if (crop && crop.w > 80 && crop.h > 30) {
          const c2 = document.createElement('canvas');
          c2.width = crop.w;
          c2.height = crop.h;
          const ctx2 = c2.getContext('2d');
          ctx2.drawImage(c, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
          window._lastCropped = true;
          resolve(c2.toDataURL('image/jpeg', 0.9));
          return;
        }
      } catch (e) { /* segue sem crop */ }
      window._lastCropped = false;
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ============================================================
// Heurísticas de extração da etiqueta
// ============================================================
// Lista de marcas vem da config (APP_CONFIG.marcas)
const BRANDS_KNOWN_FALLBACK = ['HP', 'Dell', 'Lenovo', 'Acer', 'Asus', 'Apple', 'Samsung', 'LG', 'Positivo'];
function getBrands() { return (APP_CONFIG && APP_CONFIG.marcas) || BRANDS_KNOWN_FALLBACK; }
const TYPE_KEYWORDS = {
  'Monitor': ['monitor', 'led', 'lcd', 'teleprompter'],
  'Telefone IP': ['telefone', 'sip', 'phone', 'voip', 'yealink', 'cisco'],
  'Notebook': ['notebook', 'thinkpad', 'inspiron', 'latitude', 'macbook'],
  'Impressora': ['impressora', 'printer', 'laserjet', 'deskjet'],
  'CPU': ['cpu', 'desktop', 'optiplex', 'elitedesk', 'master', 'minipro', 'mini pc', 'workstation'],
};

function parseLabel(text) {
  const out = { marca: '', modelo: '', patrimonio: '', serie: '', tipo: '', obs: [], rawText: text || '' };
  if (!text) return out;
  const linhas = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const full = text.replace(/\s+/g, ' ');

  // Marca: primeira marca conhecida que aparece
  for (const b of getBrands()) {
    const re = new RegExp('\\b' + b.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + '\\b', 'i');
    if (re.test(full)) { out.marca = b; break; }
  }

  // Tipo: por palavra-chave
  const lower = full.toLowerCase();
  for (const [tipo, keys] of Object.entries(TYPE_KEYWORDS)) {
    if (keys.some((k) => lower.includes(k))) { out.tipo = tipo; break; }
  }

  // Tipo + Marca + Modelo em sequência (ex.: "MONITOR HP ELITE E221 21 PO")
  for (const l of linhas.slice(0, 4)) {
    const m2 = l.match(/^\s*(MONITOR|CPU|NOTEBOOK|IMPRESSORA|TELEFONE|TELA)\s+([A-Z][A-Za-z]+)\s+(.{2,40})$/i);
    if (m2) {
      const tipoEnc = m2[1].toUpperCase();
      const marcaEnc = m2[2];
      let modeloEnc = m2[3].trim();
      // Limpeza genérica: remove códigos de patrimônio e nomes de empresa que grudaram no fim
      modeloEnc = modeloEnc.replace(/\s+[A-Z]{2,5}[-_\s]?\d{3,10}.*$/i, '').replace(/\s+\d{6,10}.*$/i, '').trim();
      const tipoMap = { 'MONITOR': 'Monitor', 'CPU': 'CPU', 'NOTEBOOK': 'Notebook', 'IMPRESSORA': 'Impressora', 'TELEFONE': 'Telefone IP', 'TELA': 'Monitor' };
      if (!out.tipo) out.tipo = tipoMap[tipoEnc] || tipoEnc;
      if (!out.marca) {
        const marcaUpper = marcaEnc.toUpperCase();
        const marcaMatch = getBrands().find((b) => b.toUpperCase() === marcaUpper);
        out.marca = marcaMatch || (marcaEnc.charAt(0).toUpperCase() + marcaEnc.slice(1).toLowerCase());
      }
      if (!out.modelo && modeloEnc.length >= 2 && modeloEnc.length <= 50) out.modelo = modeloEnc;
      break;
    }
  }

  // ===== PATRIMÔNIO — múltiplos padrões em ordem de confiança =====

  // 1. Padrões configurados pela empresa (APP_CONFIG.patrimonio.regex_padroes)
  // v1.0.12: usa normalizarPatrimonio() pra corrigir F-FAR perdido pelo OCR e variações
  let m = null;
  const patternsConfig = (APP_CONFIG && APP_CONFIG.patrimonio && APP_CONFIG.patrimonio.regex_padroes) || [];
  for (const padraoStr of patternsConfig) {
    try {
      const re = new RegExp(padraoStr, 'i');
      m = full.match(re);
      if (m) { out.patrimonio = normalizarPatrimonio(m[0]); break; }
    } catch (e) { /* regex inválido, continua */ }
  }

  // 2. Rótulos explícitos: PATRIM/TOMBO/PAT seguidos de código (precisa word boundary p/ não pegar "HP")
  if (!out.patrimonio) {
    m = text.match(/\b(?:patrim[oôó]nio|tombo|patrim\.?|n[ºo°]?\s*patr|pat[\s\.:\-]+)[\s\.:#\-]*([A-Z0-9][A-Z0-9\.\-\/]{3,14})/i);
    if (m) out.patrimonio = m[1].replace(/[\.\/]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  // 3. Padrão numérico de 8 dígitos (configurável)
  if (!out.patrimonio) {
    m = full.match(/\b(4180\d{4})\b/);
    if (m) out.patrimonio = m[1];
  }

  // ===== ETIQUETAS DDE/CDT/DETI vão para observações =====
  // Coleta números já "consumidos" por essas etiquetas pra não virarem patrimônio
  const numerosUsados = new Set();
  const dde = text.match(/DDE\s*[\/\-]?\s*CDT[\s:\-]*([\d\.\-\/]{3,})/i);
  if (dde) {
    out.obs.push('Etiqueta DDE/CDT ' + dde[1]);
    dde[1].match(/\d{3,}/g)?.forEach(n => numerosUsados.add(n));
  }
  const deti = text.match(/DETI[\s:\-]*([\d\.\-\/]{3,})/i);
  if (deti && !out.obs.join(' ').includes('DETI')) {
    out.obs.push('DETI ' + deti[1]);
    deti[1].match(/\d{3,}/g)?.forEach(n => numerosUsados.add(n));
  }

  // Ramal
  const ramal = text.match(/ramal\s*(\d+)/i);
  if (ramal) {
    out.obs.push('Ramal ' + ramal[1]);
    numerosUsados.add(ramal[1]);
  }

  // ===== OP da Positivo (vai pra obs, NÃO virar patrimônio) =====
  const op = text.match(/\bOP[\s:\-]*(\d{6,10})/i);
  if (op) {
    out.obs.push('OP ' + op[1]);
    numerosUsados.add(op[1]);
  }

  // ===== SÉRIE — detectada ANTES do fallback genérico de dígitos =====

  // 1. Rótulos S/N, SN, Serial, Service Tag
  let serieM = text.match(/(?:S[\s\.\/]*N|\bSN|\bSerial(?:\s*Number)?(?:\s*N[ºo°]?)?|Service\s*Tag|Express\s*Service\s*Tag|N[ºo]?\s*S[ée]rie)[\s:#\-\.]*([A-Z0-9][A-Z0-9\-]{4,24})/i);
  if (serieM) out.serie = serieM[1].toUpperCase().replace(/-+$/, '');

  // 2. Sequência alfanumérica típica de serial (letra+vários dígitos+opcional sufixo)
  //    Ex.: BRJ43747CY, 5A407GK14
  if (!out.serie) {
    serieM = full.match(/\b((?:[A-Z]{1,3}\d{4,}[A-Z0-9]{0,5}|\d[A-Z]\d{3,}[A-Z0-9]{2,8}))\b/);
    if (serieM && serieM[1].length >= 7 && serieM[1].length <= 20) out.serie = serieM[1];
  }

  // ===== PATRIMÔNIO - fallback genérico (só depois de tentar série) =====

  // 4. Outros 8 dígitos isolados (provável patrimônio) — exclui números já usados (OP, DDE, DETI, ramal)
  if (!out.patrimonio) {
    const candidatos = [...full.matchAll(/(?<![\dA-Za-z])(\d{8})(?![\dA-Za-z])/g)];
    for (const cand of candidatos) {
      if (numerosUsados.has(cand[1])) continue;
      out.patrimonio = cand[1];
      break;
    }
  }

  // 5. Códigos com formato XXX-XXXXX ou XXX.XXXXX (mas não DDE/CDT/DETI que já foram tratados)
  if (!out.patrimonio) {
    m = text.match(/\b(?!DDE|CDT|DETI|DDE\/CDT)([A-Z]{2,4}[\-\.][A-Z0-9]{3,10})\b/);
    if (m) out.patrimonio = m[1].replace(/\./g, '-');
  }

  // 6. Última cartada: qualquer sequência de 6-10 dígitos isolada (exclui números já usados)
  if (!out.patrimonio) {
    const candidatos = [...full.matchAll(/(?<![\dA-Za-z])(\d{6,10})(?![\dA-Za-z])/g)];
    for (const cand of candidatos) {
      if (numerosUsados.has(cand[1])) continue;
      out.patrimonio = cand[1];
      break;
    }
  }

  // ===== FALLBACK: se não tem patrimônio mas tem série, usa o serial como ID =====
  // E marca explicitamente como "sem etiqueta" pra etiquetar depois
  if (!out.patrimonio && out.serie) {
    out.patrimonio = 'SN-' + out.serie;
    out.obs.push('⚠️ SEM ETIQUETA DE PATRIMÔNIO — identificado pelo nº de série. Etiquetar depois.');
  } else if (!out.patrimonio && !out.serie && (out.marca || out.modelo)) {
    // Não tem nem patrimônio nem série, mas tem marca/modelo (etiqueta do fabricante)
    out.patrimonio = 'Sem etiqueta';
    out.obs.push('⚠️ SEM ETIQUETA DE PATRIMÔNIO NEM SÉRIE — identificado apenas pela etiqueta do fabricante (' + [out.marca, out.modelo].filter(Boolean).join(' ') + '). Etiquetar depois.');
  }

  // ===== MODELO =====
  const modelKeywords = /(?:master|optiplex|elitedesk|elite\s*book|elite|inspiron|latitude|thinkpad|sip\s*t\d*|c\d{4}|microcomputador|pavilion|vostro|ideapad|aspire|prodesk)/i;
  for (const l of linhas) {
    if (modelKeywords.test(l) && l.length < 60) { out.modelo = l.replace(/\s+/g, ' ').trim(); break; }
  }

  return out;
}

// Tela do usuário: procura nome em vários formatos (Title Case, CAIXA ALTA, email)
function parseUserScreen(text) {
  if (!text) return { usuario: '' };
  const linhas = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Conectivos comuns em nomes brasileiros (mantêm minúsculo no Title Case)
  const CONECT = /^(?:da|de|do|das|dos|e|di|du)$/i;

  // 1. Padrão "Olá NOME", "Bem-vindo NOME", "Usuário: NOME" (case-insensitive)
  //    Aceita tanto Title Case quanto CAIXA ALTA, e também "user: nome.sobrenome"
  //    Importante: [^\S\n] = espaço/tab MAS NÃO newline (limita captura à mesma linha)
  const labelRe = /(?:ol[aá]|bem-?vind[oa]|hello|welcome|usu[aá]rio|user|login|nome)[\s,:]+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.'\-]+(?:[^\S\n]+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ.'\-]*){0,6})/iu;
  const m1 = text.match(labelRe);
  if (m1 && m1[1].length >= 3) {
    // Se vier "nome.sobrenome" (com ponto), trata como email-style
    if (/[.\-_]/.test(m1[1]) && !/\s/.test(m1[1])) {
      const parts = m1[1].split(/[.\-_]/).filter(Boolean);
      return { usuario: parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') };
    }
    return { usuario: normalizeNameCase(m1[1]) };
  }

  // 2. Linha em CAIXA ALTA com 2-8 palavras (típica tela de bloqueio Windows)
  //    Ex.: "JULIANA LATOSINSKI DA COSTA E SILVA"
  for (const l of linhas) {
    // Remove caracteres não-letra do início/fim
    const limpa = l.replace(/^[^A-ZÀ-Ýa-zà-ÿ]+|[^A-ZÀ-Ýa-zà-ÿ]+$/gu, '');
    const palavras = limpa.split(/\s+/).filter(Boolean);
    if (palavras.length < 2 || palavras.length > 8) continue;

    const isAllCaps = palavras.every((p) =>
      /^[A-ZÀ-Ý]{2,}$/u.test(p) || CONECT.test(p)
    );
    if (isAllCaps && palavras.some((p) => p.length >= 4)) {
      return { usuario: normalizeNameCase(limpa) };
    }
  }

  // 3. Linha em Title Case com 2-7 palavras
  for (const l of linhas) {
    const limpa = l.replace(/^[^A-ZÀ-Ýa-zà-ÿ]+|[^A-ZÀ-Ýa-zà-ÿ]+$/gu, '');
    const palavras = limpa.split(/\s+/).filter(Boolean);
    if (palavras.length < 2 || palavras.length > 7) continue;

    const isTitle = palavras.every((p) =>
      /^[A-ZÀ-Ý][a-zà-ÿ'\-]+$/u.test(p) || CONECT.test(p)
    );
    if (isTitle && palavras.some((p) => p.length >= 4)) {
      return { usuario: cleanName(limpa) };
    }
  }

  // 4. Email: NOME.SOBRENOME@dominio → converte pra "Nome Sobrenome"
  const email = text.match(/([a-zà-ÿ]+(?:[.\-_][a-zà-ÿ]+){1,4})@/i);
  if (email) {
    const parts = email[1].split(/[.\-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    return { usuario: parts.join(' ') };
  }

  return { usuario: '' };
}

function cleanName(s) {
  return s.replace(/\s+/g, ' ').trim();
}

// Converte "JULIANA LATOSINSKI DA COSTA" → "Juliana Latosinski da Costa"
// Conectivos (da/de/do...) ficam minúsculos. Iniciais maiúsculas.
function normalizeNameCase(s) {
  const CONECT = ['da', 'de', 'do', 'das', 'dos', 'e', 'di', 'du'];
  return s
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w, i) => {
      const low = w.toLowerCase();
      // Primeira palavra sempre capitalizada, conectivos no meio ficam minúsculos
      if (i > 0 && CONECT.includes(low)) return low;
      return low.charAt(0).toUpperCase() + low.slice(1).toLowerCase();
    })
    .join(' ');
}

// ============================================================
// Telas
// ============================================================
function refreshList() {
  const list = $('itemList');
  const empty = $('emptyMsg');
  list.innerHTML = '';
  if (STATE.items.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  // Agrupa por sessionId (ou usuário, pra itens antigos sem sessionId)
  const sessoes = new Map();
  const ordem = [];
  for (const it of STATE.items) {
    const key = it.sessionId || ('legacy-' + (it.usuario || '(sem usuário)'));
    if (!sessoes.has(key)) {
      sessoes.set(key, { sessionId: key, usuario: it.usuario || '(sem usuário)', ramal: it.ramal || '', items: [] });
      ordem.push(key);
    }
    const s = sessoes.get(key);
    s.items.push(it);
    if (!s.ramal && it.ramal) s.ramal = it.ramal;
  }

  ordem.forEach((key, idx) => {
    const s = sessoes.get(key);
    const card = document.createElement('div');
    card.className = 'session-card';
    const ramalLine = s.ramal ? `<div class="session-card-ramal">📞 Ramal: ${escapeHtml(s.ramal)}</div>` : '';
    const itensHtml = s.items.map((it) => {
      const obsBadge = (it.obs && it.obs.toLowerCase().includes('sem etiqueta')) ? ' ⚠️' : '';
      const ident = it.patrimonio && it.patrimonio !== 'Nao capturado'
        ? it.patrimonio
        : (it.serie && it.serie !== '-' ? 'S/N: ' + it.serie : '—');
      const marca = (it.marca && it.marca !== '-') ? ' ' + it.marca : '';
      const modelo = (it.modelo && it.modelo !== '-') ? ' ' + it.modelo : '';
      return `
        <li>
          <span class="tipo-tag">${escapeHtml(it.tipo || '?')}</span>
          <span>${escapeHtml(marca + modelo)} · <strong>${escapeHtml(ident)}</strong>${obsBadge}</span>
        </li>
      `;
    }).join('');

    card.innerHTML = `
      <div class="session-card-head">
        <div>
          <div class="session-card-user">${idx + 1}. ${escapeHtml(s.usuario)}</div>
          ${ramalLine}
        </div>
        <div class="session-card-actions">
          <button data-act="edit-session" data-sid="${key}">Editar</button>
          <button class="del" data-act="del-session" data-sid="${key}">Excluir</button>
        </div>
      </div>
      <ul class="session-card-items">${itensHtml}</ul>
    `;
    list.appendChild(card);
  });
}
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// v1.2.2: funções loadItemIntoForm/readForm/applyExtracted removidas —
// pertenciam à tela de captura manual avulsa (screen-capture), que foi removida.
// O fluxo de cadastro é todo pelo wizard guiado.

// ============================================================
// WIZARD — Captura guiada por usuário
// ============================================================
function startWizard(sessionId) {
  STATE.wizardActive = true;
  STATE.wizardSessionId = sessionId || uid();
  STATE.wizardStep = 0;
  STATE.wizardItems = [];
  STATE.wizardRamal = '';
  STATE.wizardUsuario = '';

  // Se for edição (sessionId já existe), carrega itens existentes pra editar
  if (sessionId) {
    const itens = STATE.items.filter((it) => it.sessionId === sessionId);
    STATE.wizardItems = itens.map((it) => ({ ...it }));
    STATE.wizardRamal = itens.find((it) => it.ramal)?.ramal || '';
    STATE.wizardUsuario = itens.find((it) => it.usuario)?.usuario || '';
  }

  showScreen('screen-wizard');
  wizardRender();
}

function wizardRender() {
  const step = WIZARD_STEPS[STATE.wizardStep];
  const total = WIZARD_STEPS.length;
  const stepNum = STATE.wizardStep + 1;
  // v1.2.1: declarados no topo para evitar erro de TDZ (eram usados antes da declaração)
  const isEquip = ['cpu', 'monitor1', 'monitor2', 'telefone'].includes(step.key);
  const isRamal = step.key === 'ramal';
  const isUser = step.key === 'usuario';

  // Progress bar
  $('wizProgFill').style.width = (stepNum / total * 100) + '%';
  $('wizProgLabel').textContent = `Passo ${stepNum} de ${total} · ${step.titulo}`;
  $('wizStepTitle').textContent = step.titulo;
  $('wizStepSub').textContent = step.sub;

  // Botões
  $('wizBack').style.display = stepNum > 1 ? 'flex' : 'none';
  $('wizSkip').style.display = step.skippable ? 'flex' : 'none';
  if (step.skippable) $('wizSkip').textContent = step.skipLabel || 'Pular';
  $('wizNext').textContent = stepNum === total ? '✓ Finalizar captura' : 'Próximo →';
  if ($('wizSaveNext')) $('wizSaveNext').style.display = (step.key === 'usuario') ? 'flex' : 'none';
  // v1.1.2: botão "Sem etiqueta" só em passos de equipamento
  if ($('wizSemEtiqueta')) $('wizSemEtiqueta').style.display = isEquip ? 'flex' : 'none';
  // v1.1.0: botão "Finalizar inventário" aparece no passo de usuário
  if ($('wizFinishInv')) $('wizFinishInv').style.display = (step.key === 'usuario') ? 'flex' : 'none';

  // Mostrar campos certos
  $('wizFieldsEquip').style.display = isEquip ? 'block' : 'none';
  $('wizFieldsRamal').style.display = isRamal ? 'block' : 'none';
  $('wizFieldsUser').style.display = isUser ? 'block' : 'none';
  // v1.0.10: no passo Usuário, esconder photo box (foto da tela raramente funciona).
  // Usuário pode digitar manualmente ou escolher um chip rápido.
  $('wizPhotoBox').style.display = isEquip ? 'block' : 'none';
  // v1.0.10: popular datalist e chips na entrada do step de usuário
  if (isUser) {
    try { popularUsuariosDatalist(); inicializarChipsUsuario(); } catch (e) {}
  }
  // v1.1.2: ativa autocomplete inteligente de modelos
  if (isEquip) {
    try { ativarAutocompleteWizard(); popularModelosDatalist(($('wMarca') && $('wMarca').value) || ''); } catch (e) {}
  }

  // Limpar foto e status
  $('wizPhoto').src = '';
  $('wizPhoto').classList.remove('show');
  $('wizPhotoBox').classList.remove('has-photo');
  $('wizStatus').textContent = '';
  $('wizStatus').classList.remove('error');
  $('wizProg').classList.remove('active');
  $('wizCamLabel').textContent = step.cam || 'Tirar foto';

  // Hint específico de cada passo
  const hints = {
    cpu: '📸 Centralize a etiqueta de patrimônio. Se o equipamento não tem etiqueta de patrimônio, fotografe a etiqueta do fabricante (marca/modelo/série) — o app vai marcar como "sem etiqueta" pra você etiquetar depois.',
    monitor1: '📸 Foto da etiqueta de patrimônio do monitor. Quanto mais nítida, melhor o OCR identifica.',
    monitor2: '📸 Se a estação tem 2 monitores, fotografe o segundo. Se só tem 1, toque em "Só 1 monitor".',
    telefone: '📸 Foto da etiqueta do telefone IP (se houver). Se não tem telefone, toque em "Sem telefone IP".',
    ramal: '📞 Digite o número do ramal (3-5 dígitos). Pode pular se não tem.',
    usuario: '📸 Opcional: fotografe a tela com o nome do usuário OU digite abaixo. Pode finalizar sem preencher.',
  };
  $('wizHint').innerHTML = `<strong style="color:#1F4E78">${step.titulo}</strong><br>${hints[step.key] || ''}`;

  // Preenche campos com dados já capturados (se edição) ou defaults
  if (isEquip) {
    const idx = ['cpu', 'monitor1', 'monitor2', 'telefone'].indexOf(step.key);
    const existing = STATE.wizardItems[idx];
    if (existing) {
      $('wTipo').value = existing.tipo || step.tipoDefault;
      $('wMarca').value = existing.marca || '';
      $('wModelo').value = existing.modelo || '';
      $('wPatrimonio').value = existing.patrimonio === 'Nao capturado' ? '' : (existing.patrimonio || '');
      $('wSerie').value = existing.serie === '-' ? '' : (existing.serie || '');
      $('wObs').value = existing.obs || '';
    } else {
      $('wTipo').value = step.tipoDefault;
      $('wMarca').value = '';
      $('wModelo').value = '';
      $('wPatrimonio').value = '';
      $('wSerie').value = '';
      $('wObs').value = '';
    }
  } else if (isRamal) {
    $('wRamal').value = STATE.wizardRamal || '';
  } else if (isUser) {
    $('wUsuario').value = STATE.wizardUsuario || '';
  }

  // Resumo do que já foi capturado
  renderWizardSummary();

  // Popula datalist Modelos com histórico
  if (isEquip) updateModelosDatalist();

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateModelosDatalist() {
  const dl = $('modelosList');
  if (!dl) return;
  const modelosCommons = ['Master C4400 Mini', 'OptiPlex', 'EliteDesk 800 G1 SFF', 'Elite E221 21,5"', 'LED 23,8" 24BL550J', 'SIP T31G', 'Microcomputador'];
  const set = new Set(modelosCommons);
  for (const it of STATE.items) if (it.modelo && it.modelo !== '-' && it.modelo.length >= 2) set.add(it.modelo);
  for (const it of (STATE.wizardItems || [])) if (it && it.modelo && it.modelo !== '-') set.add(it.modelo);
  dl.innerHTML = Array.from(set).sort().map((m) => '<option value="' + m.replace(/"/g, '&quot;') + '"></option>').join('');
}

function renderWizardSummary() {
  const box = $('wizSummary');
  const itens = STATE.wizardItems.filter(Boolean);
  if (itens.length === 0 && !STATE.wizardRamal && !STATE.wizardUsuario) {
    box.style.display = 'none';
    return;
  }
  box.style.display = 'block';
  const linhas = [];
  if (STATE.wizardUsuario) linhas.push(`<div class="ss-item"><span class="label">👤 Usuário</span><span>${escapeHtml(STATE.wizardUsuario)}</span></div>`);
  if (STATE.wizardRamal) linhas.push(`<div class="ss-item"><span class="label">📞 Ramal</span><span>${escapeHtml(STATE.wizardRamal)}</span></div>`);
  itens.forEach((it) => {
    if (!it) return;
    const ident = it.patrimonio && it.patrimonio !== 'Nao capturado' ? it.patrimonio : (it.serie && it.serie !== '-' ? 'S/N ' + it.serie : '—');
    linhas.push(`<div class="ss-item"><span class="label">${escapeHtml(it.tipo)}</span><span>${escapeHtml((it.marca || '') + ' ' + (it.modelo || ''))} · ${escapeHtml(ident)}</span></div>`);
  });
  box.innerHTML = `<h4>Já capturado nesta sessão</h4>${linhas.join('')}`;
}

function wizardCaptureCurrent() {
  // Coleta dados do passo atual e armazena
  const step = WIZARD_STEPS[STATE.wizardStep];
  if (['cpu', 'monitor1', 'monitor2', 'telefone'].includes(step.key)) {
    const idx = ['cpu', 'monitor1', 'monitor2', 'telefone'].indexOf(step.key);
    const data = {
      id: STATE.wizardItems[idx]?.id || uid(),
      sessionId: STATE.wizardSessionId,
      tipo: $('wTipo').value,
      marca: $('wMarca').value.trim() || '-',
      modelo: $('wModelo').value.trim() || '-',
      patrimonio: $('wPatrimonio').value.trim() || 'Nao capturado',
      serie: $('wSerie').value.trim() || '-',
      usuario: '',  // preenchido no passo final
      ramal: '',
      obs: $('wObs').value.trim(),
    };
    STATE.wizardItems[idx] = data;
  } else if (step.key === 'ramal') {
    STATE.wizardRamal = $('wRamal').value.trim();
  } else if (step.key === 'usuario') {
    STATE.wizardUsuario = $('wUsuario').value.trim();
  }
}

function wizardValidateCurrent() {
  // v1.2.1: nome do usuário agora é OPCIONAL — nenhum passo bloqueia o avanço.
  // O usuário pode finalizar sem identificar o nome (fica como "(sem usuário)").
  return null;
}

function wizardNext() {
  const err = wizardValidateCurrent();
  if (err) { toast(err, 3000); return; }
  // Checa patrimonio duplicado antes de avancar
  const dupErr = checkDuplicatePatrimonio();
  if (dupErr) {
    if (!confirm(dupErr + '\n\nDeseja continuar mesmo assim?')) return;
  }
  wizardCaptureCurrent();

  if (STATE.wizardStep >= WIZARD_STEPS.length - 1) {
    wizardFinish();
    return;
  }
  STATE.wizardStep++;
  wizardRender();
}

function checkDuplicatePatrimonio() {
  const step = WIZARD_STEPS[STATE.wizardStep];
  if (!['cpu', 'monitor1', 'monitor2', 'telefone'].includes(step.key)) return null;
  const pat = ($('wPatrimonio').value || '').trim();
  if (!pat || pat === 'Nao capturado' || pat === 'Sem etiqueta') return null;
  // Itens ja salvos no inventario (exclui o item atual sendo editado)
  const sid = STATE.wizardSessionId;
  const dup = STATE.items.find((it) =>
    it.patrimonio === pat && it.sessionId !== sid
  );
  if (dup) {
    return 'Patrimonio ' + pat + ' ja existe (usuario: ' + (dup.usuario || '?') + ', tipo: ' + (dup.tipo || '?') + ').';
  }
  // Itens da sessao atual (outros slots)
  const idx = ['cpu', 'monitor1', 'monitor2', 'telefone'].indexOf(step.key);
  for (let i = 0; i < STATE.wizardItems.length; i++) {
    if (i === idx) continue;
    const w = STATE.wizardItems[i];
    if (w && w.patrimonio === pat) {
      return 'Patrimonio ' + pat + ' ja foi usado em outro equipamento desta mesma sessao (' + (w.tipo || '?') + ').';
    }
  }
  return null;
}

function wizardBack() {
  if (STATE.wizardStep <= 0) return;
  wizardCaptureCurrent();  // salva o que tá na tela antes de voltar
  STATE.wizardStep--;
  wizardRender();
}

function wizardSkip() {
  const step = WIZARD_STEPS[STATE.wizardStep];
  if (!step.skippable) return;

  // v1.2.1: pular o passo Usuário (último) finaliza sem nome
  if (step.key === 'usuario') {
    STATE.wizardUsuario = '';
    wizardFinish();
    return;
  }

  // Limpa item nesse slot
  if (['cpu', 'monitor1', 'monitor2', 'telefone'].includes(step.key)) {
    const idx = ['cpu', 'monitor1', 'monitor2', 'telefone'].indexOf(step.key);
    STATE.wizardItems[idx] = null;
  } else if (step.key === 'ramal') {
    STATE.wizardRamal = '';
  }

  // Se pulou Telefone IP, pula tambem Ramal automaticamente (nao faz sentido)
  let pulos = 1;
  if (step.key === 'telefone') {
    STATE.wizardRamal = '';
    pulos = 2;
  }

  if (STATE.wizardStep + pulos >= WIZARD_STEPS.length) {
    // Pulou ate o final, finaliza
    if (STATE.wizardStep + pulos > WIZARD_STEPS.length - 1) {
      // So vai pro proximo step renderavel sem finalizar (ainda tem o de usuario)
      STATE.wizardStep = WIZARD_STEPS.length - 1;
      wizardRender();
      return;
    }
    wizardFinish();
    return;
  }
  STATE.wizardStep += pulos;
  wizardRender();
}

function wizardFinish() {
  // Aplica usuario+ramal a todos os itens da sessão e salva
  const usr = STATE.wizardUsuario.trim();
  const ram = STATE.wizardRamal.trim();
  const sid = STATE.wizardSessionId;
  // v1.2.1: nome opcional — sem nome a sessão é salva como "(sem usuário)"
  const usrLabel = usr || '(sem usuário)';

  // Remove itens antigos dessa sessão (caso seja edição)
  STATE.items = STATE.items.filter((it) => it.sessionId !== sid);

  // Adiciona os novos
  const valid = STATE.wizardItems.filter(Boolean);
  if (valid.length === 0) { toast('Sem equipamentos capturados nesta sessão.', 3000); return; }

  for (const it of valid) {
    it.usuario = usr;
    it.ramal = ram;
    STATE.items.push(it);
  }

  // Reset
  STATE.wizardActive = false;
  STATE.wizardSessionId = null;
  STATE.wizardItems = [];
  STATE.wizardRamal = '';
  STATE.wizardUsuario = '';
  STATE.wizardStep = 0;

  saveState();
  updateTopbar(); updateDashboard();
  refreshList();
  showScreen('screen-list');
  toast(`Sessão de ${usrLabel} salva (${valid.length} equipamento${valid.length > 1 ? 's' : ''}).`);
}

function wizardSaveAndContinue() {
  // Salva sessao atual e abre wizard novo imediatamente
  // Primeiro captura o que ja foi digitado na tela atual
  wizardCaptureCurrent();
  // v1.2.1: nome opcional — salva mesmo sem identificar o usuário
  const usr = (STATE.wizardUsuario || '').trim();
  const usrLabel = usr || '(sem usuário)';
  const ram = (STATE.wizardRamal || '').trim();
  const sid = STATE.wizardSessionId;
  STATE.items = STATE.items.filter((it) => it.sessionId !== sid);
  const valid = STATE.wizardItems.filter(Boolean);
  if (valid.length === 0) { toast('Sem equipamentos para salvar.', 3000); return; }
  for (const it of valid) { it.usuario = usr; it.ramal = ram; STATE.items.push(it); }
  saveState();
  updateTopbar(); updateDashboard();
  toast('Sessao de ' + usrLabel + ' salva. Comece nova captura.');
  // Reinicia o wizard limpo
  startWizard(null);
}

function delSession(sid) {
  if (!confirm('Excluir esta sessão inteira (usuário e todos os equipamentos)?')) return;
  STATE.items = STATE.items.filter((it) => it.sessionId !== sid && ('legacy-' + (it.usuario || '(sem usuário)')) !== sid);
  saveState();
  updateTopbar(); updateDashboard();
  refreshList();
}

// ============================================================
// CÂMERA CUSTOMIZADA (Fase 2) — getUserMedia + zoom + flash + auto-detect
// ============================================================
const CAM = {
  stream: null,
  track: null,
  videoEl: null,
  modal: null,
  zoom: 1.0,
  zoomMin: 1.0,
  zoomMax: 3.0,
  zoomSupported: false,
  torchSupported: false,
  torchOn: false,
  autoDetect: true,
  detectTimer: null,
  resolve: null,
  reject: null,
  active: false,
};

function camSupportsGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

async function openCustomCamera(stepKey) {
  if (!camSupportsGetUserMedia()) {
    return null;  // Fallback pro input file
  }
  CAM.modal = $('cameraModal');
  CAM.videoEl = $('camVideo');
  if (!CAM.modal || !CAM.videoEl) return null;

  CAM.active = true;
  CAM.modal.style.display = 'flex';

  // Ajusta texto guia conforme passo
  const guideEl = document.querySelector('.cam-guide-label');
  if (guideEl) {
    guideEl.textContent = (stepKey === 'usuario')
      ? 'Centralize a tela do usuário aqui'
      : 'Centralize a etiqueta aqui';
  }

  try {
    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      }
    };
    CAM.stream = await navigator.mediaDevices.getUserMedia(constraints);
    CAM.videoEl.srcObject = CAM.stream;
    CAM.track = CAM.stream.getVideoTracks()[0];

    // Detecta capacidades
    const caps = CAM.track.getCapabilities ? CAM.track.getCapabilities() : {};
    CAM.zoomSupported = !!(caps.zoom);
    CAM.torchSupported = !!(caps.torch);

    if (CAM.zoomSupported) {
      CAM.zoomMin = caps.zoom.min || 1.0;
      CAM.zoomMax = Math.min(caps.zoom.max || 3.0, 5.0);
      CAM.zoom = CAM.zoomMin;
      $('camZoomGroup').style.display = 'flex';
      updateCamZoomLabel();
    } else {
      $('camZoomGroup').style.display = 'none';
    }
    $('camTorch').style.display = CAM.torchSupported ? 'flex' : 'none';

    // Auto-detect via OCR
    // v1.1.2: REMOVIDO auto-detect contínuo. Câmera agora SÓ tira foto manual.
    // Usuário aponta, posiciona, aperta o botão central pra capturar.
    CAM.autoDetect = false;

    // Retorna uma Promise que resolve quando o usuário captura
    return new Promise((resolve, reject) => {
      CAM.resolve = resolve;
      CAM.reject = reject;
    });
  } catch (err) {
    console.warn('Câmera customizada falhou:', err);
    closeCustomCamera();
    return null;  // Fallback
  }
}

function updateCamZoomLabel() {
  const el = $('camZoomLabel');
  if (el) el.textContent = CAM.zoom.toFixed(1) + 'x';
}

async function camApplyZoom(zoom) {
  if (!CAM.track || !CAM.zoomSupported) return;
  CAM.zoom = Math.max(CAM.zoomMin, Math.min(CAM.zoomMax, zoom));
  try {
    await CAM.track.applyConstraints({ advanced: [{ zoom: CAM.zoom }] });
    updateCamZoomLabel();
  } catch (e) { console.warn('Zoom falhou:', e); }
}

async function camToggleTorch() {
  if (!CAM.track || !CAM.torchSupported) return;
  CAM.torchOn = !CAM.torchOn;
  try {
    await CAM.track.applyConstraints({ advanced: [{ torch: CAM.torchOn }] });
    const btn = $('camTorch');
    if (btn) btn.classList.toggle('active', CAM.torchOn);
  } catch (e) { console.warn('Torch falhou:', e); CAM.torchOn = false; }
}

function camCaptureFrame() {
  if (!CAM.videoEl || !CAM.active) return null;
  const v = CAM.videoEl;
  const canvas = $('camCanvas');
  canvas.width = v.videoWidth || 1920;
  canvas.height = v.videoHeight || 1080;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function camDoCapture() {
  const canvas = camCaptureFrame();
  if (!canvas) return;
  // Converte canvas pra Blob/File e usa no pipeline OCR
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], 'captura.jpg', { type: 'image/jpeg' });
    const resolveFn = CAM.resolve;
    closeCustomCamera();
    if (resolveFn) resolveFn(file);
  }, 'image/jpeg', 0.92);
}

// v1.1.1: pré-processamento SUAVE — só converte pra grayscale + aumenta contraste sutilmente
// (binarização agressiva da v1.0.12 estava destruindo etiquetas claras tipo "F-FAR-XXXXX")
function camPreprocessForOcr(canvas) {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  try {
    const imgData = ctx.getImageData(0, 0, out.width, out.height);
    const d = imgData.data;
    // Grayscale com curva de contraste suave (multiplicador 1.2 + offset)
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      // Curva suave: amplifica contraste sem clipping agressivo
      let adj = (g - 128) * 1.25 + 128;
      adj = Math.max(0, Math.min(255, adj));
      d[i] = d[i+1] = d[i+2] = adj;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) { /* fallback */ }
  return out;
}

// v1.0.12: Auto-detect agressivo — frequência maior, pré-processamento, fallback IA Groq
function camStartAutoDetect(stepKey) {
  if (CAM.detectTimer) clearInterval(CAM.detectTimer);
  let ultimaConsultaIA = 0;
  let consultandoIA = false;
  CAM.detectTimer = setInterval(async () => {
    if (!CAM.active || !CAM.autoDetect) return;
    const canvas = camCaptureFrame();
    if (!canvas) return;
    try {
      // Reduz pra economia de CPU
      // v1.1.1: resolução aumentada 900→1100 (melhor precisão sem prejuízo de velocidade)
      const small = document.createElement('canvas');
      small.width = 1100;
      small.height = Math.round(canvas.height * (1100 / canvas.width));
      const sctx = small.getContext('2d');
      sctx.drawImage(canvas, 0, 0, small.width, small.height);
      // v1.1.1: OCR de 2 passos — primeiro IMAGEM LIMPA (Tesseract já pré-processa internamente)
      // Se não detectar, tenta com nosso pré-processamento como reforço
      const worker = await getTessWorker();
      const dataUrlOrig = small.toDataURL('image/jpeg', 0.85);
      let ret = await worker.recognize(dataUrlOrig);
      let text = (ret && ret.data && ret.data.text) || '';
      // Se texto curto/vazio, tenta com pré-processamento
      if (text.trim().length < 5) {
        const processed = camPreprocessForOcr(small);
        const dataUrl2 = processed.toDataURL('image/jpeg', 0.85);
        ret = await worker.recognize(dataUrl2);
        text = (ret && ret.data && ret.data.text) || '';
      }

      // v1.0.12: detecta padrões fortes — config + fallback genérico
      let isStrong = false;
      let patrimonioDetectado = '';
      if (stepKey !== 'usuario') {
        const cfgPats = (APP_CONFIG && APP_CONFIG.patrimonio && APP_CONFIG.patrimonio.regex_padroes) || [];
        for (const p of cfgPats) {
          try {
            const re = new RegExp(p, 'i');
            const mm = text.match(re);
            if (mm) {
              patrimonioDetectado = normalizarPatrimonio(mm[0]);
              isStrong = true;
              break;
            }
          } catch {}
        }
        // Fallback genérico: 8 dígitos ou prefixo + 5-6 dígitos
        // v1.1.0: REMOVIDO fallback \d{8} (capturava tomadas "127V" como etiqueta)
      }

      const status = $('camDetectStatus');
      if (status) {
        if (isStrong) {
          status.textContent = patrimonioDetectado
            ? '✓ Patrimônio detectado: ' + patrimonioDetectado + ' — capturando...'
            : '✓ Etiqueta identificada! Capturando...';
          status.className = 'cam-detect-status show ok';
          // Auto-captura mais rápida — 400ms
          setTimeout(() => { if (CAM.active) camDoCapture(); }, 400);
        } else if (text.trim().length > 5) {
          // v1.1.1: mostra preview do texto detectado pra ajudar debug
          const preview = text.replace(/\s+/g, ' ').trim().substring(0, 30);
          status.textContent = '👁 Lendo: "' + preview + '"...';
          status.className = 'cam-detect-status show';
          // v1.0.12: Se há texto mas regex local falhou, tenta IA (não mais que 1x a cada 6s)
          const agora = Date.now();
          if (!consultandoIA && iaDisponivel() && stepKey !== 'usuario' && (agora - ultimaConsultaIA) > 6000) {
            consultandoIA = true;
            ultimaConsultaIA = agora;
            try {
              const iaDados = await extrairCamposComIA(text, null);
              if (iaDados && iaDados.patrimonio && iaDados.patrimonio.length >= 5) {
                const patNorm = normalizarPatrimonio(iaDados.patrimonio);
                if (status) {
                  status.textContent = '🤖 IA encontrou: ' + patNorm + ' — capturando...';
                  status.className = 'cam-detect-status show ok';
                }
                setTimeout(() => { if (CAM.active) camDoCapture(); }, 500);
              }
            } catch (e) { /* silencioso */ }
            consultandoIA = false;
          }
        } else {
          status.textContent = '📷 Aproxime a etiqueta';
          status.className = 'cam-detect-status show';
        }
      }
    } catch (e) { /* silencioso, segue tentando */ }
  }, 1200); // v1.0.12: 1.2s (antes era 2.2s) — quase 2x mais rápido
}

function closeCustomCamera() {
  CAM.active = false;
  if (CAM.detectTimer) { clearInterval(CAM.detectTimer); CAM.detectTimer = null; }
  if (CAM.torchOn && CAM.track) {
    try { CAM.track.applyConstraints({ advanced: [{ torch: false }] }); } catch {}
    CAM.torchOn = false;
  }
  if (CAM.stream) {
    CAM.stream.getTracks().forEach((t) => t.stop());
    CAM.stream = null;
  }
  CAM.track = null;
  if (CAM.videoEl) CAM.videoEl.srcObject = null;
  if (CAM.modal) CAM.modal.style.display = 'none';
  const status = $('camDetectStatus');
  if (status) { status.className = 'cam-detect-status'; status.textContent = ''; }
}

// ============================================================
// DASHBOARD — gera gráficos PNG via Chart.js e embute no .xlsx
// ============================================================
function createChartPNG(type, data, options, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);

    const chart = new Chart(canvas, {
      type,
      data,
      options: {
        responsive: false,
        animation: false,
        ...options,
      },
    });

    // Espera o chart renderizar
    setTimeout(() => {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        chart.destroy();
        canvas.remove();
        resolve(base64);
      } catch (e) {
        canvas.remove();
        reject(e);
      }
    }, 50);
  });
}

async function addDashboardSheet(wb, items, ordemSessoes, sessoes) {
  const wsD = wb.addWorksheet('Dashboard', { views: [{ showGridLines: false }] });
  wsD.columns = Array(12).fill({ width: 12 });

  // ===== Título =====
  wsD.mergeCells('A1:L2');
  wsD.getCell('A1').value = 'DASHBOARD - ' + (STATE.setor || 'Inventário').toUpperCase();
  wsD.getCell('A1').font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  wsD.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  wsD.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  wsD.getRow(1).height = 26;
  wsD.getRow(2).height = 26;

  wsD.mergeCells('A3:L3');
  wsD.getCell('A3').value = `Levantamento de ${fmtDateBR(STATE.data)} · Total de ${items.length} equipamentos em ${ordemSessoes.length} estações`;
  wsD.getCell('A3').font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF555555' } };
  wsD.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };
  wsD.getRow(3).height = 22;

  // ===== KPI Cards =====
  const tipos = {};
  for (const it of items) tipos[it.tipo] = (tipos[it.tipo] || 0) + 1;
  const totalCPUs = tipos['CPU'] || 0;
  const totalMonitores = tipos['Monitor'] || 0;
  const totalTelefones = tipos['Telefone IP'] || 0;
  const totalSemEtiqueta = items.filter((it) => (it.obs || '').includes('SEM ETIQUETA')).length;
  const usuariosUnicos = new Set(items.map((it) => it.usuario).filter(Boolean)).size;

  const cards = [
    { label: 'TOTAL EQUIPAMENTOS', value: items.length, color: 'FF1F4E78' },
    { label: 'USUÁRIOS', value: usuariosUnicos, color: 'FF2E7D32' },
    { label: 'CPUs', value: totalCPUs, color: 'FF1976D2' },
    { label: 'MONITORES', value: totalMonitores, color: 'FF388E3C' },
    { label: 'TELEFONES IP', value: totalTelefones, color: 'FFE65100' },
    { label: 'SEM ETIQUETA', value: totalSemEtiqueta, color: 'FFC62828' },
  ];
  cards.forEach((card, idx) => {
    const col = (idx % 3) * 4 + 1; // A, E, I (1, 5, 9)
    const row = 5 + Math.floor(idx / 3) * 4;
    const colEnd = String.fromCharCode(64 + col + 3);
    const colStart = String.fromCharCode(64 + col);
    wsD.mergeCells(`${colStart}${row}:${colEnd}${row}`);
    wsD.mergeCells(`${colStart}${row + 1}:${colEnd}${row + 1}`);
    // Label
    wsD.getCell(`${colStart}${row}`).value = card.label;
    wsD.getCell(`${colStart}${row}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    wsD.getCell(`${colStart}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: card.color } };
    wsD.getCell(`${colStart}${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
    wsD.getRow(row).height = 22;
    // Valor
    wsD.getCell(`${colStart}${row + 1}`).value = card.value;
    wsD.getCell(`${colStart}${row + 1}`).font = { name: 'Calibri', size: 28, bold: true, color: { argb: card.color } };
    wsD.getCell(`${colStart}${row + 1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
    wsD.getCell(`${colStart}${row + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
    wsD.getCell(`${colStart}${row + 1}`).border = { bottom: { style: 'medium', color: { argb: card.color } } };
    wsD.getRow(row + 1).height = 40;
  });

  // Gera gráficos
  try {
    // ===== Pie chart: Distribuição por tipo =====
    const tiposLabels = Object.keys(tipos);
    const tiposValores = Object.values(tipos);
    const pieColors = ['#1F4E78', '#2E7D32', '#E65100', '#7B1FA2', '#C62828', '#00838F', '#5D4037'];
    const pieBase64 = await createChartPNG('doughnut',
      {
        labels: tiposLabels,
        datasets: [{
          data: tiposValores,
          backgroundColor: pieColors.slice(0, tiposLabels.length),
          borderColor: '#ffffff',
          borderWidth: 3,
        }]
      },
      {
        plugins: {
          legend: { position: 'right', labels: { font: { size: 13 } } },
          title: { display: true, text: 'Distribuicao por Tipo de Equipamento', font: { size: 16, weight: 'bold' }, color: '#1F4E78' },
        },
      },
      640, 360
    );
    const pieId = wb.addImage({ base64: pieBase64, extension: 'png' });
    wsD.addImage(pieId, { tl: { col: 0, row: 14 }, ext: { width: 640, height: 360 } });

    // ===== Bar chart: Top marcas =====
    const marcas = {};
    for (const it of items) {
      const m = (it.marca || '-').trim();
      if (m && m !== '-') marcas[m] = (marcas[m] || 0) + 1;
    }
    const marcasOrd = Object.entries(marcas).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (marcasOrd.length > 0) {
      const barMarcasBase64 = await createChartPNG('bar',
        {
          labels: marcasOrd.map((x) => x[0]),
          datasets: [{ label: 'Equipamentos', data: marcasOrd.map((x) => x[1]), backgroundColor: '#1F4E78', borderRadius: 4 }]
        },
        {
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top Marcas', font: { size: 16, weight: 'bold' }, color: '#1F4E78' },
          },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } },
        },
        640, 360
      );
      const barMarcasId = wb.addImage({ base64: barMarcasBase64, extension: 'png' });
      wsD.addImage(barMarcasId, { tl: { col: 0, row: 35 }, ext: { width: 640, height: 360 } });
    }

    // ===== Bar chart: Top usuarios (horizontal) =====
    const porUsr = {};
    for (const it of items) {
      const u = (it.usuario || '(sem usuario)').trim();
      porUsr[u] = (porUsr[u] || 0) + 1;
    }
    const usrOrd = Object.entries(porUsr).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (usrOrd.length > 0) {
      const barUsrBase64 = await createChartPNG('bar',
        {
          labels: usrOrd.map((x) => x[0].length > 22 ? x[0].slice(0, 22) + '...' : x[0]),
          datasets: [{ label: 'Equipamentos', data: usrOrd.map((x) => x[1]), backgroundColor: '#2E7D32', borderRadius: 4 }]
        },
        {
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top 10 Usuarios (por no de equipamentos)', font: { size: 16, weight: 'bold' }, color: '#1F4E78' },
          },
          scales: { x: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } },
        },
        640, 400
      );
      const barUsrId = wb.addImage({ base64: barUsrBase64, extension: 'png' });
      wsD.addImage(barUsrId, { tl: { col: 0, row: 56 }, ext: { width: 640, height: 400 } });
    }
  } catch (e) {
    console.error('Erro ao gerar graficos do dashboard:', e);
    wsD.getCell('A14').value = 'Nao foi possivel gerar graficos (' + (e.message || e) + ')';
    wsD.getCell('A14').font = { color: { argb: 'FFC62828' } };
  }
}

// ============================================================
// Geracao de planilha .xlsx
// ============================================================
async function gerarPlanilha() {
  const items = STATE.items;
  if (!items.length) { toast('Nenhum item para exportar.'); return; }

  // Ordena por sessao/usuario
  const sessoes = new Map();
  const ordemSessoes = [];
  for (const it of items) {
    const key = it.sessionId || ('legacy-' + (it.usuario || ''));
    if (!sessoes.has(key)) {
      sessoes.set(key, { usuario: it.usuario || '(sem usuario)', ramal: it.ramal || '', items: [] });
      ordemSessoes.push(key);
    }
    const s = sessoes.get(key);
    s.items.push(it);
    if (!s.ramal && it.ramal) s.ramal = it.ramal;
  }
  const itensOrdenados = [];
  for (const key of ordemSessoes) {
    for (const it of sessoes.get(key).items) itensOrdenados.push(it);
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = (APP_CONFIG.empresa.nome || 'OpenInvTI');
  wb.created = new Date();

  // ===== Aba 1: Inventario =====
  const ws = wb.addWorksheet('Inventario', { pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true } });
  ws.columns = [
    { key: 'num', width: 5 }, { key: 'tipo', width: 12 }, { key: 'marca', width: 13 },
    { key: 'modelo', width: 22 }, { key: 'patrimonio', width: 17 }, { key: 'serie', width: 15 },
    { key: 'usuario', width: 32 }, { key: 'ramal', width: 10 }, { key: 'obs', width: 42 },
  ];

  const titulo = (STATE.titulo || APP_CONFIG.empresa.titulo || 'INVENTARIO DE EQUIPAMENTOS DE TI').toUpperCase();
  ws.mergeCells('A1:I1');
  ws.getCell('A1').value = titulo;
  ws.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 24;

  ws.mergeCells('A2:I2');
  const setorStr = STATE.setor ? ' - Setor: ' + STATE.setor : '';
  ws.getCell('A2').value = 'Levantamento de ' + fmtDateBR(STATE.data) + setorStr + '. Itens agrupados por usuario (sessao de captura).';
  ws.getCell('A2').font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF555555' } };
  ws.getCell('A2').alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ws.getRow(2).height = 26;

  const headers = ['#', 'Tipo', 'Marca', 'Modelo', 'No Patrimonio', 'No de Serie', 'Usuario', 'Ramal', 'Observacoes'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(3, i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin', color: { argb: 'FF1F4E78' } }, bottom: { style: 'thin', color: { argb: 'FF1F4E78' } } };
  });
  ws.getRow(3).height = 20;

  itensOrdenados.forEach((it, idx) => {
    const r = 4 + idx;
    ws.getCell(r, 1).value = idx + 1;
    ws.getCell(r, 2).value = it.tipo || '';
    ws.getCell(r, 3).value = it.marca || '-';
    ws.getCell(r, 4).value = it.modelo || '-';
    ws.getCell(r, 5).value = it.patrimonio || 'Nao capturado';
    ws.getCell(r, 6).value = it.serie || '-';
    ws.getCell(r, 7).value = it.usuario || '(sem usuário)';
    ws.getCell(r, 8).value = it.ramal || '';
    ws.getCell(r, 9).value = it.obs || '';
    for (let c = 1; c <= 9; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { vertical: 'top', wrapText: c === 9 || c === 4 || c === 7 };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
    }
    ws.getCell(r, 1).alignment = { horizontal: 'center', vertical: 'top' };
    ws.getCell(r, 8).alignment = { horizontal: 'center', vertical: 'top' };
    if (it.obs && it.obs.includes('SEM ETIQUETA')) {
      for (let c = 1; c <= 9; c++) ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF59D' } };
    } else if (idx % 2 === 1) {
      for (let c = 1; c <= 9; c++) ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F9FB' } };
    }
  });

  ws.views = [{ state: 'frozen', ySplit: 3 }];
  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3 + itensOrdenados.length, column: 9 } };

  // ===== Aba 2: Resumo =====
  const wsR = wb.addWorksheet('Resumo');
  wsR.columns = [{ width: 18 }, { width: 14 }, { width: 50 }];
  wsR.mergeCells('A1:C1');
  wsR.getCell('A1').value = 'RESUMO POR TIPO';
  wsR.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  wsR.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  wsR.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  wsR.getRow(1).height = 22;

  ['Tipo', 'Quantidade', 'Observacao'].forEach((h, i) => {
    const cell = wsR.getCell(2, i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    cell.alignment = { horizontal: 'center' };
  });

  const tipos = Array.from(new Set(items.map((i) => i.tipo).filter(Boolean)));
  const tiposPadrao = ['CPU', 'Monitor', 'Telefone IP'];
  for (const t of tiposPadrao) if (!tipos.includes(t)) tipos.push(t);
  tipos.sort((a, b) => {
    const ia = tiposPadrao.indexOf(a), ib = tiposPadrao.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1; if (ib === -1) return -1;
    return ia - ib;
  });

  const lastRow = 3 + items.length;
  tipos.forEach((t, idx) => {
    const r = 3 + idx;
    wsR.getCell(r, 1).value = t;
    wsR.getCell(r, 2).value = { formula: 'COUNTIF(Inventario!B4:B' + lastRow + ', "' + t + '")' };
    const marcasTipo = Array.from(new Set(items.filter((i) => i.tipo === t).map((i) => i.marca).filter((m) => m && m !== '-')));
    wsR.getCell(r, 3).value = marcasTipo.join(', ');
    for (let c = 1; c <= 3; c++) {
      wsR.getCell(r, c).font = { name: 'Calibri', size: 10 };
      wsR.getCell(r, c).alignment = { vertical: 'middle' };
    }
    wsR.getCell(r, 2).alignment = { horizontal: 'center', vertical: 'middle' };
  });
  const totalRow = 3 + tipos.length;
  wsR.getCell(totalRow, 1).value = 'TOTAL';
  wsR.getCell(totalRow, 2).value = { formula: 'SUM(B3:B' + (totalRow - 1) + ')' };
  for (let c = 1; c <= 3; c++) {
    wsR.getCell(totalRow, c).font = { name: 'Calibri', size: 10, bold: true };
    wsR.getCell(totalRow, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF2FB' } };
  }
  wsR.getCell(totalRow, 2).alignment = { horizontal: 'center' };

  // ===== Aba 3: Usuarios =====
  const wsU = wb.addWorksheet('Usuarios');
  wsU.columns = [{ width: 5 }, { width: 36 }, { width: 10 }, { width: 50 }];
  wsU.mergeCells('A1:D1');
  wsU.getCell('A1').value = 'USUARIOS IDENTIFICADOS';
  wsU.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  wsU.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
  wsU.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  wsU.getRow(1).height = 22;

  ['#', 'Nome completo', 'Ramal', 'Observacao'].forEach((h, i) => {
    const cell = wsU.getCell(2, i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
    cell.alignment = { horizontal: 'center' };
  });

  ordemSessoes.forEach((key, idx) => {
    const s = sessoes.get(key);
    const r = 3 + idx;
    wsU.getCell(r, 1).value = idx + 1;
    wsU.getCell(r, 2).value = s.usuario;
    wsU.getCell(r, 3).value = s.ramal || '';
    const cont = { CPU: 0, Monitor: 0, 'Telefone IP': 0, outros: 0 };
    for (const i of s.items) {
      if (cont[i.tipo] !== undefined) cont[i.tipo]++; else cont.outros++;
    }
    const partes = [];
    if (cont.CPU) partes.push(cont.CPU + ' CPU' + (cont.CPU > 1 ? 's' : ''));
    if (cont.Monitor) partes.push(cont.Monitor + ' monitor' + (cont.Monitor > 1 ? 'es' : ''));
    if (cont['Telefone IP']) partes.push(cont['Telefone IP'] + ' telefone' + (cont['Telefone IP'] > 1 ? 's' : ''));
    if (cont.outros) partes.push(cont.outros + ' outro(s)');
    wsU.getCell(r, 4).value = partes.join(' + ');
    for (let c = 1; c <= 4; c++) {
      wsU.getCell(r, c).font = { name: 'Calibri', size: 10 };
      wsU.getCell(r, c).alignment = { vertical: 'middle', wrapText: c === 4 };
    }
    wsU.getCell(r, 1).alignment = { horizontal: 'center' };
    wsU.getCell(r, 3).alignment = { horizontal: 'center' };
  });

  // ===== Aba 4: Dashboard =====
  await addDashboardSheet(wb, items, ordemSessoes, sessoes);

  // ===== Salva e dispara download =====
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  // v1.0.11: formato AAAA-MM-DD_NomeDoSetor.xlsx (cronológico ordenado, sem prefixo)
  const nomeSet = (STATE.setor || 'Setor').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dataIso = (STATE.data || todayIso()); // já vem yyyy-mm-dd
  const nomeArquivo = dataIso + '_' + nomeSet + '.xlsx';

  // Guarda globalmente pra botao de compartilhar usar (ArrayBuffer, mais robusto)
  window._lastPlanilhaBuf = buf;
  window._lastPlanilhaBlob = blob;
  window._lastPlanilhaNome = nomeArquivo;

  // Dispara download tradicional
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);

  // SEMPRE mostra botao de compartilhar (cai pra modal se Web Share falhar)
  const btnShare = $('btnShare');
  if (btnShare) btnShare.style.display = 'flex';

  // Feedback visual rico ao usuario com instrucoes claras
  showDownloadFeedback({
    tipo: 'planilha',
    nome: nomeArquivo,
    icone: '📊',
    titulo: 'Planilha gerada e baixada!',
  });
}

// Modal de feedback pos-download com botoes diretos pra apps (WhatsApp/Email/Teams via Web Share)
function showDownloadFeedback({ tipo, nome, icone, titulo }) {
  // Remove modal anterior se existir
  const old = document.getElementById('downloadFeedbackModal');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'downloadFeedbackModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s;';

  const setor = (STATE.setor || 'Setor').replace(/[^a-zA-Z0-9 _-]/g, '');
  const data = STATE.data || todayIso();
  const totalItens = (STATE.items || []).length;
  // v1.0.8: texto enxuto, sem link do projeto (compartilhamos apenas o arquivo)
  const textoCompartilhar = `Inventario de TI - ${setor} - ${data}\n${totalItens} equipamento(s) registrado(s)`;

  overlay.innerHTML = `
    <div style="background:#1E293B;border-radius:14px;padding:24px;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(56,189,248,0.2);max-height:90vh;overflow-y:auto;">
      <div style="font-size:48px;text-align:center;margin-bottom:8px;">${icone}</div>
      <h3 style="color:#7DD3FC;margin:0 0 12px;text-align:center;font-size:18px;">${titulo}</h3>
      <div style="background:rgba(56,189,248,0.08);border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12px;color:#E2E8F0;word-break:break-all;font-family:monospace;text-align:center;">${nome}</div>
      <button id="dlFbShareFile" style="width:100%;padding:14px;background:linear-gradient(135deg,#0EA5E9,#0284C7);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:10px;box-shadow:0 4px 14px rgba(14,165,233,0.3);">
        📤 Compartilhar arquivo (WhatsApp / Teams / Email / Drive)
      </button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
        <button id="dlFbWhats" style="padding:10px 6px;background:#25D366;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">💬 WhatsApp</button>
        <button id="dlFbEmail" style="padding:10px 6px;background:#0F766E;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">📧 Email</button>
      </div>
      <details style="margin-bottom:14px;">
        <summary style="cursor:pointer;color:#94A3B8;font-size:12px;padding:6px 0;">📂 Como achar o arquivo manualmente?</summary>
        <div style="font-size:12px;color:#94A3B8;line-height:1.6;padding:8px 4px;">
          📱 Android: app <strong>Arquivos</strong> → <strong>Downloads</strong><br>
          🌐 Chrome: menu (⋮) → <strong>Downloads</strong> / <strong>Transferências</strong><br>
          💻 PC: pasta <strong>Downloads</strong> do seu usuario
        </div>
      </details>
      <button id="dlFbClose" style="width:100%;padding:11px;background:transparent;color:#94A3B8;border:1.5px solid #334155;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;">Fechar</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('dlFbClose').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  // Botao principal: Web Share com arquivo (abre menu nativo com WhatsApp, Teams, Drive, etc)
  document.getElementById('dlFbShareFile').onclick = async () => {
    if (tipo === 'planilha') {
      try { await compartilharPlanilha(); } catch (e) { console.error(e); }
    } else if (tipo === 'pdf' && window._lastPdfBlob) {
      try {
        const file = new File([window._lastPdfBlob], window._lastPdfNome || 'inventario.pdf', { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Inventario de TI', text: textoCompartilhar });
        } else {
          toast('Seu navegador nao suporta compartilhar arquivos diretamente. Abre WhatsApp/Email e anexa do Downloads.', 5000);
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
      }
    }
  };

  // v1.0.8: WhatsApp via Web Share (compartilha O ARQUIVO direto, sem link promocional)
  document.getElementById('dlFbWhats').onclick = async () => {
    try {
      let file = null;
      if (tipo === 'planilha' && window._lastPlanilhaBuf) {
        file = new File([window._lastPlanilhaBuf], nome, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else if (tipo === 'planilha' && window._lastPlanilhaBlob) {
        file = new File([window._lastPlanilhaBlob], nome, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else if (tipo === 'pdf' && window._lastPdfBlob) {
        file = new File([window._lastPdfBlob], nome, { type: 'application/pdf' });
      }
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] }); // só o arquivo, sem texto promocional
        return;
      }
      // Fallback: abre WhatsApp Web no chat picker (sem link/texto promocional)
      window.open('https://wa.me/', '_blank');
      toast('Anexe o arquivo "' + nome + '" da pasta Downloads.', 5000);
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  };

  // Atalho: Email
  document.getElementById('dlFbEmail').onclick = () => {
    const subject = encodeURIComponent('Inventario de TI - ' + setor + ' - ' + data);
    const body = encodeURIComponent(textoCompartilhar + '\n\n(Anexe o arquivo "' + nome + '" da pasta Downloads.)');
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
    toast('Abrindo email. Anexe o arquivo da pasta Downloads.', 5000);
  };
}

async function compartilharPlanilha() {
  if (!window._lastPlanilhaBuf && !window._lastPlanilhaBlob) {
    toast('Gere a planilha primeiro antes de compartilhar.');
    return;
  }

  const nome = window._lastPlanilhaNome || 'Inventario.xlsx';
  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // Tier 1: Web Share API com arquivo (melhor, funciona em Chrome Android)
  try {
    const buf = window._lastPlanilhaBuf;
    let file;
    if (buf) {
      file = new File([buf], nome, { type: mime, lastModified: Date.now() });
    } else {
      file = new File([window._lastPlanilhaBlob], nome, { type: mime, lastModified: Date.now() });
    }
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
  } catch (err) {
    if (err.name === 'AbortError') return; // usuario cancelou, ok
    console.warn('Web Share files falhou:', err.name, err.message);
  }

  // Tier 2: Modal customizado com instrucoes claras
  abrirShareModal();
}

function abrirShareModal() {
  // Remove modal antigo se existir
  const old = document.getElementById('shareModal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'shareModal';
  modal.className = 'share-modal-bg';
  const nome = window._lastPlanilhaNome || 'planilha.xlsx';

  modal.innerHTML = '<div class="share-modal">' +
    '<h3>Compartilhar planilha</h3>' +
    '<p class="share-modal-sub">Arquivo: <strong>' + nome + '</strong></p>' +
    '<div class="share-modal-info">' +
      'O compartilhamento direto pelo app foi bloqueado pelo sistema. ' +
      'A planilha foi salva em <strong>Downloads</strong>. Para compartilhar:' +
    '</div>' +
    '<ol class="share-modal-steps">' +
      '<li>Abra o app desejado (WhatsApp, Outlook, Gmail, Teams...)</li>' +
      '<li>Toque em <strong>📎 Anexar</strong> ou <strong>+</strong></li>' +
      '<li>Escolha <strong>Documento / Arquivo</strong></li>' +
      '<li>Navegue até <strong>Downloads</strong> e selecione <strong>' + nome + '</strong></li>' +
    '</ol>' +
    '<div class="share-modal-btns">' +
      '<button class="btn btn-primary" id="shareTryAgain">🔁 Tentar compartilhar de novo</button>' +
      '<button class="btn btn-secondary" id="shareDownload">⬇️ Baixar novamente</button>' +
      '<button class="btn btn-secondary" id="shareClose">Fechar</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(modal);

  document.getElementById('shareClose').onclick = () => modal.remove();
  document.getElementById('shareTryAgain').onclick = async () => {
    modal.remove();
    // Tenta de novo, mas agora sem o canShare check (forca o share)
    try {
      const buf = window._lastPlanilhaBuf;
      const file = buf
        ? new File([buf], nome, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        : new File([window._lastPlanilhaBlob], nome, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      await navigator.share({ files: [file] });
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast('Ainda nao foi possivel. Anexe manualmente do Downloads.');
      }
    }
  };
  document.getElementById('shareDownload').onclick = () => {
    if (!window._lastPlanilhaBlob) return;
    const url = URL.createObjectURL(window._lastPlanilhaBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
    modal.remove();
  };
}

// v1.0.10: Persistência de analistas e usuários frequentes — pra autocomplete
function registrarAnalista(nome) {
  if (!nome || nome.length < 2) return;
  try {
    localStorage.setItem('openinvti-ultimo-analista', nome);
    const lista = JSON.parse(localStorage.getItem('openinvti-analistas') || '[]');
    const i = lista.indexOf(nome);
    if (i >= 0) lista.splice(i, 1);
    lista.unshift(nome);
    localStorage.setItem('openinvti-analistas', JSON.stringify(lista.slice(0, 20)));
  } catch (e) {}
}
function popularAnalistasDatalist() {
  const dl = document.getElementById('analistasList');
  if (!dl) return;
  try {
    const lista = JSON.parse(localStorage.getItem('openinvti-analistas') || '[]');
    dl.innerHTML = lista.map(n => '<option value="' + n.replace(/"/g, '&quot;') + '"></option>').join('');
  } catch (e) {}
}
// v1.1.2: Aprende com o uso — registra marca/modelo digitado manualmente
function registrarMarcaModelo(marca, modelo) {
  if (!marca && !modelo) return;
  try {
    const key = 'openinvti-base-equipamentos';
    const base = JSON.parse(localStorage.getItem(key) || '{}');
    if (marca) {
      base.marcas = base.marcas || {};
      base.marcas[marca] = (base.marcas[marca] || 0) + 1;
    }
    if (modelo && marca) {
      base.modelosPorMarca = base.modelosPorMarca || {};
      if (!base.modelosPorMarca[marca]) base.modelosPorMarca[marca] = {};
      base.modelosPorMarca[marca][modelo] = (base.modelosPorMarca[marca][modelo] || 0) + 1;
    }
    localStorage.setItem(key, JSON.stringify(base));
  } catch (e) {}
}

function popularModelosDatalist(marca) {
  const dl = document.getElementById('modelosList');
  if (!dl) return;
  try {
    const key = 'openinvti-base-equipamentos';
    const base = JSON.parse(localStorage.getItem(key) || '{}');
    let modelos = [];
    // Modelos da marca atual
    if (marca && base.modelosPorMarca && base.modelosPorMarca[marca]) {
      modelos = Object.entries(base.modelosPorMarca[marca])
        .sort((a, b) => b[1] - a[1])
        .map(e => e[0]);
    }
    // Adiciona também os usados em inventário atual
    for (const it of (STATE.items || [])) {
      if (it.modelo && !modelos.includes(it.modelo)) modelos.push(it.modelo);
    }
    dl.innerHTML = modelos.slice(0, 30).map(m => '<option value="' + m.replace(/"/g, '&quot;') + '"></option>').join('');
  } catch (e) {}
}

// Hook quando marca muda, atualiza modelos sugeridos
function ativarAutocompleteWizard() {
  const wMarca = document.getElementById('wMarca');
  if (wMarca && !wMarca.dataset.autoBound) {
    wMarca.dataset.autoBound = '1';
    wMarca.addEventListener('input', () => popularModelosDatalist(wMarca.value));
    wMarca.addEventListener('change', () => popularModelosDatalist(wMarca.value));
  }
}

// v1.1.2: Marca item como "sem etiqueta" pra etiquetar depois
function marcarSemEtiqueta() {
  if ($('wPatrimonio')) $('wPatrimonio').value = 'SEM ETIQUETA';
  if ($('wObs')) {
    const cur = ($('wObs').value || '').trim();
    const obs = 'SEM ETIQUETA - PENDENTE ETIQUETAR';
    $('wObs').value = cur ? (cur + ' · ' + obs) : obs;
  }
  toast('✓ Marcado como SEM ETIQUETA. Etiquetar depois.', 3500);
}

// ==================================================
// v1.2.0: Indicador de Auto-save visual
// ==================================================
let _autoSaveTimer = null;
function mostrarIndicadorSave(texto, classe) {
  let el = document.getElementById('saveIndicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'saveIndicator';
    el.className = 'save-indicator';
    document.body.appendChild(el);
  }
  el.textContent = texto || '✓ Salvo';
  el.className = 'save-indicator show ' + (classe || 'ok');
  if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => { el.className = 'save-indicator'; }, 2200);
}
// Hook no saveState para mostrar indicador
const _originalSaveState = (typeof saveState === 'function') ? saveState : null;
window._mostrarSaveAfter = function() { mostrarIndicadorSave('💾 Salvo', 'ok'); };

// ==================================================
// v1.2.0: BarcodeDetector API (Chrome nativo)
// ==================================================
async function lerCodigoBarras() {
  if (!('BarcodeDetector' in window)) {
    toast('⚠️ Seu navegador não suporta leitura nativa de código de barras. Use OCR.', 4500);
    return null;
  }
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.capture = 'environment';
  const file = await new Promise((resolve) => {
    fileInput.onchange = (e) => resolve(e.target.files && e.target.files[0]);
    fileInput.click();
  });
  if (!file) return null;
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = URL.createObjectURL(file);
    });
    const detector = new BarcodeDetector({
      formats: ['code_128', 'ean_13', 'ean_8', 'code_39', 'qr_code', 'codabar']
    });
    const codes = await detector.detect(img);
    URL.revokeObjectURL(img.src);
    if (codes && codes.length > 0) {
      const raw = codes[0].rawValue || '';
      const normalizado = normalizarPatrimonio(raw);
      toast('✓ Código de barras lido: ' + (normalizado || raw), 4000);
      return normalizado || raw;
    }
    toast('⚠️ Nenhum código de barras detectado. Tente OCR.', 3500);
    return null;
  } catch (e) {
    toast('Erro ao ler código: ' + (e.message || e), 4000);
    return null;
  }
}

// ==================================================
// v1.2.0: IA Vision — identifica equipamento pela foto
// v1.2.3: aceita arquivo direto (pra usar como assistente automático)
// ==================================================
async function identificarEquipamentoComIAFromFile(file, silent) {
  if (!iaDisponivel()) { if (!silent) toast('IA não disponível agora.', 3000); return null; }
  if (!file) return null;
  if (!silent) toast('🤖 IA analisando a foto…', 2500);
  try {
    // Converte pra base64 reduzido
    const dataUrl = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    return await _identificarEquipamentoCore(dataUrl);
  } catch (e) {
    console.warn('IA Vision (from file) falhou:', e.message);
    if (!silent) toast('⚠️ IA Vision indisponível agora.', 3500);
  }
  return null;
}

async function identificarEquipamentoComIA() {
  if (!iaDisponivel()) { toast('IA não disponível agora.', 3000); return null; }
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.capture = 'environment';
  const file = await new Promise((resolve) => {
    fileInput.onchange = (e) => resolve(e.target.files && e.target.files[0]);
    fileInput.click();
  });
  if (!file) return null;
  return await identificarEquipamentoComIAFromFile(file, false);
}

async function _identificarEquipamentoCore(dataUrl) {
  try {
    // Mensagem multimodal (texto + imagem) — JSON mode é aplicado por chamarIA
    const messages = [{
      role: 'user',
      content: [
        { type: 'text', text: 'Você é um especialista em equipamentos de TI corporativos. Analise a foto do equipamento e identifique tipo, marca e modelo visíveis. O campo "tipo" DEVE ser exatamente um destes: CPU, Monitor, Notebook, Impressora, Telefone IP, Outro. Se não tiver certeza da marca ou do modelo, deixe a string vazia (não invente). Responda APENAS com JSON válido, sem markdown, no formato: {"tipo":"...","marca":"...","modelo":"..."}' },
        { type: 'image_url', image_url: { url: dataUrl } }
      ]
    }];
    // v1.2.2: modelos de visão mais recentes da Groq — Llama 4 Maverick (mais inteligente)
    // com fallback automático para Llama 4 Scout (mais rápido) se o primeiro indisponível.
    let parsed = null, lastErr = null;
    for (const model of GROQ_VISION_MODELS) {
      try {
        const content = await chamarIA(messages, { model: model, max_tokens: 300, temperature: 0.1 });
        const txt = content || '';
        try { parsed = JSON.parse(txt); }
        catch (e1) { const m = txt.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); }
        if (parsed) break;
      } catch (e2) { lastErr = e2; console.warn('IA Vision (' + model + ') falhou:', e2.message); }
    }
    if (parsed) return parsed;
    if (lastErr) throw lastErr;
    return null;
  } catch (e) {
    console.warn('IA Vision falhou:', e.message);
  }
  return null;
}

// ==================================================
// v1.2.0: IA Copiloto — dicas proativas
// ==================================================
function abrirCopilotoIA() {
  const old = document.getElementById('historyModal');
  if (old) old.remove();
  const items = STATE.items || [];
  const porTipo = {};
  items.forEach(it => { porTipo[it.tipo || 'Outro'] = (porTipo[it.tipo || 'Outro'] || 0) + 1; });
  const sessoes = new Set(items.map(i => i.sessionId || ('l-' + (i.usuario || '')))).size;
  const usuarios = new Set(items.map(i => i.usuario).filter(Boolean)).size;
  const semEtiqueta = items.filter(i => /SEM ETIQUETA/i.test(i.patrimonio || i.obs || '')).length;
  const sugestoes = [];
  if (items.length === 0) {
    sugestoes.push('🎯 Comece tocando em "+ Nova captura" pra cadastrar o primeiro equipamento.');
  } else {
    sugestoes.push('📊 Você cadastrou ' + items.length + ' equipamento(s) em ' + sessoes + ' sessão(ões).');
    if (sessoes > 0) sugestoes.push('👥 Usuários únicos: ' + usuarios + '.');
    if (semEtiqueta > 0) sugestoes.push('🏷️ ' + semEtiqueta + ' item(ns) sem etiqueta — lembre-se de etiquetar depois!');
    const cpus = porTipo['CPU'] || 0;
    const mons = porTipo['Monitor'] || 0;
    if (cpus > 0 && mons === 0) sugestoes.push('⚠️ Você cadastrou ' + cpus + ' CPU(s) mas nenhum monitor. Conferir se faltou.');
    if (cpus > 0 && mons / cpus < 1) sugestoes.push('💡 Razão monitor/CPU = ' + (mons/cpus).toFixed(1) + '. Estações geralmente têm 1-2 monitores por CPU.');
    if (items.length >= 30) sugestoes.push('🎉 Mais de 30 equipamentos! Não esqueça de gerar a planilha antes de arquivar.');
  }
  const overlay = document.createElement('div');
  overlay.id = 'historyModal';
  overlay.className = 'history-modal-bg';
  overlay.innerHTML = '<div class="history-modal">' +
    '<button class="hm-close" id="hmCloseBtn">Fechar ×</button>' +
    '<h3>🤖 Copiloto IA — Dicas para este inventário</h3>' +
    '<div class="hm-arch-meta">' + sugestoes.map(s => '<div style="margin-bottom:8px;line-height:1.6;color:#E2E8F0">' + s + '</div>').join('') + '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  document.getElementById('hmCloseBtn').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ==================================================
// v1.2.0: Importar inventário existente (.xlsx)
// ==================================================
async function importarPlanilhaXlsx() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xlsx,.xls';
  const file = await new Promise((resolve) => {
    fileInput.onchange = (e) => resolve(e.target.files && e.target.files[0]);
    fileInput.click();
  });
  if (!file) return;
  if (!window.ExcelJS) { toast('ExcelJS não carregado. Recarregue o app.', 4000); return; }
  toast('📥 Lendo planilha…', 2500);
  try {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const ws = wb.worksheets[0];
    if (!ws) { toast('Planilha vazia.', 3000); return; }
    const importados = [];
    let header = null;
    ws.eachRow({ includeEmpty: false }, (row, num) => {
      const vals = row.values || [];
      if (num === 1 || num === 2) {
        const all = vals.map(v => (v || '').toString().toUpperCase()).join(' ');
        if (/TIPO|MARCA|MODELO|PATRIM/.test(all)) { header = vals.map(v => (v||'').toString().toUpperCase().trim()); return; }
      }
      if (!header) return;
      const obj = {};
      header.forEach((h, i) => { obj[h] = (vals[i] || '').toString().trim(); });
      const tipo = obj['TIPO'] || obj['EQUIPAMENTO'] || '';
      const marca = obj['MARCA'] || '';
      const modelo = obj['MODELO'] || '';
      const pat = obj['PATRIMÔNIO'] || obj['PATRIMONIO'] || obj['Nº PATR'] || obj['N° PATR'] || obj['PATR'] || '';
      const serie = obj['SÉRIE'] || obj['SERIE'] || obj['Nº SÉRIE'] || obj['N° SÉRIE'] || '';
      const usuario = obj['USUÁRIO'] || obj['USUARIO'] || obj['RESPONSÁVEL'] || '';
      if (tipo || pat) {
        importados.push({
          id: uid(),
          sessionId: 'imp-' + Date.now() + '-' + importados.length,
          tipo: tipo, marca: marca, modelo: modelo,
          patrimonio: pat, serie: serie || '-', usuario: usuario,
          obs: 'Importado da planilha ' + (file.name || ''),
        });
      }
    });
    if (importados.length === 0) { toast('Nenhum item reconhecido na planilha.', 4500); return; }
    if (!confirm('Importar ' + importados.length + ' item(ns)?\n\nIsso vai ADICIONAR ao inventário atual.')) return;
    STATE.items = (STATE.items || []).concat(importados);
    await saveState();
    updateTopbar(); updateDashboard();
    if (typeof refreshList === 'function') refreshList();
    toast('✓ ' + importados.length + ' item(ns) importado(s)!', 4500);
  } catch (e) {
    console.error(e);
    toast('Erro ao importar: ' + (e.message || e), 5000);
  }
}

// ==================================================
// v1.2.0: Dashboard Analítico (Chart.js)
// ==================================================
function abrirDashboardAnalitico() {
  const old = document.getElementById('historyModal');
  if (old) old.remove();
  const items = STATE.items || [];
  const historico = STATE.historicoSessoes || [];
  const todosItems = items.concat(...(historico.map(h => h.items || [])));
  const porMarca = {};
  const porTipo = {};
  const porUsuario = {};
  todosItems.forEach(it => {
    if (it.marca) porMarca[it.marca] = (porMarca[it.marca] || 0) + 1;
    if (it.tipo) porTipo[it.tipo] = (porTipo[it.tipo] || 0) + 1;
    if (it.usuario) porUsuario[it.usuario] = (porUsuario[it.usuario] || 0) + 1;
  });
  const topMarcas = Object.entries(porMarca).sort((a,b)=>b[1]-a[1]).slice(0, 8);
  const topUsuarios = Object.entries(porUsuario).sort((a,b)=>b[1]-a[1]).slice(0, 5);
  const overlay = document.createElement('div');
  overlay.id = 'historyModal';
  overlay.className = 'history-modal-bg';
  let html = '<div class="history-modal" style="max-width:680px">' +
    '<button class="hm-close" id="hmCloseBtn">Fechar ×</button>' +
    '<h3>📊 Análise do Inventário</h3>' +
    '<div class="hm-arch-meta">' +
    '<div style="font-size:18px;color:#67E8F9;margin-bottom:4px"><strong>' + todosItems.length + '</strong> equipamentos no total</div>' +
    '<div>📦 Sessão atual: ' + items.length + ' · 🗂️ Arquivados: ' + (todosItems.length - items.length) + '</div>' +
    '</div>';
  if (Object.keys(porTipo).length > 0) {
    html += '<div style="margin:14px 0"><div style="font-size:12px;font-weight:700;color:#67E8F9;margin-bottom:8px">▸ Por tipo</div>';
    Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).forEach(([t,n]) => {
      const pct = Math.round((n/todosItems.length)*100);
      html += '<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:12px;color:#E2E8F0"><span>' + t + '</span><span>' + n + ' (' + pct + '%)</span></div>' +
        '<div style="background:rgba(13,20,36,0.7);border-radius:6px;height:6px;margin-top:2px"><div style="background:linear-gradient(90deg,#06B6D4,#34D399);width:' + pct + '%;height:100%;border-radius:6px"></div></div></div>';
    });
    html += '</div>';
  }
  if (topMarcas.length > 0) {
    html += '<div style="margin:14px 0"><div style="font-size:12px;font-weight:700;color:#34D399;margin-bottom:8px">▸ Top marcas</div>';
    topMarcas.forEach(([m,n]) => {
      const pct = Math.round((n/todosItems.length)*100);
      html += '<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:12px;color:#E2E8F0"><span>' + m + '</span><span>' + n + '</span></div>' +
        '<div style="background:rgba(13,20,36,0.7);border-radius:6px;height:6px;margin-top:2px"><div style="background:#FCD34D;width:' + pct + '%;height:100%;border-radius:6px"></div></div></div>';
    });
    html += '</div>';
  }
  if (topUsuarios.length > 0) {
    html += '<div style="margin:14px 0"><div style="font-size:12px;font-weight:700;color:#A78BFA;margin-bottom:8px">▸ Top usuários (equipamentos)</div>';
    topUsuarios.forEach(([u,n]) => {
      html += '<div class="hm-item" style="padding:8px 12px"><strong style="font-size:13px">' + u + '</strong><span style="float:right;color:#67E8F9">' + n + ' equip</span></div>';
    });
    html += '</div>';
  }
  if (historico.length > 0) {
    html += '<div style="margin:14px 0"><div style="font-size:12px;font-weight:700;color:#FB7185;margin-bottom:8px">▸ Inventários arquivados</div>';
    historico.forEach(h => {
      html += '<div class="hm-item" style="padding:8px 12px"><strong style="font-size:13px">' + (h.setor || '-') + '</strong>' +
        '<span style="float:right;color:#94A3B8;font-size:11px">' + (h.totalItens || 0) + ' itens · ' + (h.data ? fmtDateBR(h.data) : '') + '</span></div>';
    });
    html += '</div>';
  }
  html += '</div>';
  overlay.innerHTML = html;
  document.body.appendChild(overlay);
  document.getElementById('hmCloseBtn').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

function popularUsuariosDatalist() {
  const dl = document.getElementById('usuariosList');
  if (!dl) return;
  const usuariosUsados = new Set();
  for (const it of (STATE.items || [])) if (it.usuario) usuariosUsados.add(it.usuario);
  for (const h of (STATE.historicoSessoes || [])) {
    if (Array.isArray(h.usuarios)) h.usuarios.forEach(u => usuariosUsados.add(u));
  }
  ['Estação compartilhada', 'Sem usuário fixo', 'Multiusuário'].forEach(u => usuariosUsados.add(u));
  dl.innerHTML = Array.from(usuariosUsados).sort().map(n => '<option value="' + n.replace(/"/g, '&quot;') + '"></option>').join('');
}
function inicializarChipsUsuario() {
  const wrap = document.getElementById('wizFieldsUser');
  if (!wrap) return;
  wrap.querySelectorAll('.user-chip').forEach((c) => c.classList.remove('active'));
  const valAtual = ($('wUsuario') && $('wUsuario').value || '').trim();
  if (valAtual) {
    const match = wrap.querySelector('.user-chip[data-quick="' + valAtual.replace(/"/g, '\\"') + '"]');
    if (match) match.classList.add('active');
  }
}

// v1.0.10: Modal genérico — abre lista de itens por tipo
function abrirItensPorTipo(tipo) {
  const old = document.getElementById('historyModal');
  if (old) old.remove();
  const items = (STATE.items || []).filter(it => (it.tipo || 'Outro') === tipo);
  const overlay = document.createElement('div');
  overlay.id = 'historyModal';
  overlay.className = 'history-modal-bg';
  const iconeMap = { 'CPU': '🖥️', 'Monitor': '🖼️', 'Telefone IP': '📞', 'Notebook': '💻', 'Impressora': '🖨️', 'Outro': '📦' };
  const icone = iconeMap[tipo] || '📦';
  let conteudo;
  if (items.length === 0) {
    conteudo = '<div class="hm-empty">Nenhum ' + tipo + ' registrado nesta sessão.</div>';
  } else {
    conteudo = items.map((it, i) => {
      const sid = it.sessionId || ('legacy-' + (it.usuario || ''));
      return '<div class="hm-item hm-item-editable" data-sid="' + sid + '">' +
        '<div class="hm-item-body">' +
          '<strong>' + (i+1) + '. ' + (it.marca || '-') + ' ' + (it.modelo || '') + '</strong>' +
          '<div class="hm-sub">' +
            (it.patrimonio ? 'Patr: ' + it.patrimonio + ' · ' : '') +
            (it.serie ? 'SN: ' + it.serie + ' · ' : '') +
            (it.usuario ? '👤 ' + it.usuario : '(sem usuário)') +
          '</div>' +
        '</div>' +
        '<button type="button" class="hm-item-edit" data-sid="' + sid + '" title="Editar esta estação">✏️</button>' +
      '</div>';
    }).join('');
  }
  overlay.innerHTML =
    '<div class="history-modal">' +
      '<button class="hm-close" id="hmCloseBtn">Fechar ×</button>' +
      '<h3>' + icone + ' ' + tipo + ' (' + items.length + ')</h3>' +
      conteudo +
    '</div>';
  document.body.appendChild(overlay);
  document.getElementById('hmCloseBtn').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  // v1.0.11: clicar em item OU no lápis ✏️ → abre wizard pra editar
  overlay.querySelectorAll('.hm-item-edit, .hm-item-editable').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const archEl = e.target.closest('[data-arch-id]');
      if (archEl) { abrirInventarioArquivado(archEl.dataset.archId); return; }
      const sid = (e.currentTarget.dataset && e.currentTarget.dataset.sid)
                 || (e.target.closest('[data-sid]') && e.target.closest('[data-sid]').dataset.sid);
      if (sid) editarSessaoDoModal(sid);
    });
  });
  // v1.1.0: clicar no item arquivado inteiro
  overlay.querySelectorAll('.hm-item-archived').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = el.dataset.archId;
      if (id) abrirInventarioArquivado(id);
    });
  });
}

// v1.0.8/v1.0.10: Monta um relatório formatado em texto e dispara WhatsApp + planilha
function montarRelatorioTexto() {
  const setor = STATE.setor || '(sem setor)';
  const data = fmtDateBR(STATE.data || todayIso());
  const empresa = (APP_CONFIG.empresa && APP_CONFIG.empresa.nome) || 'Empresa';
  const titulo = STATE.titulo || (APP_CONFIG.empresa && APP_CONFIG.empresa.titulo) || 'Inventário de TI';
  const analista = STATE.analista || '';
  const items = STATE.items || [];
  const total = items.length;
  const porTipo = {};
  for (const it of items) {
    const t = it.tipo || 'Outro';
    porTipo[t] = (porTipo[t] || 0) + 1;
  }
  const usuariosUnicos = new Set(items.map(i => i.usuario).filter(Boolean)).size;
  const sessoesUnicas = new Set(items.map(i => i.sessionId || ('legacy-' + (i.usuario || '')))).size;
  const linhas = [];
  linhas.push('*' + titulo + '*');
  linhas.push('');
  linhas.push('🏢 *Empresa:* ' + empresa);
  linhas.push('📍 *Setor:* ' + setor);
  linhas.push('📅 *Data:* ' + data);
  if (analista) linhas.push('👤 *Analista responsável:* ' + analista);
  linhas.push('');
  linhas.push('📦 *Total de itens:* ' + total);
  linhas.push('👥 *Usuários únicos:* ' + usuariosUnicos);
  linhas.push('🗂️ *Sessões / estações:* ' + sessoesUnicas);
  linhas.push('');
  linhas.push('📊 *Resumo por tipo:*');
  const ordemTipos = ['CPU', 'Notebook', 'Monitor', 'Telefone IP', 'Impressora', 'Outro'];
  const tiposVistos = new Set();
  for (const t of ordemTipos) {
    if (porTipo[t]) { linhas.push('• ' + t + ': ' + porTipo[t]); tiposVistos.add(t); }
  }
  for (const t in porTipo) {
    if (!tiposVistos.has(t)) linhas.push('• ' + t + ': ' + porTipo[t]);
  }
  linhas.push('');
  linhas.push('📎 Planilha completa em anexo (.xlsx)');
  return linhas.join('\n');
}

async function enviarRelatorioWhatsApp() {
  if (!STATE.items || STATE.items.length === 0) {
    toast('Nenhum item para reportar. Adicione equipamentos primeiro.');
    return;
  }
  // v1.1.0: PLANILHA SEMPRE PRIMEIRO — backup automático em Downloads
  toast('Gerando planilha .xlsx (backup em Downloads)…', 2500);
  try {
    await gerarPlanilha();
  } catch (e) {
    toast('❌ ERRO ao gerar planilha: ' + (e.message || e) + '. Tente de novo.', 6000);
    return;
  }
  const textoRelatorio = montarRelatorioTexto();
  const nome = window._lastPlanilhaNome || 'Inventario.xlsx';
  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  let file = null;
  try {
    if (window._lastPlanilhaBuf) file = new File([window._lastPlanilhaBuf], nome, { type: mime, lastModified: Date.now() });
    else if (window._lastPlanilhaBlob) file = new File([window._lastPlanilhaBlob], nome, { type: mime, lastModified: Date.now() });
  } catch (e) { /* ignore */ }
  // Tier 1: Web Share API com arquivo + texto (Chrome Android: WhatsApp aparece na lista)
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: textoRelatorio, title: 'Inventário de TI' });
      return;
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.warn('Web Share falhou, tentando fallback:', err.message);
  }
  // Tier 2: Copia o texto pro clipboard e abre wa.me
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textoRelatorio);
      toast('Relatório copiado! Cole no WhatsApp e anexe a planilha.', 5500);
    }
  } catch (e) { /* ignore */ }
  const wppUrl = 'https://wa.me/?text=' + encodeURIComponent(textoRelatorio);
  window.open(wppUrl, '_blank');
}

// v1.0.8/v1.0.9: Extração inteligente de TODOS os campos via IA
// Recebe o texto OCR e retorna { tipo, marca, modelo, patrimonio, serie, observacoes }
// v1.0.9: usa Cloudflare proxy quando PROXY_URL setado (chave fica protegida no worker)
async function extrairCamposComIA(textoOCR, contextoTipo) {
  if (!iaDisponivel()) return null;
  const padroes = (APP_CONFIG.patrimonio && APP_CONFIG.patrimonio.regex_padroes) || [];
  const marcasConhecidas = (APP_CONFIG.marcas || []).slice(0, 30).join(', ');
  const prompt = 'Você é um assistente especialista em inventário de TI. Analise o texto abaixo (extraído via OCR de uma etiqueta de equipamento corporativo) e extraia os campos do equipamento.\n\n' +
    'TEXTO OCR:\n```\n' + (textoOCR || '').substring(0, 1500) + '\n```\n\n' +
    (contextoTipo ? 'CONTEXTO: o usuário está cadastrando um(a) ' + contextoTipo + ', mas confirme pelo texto.\n\n' : '') +
    'PADRÕES DE PATRIMÔNIO conhecidos da empresa: ' + (padroes.join(' | ') || '(não definido)') + '\n' +
    'MARCAS conhecidas: ' + marcasConhecidas + '\n\n' +
    'Retorne APENAS um JSON válido (sem markdown) com EXATAMENTE esta estrutura:\n' +
    '{"tipo":"CPU|Monitor|Telefone IP|Notebook|Impressora|Outro","marca":"...","modelo":"...","patrimonio":"...","serie":"...","observacoes":"..."}\n\n' +
    'Regras:\n' +
    '- Se algum campo não estiver claro no texto, retorne string vazia "".\n' +
    '- "tipo" DEVE ser um dos 6 valores acima.\n' +
    '- "patrimonio" deve casar com algum padrão conhecido (se houver).\n' +
    '- "serie" é o S/N do fabricante, geralmente alfanumérico longo.\n' +
    '- "observacoes" pode ter info adicional relevante (etiqueta DDE/CDT, nº de bem, departamento, etc.) — máximo 80 chars.\n' +
    '- NÃO invente dados. Se não encontrou, retorne "".';
  const content = await chamarIA(
    [
      { role: 'system', content: 'Você responde APENAS com JSON válido, sem markdown, sem texto adicional.' },
      { role: 'user', content: prompt }
    ],
    { temperature: 0.1, max_tokens: 400 }
  );
  let parsed;
  try { parsed = JSON.parse(content); }
  catch (e) {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} }
  }
  if (!parsed) throw new Error('IA retornou formato inválido');
  // Normaliza campos
  const tiposValidos = ['CPU', 'Monitor', 'Telefone IP', 'Notebook', 'Impressora', 'Outro'];
  return {
    tipo: tiposValidos.includes(parsed.tipo) ? parsed.tipo : '',
    marca: (parsed.marca || '').toString().trim(),
    modelo: (parsed.modelo || '').toString().trim(),
    patrimonio: (parsed.patrimonio || '').toString().trim(),
    serie: (parsed.serie || '').toString().trim(),
    observacoes: (parsed.observacoes || '').toString().trim().substring(0, 200),
  };
}

// v1.0.8: Auto-detecta tipo do equipamento por palavras-chave no texto OCR
function detectarTipoPorOCR(texto) {
  if (!texto) return null;
  const t = texto.toUpperCase();
  // Telefone IP (mais específico primeiro pra evitar falsos positivos)
  if (/\b(YEALINK|IP\s?PHONE|VOIP|TELEFONE\s?IP|GRANDSTREAM|POLYCOM|RAMAL|EXTENSION|HEADSET\s?IP)\b/.test(t)) return 'Telefone IP';
  if (/\bSIP\s?\d{3,5}\b/.test(t)) return 'Telefone IP';
  // Notebook
  if (/\b(NOTEBOOK|LAPTOP|THINKPAD|INSPIRON|LATITUDE|IDEAPAD|MACBOOK|VIVOBOOK|ELITEBOOK|PROBOOK|ULTRABOOK|VAIO|SWIFT|GAMING\s?BOOK|YOGA)\b/.test(t)) return 'Notebook';
  // Impressora
  if (/\b(IMPRESSORA|PRINTER|MULTIFUNCION|LASERJET|DESKJET|OFFICEJET|ECOSYS|WORKCENTRE|PHASER|TASKALFA|BIZHUB|PIXMA|EPSON\s?L\d{2,4}|MFC|DCP)\b/.test(t)) return 'Impressora';
  // Monitor
  if (/\b(MONITOR|MONIT\.|DISPLAY|LCD|LED|UHD|QHD|FHD|FULLHD|"|POLEGADAS?|POL\.?|HDMI|VGA|DVI|DISPLAYPORT|IPS|TN\s|VA\s)\b/.test(t)) return 'Monitor';
  if (/\b\d{2}\s?(POL|"|INCH|INCHES)\b/.test(t)) return 'Monitor';
  // CPU / Desktop (mais genérico, vem por último)
  if (/\b(WORKSTATION|DESKTOP|MINI\s?PC|TINY\s?PC|OPTIPLEX|PRECISION|THINKCENTRE|PRODESK|ELITEDESK|MICRO\s?TOWER|TOWER|CPU)\b/.test(t)) return 'CPU';
  return null;
}

// ============================================================
// Listeners
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  // v1.2.4: BOOT — atualiza subtítulo com APP_VERSION imediato, ANTES de qualquer tela
  // (antes só rodava em updateTopbar, que só dispara na tela home — então setup-empresa ficava com versão velha hardcoded)
  try {
    const sub = document.getElementById('topSub');
    if (sub) sub.textContent = APP_TAGLINE + ' · v' + APP_VERSION;
  } catch (e) {}

  // v1.0.9: Aplica preset de empresa via ?preset=XXX na URL antes de qualquer coisa
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const preset = urlParams.get('preset');
    // v1.2.4: re-aplica preset mesmo se setup_done já = true (permite reusar link quando user limpa dados)
    if (preset && EMPRESA_PRESETS[preset.toLowerCase()]) {
      aplicarPresetEmpresa(preset);
      // Limpa o parâmetro da URL pra não reaplicar em refresh
      try { history.replaceState(null, '', window.location.pathname); } catch (e) {}
    }
  } catch (e) { console.warn('Erro aplicando preset:', e); }

  // v1.0.9: Se proxy de IA está hardcoded, esconde campo da chave Groq do setup
  try {
    if (typeof PROXY_URL === 'string' && PROXY_URL.startsWith('http')) {
      const grpKeyField = document.getElementById('cfgGroqKey');
      if (grpKeyField && grpKeyField.parentElement) grpKeyField.parentElement.style.display = 'none';
    }
  } catch (e) {}

  // FAILSAFE: garante que pelo menos uma tela está ativa, mesmo se algo travar depois
  try {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const initial = APP_CONFIG.setup_done ? 'screen-start' : 'screen-setup';
    const el = document.getElementById(initial);
    if (el) el.classList.add('active');
  } catch (e) { console.error('Failsafe screen falhou:', e); }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch((e) => console.warn('SW falhou', e));
  }

  // === SETUP INICIAL OpenInvTI ===
  if (!APP_CONFIG.setup_done) {
    showScreen('screen-setup');
    if ($('cfgEmpresa')) $('cfgEmpresa').value = APP_CONFIG.empresa.nome || '';
    if ($('cfgTitulo')) $('cfgTitulo').value = APP_CONFIG.empresa.titulo || '';
    if ($('cfgMarcas')) $('cfgMarcas').value = (APP_CONFIG.marcas || []).join(', ');
    if ($('cfgPatRegex')) $('cfgPatRegex').value = '';
  }
  if ($('cfgSalvar')) $('cfgSalvar').onclick = () => {
    const emp = ($('cfgEmpresa').value || '').trim();
    if (!emp) { toast('Informe o nome da empresa.'); return; }
    APP_CONFIG.empresa.nome = emp;
    APP_CONFIG.empresa.titulo = ($('cfgTitulo').value || 'INVENTARIO DE EQUIPAMENTOS DE TI').trim();
    const marcasStr = ($('cfgMarcas').value || '').trim();
    if (marcasStr) APP_CONFIG.marcas = marcasStr.split(',').map(s => s.trim()).filter(Boolean);
    const patRegex = ($('cfgPatRegex').value || '').trim();
    if (patRegex) {
      APP_CONFIG.patrimonio.regex_padroes = patRegex.split(/\n|\s*\|\s*/).map(r => r.trim()).filter(Boolean);
    }
    // v1.1.0: auto-detect Farmanguinhos/Fiocruz no nome da empresa
    if (/farmanguinhos|fiocruz|f[-_\s]?far/i.test(emp)) {
      APP_CONFIG.patrimonio.normalizar = 'far';
      const regexAtuais = (APP_CONFIG.patrimonio.regex_padroes || []).join(' ');
      if (!/41|F.{0,3}FAR/i.test(regexAtuais)) {
        APP_CONFIG.patrimonio.regex_padroes = [
          '\\b41\\d{6}\\b',
          'F[-_\\s]?FAR[-_\\s]?\\d{5}',
          '\\bFAR[-_\\s]?\\d{5}\\b',
          '\\b\\d{6}\\b'
        ];
      }
    }
    // v1.0.8: salva chave Groq se informada
    if ($('cfgGroqKey')) {
      const groqKey = ($('cfgGroqKey').value || '').trim();
      if (!APP_CONFIG.ai) APP_CONFIG.ai = { groq_key: '', model: 'llama-3.3-70b-versatile' };
      APP_CONFIG.ai.groq_key = groqKey;
    }
    APP_CONFIG.setup_done = true;
    saveConfig(APP_CONFIG);
    if ($('tituloInv')) $('tituloInv').value = APP_CONFIG.empresa.titulo;
    if ($('marcasList')) $('marcasList').innerHTML = APP_CONFIG.marcas.map(m => '<option value="' + m.replace(/"/g,'&quot;') + '"></option>').join('');
    toast('Configuracao salva! Bem-vindo ao ' + emp + '.');
    showScreen('screen-start');
  };
  // Botao Configuracoes no topbar abre a tela de setup
  if ($('settingsBtn')) $('settingsBtn').onclick = () => {
    if ($('cfgEmpresa')) $('cfgEmpresa').value = APP_CONFIG.empresa.nome || '';
    if ($('cfgTitulo')) $('cfgTitulo').value = APP_CONFIG.empresa.titulo || '';
    if ($('cfgMarcas')) $('cfgMarcas').value = (APP_CONFIG.marcas || []).join(', ');
    // v1.0.8: mostra todos os regex unidos com | quando há mais de um
    if ($('cfgPatRegex')) $('cfgPatRegex').value = (APP_CONFIG.patrimonio.regex_padroes || []).join(' | ');
    if ($('cfgGroqKey')) $('cfgGroqKey').value = (APP_CONFIG.ai && APP_CONFIG.ai.groq_key) || '';
    if ($('cfgPadroesSugestoes')) { $('cfgPadroesSugestoes').innerHTML = ''; $('cfgPadroesSugestoes').style.display = 'none'; }
    showScreen('screen-setup');
  };
  if ($('cfgDetectarPadrao')) $('cfgDetectarPadrao').onclick = () => detectarPadraoPorFoto();
  if ($('cfgResetar')) $('cfgResetar').onclick = async () => {
    if (!confirm('Apagar TODA a configuração e inventários? Esta acao é irreversível.')) return;
    if (!confirm('Confirme novamente: apagar mesmo?')) return;
    try {
      localStorage.removeItem('openinvti-config');
      await clearState();
      // Apaga também dashboard via APP_CONFIG default
      APP_CONFIG = Object.assign({}, DEFAULT_CONFIG);
      STATE.items = [];
      STATE.data = ''; STATE.setor = ''; STATE.titulo = '';
      STATE.historicoSessoes = []; // zera tambem o dashboard cumulativo
      toast('Tudo limpo! Reiniciando...', 1500);
      setTimeout(() => location.reload(), 1200);
    } catch (e) { toast('Erro ao limpar: ' + e.message); }
  };
  if ($('tituloInv') && APP_CONFIG.setup_done && APP_CONFIG.empresa.titulo) {
    $('tituloInv').value = APP_CONFIG.empresa.titulo;
  }
  if ($('marcasList') && APP_CONFIG.marcas && APP_CONFIG.marcas.length > 0) {
    $('marcasList').innerHTML = APP_CONFIG.marcas.map(m => '<option value="' + m.replace(/"/g,'&quot;') + '"></option>').join('');
  }

  const saved = await loadState();
  // BUG #1 FIX: SEMPRE carrega historicoSessoes (mesmo se nao tem inventario atual em andamento)
  if (saved && Array.isArray(saved.historicoSessoes)) {
    STATE.historicoSessoes = saved.historicoSessoes;
  }
  if (saved && saved.items && saved.items.length > 0) {
    $('btnResume').style.display = 'flex';
    $('btnResume').onclick = () => {
      Object.assign(STATE, saved);
      $('dataInv').value = STATE.data;
      $('setorInv').value = STATE.setor;
      $('tituloInv').value = STATE.titulo || '';
      updateTopbar(); updateDashboard();
      refreshList();
      showScreen('screen-list');
    };
  }
  // Renderiza dashboard com historico carregado (mesmo sem inventario atual)
  updateDashboard();
  $('dataInv').value = todayIso();

  // v1.0.11: Auto-gerar título do inventário baseado no setor digitado
  // Só sobrescreve se o usuário NÃO editou manualmente o título (rastreado via dataset.manual)
  if ($('setorInv') && $('tituloInv')) {
    const setorEl = $('setorInv');
    const tituloEl = $('tituloInv');
    // Detecta edição manual do título — a partir daí, não sobrescreve mais
    tituloEl.addEventListener('input', () => {
      tituloEl.dataset.manual = '1';
    });
    setorEl.addEventListener('input', () => {
      if (tituloEl.dataset.manual === '1') return;
      const s = setorEl.value.trim();
      tituloEl.value = s ? ('INVENTÁRIO DO SETOR ' + s.toUpperCase()) : 'INVENTARIO DE EQUIPAMENTOS DE TI';
    });
  }

  $('btnStart').onclick = () => {
    const data = $('dataInv').value;
    const setor = $('setorInv').value.trim();
    if (!data) { toast('Informe a data.'); return; }
    if (!setor) { toast('Informe o setor.'); return; }
    STATE.data = data;
    STATE.setor = setor;
    // v1.0.10: persiste analista responsável (opcional)
    if ($('analistaInv')) {
      const analista = $('analistaInv').value.trim();
      STATE.analista = analista;
      if (analista) registrarAnalista(analista);
    }
    STATE.titulo = $('tituloInv').value.trim();
    STATE.items = [];
    saveState();
    updateTopbar(); updateDashboard();
    refreshList();
    showScreen('screen-list');
    warmupOcr();
  };
  // v1.0.10: popula datalist do analista ao abrir tela inicial e restaura último valor
  if ($('analistaInv')) {
    popularAnalistasDatalist();
    if (STATE.analista) {
      $('analistaInv').value = STATE.analista;
    } else {
      const ultimoAnalista = localStorage.getItem('openinvti-ultimo-analista');
      if (ultimoAnalista) $('analistaInv').value = ultimoAnalista;
    }
  }
  // v1.0.10: botão Voltar na tela de lista — volta pro dashboard inicial
  if ($('listBack')) $('listBack').onclick = () => showScreen('screen-start');
  // v1.0.10: chips rápidos da tela de usuário
  if ($('wizFieldsUser')) {
    $('wizFieldsUser').querySelectorAll('.user-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.quick || '';
        if ($('wUsuario')) {
          $('wUsuario').value = val;
          $('wUsuario').focus();
          if (val) $('wUsuario').blur(); // se for um quick pré-preenchido, fecha teclado
        }
        // Marca o chip ativo
        $('wizFieldsUser').querySelectorAll('.user-chip').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  $('btnAdd').onclick = () => { startWizard(null); };

  // v1.2.2: botões da tela inicial (estavam sem ação ligada)
  if ($('btnImport')) $('btnImport').onclick = async () => {
    try { await importarPlanilhaXlsx(); } catch (e) { toast('Erro ao importar: ' + (e.message || e), 4000); }
  };
  if ($('btnAnalytics')) $('btnAnalytics').onclick = () => {
    try { abrirDashboardAnalitico(); } catch (e) { toast('Erro ao abrir análise: ' + (e.message || e), 4000); }
  };
  if ($('btnCopilot')) $('btnCopilot').onclick = () => {
    try { abrirCopilotoIA(); } catch (e) { toast('Erro ao abrir copiloto: ' + (e.message || e), 4000); }
  };

  // Wizard
  $('wizNext').onclick = () => wizardNext();
  // v1.1.2: botão "Sem etiqueta"
  if ($('wizSemEtiqueta')) $('wizSemEtiqueta').onclick = () => marcarSemEtiqueta();
  $('wizBack').onclick = () => wizardBack();
  $('wizSkip').onclick = () => { if (!confirm('Pular essa etapa?')) return; wizardSkip(); };
  if ($('wizSaveNext')) $('wizSaveNext').onclick = () => wizardSaveAndContinue();
  // v1.2.2: botão "Código de barras" — lê o código e preenche o patrimônio
  if ($('wizBarcode')) $('wizBarcode').onclick = async () => {
    try {
      const code = await lerCodigoBarras();
      if (code && $('wPatrimonio')) {
        $('wPatrimonio').value = code;
        $('wPatrimonio').style.transition = 'background 0.3s';
        $('wPatrimonio').style.background = 'rgba(52, 211, 153, 0.15)';
        setTimeout(() => { $('wPatrimonio').style.background = ''; }, 1500);
      }
    } catch (e) { toast('Erro ao ler código: ' + (e.message || e), 4000); }
  };
  // v1.2.2: botão "IA identifica" — identifica tipo/marca/modelo pela foto do equipamento
  if ($('wizVision')) $('wizVision').onclick = async () => {
    try {
      const dados = await identificarEquipamentoComIA();
      if (!dados) return;
      const step = WIZARD_STEPS[STATE.wizardStep];
      const flash = (el) => {
        if (!el) return;
        el.style.transition = 'background 0.3s';
        el.style.background = 'rgba(52, 211, 153, 0.15)';
        setTimeout(() => { el.style.background = ''; }, 1500);
      };
      if (dados.marca && $('wMarca') && !$('wMarca').value) { $('wMarca').value = dados.marca; flash($('wMarca')); }
      if (dados.modelo && $('wModelo') && !$('wModelo').value) { $('wModelo').value = dados.modelo; flash($('wModelo')); }
      const tipoTravado = ['monitor1', 'monitor2', 'telefone'].includes(step.key);
      if (tipoTravado) {
        if ($('wTipo')) $('wTipo').value = step.tipoDefault;
      } else if (dados.tipo && $('wTipo')) {
        const opcoes = Array.from($('wTipo').options).map((o) => o.value);
        if (opcoes.includes(dados.tipo) && $('wTipo').value !== dados.tipo) { $('wTipo').value = dados.tipo; flash($('wTipo')); }
      }
      const achados = [dados.tipo, dados.marca, dados.modelo].filter(Boolean).join(', ');
      toast(achados ? '🤖 IA identificou: ' + achados + '. Confira/edite.' : '🤖 IA não conseguiu identificar. Tire foto da etiqueta.', 4000);
    } catch (e) { toast('Erro na IA: ' + (e.message || e), 4000); }
  };
  // v1.1.0: Finalizar inventário do wizard
  if ($('wizFinishInv')) $('wizFinishInv').onclick = async () => {
    try { if (typeof wizardSaveAndContinue === 'function') await wizardSaveAndContinue(); } catch (e) {}
    if ($('btnFinish')) $('btnFinish').click();
  };
  // Theme toggle
  if ($('themeToggle')) $('themeToggle').onclick = () => toggleTheme();
  // Aplica tema salvo
  applyTheme(localStorage.getItem('inventai-theme') || 'dark');
  // Botão PDF
  if ($('btnPdf')) $('btnPdf').onclick = async () => {
    $('btnPdf').disabled = true;
    $('btnPdf').textContent = 'Gerando PDF...';
    try { await gerarPDF(); } catch (e) { console.error(e); toast('Erro ao gerar PDF: ' + (e.message || e)); }
    $('btnPdf').disabled = false;
    $('btnPdf').textContent = '📄 Gerar PDF';
  };

  // OCR no Wizard
  // Intercepta clique no botão de câmera pra tentar câmera customizada
  const capLabel = document.querySelector('#wizPhotoBox .cap-btn');
  if (capLabel) {
    capLabel.addEventListener('click', async (ev) => {
      if (!camSupportsGetUserMedia()) return; // Deixa o input file abrir
      const step = WIZARD_STEPS[STATE.wizardStep];
      // Permissão prévia foi tentada — agora tenta abrir custom camera
      ev.preventDefault();
      const file = await openCustomCamera(step.key);
      if (file) {
        // Processa como se viesse do input file
        await processCapturedFile(file);
      }
      // Se file === null, abre input file (clica no input programaticamente)
      else {
        $('wizInput').click();
      }
    }, true);
  }
  // Botões da câmera customizada
  if ($('camClose')) $('camClose').onclick = () => {
    const rejectFn = CAM.reject;
    closeCustomCamera();
    if (rejectFn) rejectFn(new Error('Cancelado'));
  };
  if ($('camCapture')) $('camCapture').onclick = () => camDoCapture();
  if ($('camTorch')) $('camTorch').onclick = () => camToggleTorch();
  if ($('camZoomIn')) $('camZoomIn').onclick = () => camApplyZoom(CAM.zoom + 0.5);
  if ($('camZoomOut')) $('camZoomOut').onclick = () => camApplyZoom(CAM.zoom - 0.5);
  // v1.1.2: auto-detect desativado — checkbox Auto não tem mais função

  async function processCapturedFile(file) {
    if (!file) return;
    const step = WIZARD_STEPS[STATE.wizardStep];
    const box = $('wizPhotoBox');
    const status = $('wizStatus');
    const prog = $('wizProg');
    box.classList.add('has-photo');
    status.textContent = 'Iniciando OCR...';
    status.classList.remove('error');
    prog.classList.add('active');
    prog.querySelector('.bar').style.width = '0%';
    // Bug #4: timer de aviso para OCR demorado - apos 8s mostra opcao de pular pro manual
    const slowOcrTimer = setTimeout(() => {
      const oldHtml = status.innerHTML;
      status.innerHTML = '⏱️ OCR esta demorando mais que o normal. <span style="display:inline-block;margin-left:6px;padding:4px 10px;background:#0EA5E9;color:#fff;border-radius:8px;font-weight:700;cursor:pointer;" id="ocrSkipBtn">Preencher manualmente</span>';
      const skipBtn = document.getElementById('ocrSkipBtn');
      if (skipBtn) {
        skipBtn.onclick = () => {
          status.innerHTML = '✏️ Preenchimento manual. Edite os campos abaixo (a foto fica salva).';
          prog.classList.remove('active');
          window._ocrSkipRequested = true;
        };
      }
    }, 8000);
    try {
      const { text, dataUrl } = await ocrImage(
        file,
        (p) => { prog.querySelector('.bar').style.width = p + '%'; },
        (msg) => { if (!window._ocrSkipRequested) status.textContent = msg; }
      );
      clearTimeout(slowOcrTimer);
      // Se usuario pediu pra pular durante OCR, ainda mostra a foto mas nao preenche
      if (window._ocrSkipRequested) {
        window._ocrSkipRequested = false;
        $('wizPhoto').src = dataUrl;
        $('wizPhoto').classList.add('show');
        return;
      }
      $('wizPhoto').src = dataUrl;
      $('wizPhoto').classList.add('show');
      // Aviso de foto borrada
      const blur = window._lastBlurScore;
      let blurWarn = '';
      if (blur !== null && blur !== undefined && blur < 80) {
        blurWarn = ' ⚠️ Foto parece borrada — se OCR errar, tire outra mais nitida.';
      }
      if (step.key === 'usuario') {
        const extracted = parseUserScreen(text);
        if (extracted.usuario) {
          $('wUsuario').value = extracted.usuario;
          status.textContent = 'OK Usuario detectado: ' + extracted.usuario + '. Confira/edite abaixo.' + blurWarn;
        } else {
          status.textContent = text.trim() ? 'OCR leu a tela mas nao identificou um nome. Digite manualmente abaixo.' : 'Nao consegui ler texto. Digite o nome manualmente.';
        }
      } else {
        // v1.0.8 + v1.2.3: Extração híbrida — IA Groq (texto OCR + Vision na foto) em paralelo
        const groqKey = (APP_CONFIG.ai && APP_CONFIG.ai.groq_key) || '';
        const extracted = parseLabel(text);
        let iaDados = null;
        let iaVision = null;
        let iaUsada = false;
        if (groqKey && (text || file)) {
          try {
            status.innerHTML = '🤖 Assistente IA analisando foto + texto…';
            const tipoCtx = ($('wTipo') && $('wTipo').value) || null;
            // v1.2.3: roda extração de texto E vision em paralelo (mais rico)
            const promTexto = (text && text.trim().length > 5)
              ? extrairCamposComIA(text, tipoCtx).catch((e) => { console.warn('IA texto falhou:', e.message); return null; })
              : Promise.resolve(null);
            const promVision = identificarEquipamentoComIAFromFile(file, true).catch((e) => { console.warn('IA vision falhou:', e.message); return null; });
            const [resTexto, resVision] = await Promise.all([promTexto, promVision]);
            iaDados = resTexto || null;
            iaVision = resVision || null;
            iaUsada = !!(iaDados || iaVision);
          } catch (errIA) {
            console.warn('Extração IA falhou, usando parseLabel:', errIA.message);
          }
        }
        // v1.2.3: combina Vision (tipo/marca/modelo) + OCR-IA (patrimonio/serie) + parseLabel (fallback)
        const finalDados = {
          tipo: (iaVision && iaVision.tipo) || (iaDados && iaDados.tipo) || '',
          marca: (iaVision && iaVision.marca) || (iaDados && iaDados.marca) || extracted.marca || '',
          modelo: (iaVision && iaVision.modelo) || (iaDados && iaDados.modelo) || extracted.modelo || '',
          patrimonio: (iaDados && iaDados.patrimonio) || extracted.patrimonio || '',
          serie: (iaDados && iaDados.serie) || extracted.serie || '',
          observacoes: (iaDados && iaDados.observacoes) || (extracted.obs ? extracted.obs.join(' ') : ''),
        };
        // Auto-detect tipo (fallback se IA não informou)
        if (!finalDados.tipo) {
          try { finalDados.tipo = detectarTipoPorOCR(text) || ''; } catch (e) {}
        }
        // v1.2.2: helper de destaque visual nos campos
        const flashCampo = (el, cor) => {
          if (!el) return;
          el.style.transition = 'background 0.3s';
          el.style.background = cor || 'rgba(52, 211, 153, 0.18)';
          setTimeout(() => { el.style.background = ''; }, 1600);
        };
        // Aplica nos campos só se eles estiverem vazios (preserva input manual)
        if (finalDados.marca && !$('wMarca').value) $('wMarca').value = finalDados.marca;
        if (finalDados.modelo && !$('wModelo').value) $('wModelo').value = finalDados.modelo;
        // PRIORIDADE: nº de patrimônio (campo-chave do inventário) — destaca e rola até ele
        if (finalDados.patrimonio && !$('wPatrimonio').value) {
          $('wPatrimonio').value = finalDados.patrimonio;
          flashCampo($('wPatrimonio'));
          try { $('wPatrimonio').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
        }
        if (finalDados.serie && (!$('wSerie').value || $('wSerie').value === '-')) $('wSerie').value = finalDados.serie;
        if (finalDados.observacoes) {
          const cur = $('wObs').value.trim();
          $('wObs').value = cur ? (cur + (cur.endsWith('.') ? ' ' : '. ') + finalDados.observacoes) : finalDados.observacoes;
        }
        // v1.2.2: Tipo TRAVADO nos passos de Monitor e Telefone — o passo já define o tipo,
        // então OCR/IA não pode sobrescrever (evita ex.: telefone virar "Outro").
        // No passo de CPU mantém a autodetecção (pode ser Notebook etc.).
        const tipoTravado = ['monitor1', 'monitor2', 'telefone'].includes(step.key);
        if (tipoTravado) {
          if ($('wTipo')) $('wTipo').value = step.tipoDefault;
        } else if (finalDados.tipo && $('wTipo')) {
          const opcoes = Array.from($('wTipo').options).map(o => o.value);
          if (opcoes.includes(finalDados.tipo) && $('wTipo').value !== finalDados.tipo) {
            $('wTipo').value = finalDados.tipo;
            $('wTipo').style.transition = 'background 0.3s';
            $('wTipo').style.background = 'rgba(52, 211, 153, 0.15)';
            setTimeout(() => { $('wTipo').style.background = ''; }, 1500);
          }
        }
        // v1.2.2: status PRIORIZA o nº de patrimônio (campo-chave do inventário)
        const patVal = ($('wPatrimonio').value || '').trim();
        const temPatReal = patVal && patVal !== 'Sem etiqueta' && !/^SN-/i.test(patVal);
        const achados = [];
        if (finalDados.tipo) achados.push('tipo (' + finalDados.tipo + ')');
        if (finalDados.marca) achados.push('marca');
        if (finalDados.modelo) achados.push('modelo');
        if (finalDados.serie) achados.push('série');
        // v1.2.3: fonte mais granular (Vision vs Texto vs ambos)
        let fonte;
        if (iaVision && iaDados) fonte = '🤖 Assistente IA (foto + texto)';
        else if (iaVision) fonte = '🤖 Assistente IA (foto)';
        else if (iaDados) fonte = '🤖 Assistente IA (texto)';
        else fonte = 'OCR';
        if (temPatReal) {
          status.textContent = '✅ ' + fonte + ' — Patrimônio: ' + patVal + (achados.length ? ' · também preencheu: ' + achados.join(', ') : '') + '. Confira/edite abaixo.' + blurWarn;
        } else if (text.trim() || iaVision) {
          const previewT = (text || '').replace(/\s+/g, ' ').trim().substring(0, 50);
          const baseAchados = achados.length ? ' Assistente IA preencheu ' + achados.join(', ') + '.' : (text.trim() ? ' OCR leu: "' + previewT + '..."' : '');
          status.textContent = '⚠️ Não identifiquei o nº de patrimônio.' + baseAchados + ' Digite o nº abaixo.' + blurWarn;
          status.classList.add('error');
          try { $('wPatrimonio').focus(); flashCampo($('wPatrimonio'), 'rgba(251, 191, 36, 0.20)'); } catch (e) {}
        } else {
          status.textContent = '⚠️ Foto sem texto legível. Aproxime da etiqueta, melhore a luz ou digite o nº de patrimônio.';
          status.classList.add('error');
          try { $('wPatrimonio').focus(); } catch (e) {}
        }
      }
    } catch (err) {
      clearTimeout(slowOcrTimer);
      console.error('Erro OCR wizard:', err);
      const msg = (err && (err.message || err.toString())) || 'erro desconhecido';
      status.textContent = 'Erro no OCR: ' + msg + '. Preencha manualmente.';
      status.classList.add('error');
    } finally {
      clearTimeout(slowOcrTimer);
      prog.classList.remove('active');
    }
  }

  // Handler legacy do input file (fallback)
  $('wizInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // limpa logo
    if (file) {
      // v1.1.0: reset estado anti-stale
      try {
        const img = document.getElementById('wizPhoto');
        if (img) { img.src = ''; img.classList.remove('show'); }
        const box = document.getElementById('wizPhotoBox');
        if (box) box.classList.remove('has-photo');
        const st = document.getElementById('wizStatus');
        if (st) { st.textContent = ''; st.classList.remove('error', 'ok'); }
        const pg = document.getElementById('wizProg');
        if (pg) pg.classList.remove('active');
      } catch (e) {}
      await processCapturedFile(file);
    }
  });

  $('itemList').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    const sid = btn.dataset.sid;
    if (act === 'edit-session') startWizard(sid);
    else if (act === 'del-session') delSession(sid);
  });

  $('btnFinish').onclick = () => {
    if (STATE.items.length === 0) { toast('Adicione pelo menos 1 item antes de finalizar.'); return; }
    $('rData').textContent = fmtDateBR(STATE.data);
    $('rSetor').textContent = STATE.setor;
    $('rTotal').textContent = STATE.items.length;
    $('rCpu').textContent = STATE.items.filter((i) => i.tipo === 'CPU').length;
    $('rMon').textContent = STATE.items.filter((i) => i.tipo === 'Monitor').length;
    $('rTel').textContent = STATE.items.filter((i) => i.tipo === 'Telefone IP').length;
    // v1.0.10: novos contadores Notebook e Impressora no resumo executivo
    if ($('rNote')) $('rNote').textContent = STATE.items.filter((i) => i.tipo === 'Notebook').length;
    if ($('rImp')) $('rImp').textContent = STATE.items.filter((i) => i.tipo === 'Impressora').length;
    $('rUsr').textContent = new Set(STATE.items.map((i) => i.usuario).filter(Boolean)).size;
    // v1.0.10: mostra analista se informado
    if ($('rAnalista') && $('rAnalistaWrap')) {
      if (STATE.analista) {
        $('rAnalista').textContent = STATE.analista;
        $('rAnalistaWrap').style.display = '';
      } else {
        $('rAnalistaWrap').style.display = 'none';
      }
    }
    if ($('btnShare')) $('btnShare').style.display = 'none';
    window._lastPlanilhaBlob = null;
    showScreen('screen-finish');
  };
  $('btnBackList').onclick = () => showScreen('screen-list');
  // v1.0.10: cards do resumo executivo clicáveis (abre modal com itens daquele tipo)
  document.querySelectorAll('#execGrid .exec-tile').forEach((tile) => {
    tile.addEventListener('click', () => {
      const tipo = tile.dataset.tipo;
      if (tipo === '__users__') return abrirHistoricoModal('usuarios');
      abrirItensPorTipo(tipo);
    });
  });
  if ($('btnShare')) $('btnShare').onclick = () => compartilharPlanilha();
  // v1.0.8: Enviar relatório formatado + planilha pelo WhatsApp
  if ($('btnWhatsRelatorio')) $('btnWhatsRelatorio').onclick = () => enviarRelatorioWhatsApp();

  $('btnGen').onclick = async () => {
    $('btnGen').disabled = true;
    $('btnGen').textContent = 'Gerando...';
    try {
      await gerarPlanilha();
    } catch (e) {
      console.error(e);
      toast('Erro ao gerar planilha: ' + (e.message || e));
    }
    $('btnGen').disabled = false;
    $('btnGen').textContent = '📊 Gerar planilha .xlsx';
  };

  $('btnNew').onclick = async () => {
    const planilhaGerada = !!(window._lastPlanilhaBuf || window._lastPlanilhaBlob);
    const totalItens = STATE.items ? STATE.items.length : 0;
    if (!planilhaGerada && totalItens > 0) {
      const msg = '⚠️ ATENÇÃO!\n\nVocê NÃO gerou a planilha .xlsx ainda.\n\nItens: ' + totalItens + '\nSetor: ' + (STATE.setor || '-') + '\n\nSe arquivar agora SEM planilha, você corre risco de perder dados.\n\nRecomendado:\n1) CANCELAR\n2) Tocar em "📊 Gerar planilha"\n3) Aí sim arquivar\n\nArquivar mesmo assim? (não recomendado)';
      if (!confirm(msg)) return;
    } else {
      if (!confirm('Arquivar este inventário?\n\nFica salvo no card "📦 Sessões" com TODOS os dispositivos. Você pode regerar planilha/PDF ou editar depois.')) return;
    }
    // BUG #1 FIX: Arquiva o inventario atual no historico antes de limpar
    arquivarInventarioAtual();
    STATE.data = ''; STATE.setor = ''; STATE.titulo = ''; STATE.items = []; STATE.editingId = null;
    // Salva state COM o historico atualizado (nao usa clearState, que apaga tudo)
    await saveState();
    $('setorInv').value = '';
    $('dataInv').value = todayIso();
    $('btnResume').style.display = 'none';
    window._lastPlanilhaBlob = null;
    if ($('btnShare')) $('btnShare').style.display = 'none';
    updateTopbar(); updateDashboard();
    toast('Inventario arquivado! Comece um novo.', 3500);
    showScreen('screen-start');
  };

  updateTopbar(); updateDashboard();
  // Validacao visual de Numero de Serie (alerta, nao bloqueia)
  function validarSerie() {
    const el = $('wSerie');
    if (!el) return;
    const v = (el.value || '').trim();
    if (v && v !== '-' && (v.length < 5 || !/^[A-Z0-9\-\.]+$/i.test(v))) {
      el.style.borderColor = '#F59E0B';
      el.style.background = 'rgba(245, 158, 11, 0.08)';
    } else {
      el.style.borderColor = '';
      el.style.background = '';
    }
  }
  if ($('wSerie')) {
    $('wSerie').addEventListener('input', validarSerie);
    $('wSerie').addEventListener('blur', validarSerie);
  }

});

function applyTheme(mode) {
  if (mode === 'light') {
    document.documentElement.classList.add('light-mode');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#F5F7FA');
  } else {
    document.documentElement.classList.remove('light-mode');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#0F172A');
  }
  localStorage.setItem('inventai-theme', mode);
}
function toggleTheme() {
  const cur = localStorage.getItem('inventai-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

async function gerarPDF() {
  if (!STATE.items || STATE.items.length === 0) { toast('Nenhum item para exportar.'); return; }
  if (typeof window.jspdf === 'undefined') { toast('jsPDF nao carregado. Verifique sua conexao.'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Cabeçalho
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(STATE.titulo || 'INVENTARIO DE EQUIPAMENTOS DE TI', 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Setor: ' + (STATE.setor || '-') + '  |  Data: ' + fmtDateBR(STATE.data) + '  |  Total: ' + STATE.items.length + ' itens', 14, 22);

  // Ordena por sessao/usuario
  const sessoes = new Map();
  const ordem = [];
  for (const it of STATE.items) {
    const key = it.sessionId || ('legacy-' + (it.usuario || ''));
    if (!sessoes.has(key)) { sessoes.set(key, []); ordem.push(key); }
    sessoes.get(key).push(it);
  }
  const linhas = [];
  let n = 1;
  for (const key of ordem) for (const it of sessoes.get(key)) {
    linhas.push([
      n++, it.tipo || '', it.marca || '-', it.modelo || '-',
      it.patrimonio || 'Nao capturado', it.serie || '-',
      it.usuario || '(sem usuário)', it.ramal || '', (it.obs || '').slice(0, 60)
    ]);
  }

  doc.autoTable({
    startY: 28,
    head: [['#', 'Tipo', 'Marca', 'Modelo', 'Patrimonio', 'Serie', 'Usuario', 'Ramal', 'Obs']],
    body: linhas,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 247, 252] },
    columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 7: { halign: 'center' } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.raw[8] && data.row.raw[8].includes('SEM ETIQUETA')) {
        data.cell.styles.fillColor = [255, 245, 157];
      }
    },
  });

  // v1.0.11: formato AAAA-MM-DD_NomeDoSetor.pdf
  const nomeSet = (STATE.setor || 'Setor').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dataIso = (STATE.data || todayIso());
  doc.save(dataIso + '_' + nomeSet + '.pdf');
  toast('PDF gerado!');
}

// ============================================================
// DETECTOR DE PADRÃO DE PATRIMÔNIO via múltiplas fotos + IA (v1.0.8)
// ============================================================
const DETECTOR_STATE = { fotos: [], textos: [] };

async function detectarPadraoPorFoto() {
  const sugBox = $('cfgPadroesSugestoes');
  if (!sugBox) return;
  // Reset estado a cada nova sessão de detecção
  DETECTOR_STATE.fotos = [];
  DETECTOR_STATE.textos = [];
  sugBox.style.display = 'block';
  renderDetectorUI();
}

function renderDetectorUI() {
  const sugBox = $('cfgPadroesSugestoes');
  if (!sugBox) return;
  const n = DETECTOR_STATE.fotos.length;
  const groqKey = (APP_CONFIG.ai && APP_CONFIG.ai.groq_key) || '';
  const modoIA = !!groqKey;
  let html = '<div class="info-banner">' +
    '📸 <strong>Detector de padrão multi-foto</strong><br>' +
    'Fotografe de 3 a 5 etiquetas diferentes da sua empresa para o app aprender o(s) padrão(ões). ' +
    (modoIA ? '🤖 <strong>Modo IA ativo</strong> (Groq Llama 3.3)' : '🔍 <strong>Modo análise local</strong> (sem IA, configure chave Groq para mais precisão)') +
    '</div>';
  html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">';
  for (let i = 0; i < n; i++) {
    const t = DETECTOR_STATE.textos[i] || '';
    const preview = t.split(/\r?\n/).find(l => l.trim().length > 2) || '(sem texto)';
    html += '<div style="background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.3);border-radius:8px;padding:6px 10px;font-size:11px;color:#7DD3FC;">' +
      '✓ Foto ' + (i+1) + ': ' + preview.substring(0, 24) + (preview.length > 24 ? '…' : '') +
      '</div>';
  }
  html += '</div>';
  if (n < 5) {
    html += '<button type="button" class="btn btn-secondary" id="detAddFoto" style="margin-bottom:8px">📷 Tirar foto ' + (n+1) + ' de até 5</button>';
  }
  if (n >= 1) {
    const labelAnalisar = modoIA ? '🤖 Analisar com IA (Groq Llama 3.3)' : '🔍 Analisar localmente (' + n + ' foto' + (n>1?'s':'') + ')';
    html += '<button type="button" class="btn btn-primary" id="detAnalisar" style="margin-top:4px">' + labelAnalisar + '</button>';
  }
  if (n >= 1) {
    html += '<button type="button" class="btn btn-secondary" id="detReset" style="margin-top:8px;font-size:12px">↺ Limpar e recomeçar</button>';
  }
  html += '<div id="detResultados"></div>';
  sugBox.innerHTML = html;
  const btnAdd = document.getElementById('detAddFoto');
  if (btnAdd) btnAdd.onclick = () => detectorAdicionarFoto();
  const btnAna = document.getElementById('detAnalisar');
  if (btnAna) btnAna.onclick = () => detectorAnalisar();
  const btnReset = document.getElementById('detReset');
  if (btnReset) btnReset.onclick = () => { DETECTOR_STATE.fotos = []; DETECTOR_STATE.textos = []; renderDetectorUI(); };
}

async function detectorAdicionarFoto() {
  let file = null;
  if (typeof camSupportsGetUserMedia === 'function' && camSupportsGetUserMedia()) {
    try { file = await openCustomCamera('cpu'); } catch (e) {}
  }
  if (!file) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    file = await new Promise((resolve) => {
      fileInput.onchange = (e) => resolve(e.target.files && e.target.files[0]);
      fileInput.click();
    });
  }
  if (!file) return;
  const sugBox = $('cfgPadroesSugestoes');
  if (sugBox) sugBox.innerHTML = '<div class="info-banner">🔍 Lendo etiqueta ' + (DETECTOR_STATE.fotos.length + 1) + ' com OCR...</div>';
  try {
    const { text } = await ocrImage(file, null, null);
    DETECTOR_STATE.fotos.push(file);
    DETECTOR_STATE.textos.push(text || '');
    renderDetectorUI();
  } catch (err) {
    toast('Erro OCR: ' + (err.message || err));
    renderDetectorUI();
  }
}

async function detectorAnalisar() {
  const resBox = document.getElementById('detResultados');
  if (resBox) resBox.innerHTML = '<div class="info-banner" style="margin-top:10px">⏳ Analisando ' + DETECTOR_STATE.textos.length + ' foto(s)...</div>';
  const groqKey = (APP_CONFIG.ai && APP_CONFIG.ai.groq_key) || '';
  try {
    let candidatos = [];
    if (groqKey) {
      try {
        candidatos = await sugerirRegexComIA(DETECTOR_STATE.textos);
      } catch (err) {
        console.warn('IA Groq falhou, caindo pra análise local:', err.message);
        if (resBox) resBox.innerHTML = '<div class="info-banner" style="border-left-color:#F59E0B;margin-top:10px">⚠️ IA Groq falhou (' + (err.message||'erro') + '). Usando análise local…</div>';
        candidatos = analiseLocalMultiFoto(DETECTOR_STATE.textos);
      }
    } else {
      candidatos = analiseLocalMultiFoto(DETECTOR_STATE.textos);
    }
    renderDetectorResultados(candidatos);
  } catch (err) {
    if (resBox) resBox.innerHTML = '<div class="info-banner" style="border-left-color:#EF4444;margin-top:10px">Erro: ' + (err.message || err) + '</div>';
  }
}

function renderDetectorResultados(candidatos) {
  const resBox = document.getElementById('detResultados');
  if (!resBox) return;
  if (!candidatos || candidatos.length === 0) {
    resBox.innerHTML = '<div class="info-banner" style="border-left-color:#F59E0B;color:#FCD34D;margin-top:10px">⚠️ Não consegui identificar padrões claros. Tente tirar fotos com etiquetas mais legíveis.</div>';
    return;
  }
  let html = '<div class="info-banner" style="margin-top:10px">✓ Toque em <strong>"Aplicar todos"</strong> para usar os padrões abaixo (recomendado), ou escolha um específico:</div>';
  html += '<button type="button" class="btn btn-primary" id="detAplicarTodos" style="margin-top:8px">✓ Aplicar todos os padrões (' + candidatos.length + ')</button>';
  html += candidatos.map((c, i) => (
    '<button type="button" class="btn btn-secondary cfg-pat-card" data-regex="' + c.regex.replace(/"/g, '&quot;') + '" data-exemplo="' + (c.exemplo||'').replace(/"/g,'&quot;') + '" style="text-align:left; margin-top:8px">' +
      '<div><strong>' + (c.exemplo || 'Padrão ' + (i+1)) + '</strong></div>' +
      '<div style="font-size:11px; opacity:0.7">Regex: <code>' + c.regex + '</code></div>' +
      (c.descricao ? '<div style="font-size:11px; opacity:0.6">' + c.descricao + '</div>' : '') +
    '</button>'
  )).join('');
  resBox.innerHTML = html;
  document.getElementById('detAplicarTodos').onclick = () => {
    const todos = candidatos.map(c => c.regex).filter(Boolean);
    $('cfgPatRegex').value = todos.join(' | ');
    toast('✓ ' + todos.length + ' padrões aplicados! Toque "Salvar e começar".');
    resBox.innerHTML = '<div class="info-banner" style="border-left-color:#10B981; color:#86EFAC;margin-top:10px">✓ <strong>' + todos.length + ' padrão(ões) salvo(s)</strong>: <code style="font-size:11px">' + todos.join(' | ') + '</code></div>';
  };
  resBox.querySelectorAll('.cfg-pat-card').forEach((btn) => {
    btn.onclick = () => {
      $('cfgPatRegex').value = btn.dataset.regex;
      toast('Padrão único aplicado: ' + btn.dataset.exemplo);
      resBox.innerHTML = '<div class="info-banner" style="border-left-color:#10B981; color:#86EFAC;margin-top:10px">✓ Padrão salvo: <strong>' + btn.dataset.regex + '</strong>. Toque "Salvar e começar".</div>';
    };
  });
}

// v1.0.9: chamada genérica à IA — usa Cloudflare proxy (PROXY_URL) se setado,
// caso contrário usa a chave Groq do localStorage.
async function chamarIA(messages, opts) {
  opts = opts || {};
  const model = opts.model || (APP_CONFIG.ai && APP_CONFIG.ai.model) || 'llama-3.3-70b-versatile';
  const payload = {
    model: model,
    messages: messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.max_tokens || 600,
    response_format: opts.response_format || { type: 'json_object' },
  };
  let url, headers;
  if (PROXY_URL && PROXY_URL.startsWith('http')) {
    // Modo proxy: chave fica no Cloudflare Worker
    url = PROXY_URL.replace(/\/+$/, '') + '/chat';
    headers = { 'Content-Type': 'application/json', 'X-OpenInvTI-Client': '1.0.9' };
  } else {
    // Modo legado: chave manual do usuário
    const groqKey = (APP_CONFIG.ai && APP_CONFIG.ai.groq_key) || '';
    if (!groqKey) throw new Error('IA indisponível: nem proxy nem chave Groq configurados');
    url = 'https://api.groq.com/openai/v1/chat/completions';
    headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + groqKey };
  }
  const resp = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(payload) });
  if (!resp.ok) {
    const errTxt = await resp.text().catch(() => '');
    throw new Error('HTTP ' + resp.status + ': ' + errTxt.substring(0, 200));
  }
  const data = await resp.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

// v1.0.8: IA — pede pra Llama analisar os textos OCR e sugerir regex
async function sugerirRegexComIA(textos) {
  if (!iaDisponivel()) throw new Error('IA não configurada');
  const prompt = 'Você é um especialista em regex JavaScript. Analise os seguintes textos extraídos via OCR de etiquetas de patrimônio corporativo e identifique os padrões DE CÓDIGO DE PATRIMÔNIO (números/letras que identificam unicamente o equipamento, geralmente em destaque). Ignore endereços, datas, marcas, números de telefone.\n\n' +
    textos.map((t, i) => '--- ETIQUETA ' + (i+1) + ' ---\n' + (t || '(vazio)').substring(0, 800)).join('\n\n') +
    '\n\nRetorne APENAS um JSON válido (sem markdown, sem prefixo) com esta estrutura exata:\n' +
    '{"padroes":[{"regex":"^F-FAR-\\\\d{5}$","exemplo":"F-FAR-12345","descricao":"Prefixo F-FAR + 5 dígitos"}]}\n\n' +
    'Regras:\n- Use regex JavaScript válido (com âncoras ^ e $ quando possível).\n- Escape barras invertidas como \\\\\\\\.\n- Inclua todos os padrões DIFERENTES encontrados (máximo 5).\n- Se houver um padrão "só número" com tamanho variável, use \\\\d{N,M}.\n- "descricao" em português.';
  const content = await chamarIA(
    [
      { role: 'system', content: 'Você responde APENAS com JSON válido, sem texto adicional, sem markdown.' },
      { role: 'user', content: prompt }
    ],
    { temperature: 0.2, max_tokens: 600 }
  );
  let parsed;
  try { parsed = JSON.parse(content); }
  catch (e) {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} }
  }
  if (!parsed || !Array.isArray(parsed.padroes)) throw new Error('Resposta da IA em formato inesperado');
  return parsed.padroes.map(p => ({
    regex: (p.regex || '').replace(/\\\\/g, '\\'), // unescape JSON dupla
    exemplo: p.exemplo || '',
    descricao: '🤖 IA: ' + (p.descricao || 'padrão detectado'),
  })).filter(p => p.regex);
}

// v1.0.8: Análise local multi-foto — combina extração de várias fotos, deduplica por regex
function analiseLocalMultiFoto(textos) {
  const todos = [];
  for (const t of textos) {
    const c = extrairCandidatosPadrao(t || '');
    todos.push(...c);
  }
  const porRegex = new Map();
  for (const cand of todos) {
    const k = cand.regex;
    if (!porRegex.has(k)) porRegex.set(k, Object.assign({ contagem: 0 }, cand));
    porRegex.get(k).contagem++;
  }
  const ordenados = Array.from(porRegex.values()).sort((a, b) => b.contagem - a.contagem);
  return ordenados.slice(0, 5).map(c => ({
    regex: c.regex,
    exemplo: c.exemplo,
    descricao: '🔍 Local: ' + c.descricao + (c.contagem > 1 ? ' (apareceu em ' + c.contagem + ' fotos)' : ''),
  }));
}

function extrairCandidatosPadrao(text) {
  if (!text) return [];
  const cands = [];
  const seen = new Set();
  function add(regex, exemplo, descricao) {
    const key = regex + '|' + exemplo;
    if (seen.has(key)) return;
    seen.add(key);
    cands.push({ regex, exemplo, descricao });
  }
  const linhas = text.split(/\r?\n/);
  for (const linha of linhas) {
    // Padrão LETRAS-NUMEROS (ex.: ACME-12345, INV-2024-0123)
    const m1 = linha.match(/\b([A-Z]{2,5})[-_\.\s]?(\d{3,8})\b/);
    if (m1) {
      const prefix = m1[1];
      const numLen = m1[2].length;
      add('^' + prefix + '-?\\d{' + numLen + '}$', prefix + '-' + m1[2], prefix + ' + ' + numLen + ' digitos');
    }
    // Padrão LETRAS-LETRAS-NUMEROS (ex.: ABC-CORP-12345)
    const m2 = linha.match(/\b([A-Z])[-_\.\s]([A-Z]{2,5})[-_\.\s](\d{3,8})\b/);
    if (m2) {
      add('^' + m2[1] + '-' + m2[2] + '-\\d{' + m2[3].length + '}$', m2[1] + '-' + m2[2] + '-' + m2[3], 'Prefixo composto + ' + m2[3].length + ' digitos');
    }
      // Padrão só números (6-10 digitos)
    const m3 = linha.match(/\b(\d{6,10})\b/);
    if (m3) {
      add('^\\d{' + m3[1].length + '}$', m3[1], 'Apenas ' + m3[1].length + ' digitos');
    }
    // Padrão alfanumérico misturado (ex.: A1B2C3)
    const m4 = linha.match(/\b([A-Z][A-Z0-9]{4,10}[0-9])\b/);
    if (m4 && !/^[A-Z]+$/.test(m4[1]) && !/^[0-9]+$/.test(m4[1])) {
      add('^[A-Z][A-Z0-9]{' + (m4[1].length - 2) + '}[0-9]$', m4[1], 'Alfanumerico ' + m4[1].length + ' caracteres');
    }
  }
  return cands.slice(0, 5);
}

// v1.2.0: Atalhos de teclado (Enter avança, Esc cancela, Ctrl+S salva)
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox'))) return;
  if (e.key === 'Enter' && document.querySelector('#screen-wizard.active')) {
    e.preventDefault();
    const btn = document.getElementById('wizNext');
    if (btn) btn.click();
  }
  if (e.key === 'Escape') {
    const modal = document.getElementById('historyModal') || document.getElementById('downloadFeedbackModal');
    if (modal) modal.remove();
  }
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    if (typeof saveState === 'function') saveState();
    if (typeof mostrarIndicadorSave === 'function') mostrarIndicadorSave('💾 Salvo (manual)', 'ok');
  }
});

window.addEventListener('beforeunload', (e) => {
  if (STATE.items && STATE.items.length > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
});
