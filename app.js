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
  { id: 2, title: 'Cobro de Pedido', text: 'Hola {nombre}, el monto a cobrar por tu {producto} es S/{cobrar}. Puedes cancelarlo vía Yape al {yape}.', categoryId: 'cat-cobro', favorite: true },
  { id: 3, title: 'Solicitar Ubicación', text: 'Hola {nombre}, envíame tu ubicación exacta para entregarte tu pedido en {distrito}.', categoryId: 'cat-ubicacion', favorite: false },
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
        ...state,
        ...parsed,
        templates: parsed.templates || defaultTemplates,
        categories: parsed.categories || defaultCategories,
        customTags: parsed.customTags || defaultCustomTags
      };
    } catch(e) {
      console.error('Error cargando estado:', e);
    }
  } else {
    saveState();
  }
}

export function saveState() {
  try {
    localStorage.setItem('clienttrack_state_v1', JSON.stringify(state));
  } catch(e) {
    console.warn('Error guardando estado:', e);
  }
}

// Carga inmediata
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

export function openWhatsApp(phoneString) {
  const cleaned = cleanPhoneNumber(phoneString);
  if (cleaned.length >= 9) window.open(`https://wa.me/${cleaned}`, '_blank');
  else showToast('Número inválido');
}

// Exponer para onclick en HTML
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
  function update() {
    const now = new Date();
    const date = now.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
    const time = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    el.textContent = `${date} • ${time}`;
  }
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
      if (target === 'view-masivo') initMasivoView();
      if (target === 'view-config') loadConfigForm();
    });
  });
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
  const stats = {
    total: clients.length,
    pendientes: clients.filter(c => c.status === 'Pendiente').length,
    entregados: clients.filter(c => c.status === 'Entregado').length,
    empresa: clients.filter(c => c.status === 'Empresa').length,
    fallidos: clients.filter(c => c.status === 'Fallido').length,
    reprogramados: clients.filter(c => c.status === 'Reprogramado').length,
    montoCobrado: clients.filter(c => c.status === 'Entregado').reduce((a, c) => a + parseFloat(c.cobrar || 0), 0),
    montoPendiente: clients.filter(c => ['Pendiente','Empresa','Reprogramado','No contesta'].includes(c.status)).reduce((a, c) => a + parseFloat(c.cobrar || 0), 0),
  };

  const els = {
    'dash-total': stats.total,
    'dash-pendientes': stats.pendientes,
    'dash-entregados': stats.entregados,
    'dash-empresa': stats.empresa,
    'dash-fallidos': stats.fallidos,
    'dash-reprogramados': stats.reprogramados,
    'dash-monto-cobrado': `S/ ${stats.montoCobrado.toFixed(2)}`,
    'dash-monto-pendiente': `S/ ${stats.montoPendiente.toFixed(2)}`,
  };
  Object.entries(els).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

// --- CLIENTES ---
let activeFilter = 'Todos';
let searchQuery = '';

