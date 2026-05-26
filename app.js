/**
 * ClienteTrack Alpha - app.js
 * Orquestador principal — ES Modules
 */

import { inicializarQR, renderQRs } from './qr.js';
import { inicializarMensajes } from './mensajes.js';
import { inicializarRutas } from './rutas.js';
import { inicializarClientePlus } from './clienteplus.js';

// --- DATOS INICIALES ---
const initialClients = [
  { id: 1, name: "Carlos Mendoza", product: "Polera Over-Size Negra", phone: "987654321", district: "Miraflores", address: "Av. Larco 743 Apt 202", cobrar: 120.00, status: "Pendiente", observation: "Entregar por la tarde." },
  { id: 2, name: "Ana Isabel Ruiz", product: "Pack Termos Inteligentes", phone: "+51 941-234-567", district: "Surco", address: "Calle Las Begonias 145", cobrar: 85.50, status: "Entregado", observation: "Pagó por Yape al recibir." },
  { id: 3, name: "Corporación Logix", product: "Servicios de Envío x10", phone: "922441133", district: "San Borja", address: "Av. Aviación 3120 Of 502", cobrar: 450.00, status: "Empresa", observation: "Dejar factura impresa." },
  { id: 4, name: "Esteban Quiroz", product: "Zapatillas Urbanas V2", phone: "991-882-773", district: "Chorrillos", address: "Jr. Alfonso Ugarte 542", cobrar: 190.00, status: "Fallido", observation: "Teléfono apagado." }
];

const defaultCategories = [
  { id: 'cat-llegada', name: 'Llegada', icon: '🚚', color: '#10b981' },
  { id: 'cat-ubicacion', name: 'Ubicación', icon: '📍', color: '#3b82f6' },
  { id: 'cat-cobro', name: 'Cobro', icon: '💰', color: '#f59e0b' },
  { id: 'cat-empresa', name: 'Empresa', icon: '🏢', color: '#6366f1' },
  { id: 'cat-problemas', name: 'Problemas', icon: '⚠️', color: '#ef4444' },
  { id: 'cat-reprogramacion', name: 'Reprogramación', icon: '🔄', color: '#8b5cf6' },
  { id: 'cat-personalizados', name: 'Personalizados', icon: '❤️', color: '#ec4899' }
];

const defaultTemplates = [
  { id: 1, title: 'Aviso de Llegada', text: 'Hola {nombre}, estoy llegando con tu pedido de {producto}.', categoryId: 'cat-llegada', favorite: true },
  { id: 2, title: 'Cobro de Pedido', text: 'Hola {nombre}, el monto a cobrar por tu {producto} es S/{cobrar}. Yape: {yape}.', categoryId: 'cat-cobro', favorite: true },
  { id: 3, title: 'Solicitar Ubicación', text: 'Hola {nombre}, envíame tu ubicación exacta para entregar en {distrito}.', categoryId: 'cat-ubicacion', favorite: false },
  { id: 4, title: 'Coordinación Empresa', text: 'Estimado {nombre}, coordinaremos la entrega corporativa en {direccion}.', categoryId: 'cat-empresa', favorite: false },
  { id: 5, title: 'Notificación de Fallo', text: 'Hola {nombre}, no pudimos ubicarte en {direccion}. Favor comunicarse.', categoryId: 'cat-problemas', favorite: false }
];

const defaultCustomTags = [
  { id: 'tag-custom-codigo', name: 'codigo', label: 'Código' },
  { id: 'tag-custom-zona', name: 'zona', label: 'Zona' },
];

export let state = {
  theme: 'dark',
  clients: initialClients,
  config: {
    businessName: 'ClienteTrack Alpha',
    yapeNum: '987654321',
    plinNum: '987654321',
    businessInfo: 'Cuenta Corriente BCP Soles: 191-XXXXXXXX-X-XX'
  },
  qrs: { yape: '', plin: '', empresa: '' },
  templates: defaultTemplates,
  categories: defaultCategories,
  customTags: defaultCustomTags
};

// --- PERSISTENCIA ---
export function loadState() {
  const stored = localStorage.getItem('clienttrack_state_v1');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      state = {
        ...state, ...parsed,
        templates: parsed.templates || defaultTemplates,
        categories: parsed.categories || defaultCategories,
        customTags: parsed.customTags || defaultCustomTags
      };
    } catch(e) { console.error('Error cargando estado:', e); }
  } else { saveState(); }
}

export function saveState() {
  try { localStorage.setItem('clienttrack_state_v1', JSON.stringify(state)); }
  catch(e) { console.warn('Error guardando estado:', e); }
}

loadState();

// --- UTILIDADES ---
export function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

export function cleanPhoneNumber(phoneString) {
  if (!phoneString) return '';
  let cleaned = phoneString.replace(/[^\d]/g, '');
  if (cleaned.length === 9 && cleaned.startsWith('9')) cleaned = '51' + cleaned;
  return cleaned;
}

export function openWhatsApp(phoneString, text = '') {
  const cleaned = cleanPhoneNumber(phoneString);
  if (cleaned.length >= 9) {
    const url = text ? `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}` : `https://wa.me/${cleaned}`;
    window.open(url, '_blank');
  } else { showToast('Número inválido'); }
}
window.openWhatsApp = openWhatsApp;

// --- TEMA ---
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  saveState();
  const slider = document.getElementById('theme-slider');
  if (slider) slider.value = theme === 'light' ? 1 : 0;
}
window.applyTheme = applyTheme;

// --- RELOJ ---
function initClock() {
  const el = document.getElementById('time-display');
  if (!el) return;
  const update = () => {
    const now = new Date();
    const date = now.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
    const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    el.textContent = `${date} • ${time}`;
  };
  setInterval(update, 1000);
  update();
}

// --- NAVEGACIÓN ---
function initNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const views = document.querySelectorAll('.view-content');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      item.classList.add('active');
      const target = item.getAttribute('data-target');
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add('active');
      if (target === 'view-dashboard') renderDashboard();
      if (target === 'view-clientes') renderClients();
      if (target === 'view-masivo') { if(window.renderMasivoView) window.renderMasivoView(); initMasivoSearch(); }
      if (target === 'view-config') loadConfigForm();
    });
  });
}

// --- FILTROS (FIX: usa .filter-chip no .filter-btn) ---
function initFilters() {
  // Búsqueda
  const searchEl = document.getElementById('client-search-input');
  if (searchEl) {
    searchEl.addEventListener('input', e => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderClients();
    });
  }

  // Filtros — clase corregida a .filter-chip
  const filterChips = document.querySelectorAll('.filter-chip[data-filter]');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderClients();
    });
  });
}

// --- NUEVO CLIENTE (FIX: binding completo) ---
function initAddClient() {
  const btnOpen = document.getElementById('btn-open-add-modal');
  const modal = document.getElementById('add-client-modal');
  const btnClose = document.getElementById('btn-close-add-modal');
  const form = document.getElementById('add-client-form');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', () => modal.classList.add('active'));
  }
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => { modal.classList.remove('active'); form && form.reset(); });
  }
  if (modal) {
    modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.remove('active'); form && form.reset(); } });
  }
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const newClient = {
        id: Date.now(),
        name: document.getElementById('new-name')?.value.trim() || '',
        product: document.getElementById('new-product')?.value.trim() || '',
        phone: document.getElementById('new-phone')?.value.trim() || '',
        cobrar: parseFloat(document.getElementById('new-price')?.value || 0),
        district: document.getElementById('new-district')?.value.trim() || '',
        address: document.getElementById('new-address')?.value.trim() || '',
        status: document.getElementById('new-status')?.value || 'Pendiente',
        observation: document.getElementById('new-observation')?.value.trim() || '',
      };
      if (!newClient.name || !newClient.phone) { showToast('Nombre y teléfono requeridos'); return; }
      state.clients.unshift(newClient);
      saveState();
      renderClients();
      renderDashboard();
      modal.classList.remove('active');
      form.reset();
      showToast(`✅ ${newClient.name} agregado`);
    });
  }
}

// --- CONFIG ---
export function loadConfigForm() {
  const fields = {
    'cfg-business-name': 'businessName',
    'cfg-yape-num': 'yapeNum',
    'cfg-plin-num': 'plinNum',
    'cfg-business-info': 'businessInfo'
  };
  Object.entries(fields).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.value = state.config[key] || '';
  });
}

function saveConfig() {
  state.config.businessName = document.getElementById('cfg-business-name')?.value || '';
  state.config.yapeNum = document.getElementById('cfg-yape-num')?.value || '';
  state.config.plinNum = document.getElementById('cfg-plin-num')?.value || '';
  state.config.businessInfo = document.getElementById('cfg-business-info')?.value || '';
  saveState();
  renderDashboard();
  showToast('Configuración guardada');
}
window.saveConfig = saveConfig;