export function renderClients() {
  const list = document.getElementById('client-list-container');
  if (!list) return;
  list.innerHTML = '';

  const filtered = state.clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery) ||
      c.product.toLowerCase().includes(searchQuery) ||
      c.district.toLowerCase().includes(searchQuery);
    const matchStatus = activeFilter === 'Todos' || c.status === activeFilter;
    return matchSearch && matchStatus;
  });

  if (!filtered.length) {
    list.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-secondary);font-size:0.85rem;">Ningún cliente coincide.</div>`;
    return;
  }

  filtered.sort((a,b) => (a.rutaSequence||9999) - (b.rutaSequence||9999)).forEach(client => {
    const card = document.createElement('div');
    card.className = 'card client-card';
    card.id = `client-card-${client.id}`;

    const statusClass = client.status.toLowerCase()
      .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u')
      .replace(/\s+/g,'-');

    card.innerHTML = `
      <div class="client-header" onclick="toggleCardExpand(${client.id})">
        <div class="client-main-info">
          <span class="client-title">${client.name}</span>
          <span class="client-subtitle">${client.product} • <strong>${client.district}</strong></span>
        </div>
        <div class="client-right-info">
          <span class="client-cobro">S/ ${parseFloat(client.cobrar).toFixed(2)}</span>
          <span class="status-badge status-${statusClass}">${client.status}</span>
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
            <span class="detail-value">${client.address}</span>
          </div>
          <div class="detail-item detail-item-full">
            <span class="detail-label">Notas</span>
            <textarea class="notes-textarea" placeholder="Observaciones..." onchange="updateNote(${client.id}, this.value)">${client.observation||''}</textarea>
          </div>
        </div>
        <div class="panel-actions" style="grid-template-columns: repeat(2,1fr); gap:8px;">
          <button class="btn btn-whatsapp" onclick="openWhatsApp('${client.phone}')">💬 WhatsApp</button>
          <button class="btn" style="background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);color:var(--color-entregado);" onclick="abrirMensajeCliente(${client.id})">✉️ Mensaje</button>
          <button class="btn btn-qr" onclick="abrirQRCliente(${client.id})">📱 QR + Mensaje</button>
          <button class="btn" style="background:rgba(139,92,246,0.1);border-color:rgba(139,92,246,0.3);color:var(--color-reprogramado);" onclick="openClientTemplates(${client.id})">📚 Plantillas</button>
          <button class="btn" style="background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.3);color:#818cf8;" onclick="waEmpresaCliente(${client.id})">🏢 Empresa WA</button>
          <button class="btn" style="background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.2);color:var(--color-fallido);" onclick="deleteClient(${client.id})">🗑️ Eliminar</button>
        </div>
        <!-- PANEL MENSAJE -->
        <div id="msg-panel-${client.id}" style="display:none;margin-top:10px;background:rgba(16,185,129,0.05);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:12px;">
          <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">✉️ Mensaje — edita antes de enviar</div>
          <textarea id="msg-text-${client.id}" rows="4" style="width:100%;background:var(--input-bg);border:1px solid var(--border-color);border-radius:8px;padding:10px;color:var(--text-primary);font-size:0.82rem;line-height:1.55;resize:vertical;"></textarea>
          <div style="display:flex;gap:8px;margin-top:8px;">
            <button class="btn btn-whatsapp" style="flex:1;font-size:0.78rem;" onclick="enviarMensajeCliente(${client.id})">💬 Enviar WA</button>
            <button class="btn" style="flex:1;font-size:0.78rem;background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.3);color:#818cf8;" onclick="copiarMensajeCliente(${client.id})">📋 Copiar</button>
          </div>
        </div>
        <!-- PANEL QR -->
        <div id="qr-panel-${client.id}" style="display:none;margin-top:10px;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.2);border-radius:10px;padding:12px;text-align:center;">
          <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:8px;font-weight:600;">📱 QR de Cobro</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px;">
            <button onclick="setQRTipoCliente(${client.id},'yape')" id="qr-btn-y-${client.id}" style="padding:6px 14px;background:rgba(139,92,246,0.15);border:1.5px solid rgba(139,92,246,0.4);border-radius:20px;color:#a78bfa;font-size:0.72rem;font-weight:700;cursor:pointer;">💜 Yape</button>
            <button onclick="setQRTipoCliente(${client.id},'plin')" id="qr-btn-p-${client.id}" style="padding:6px 14px;background:var(--input-bg);border:1.5px solid var(--border-color);border-radius:20px;color:var(--text-secondary);font-size:0.72rem;font-weight:700;cursor:pointer;">💙 Plin</button>
          </div>
          <div style="background:#fff;border-radius:12px;padding:12px;display:inline-block;">
            <img id="qr-img-${client.id}" src="" style="width:150px;height:150px;object-fit:contain;display:none;">
            <div id="qr-placeholder-${client.id}" style="width:150px;height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;font-size:0.75rem;"><div style="font-size:2rem;margin-bottom:6px;">📷</div><div>Sin QR</div></div>
          </div>
          <div style="font-size:0.7rem;color:var(--text-secondary);margin:8px 0 4px;font-weight:600;">✏️ Mensaje editable</div>
          <textarea id="qr-msg-${client.id}" rows="3" style="width:100%;background:var(--input-bg);border:1px solid var(--border-color);border-radius:8px;padding:8px;color:var(--text-primary);font-size:0.75rem;resize:none;"></textarea>
          <button class="btn btn-whatsapp" style="width:100%;margin-top:8px;font-size:0.78rem;" onclick="compartirQRCliente(${client.id})">📲 Compartir QR por WhatsApp</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  // Bind search and filters
  const searchEl = document.getElementById('client-search-input');
  if (searchEl && !searchEl._bound) {
    searchEl._bound = true;
    searchEl.addEventListener('input', e => { searchQuery = e.target.value.toLowerCase(); renderClients(); });
  }
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  filterBtns.forEach(btn => {
    if (!btn._bound) {
      btn._bound = true;
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        renderClients();
      });
    }
  });
}

// --- ACCIONES CLIENTE ---
window.toggleCardExpand = function(id) {
  const card = document.getElementById(`client-card-${id}`);
  if (card) card.classList.toggle('expanded');
};

window.changeStatus = function(id, status) {
  const c = state.clients.find(c => c.id === id);
  if (c) { c.status = status; saveState(); renderClients(); renderDashboard(); showToast(`Estado: ${status}`); }
};

window.updateNote = function(id, val) {
  const c = state.clients.find(c => c.id === id);
  if (c) { c.observation = val; saveState(); }
};

window.deleteClient = function(id) {
  if (confirm('¿Eliminar este cliente?')) {
    state.clients = state.clients.filter(c => c.id !== id);
    saveState(); renderClients(); renderDashboard(); showToast('Cliente eliminado');
  }
};

// --- MENSAJE POR ESTADO ---
function getMensajeDefault(client) {
  const nombre = (client.name || '').split(' ')[0];
  const producto = client.product || 'tu pedido';
  const cobrar = parseFloat(client.cobrar || 0).toFixed(2);
  const yape = state.config?.yapeNum || '';
  const msgs = {
    'Pendiente': `Hola ${nombre}! 🛵 Ya salgo con tu ${producto}. Monto: S/ ${cobrar}.${yape?' Yape: '+yape:''}`,
    'Entregado': `Hola ${nombre}! ✅ Tu ${producto} fue entregado. ¡Gracias!`,
    'Empresa': `Estimado ${nombre}, coordinaremos la entrega corporativa de ${producto} por S/ ${cobrar}.`,
    'Fallido': `Hola ${nombre}, no pudimos entregar tu ${producto}. Comunícate para coordinar.`,
    'Reprogramado': `Hola ${nombre}, reprogramamos la entrega de tu ${producto}. Te avisamos.`,
    'Dirección incorrecta': `Hola ${nombre}, la dirección no es válida. Envíanos tu ubicación para ${producto}.`,
    'No contesta': `Hola ${nombre}, intentamos ubicarte para ${producto} sin éxito. Por favor contáctanos.`,
    'Sin WhatsApp': ``,
  };
  return msgs[client.status] || msgs['Pendiente'];
}

window.abrirMensajeCliente = function(id) {
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

window.enviarMensajeCliente = function(id) {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const ta = document.getElementById(`msg-text-${id}`);
  const msg = ta ? ta.value : getMensajeDefault(client);
  const tel = cleanPhoneNumber(client.phone);
  if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  else showToast('Sin número de WhatsApp');
};

window.copiarMensajeCliente = function(id) {
  const ta = document.getElementById(`msg-text-${id}`);
  if (ta && navigator.clipboard) navigator.clipboard.writeText(ta.value).then(() => showToast('Mensaje copiado'));
};

// --- QR POR CLIENTE ---
const qrTipoActivo = {};

window.abrirQRCliente = function(id) {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const panel = document.getElementById(`qr-panel-${id}`);
  const msgPanel = document.getElementById(`msg-panel-${id}`);
  if (!panel) return;
  if (msgPanel) msgPanel.style.display = 'none';
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    qrTipoActivo[id] = client.status === 'Empresa' ? 'plin' : 'yape';
    cargarQRCliente(id);
    const ta = document.getElementById(`qr-msg-${id}`);
    if (ta) {
      const nombre = (client.name||'').split(' ')[0];
      ta.value = `Hola ${nombre}! Te comparto mi QR de cobro.\nMonto: S/ ${parseFloat(client.cobrar||0).toFixed(2)}\n${state.config?.yapeNum?'Yape: '+state.config.yapeNum:''}`;
    }
  }
};

window.setQRTipoCliente = function(id, tipo) {
  qrTipoActivo[id] = tipo;
  cargarQRCliente(id);
  const btnY = document.getElementById(`qr-btn-y-${id}`);
  const btnP = document.getElementById(`qr-btn-p-${id}`);
  if (btnY) { btnY.style.background = tipo==='yape'?'rgba(139,92,246,0.15)':'var(--input-bg)'; btnY.style.color = tipo==='yape'?'#a78bfa':'var(--text-secondary)'; }
  if (btnP) { btnP.style.background = tipo==='plin'?'rgba(59,130,246,0.15)':'var(--input-bg)'; btnP.style.color = tipo==='plin'?'#60a5fa':'var(--text-secondary)'; }
};

function cargarQRCliente(id) {
  const tipo = qrTipoActivo[id] || 'yape';
  const src = localStorage.getItem(`ridertrack_qr_${tipo}`) || state.qrs?.[tipo] || '';
  const img = document.getElementById(`qr-img-${id}`);
  const ph = document.getElementById(`qr-placeholder-${id}`);
  if (img && ph) {
    if (src) { img.src = src; img.style.display = 'block'; ph.style.display = 'none'; }
    else { img.style.display = 'none'; ph.style.display = 'flex'; }
  }
}

window.compartirQRCliente = function(id) {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const tipo = qrTipoActivo[id] || 'yape';
  const src = localStorage.getItem(`ridertrack_qr_${tipo}`) || state.qrs?.[tipo] || '';
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

window.waEmpresaCliente = function(id) {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const nombre = (client.name||'').split(' ')[0];
  const msg = `Estimado ${nombre}, coordinaremos la entrega corporativa de *${client.product}* por S/ ${parseFloat(client.cobrar||0).toFixed(2)}. ${state.config?.businessInfo||''}`;
  const tel = cleanPhoneNumber(client.phone);
  if (tel) window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  else if (navigator.clipboard) navigator.clipboard.writeText(msg).then(() => showToast('Mensaje empresa copiado'));
};

// --- SYNC RIDERTRACK ---
window.syncRiderTrack = function() {
  showToast('Sincronizando con RiderTrack...');
  const mapStatus = (st) => {
    const map = {'pendiente':'Pendiente','efectivo':'Entregado','yape':'Entregado','plin':'Entregado','transferencia':'Entregado','empresa':'Empresa','fallida':'Fallido','reprogramar':'Reprogramado','no_contesta':'No contesta'};
    return map[st?.toLowerCase()] || 'Pendiente';
  };
  try {
    const rt = JSON.parse(localStorage.getItem('urRoute') || '{}');
    const clsRT = rt.cl || [];
    if (!clsRT.length) { showToast('RiderTrack sin clientes'); return; }
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
window.initMasivoView = function() {
  // Delegate to the inline function if needed
  renderMassClientsList();
};

function renderMassClientsList() {
  const container = document.getElementById('masivo-clients-list');
  if (!container) return;
  container.innerHTML = '';
  state.clients.forEach(client => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--input-bg);border-radius:8px;margin-bottom:6px;';
    item.innerHTML = `
      <input type="checkbox" class="masivo-check" data-id="${client.id}" style="width:16px;height:16px;cursor:pointer;">
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.85rem;">${client.name}</div>
        <div style="font-size:0.72rem;color:var(--text-secondary);">${client.product} • S/ ${parseFloat(client.cobrar||0).toFixed(2)}</div>
      </div>
      <span class="status-badge status-${client.status.toLowerCase().replace(/\s+/g,'-')}" style="font-size:0.65rem;">${client.status}</span>
    `;
    container.appendChild(item);
  });
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  applyTheme(state.theme);
  initClock();
  initNavigation();
  renderDashboard();
  renderClients();
  loadConfigForm();

  // Módulos externos
  inicializarQR();
  inicializarMensajes();
  inicializarRutas();
  inicializarClientePlus();

  // Slider de tema
  const slider = document.getElementById('theme-slider');
  if (slider) {
    slider.value = state.theme === 'light' ? 1 : 0;
    slider.addEventListener('input', e => applyTheme(e.target.value === '1' ? 'light' : 'dark'));
  }

  // Config save button
  const btnSaveConfig = document.getElementById('btn-save-config');
  if (btnSaveConfig) btnSaveConfig.addEventListener('click', saveConfig);
});