// --- DASHBOARD ---
export function renderDashboard() {
  const nameEl = document.getElementById('dash-business-name');
  if (nameEl) nameEl.textContent = state.config.businessName || 'Mi Negocio';
  const clients = state.clients || [];
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('dash-total', clients.length);
  set('dash-pendientes', clients.filter(c => c.status === 'Pendiente').length);
  set('dash-entregados', clients.filter(c => c.status === 'Entregado').length);
  set('dash-empresa', clients.filter(c => c.status === 'Empresa').length);
  set('dash-fallidos', clients.filter(c => c.status === 'Fallido').length);
  set('dash-reprogramados', clients.filter(c => c.status === 'Reprogramado').length);
  const cobrado = clients.filter(c => c.status === 'Entregado').reduce((a, c) => a + parseFloat(c.cobrar || 0), 0);
  const pendiente = clients.filter(c => ['Pendiente','Empresa','Reprogramado','No contesta'].includes(c.status)).reduce((a, c) => a + parseFloat(c.cobrar || 0), 0);
  set('dash-monto-cobrado', `S/ ${cobrado.toFixed(2)}`);
  set('dash-monto-pendiente', `S/ ${pendiente.toFixed(2)}`);
}

// --- CLIENTES ---
let activeFilter = 'Todos';
let searchQuery = '';

export function renderClients() {
  const list = document.getElementById('client-list-container');
  if (!list) return;
  list.innerHTML = '';

  const filtered = state.clients.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.product || '').toLowerCase().includes(q) ||
      (c.district || '').toLowerCase().includes(q);
    const matchStatus = activeFilter === 'Todos' || c.status === activeFilter;
    return matchSearch && matchStatus;
  });

  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-secondary);font-size:0.85rem;">Ningún cliente coincide.</div>`;
    return;
  }

  filtered.sort((a, b) => (a.rutaSequence || 9999) - (b.rutaSequence || 9999)).forEach(client => {
    const card = document.createElement('div');
    card.className = 'card client-card';
    card.id = `client-card-${client.id}`;
    const sc = (client.status || '').toLowerCase()
      .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u')
      .replace(/\s+/g,'-');

    card.innerHTML = `
      <div class="client-header" onclick="toggleCardExpand(${client.id})">
        <div class="client-main-info">
          <span class="client-title">${client.name}</span>
          <span class="client-subtitle">${client.product} • <strong>${client.district}</strong></span>
        </div>
        <div class="client-right-info">
          <span class="client-cobro">S/ ${parseFloat(client.cobrar||0).toFixed(2)}</span>
          <span class="status-badge status-${sc}">${client.status}</span>
        </div>
      </div>
      <div class="client-details">
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Teléfono</span>
            <span class="detail-value">${client.phone}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Estado</span>
            <select class="status-select" onchange="changeStatus(${client.id}, this.value)">
              <option value="Pendiente" ${client.status==='Pendiente'?'selected':''}>⏳ Pendiente</option>
              <option value="Entregado" ${client.status==='Entregado'?'selected':''}>❤️ Entregado</option>
              <option value="Empresa" ${client.status==='Empresa'?'selected':''}>🏠 Empresa</option>
              <option value="Fallido" ${client.status==='Fallido'?'selected':''}>❌ Fallido</option>
              <option value="Reprogramado" ${client.status==='Reprogramado'?'selected':''}>🔄 Reprogramar</option>
              <option value="Dirección incorrecta" ${client.status==='Dirección incorrecta'?'selected':''}>📍 Dir. incorrecta</option>
              <option value="Sin WhatsApp" ${client.status==='Sin WhatsApp'?'selected':''}>📵 Sin WhatsApp</option>
              <option value="No contesta" ${client.status==='No contesta'?'selected':''}>📞 No contesta</option>
            </select>
          </div>
          <div class="detail-item detail-item-full">
            <span class="detail-label">Dirección</span>
            <span class="detail-value">${client.address || '—'}</span>
          </div>
          <div class="detail-item detail-item-full">
            <span class="detail-label">Notas</span>
            <textarea class="notes-textarea" placeholder="Observaciones..." onchange="updateNote(${client.id}, this.value)">${client.observation || ''}</textarea>
          </div>
        </div>
        <div class="panel-actions" style="grid-template-columns:repeat(2,1fr);gap:8px;">
          <button class="btn btn-whatsapp" onclick="openWhatsApp('${client.phone}')">💬 WhatsApp</button>
          <button class="btn" style="background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);color:var(--color-entregado);" onclick="abrirMensajeCliente(${client.id})">✉️ Mensaje</button>
          <button class="btn btn-qr" onclick="abrirQRCliente(${client.id})">📱 QR + Mensaje</button>
          <button class="btn" style="background:rgba(139,92,246,0.1);border-color:rgba(139,92,246,0.3);color:var(--color-reprogramado);" onclick="openClientTemplates(${client.id})">📚 Plantillas</button>
          <button class="btn" style="background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.3);color:#818cf8;" onclick="waEmpresaCliente(${client.id})">🏢 Empresa WA</button>
          <button class="btn" style="background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2);color:var(--color-fallido);" onclick="deleteClient(${client.id})">🗑️ Eliminar</button>
        </div>

        <!-- PANEL MENSAJE EDITABLE -->
        <div id="msg-panel-${client.id}" style="display:none;margin-top:10px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px;">
          <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">✉️ Mensaje — edita antes de enviar</div>
          <textarea id="msg-text-${client.id}" rows="4" style="width:100%;background:var(--input-bg);border:1px solid var(--border-color);border-radius:8px;padding:10px;color:var(--text-primary);font-size:0.82rem;line-height:1.55;resize:vertical;"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn btn-whatsapp" style="flex:1;font-size:0.78rem;" onclick="enviarMensajeCliente(${client.id})">💬 Enviar WA</button>
            <button class="btn" style="flex:1;font-size:0.78rem;background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.3);color:#818cf8;" onclick="copiarMensajeCliente(${client.id})">📋 Copiar</button>
          </div>
        </div>

        <!-- PANEL QR SINCRONIZADO -->
        <div id="qr-panel-${client.id}" style="display:none;margin-top:10px;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.2);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:8px;font-weight:600;">📱 QR de Cobro — sincronizado con sección QR</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px;">
            <button onclick="setQRTipoCliente(${client.id},'yape')" id="qr-btn-y-${client.id}" style="padding:6px 14px;background:rgba(139,92,246,0.15);border:1.5px solid rgba(139,92,246,0.4);border-radius:20px;color:#a78bfa;font-size:0.72rem;font-weight:700;cursor:pointer;">💜 Yape</button>
            <button onclick="setQRTipoCliente(${client.id},'plin')" id="qr-btn-p-${client.id}" style="padding:6px 14px;background:var(--input-bg);border:1.5px solid var(--border-color);border-radius:20px;color:var(--text-secondary);font-size:0.72rem;font-weight:700;cursor:pointer;">💙 Plin</button>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px;display:inline-block;">
            <img id="qr-img-${client.id}" src="" style="width:150px;height:150px;object-fit:contain;display:none;">
            <div id="qr-placeholder-${client.id}" style="width:150px;height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;font-size:0.75rem;"><div style="font-size:2rem;margin-bottom:6px;">📷</div><div>Sin QR configurado</div></div>
          </div>
          <div style="font-size:0.7rem;color:var(--text-secondary);margin:8px 0 4px;font-weight:600;">✏️ Mensaje editable</div>
          <textarea id="qr-msg-${client.id}" rows="3" style="width:100%;background:var(--input-bg);border:1px solid var(--border-color);border-radius:8px;padding:8px;color:var(--text-primary);font-size:0.75rem;resize:none;"></textarea>
          <button class="btn btn-whatsapp" style="width:100%;margin-top:8px;font-size:0.78rem;" onclick="compartirQRCliente(${client.id})">📲 Compartir QR por WhatsApp</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

// --- ACCIONES CLIENTE ---
window.toggleCardExpand = id => {
  document.getElementById(`client-card-${id}`)?.classList.toggle('expanded');
};

window.changeStatus = (id, status) => {
  const c = state.clients.find(c => c.id === id);
  if (!c) return;
  c.status = status;
  saveState();
  renderClients();
  renderDashboard();
  showToast(`Estado: ${status}`);
};

window.updateNote = (id, val) => {
  const c = state.clients.find(c => c.id === id);
  if (c) { c.observation = val; saveState(); }
};

window.deleteClient = id => {
  if (confirm('¿Eliminar este cliente?')) {
    state.clients = state.clients.filter(c => c.id !== id);
    saveState(); renderClients(); renderDashboard();
    showToast('Cliente eliminado');
  }
};

// --- MENSAJE DEFAULT POR ESTADO ---
export function getMensajeDefault(client) {
  const now = new Date();
  const nombre = (client.name || '').split(' ')[0];
  const producto = client.product || 'tu pedido';
  const cobrar = parseFloat(client.cobrar || 0).toFixed(2);
  const yape = state.config?.yapeNum || '';
  const plin = state.config?.plinNum || '';
  const empresa = state.config?.businessName || '';
  const direccion = client.address || '';
  const telefono = client.phone || '';
  const ruta = client.district || '';
  const fecha = now.toLocaleDateString('es-PE');
  const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const msgs = {
    'Pendiente':
      `Hola ${nombre}! 🛵 Ya salgo con tu ${producto}.\nMonto: S/ ${cobrar}${yape ? '\nYape: ' + yape : ''}${plin ? ' | Plin: ' + plin : ''}\nDirección: ${direccion}`,
    'Entregado':
      `Hola ${nombre}! ✅ Tu ${producto} fue entregado correctamente. ¡Gracias por tu compra!`,
    'Empresa':
      `Estimado ${nombre}, coordinamos la entrega corporativa de *${producto}* por S/ ${cobrar}.\nDirección: ${direccion}\nFecha: ${fecha} • ${hora}\n${empresa ? 'Empresa: ' + empresa : ''}`,
    'Fallido':
      `Hola ${nombre}, no pudimos entregar tu ${producto} en ${direccion}.\nPor favor comunícate para coordinar una nueva entrega. Tel: ${telefono}`,
    'Reprogramado':
      `Hola ${nombre}, reprogramamos la entrega de tu ${producto}.\nTe avisamos la nueva fecha y hora. Dirección: ${direccion}`,
    'Dirección incorrecta':
      `Hola ${nombre}, la dirección *${direccion}* no coincide con lo registrado.\nPor favor envíanos tu ubicación exacta para entregar tu ${producto}.`,
    'Sin WhatsApp':
      ``,
    'No contesta':
      `Hola ${nombre}, intentamos contactarte para la entrega de tu ${producto} sin éxito.\nPor favor comunícate al ${telefono} para coordinar.`,
  };
  return msgs[client.status] || msgs['Pendiente'];
}

// --- PANEL MENSAJE CLIENTE ---
window.abrirMensajeCliente = id => {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const panel = document.getElementById(`msg-panel-${id}`);
  const qrPanel = document.getElementById(`qr-panel-${id}`);
  if (!panel) return;
  if (qrPanel) qrPanel.style.display = 'none';
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    const ta = document.getElementById(`msg-text-${id}`);
    if (ta) ta.value = getMensajeDefault(client);
  }
};

window.enviarMensajeCliente = id => {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const ta = document.getElementById(`msg-text-${id}`);
  const msg = ta ? ta.value : getMensajeDefault(client);
  const tel = cleanPhoneNumber(client.phone);
  if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  else showToast('Sin número de WhatsApp');
};

window.copiarMensajeCliente = id => {
  const ta = document.getElementById(`msg-text-${id}`);
  if (ta && navigator.clipboard) navigator.clipboard.writeText(ta.value).then(() => showToast('Mensaje copiado'));
};

// --- QR SINCRONIZADO CON SECCIÓN QR PRINCIPAL ---
const qrTipoActivo = {};

function getQRSrc(tipo) {
  // Prioridad: 1. QR del state (subido en sección QR) 2. localStorage RiderTrack
  return state.qrs?.[tipo] || localStorage.getItem(`ridertrack_qr_${tipo}`) || '';
}

window.abrirQRCliente = id => {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const panel = document.getElementById(`qr-panel-${id}`);
  const msgPanel = document.getElementById(`msg-panel-${id}`);
  if (!panel) return;
  if (msgPanel) msgPanel.style.display = 'none';
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    // Auto-seleccionar: Empresa → plin, resto → yape
    qrTipoActivo[id] = client.status === 'Empresa' ? 'plin' : 'yape';
    cargarQRCliente(id);
    // Mensaje default del QR
    const ta = document.getElementById(`qr-msg-${id}`);
    if (ta) {
      const nombre = (client.name || '').split(' ')[0];
      const tipo = qrTipoActivo[id];
      const num = tipo === 'yape' ? state.config?.yapeNum : state.config?.plinNum;
      ta.value = `Hola ${nombre}! Te comparto mi QR de cobro.\nMonto: S/ ${parseFloat(client.cobrar||0).toFixed(2)}${num ? '\n' + (tipo==='yape'?'Yape':'Plin') + ': ' + num : ''}`;
    }
  }
};

window.setQRTipoCliente = (id, tipo) => {
  qrTipoActivo[id] = tipo;
  cargarQRCliente(id);
  ['y','p'].forEach(t => {
    const btn = document.getElementById(`qr-btn-${t}-${id}`);
    const active = (t === 'y' && tipo === 'yape') || (t === 'p' && tipo === 'plin');
    if (btn) {
      btn.style.background = active ? (t==='y'?'rgba(139,92,246,0.15)':'rgba(59,130,246,0.15)') : 'var(--input-bg)';
      btn.style.borderColor = active ? (t==='y'?'rgba(139,92,246,0.4)':'rgba(59,130,246,0.4)') : 'var(--border-color)';
      btn.style.color = active ? (t==='y'?'#a78bfa':'#60a5fa') : 'var(--text-secondary)';
    }
  });
};

function cargarQRCliente(id) {
  const tipo = qrTipoActivo[id] || 'yape';
  const src = getQRSrc(tipo);
  const img = document.getElementById(`qr-img-${id}`);
  const ph = document.getElementById(`qr-placeholder-${id}`);
  if (img && ph) {
    if (src) { img.src = src; img.style.display = 'block'; ph.style.display = 'none'; }
    else { img.style.display = 'none'; ph.style.display = 'flex'; }
  }
}

window.compartirQRCliente = id => {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const tipo = qrTipoActivo[id] || 'yape';
  const src = getQRSrc(tipo);
  const ta = document.getElementById(`qr-msg-${id}`);
  const msg = ta ? ta.value : '';
  const tel = cleanPhoneNumber(client.phone);
  if (!src) {
    if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    showToast('Sin QR — enviando solo mensaje');
    return;
  }
  try {
    const arr = src.split(','), mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]), u8 = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
    const file = new File([new Blob([u8],{type:mime})], `QR_${tipo}.png`, {type:mime});
    if (navigator.canShare && navigator.canShare({files:[file]})) {
      navigator.share({files:[file], text:msg}).catch(() => {
        if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
      });
    } else if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  } catch(e) {
    if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  }
};

// --- WA EMPRESA ---
window.waEmpresaCliente = id => {
  // Abre el panel de acciones rápidas de empresa (clienteplus.js)
  if (typeof window.abrirPanelEmpresa === 'function') {
    window.abrirPanelEmpresa(id);
  } else {
    // Fallback si clienteplus no cargó
    const client = state.clients.find(c => c.id === id);
    if (!client) return;
    const msg = getMensajeDefault({...client, status: 'Empresa'});
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }
};

// --- SYNC RIDERTRACK ---
// ESTADO: Solo existe estructura de conexión vía localStorage compartido.
// NO hay API, NO hay webhook, NO hay servidor.
// Funciona únicamente si ambas apps están en el mismo dominio (alenrudy.github.io).
// Para una conexión real se necesitaría una API REST o Firebase.
window.syncRiderTrack = () => {
  showToast('Sincronizando con RiderTrack...');
  const mapStatus = st => {
    const m = {'pendiente':'Pendiente','efectivo':'Entregado','yape':'Entregado','plin':'Entregado','transferencia':'Entregado','empresa':'Empresa','fallida':'Fallido','reprogramar':'Reprogramado','no_contesta':'No contesta'};
    return m[st?.toLowerCase()] || 'Pendiente';
  };
  try {
    const rt = JSON.parse(localStorage.getItem('urRoute') || '{}');
    const clsRT = rt.cl || [];
    if (!clsRT.length) { showToast('RiderTrack: sin clientes cargados'); return; }
    let updated = 0, added = 0;
    clsRT.forEach(incoming => {
      const phone = cleanPhoneNumber(incoming.cel || incoming.phone || '');
      const idx = state.clients.findIndex(c =>
        cleanPhoneNumber(c.phone) === phone ||
        (c.name||'').toLowerCase().trim() === (incoming.nombre||incoming.name||'').toLowerCase().trim()
      );
      const mapped = {
        name: incoming.nombre||incoming.name||'',
        product: incoming.prod||incoming.product||'',
        phone: incoming.cel||incoming.phone||'',
        district: incoming.dist||incoming.district||'',
        address: incoming.dir||incoming.address||'',
        cobrar: parseFloat(incoming.cobrar||incoming.precio||0),
        status: mapStatus(incoming.st||incoming.status||'pendiente'),
        observation: incoming.obs||incoming.observation||'',
      };
      if (idx !== -1) { state.clients[idx] = {...state.clients[idx], ...mapped}; updated++; }
      else { state.clients.unshift({id: Date.now()+Math.random(), ...mapped}); added++; }
    });
    saveState(); renderDashboard(); renderClients();
    showToast(`RiderTrack: ${updated} actualizados, ${added} nuevos`);
  } catch(e) {
    showToast('Error sincronizando con RiderTrack');
    console.error(e);
  }
};

// --- MASIVO ---
function renderMassClientsList() {
  const container = document.getElementById('masivo-clients-container');
  if (!container) return;
  container.innerHTML = '';
  state.clients.forEach(client => {
    const sc = (client.status||'').toLowerCase().replace(/\s+/g,'-');
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--input-bg);border-radius:8px;margin-bottom:6px;';
    item.innerHTML = `
      <input type="checkbox" class="masivo-check" data-id="${client.id}" style="width:16px;height:16px;cursor:pointer;">
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.85rem;">${client.name}</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);">${client.product} • S/ ${parseFloat(client.cobrar||0).toFixed(2)}</div>
      </div>
      <span class="status-badge status-${sc}" style="font-size:0.65rem;">${client.status}</span>
    `;
    container.appendChild(item);
  });
}

// --- INICIALIZACIÓN ---

// --- MASIVO: FUNCIONES COMPLETAS ---
let masivoSelectedIds = new Set();
let masivoQueue = [];
let masivoQueueIndex = 0;

function renderMasivoView() {
  renderMassClientsList();
  renderMasivoTags();
  loadMasivoTemplateSelect();
  updateMasivoCount();
}

function renderMassClientsList() {
  const container = document.getElementById('masivo-clients-container');
  if (!container) return;
  const query = (document.getElementById('masivo-search-input')?.value || '').toLowerCase();
  container.innerHTML = '';
  const filtered = state.clients.filter(c =>
    !query ||
    (c.name||'').toLowerCase().includes(query) ||
    (c.district||'').toLowerCase().includes(query)
  );
  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-secondary);font-size:0.82rem;">Sin clientes</div>';
    return;
  }
  filtered.forEach(client => {
    const sc = (client.status||'').toLowerCase().replace(/\s+/g,'-');
    const checked = masivoSelectedIds.has(client.id);
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--input-bg);border:1.5px solid '+(checked?'var(--accent)':'var(--border-color)')+';border-radius:10px;cursor:pointer;transition:all 0.15s;';
    item.innerHTML = `
      <input type="checkbox" data-id="${client.id}" ${checked?'checked':''} style="width:17px;height:17px;cursor:pointer;accent-color:var(--accent);">
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${client.name}</div>
        <div style="font-size:0.7rem;color:var(--text-secondary);">${client.product} • S/ ${parseFloat(client.cobrar||0).toFixed(2)}</div>
      </div>
      <span class="status-badge status-${sc}" style="font-size:0.62rem;flex-shrink:0;">${client.status}</span>
    `;
    const cb = item.querySelector('input[type=checkbox]');
    const toggle = () => {
      if (masivoSelectedIds.has(client.id)) masivoSelectedIds.delete(client.id);
      else masivoSelectedIds.add(client.id);
      updateMasivoCount();
      renderMassClientsList();
    };
    cb.addEventListener('change', toggle);
    item.addEventListener('click', e => { if (e.target !== cb) toggle(); });
    container.appendChild(item);
  });
  updateMasivoCount();
}

function updateMasivoCount() {
  const el = document.getElementById('masivo-selected-count');
  if (el) el.textContent = masivoSelectedIds.size;
}

window.selectMasivoAll = (sel) => {
  if (sel) state.clients.forEach(c => masivoSelectedIds.add(c.id));
  else masivoSelectedIds.clear();
  renderMassClientsList();
};

function renderMasivoTags() {
  const container = document.getElementById('masivo-builder-tags');
  if (!container) return;
  const tags = ['{nombre}','{producto}','{cobrar}','{direccion}','{telefono}','{ruta}','{fecha}','{hora}'];
  container.innerHTML = '';
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.cssText = 'padding:5px 10px;font-size:0.72rem;margin:3px;';
    btn.textContent = tag;
    btn.addEventListener('click', () => {
      const ta = document.getElementById('masivo-text-area');
      if (!ta) return;
      const s = ta.selectionStart, e2 = ta.selectionEnd;
      ta.value = ta.value.substring(0,s) + tag + ta.value.substring(e2);
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + tag.length;
    });
    container.appendChild(btn);
  });
}

function loadMasivoTemplateSelect() {
  const sel = document.getElementById('masivo-tpl-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Seleccionar plantilla —</option>';
  (state.templates || []).forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.title;
    sel.appendChild(opt);
  });
}

window.loadMasivoTemplate = () => {
  const sel = document.getElementById('masivo-tpl-select');
  const ta  = document.getElementById('masivo-text-area');
  if (!sel || !ta) return;
  const tpl = (state.templates||[]).find(t => String(t.id) === sel.value);
  if (tpl) ta.value = tpl.text;
};

window.startMassSendingQueue = () => {
  const msg = (document.getElementById('masivo-text-area')?.value || '').trim();
  if (!msg) { showToast('Escribe un mensaje primero'); return; }
  if (!masivoSelectedIds.size) { showToast('Selecciona al menos un destinatario'); return; }

  masivoQueue = state.clients.filter(c => masivoSelectedIds.has(c.id));
  masivoQueueIndex = 0;

  const modal = document.getElementById('masivo-queue-modal');
  if (modal) modal.classList.add('active');
  processNextInQueue();
};

window.processNextInQueue = () => {
  if (masivoQueueIndex >= masivoQueue.length) {
    window.closeMassSendingQueue();
    showToast(`✅ Envío masivo completado — ${masivoQueue.length} mensajes`);
    masivoSelectedIds.clear();
    renderMassClientsList();
    return;
  }

  const client = masivoQueue[masivoQueueIndex];
  const now = new Date();
  let msg = (document.getElementById('masivo-text-area')?.value || '');

  // Apply tags
  msg = msg
    .replace(/\{nombre\}/g,    (client.name||'').split(' ')[0])
    .replace(/\{producto\}/g,   client.product||'')
    .replace(/\{cobrar\}/g,     parseFloat(client.cobrar||0).toFixed(2))
    .replace(/\{direccion\}/g,  client.address||'')
    .replace(/\{telefono\}/g,   client.phone||'')
    .replace(/\{ruta\}/g,       client.district||'')
    .replace(/\{fecha\}/g,      now.toLocaleDateString('es-PE'))
    .replace(/\{hora\}/g,       now.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}));

  const nameEl = document.getElementById('masivo-queue-client-name');
  const preview = document.getElementById('masivo-queue-text-preview');
  const progress = document.getElementById('masivo-queue-progress');
  const bar = document.getElementById('masivo-queue-bar');

  if (nameEl)   nameEl.textContent  = client.name || 'Cliente';
  if (preview)  preview.value       = msg;
  if (progress) progress.textContent = `${masivoQueueIndex + 1} de ${masivoQueue.length}`;
  if (bar)      bar.style.width      = `${((masivoQueueIndex) / masivoQueue.length) * 100}%`;

  // Open WhatsApp
  const tel = cleanPhoneNumber(client.phone);
  if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');

  masivoQueueIndex++;
};

window.closeMassSendingQueue = () => {
  const modal = document.getElementById('masivo-queue-modal');
  if (modal) modal.classList.remove('active');
  masivoQueue = [];
  masivoQueueIndex = 0;
};

// Expose masivo renderers globally
window.renderMasivoView = renderMasivoView;
window.renderMassClientsList = renderMassClientsList;

// Masivo search binding
function initMasivoSearch() {
  const searchEl = document.getElementById('masivo-search-input');
  if (searchEl && !searchEl._bound) {
    searchEl._bound = true;
    searchEl.addEventListener('input', () => renderMassClientsList());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme(state.theme);
  initClock();
  initNavigation();
  initFilters();     // FIX: filtros correctamente enlazados
  initAddClient();   // FIX: nuevo cliente correctamente enlazado
  renderDashboard();
  renderClients();
  loadConfigForm();

  // Módulos externos
  inicializarQR();
  inicializarMensajes();
  inicializarRutas();
  inicializarClientePlus();

  // Slider tema
  const slider = document.getElementById('theme-slider');
  if (slider) {
    slider.value = state.theme === 'light' ? 1 : 0;
    slider.addEventListener('input', e => applyTheme(e.target.value === '1' ? 'light' : 'dark'));
  }

  // Config
  const btnSaveConfig = document.getElementById('btn-save-config');
  if (btnSaveConfig) btnSaveConfig.addEventListener('click', saveConfig);

  // Initialize masivo last (after all modules)
  try {
    renderMasivoView();
    initMasivoSearch();
  } catch(e) {
    console.warn('Masivo init deferred:', e);
    setTimeout(() => { renderMasivoView(); initMasivoSearch(); }, 200);
  }
});
