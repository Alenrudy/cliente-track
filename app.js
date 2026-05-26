/**
 * ClienteTrack Alpha - app.js
 * Orquestador principal de la aplicación y gestión de Clientes (ES Modules nativos)
 */

import { inicializarQR, renderQRs } from './qr.js';
import { inicializarMensajes, initMensajesView } from './mensajes.js';
import { inicializarRutas } from './rutas.js';
import { inicializarClientePlus } from './clienteplus.js';

// --- ESTADO INICIAL Y PERSISTENCIA ---
const initialClients = [
  { id: 1, name: "Carlos Mendoza", product: "Polera Over-Size Negra", phone: "987654321", district: "Miraflores", address: "Av. Larco 743 Apt 202", cobrar: 120.00, status: "Pendiente", observation: "Entregar por la tarde. Portería recibe si no está." },
  { id: 2, name: "Ana Isabel Ruiz", product: "Pack Termos Inteligentes", phone: "+51 941-234-567", district: "Surco", address: "Calle Las Begonias 145", cobrar: 85.50, status: "Entregado", observation: "Pagó por Yape al recibir." },
  { id: 3, name: "Corporación Logix", product: "Servicios de Envío x10", phone: "922441133", district: "San Borja", address: "Av. Aviación 3120 Of 502", cobrar: 450.00, status: "Empresa", observation: "Dejar factura impresa al recepcionista." },
  { id: 4, name: "Esteban Quiroz", product: "Zapatillas Urbanas V2", phone: "991-882-773", district: "Chorrillos", address: "Jr. Alfonso Ugarte 542", cobrar: 190.00, status: "Fallido", observation: "Teléfono apagado durante visita de entrega." }
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
  { id: 2, title: 'Cobro de Pedido', text: 'Hola {nombre}, el monto a cobrar por tu {producto} es S/{cobrar}. Puedes cancelarlo vía Yape al número {yape}.', categoryId: 'cat-cobro', favorite: true },
  { id: 3, title: 'Solicitar Ubicación', text: 'Hola {nombre}, envíame tu ubicación exacta por favor para poder entregar tu pedido en {distrito}.', categoryId: 'cat-ubicacion', favorite: false },
  { id: 4, title: 'Coordinación de Entrega Empresa', text: 'Estimado {nombre}, se realizará la coordinación corporativa respectiva para la entrega en {direccion}.', categoryId: 'cat-empresa', favorite: false },
  { id: 5, title: 'Notificación de Fallo', text: 'Hola {nombre}, no se le pudo ubicar en {direccion} para su entrega. Favor de comunicarse.', categoryId: 'cat-problemas', favorite: false }
];

const defaultCustomTags = [
  { id: 'tag-custom-codigo', name: 'codigo', label: 'Código' },
  { id: 'tag-custom-zona', name: 'zona', label: 'Zona' },
  { id: 'tag-custom-referencia', name: 'referencia', label: 'Referencia' },
  { id: 'tag-custom-comentario', name: 'comentario', label: 'Comentario' }
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
  qrs: {
    yape: '',
    plin: '',
    empresa: ''
  },
  templates: defaultTemplates,
  categories: defaultCategories,
  customTags: defaultCustomTags
};

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
    } catch (e) {
      console.error("Error cargando estado, restaurando valores por defecto.", e);
    }
  } else {
    saveState();
  }
}

export function saveState() {
  localStorage.setItem('clienttrack_state_v1', JSON.stringify(state));
}

// Carga inmediata del estado antes de la carga del DOM para evitar condiciones de carrera en módulos
loadState();

// --- UTILERÍAS COMPARTIDAS ---
export function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

export function cleanPhoneNumber(phoneString) {
  if (!phoneString) return '';
  let cleaned = phoneString.replace(/[^\d]/g, '');
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    cleaned = '51' + cleaned;
  }
  return cleaned;
}

export function openWhatsApp(phoneString) {
  const cleaned = cleanPhoneNumber(phoneString);
  if (cleaned.length >= 9) {
    window.open(`https://wa.me/${cleaned}`, '_blank');
  } else {
    showToast("Número inválido");
  }
}

// --- CONFIGURACIÓN DE TEMA Y RELOJ ---
const themeSlider = document.getElementById('theme-slider');

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  saveState();
  if (themeSlider) {
    themeSlider.value = theme === 'light' ? 1 : 0;
  }
}

function initClock() {
  const timeDisplay = document.getElementById('time-display');
  if (!timeDisplay) return;
  function update() {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const dateStr = now.toLocaleDateString('es-PE', options).toUpperCase();
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    timeDisplay.textContent = `${dateStr} • ${timeStr}`;
  }
  setInterval(update, 1000);
  update();
}

// --- CONFIGURACIÓN DE VISTAS (NAVEGACIÓN) ---
function initNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const views = document.querySelectorAll('.view-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      const targetView = item.getAttribute('data-target');
      const targetEl = document.getElementById(targetView);
      if (targetEl) targetEl.classList.add('active');

      if (targetView === 'view-dashboard') renderDashboard();
      if (targetView === 'view-clientes') renderClients();
      if (targetView === 'view-masivo') initMasivoView();
      if (targetView === 'view-config') loadConfigForm();
    });
  });
}

// --- GESTIÓN DE CONFIGURACIÓN ---
export function loadConfigForm() {
  const nameInput = document.getElementById('cfg-business-name');
  const yapeInput = document.getElementById('cfg-yape-num');
  const plinInput = document.getElementById('cfg-plin-num');
  const infoInput = document.getElementById('cfg-business-info');

  if (nameInput) nameInput.value = state.config.businessName || '';
  if (yapeInput) yapeInput.value = state.config.yapeNum || '';
  if (plinInput) plinInput.value = state.config.plinNum || '';
  if (infoInput) infoInput.value = state.config.businessInfo || '';
}

function saveConfig() {
  state.config.businessName = document.getElementById('cfg-business-name').value;
  state.config.yapeNum = document.getElementById('cfg-yape-num').value;
  state.config.plinNum = document.getElementById('cfg-plin-num').value;
  state.config.businessInfo = document.getElementById('cfg-business-info').value;
  saveState();
  renderDashboard();
  showToast("Configuración guardada correctamente");
}

// --- GESTIÓN DE DASHBOARD ---
export function renderDashboard() {
  const nameEl = document.getElementById('dash-business-name');
  if (nameEl) nameEl.textContent = state.config.businessName || 'Mi Negocio';

  const totalEl = document.getElementById('dash-total');
  const pendientesEl = document.getElementById('dash-pendientes');
  const entregadosEl = document.getElementById('dash-entregados');
  const empresaEl = document.getElementById('dash-empresa');
  const fallidosEl = document.getElementById('dash-fallidos');
  const reprogramadosEl = document.getElementById('dash-reprogramados');
  const cobradoEl = document.getElementById('dash-monto-cobrado');
  const pendienteEl = document.getElementById('dash-monto-pendiente');

  const clients = state.clients;
  const total = clients.length;
  const pendientes = clients.filter(c => c.status === 'Pendiente').length;
  const entregados = clients.filter(c => c.status === 'Entregado').length;
  const empresa = clients.filter(c => c.status === 'Empresa').length;
  const fallidos = clients.filter(c => c.status === 'Fallido').length;
  const reprogramados = clients.filter(c => c.status === 'Reprogramado').length;

  const montoCobrado = clients
    .filter(c => c.status === 'Entregado')
    .reduce((acc, curr) => acc + parseFloat(curr.cobrar || 0), 0);

  const montoPendiente = clients
    .filter(c => ['Pendiente', 'Empresa', 'Reprogramado', 'No contesta'].includes(c.status))
    .reduce((acc, curr) => acc + parseFloat(curr.cobrar || 0), 0);

  if (totalEl) totalEl.textContent = total;
  if (pendientesEl) pendientesEl.textContent = pendientes;
  if (entregadosEl) entregadosEl.textContent = entregados;
  if (empresaEl) empresaEl.textContent = empresa;
  if (fallidosEl) fallidosEl.textContent = fallidos;
  if (reprogramadosEl) reprogramadosEl.textContent = reprogramados;

  if (cobradoEl) cobradoEl.textContent = `S/ ${montoCobrado.toFixed(2)}`;
  if (pendienteEl) pendienteEl.textContent = `S/ ${montoPendiente.toFixed(2)}`;
}

// --- GESTIÓN DE CLIENTES (CRUD Y RENDERING) ---
let activeFilter = 'Todos';
let searchQuery = '';

export function renderClients() {
  const listContainer = document.getElementById('client-list-container');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const filtered = state.clients.filter(client => {
    const matchSearch = 
      client.name.toLowerCase().includes(searchQuery) ||
      client.product.toLowerCase().includes(searchQuery) ||
      client.district.toLowerCase().includes(searchQuery);

    const matchStatus = (activeFilter === 'Todos' || client.status === activeFilter);
    return matchSearch && matchStatus;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-secondary); font-size: 0.85rem;">Ningún cliente coincide con la búsqueda.</div>`;
    return;
  }

  // Ordenamos los clientes por secuencia de ruta para respetar el Itinerario de rutas.js
  const sortedClients = filtered.sort((a, b) => (a.rutaSequence || 9999) - (b.rutaSequence || 9999));

  sortedClients.forEach(client => {
    const card = document.createElement('div');
    card.className = 'card client-card';
    card.setAttribute('id', `client-card-${client.id}`);
    
    const seqBadge = client.rutaSequence ? `<span style="font-size:0.65rem; background: var(--border-color); color: var(--text-secondary); padding: 2px 5px; border-radius:4px; margin-right:6px; font-weight:700;">#${client.rutaSequence}</span>` : '';

    // Sanitización básica del estado del cliente para las clases CSS dinámicas de ClientePlus
    const statusClass = client.status.toLowerCase()
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u')
      .replace(/\s+/g, '-');

    card.innerHTML = `
      <div class="client-header">
        <div class="client-main-info">
          <span class="client-title">${seqBadge}${client.name}</span>
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
            <span class="detail-label">Cambiar Estado</span>
            <select class="status-select">
              <option value="Pendiente" ${client.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="Entregado" ${client.status === 'Entregado' ? 'selected' : ''}>Entregado</option>
              <option value="Empresa" ${client.status === 'Empresa' ? 'selected' : ''}>Empresa</option>
              <option value="Fallido" ${client.status === 'Fallido' ? 'selected' : ''}>Fallido</option>
              <option value="Reprogramado" ${client.status === 'Reprogramado' ? 'selected' : ''}>Reprogramado</option>
              <option value="Dirección incorrecta" ${client.status === 'Dirección incorrecta' ? 'selected' : ''}>Dirección incorrecta</option>
              <option value="No contesta" ${client.status === 'No contesta' ? 'selected' : ''}>No contesta</option>
              <option value="Sin WhatsApp" ${client.status === 'Sin WhatsApp' ? 'selected' : ''}>Sin WhatsApp</option>
            </select>
          </div>
          <div class="detail-item detail-item-full">
            <span class="detail-label">Dirección</span>
            <span class="detail-value">${client.address}</span>
          </div>
          <div class="detail-item detail-item-full">
            <span class="detail-label">Notas rápidas</span>
            <textarea class="notes-textarea" placeholder="Escribe observaciones aquí...">${client.observation || ''}</textarea>
          </div>
        </div>
        <div class="panel-actions" style="grid-template-columns: repeat(4, 1fr);">
          <button class="btn btn-whatsapp btn-client-wa" data-phone="${client.phone}">💬 WhatsApp</button>
          <button class="btn btn-qr btn-client-smart-qr">📱 Ver QR</button>
          <button class="btn btn-client-templates" style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3); color: var(--color-reprogramado);">📚 Plantillas</button>
          <button class="btn btn-client-delete" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--color-fallido);">🗑️ Eliminar</button>
        </div>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

function toggleCardExpand(clientId) {
  const card = document.getElementById(`client-card-${clientId}`);
  if (!card) return;
  if (card.classList.contains('expanded')) {
    card.classList.remove('expanded');
  } else {
    document.querySelectorAll('.client-card').forEach(c => c.classList.remove('expanded'));
    card.classList.add('expanded');
  }
}

function changeStatus(id, newStatus) {
  const client = state.clients.find(c => c.id === id);
  if (client) {
    client.status = newStatus;
    saveState();
    renderClients();
    showToast(`Cliente actualizado a: ${newStatus}`);
  }
}

function updateNote(id, noteVal) {
  const client = state.clients.find(c => c.id === id);
  if (client) {
    client.observation = noteVal;
    saveState();
    showToast("Observación autoguardada");
  }
}

function deleteClient(id) {
  if (confirm("¿Estás seguro de eliminar a este cliente?")) {
    state.clients = state.clients.filter(c => c.id !== id);
    saveState();
    renderClients();
    showToast("Cliente eliminado de la lista");
  }
}

export function inicializarClientes() {
  const btnOpenAdd = document.getElementById('btn-open-add-modal');
  const btnCloseAdd = document.getElementById('btn-close-add-modal');
  const addModal = document.getElementById('add-client-modal');
  const addForm = document.getElementById('add-client-form');

  if (btnOpenAdd && addModal) {
    btnOpenAdd.addEventListener('click', () => addModal.classList.add('active'));
  }
  if (btnCloseAdd && addModal) {
    btnCloseAdd.addEventListener('click', () => addModal.classList.remove('active'));
  }

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newClient = {
        id: Date.now(),
        name: document.getElementById('new-name').value.trim(),
        product: document.getElementById('new-product').value.trim(),
        phone: document.getElementById('new-phone').value.trim(),
        district: document.getElementById('new-district').value.trim(),
        address: document.getElementById('new-address').value.trim(),
        cobrar: parseFloat(document.getElementById('new-price').value) || 0,
        status: document.getElementById('new-status').value,
        observation: document.getElementById('new-observation').value.trim()
      };
      state.clients.unshift(newClient);
      saveState();
      addForm.reset();
      addModal.classList.remove('active');
      renderClients();
      showToast("Cliente agregado con éxito");
    });
  }

  // Buscador
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderClients();
    });
  }

  // Filtros
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderClients();
    });
  });

  // Delegación de eventos en contenedor de clientes
  const clientListContainer = document.getElementById('client-list-container');
  if (clientListContainer) {
    clientListContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.client-card');
      if (!card) return;
      const clientId = parseInt(card.id.replace('client-card-', ''));

      // Header click
      if (e.target.closest('.client-header')) {
        toggleCardExpand(clientId);
        return;
      }
      // WhatsApp btn
      if (e.target.closest('.btn-client-wa')) {
        const phone = e.target.closest('.btn-client-wa').getAttribute('data-phone');
        openWhatsApp(phone);
        return;
      }
      // QR btn
      if (e.target.closest('.btn-client-smart-qr')) {
        if (typeof window.openClientSmartQR === 'function') {
          window.openClientSmartQR(clientId);
        }
        return;
      }
      // Plantillas btn
      if (e.target.closest('.btn-client-templates')) {
        if (typeof window.openClientTemplates === 'function') {
          window.openClientTemplates(clientId);
        }
        return;
      }
      // Delete btn
      if (e.target.closest('.btn-client-delete')) {
        deleteClient(clientId);
        return;
      }
    });

    clientListContainer.addEventListener('change', (e) => {
      const card = e.target.closest('.client-card');
      if (!card) return;
      const clientId = parseInt(card.id.replace('client-card-', ''));

      if (e.target.classList.contains('status-select')) {
        changeStatus(clientId, e.target.value);
      }
      if (e.target.classList.contains('notes-textarea')) {
        updateNote(clientId, e.target.value);
      }
    });
  }

  // Sincronizaciones RiderTrack
  const syncBtnDash = document.getElementById('btn-sync-dashboard');
  if (syncBtnDash) syncBtnDash.addEventListener('click', syncRiderTrack);

  const syncBtnCfg = document.getElementById('btn-sync-config');
  if (syncBtnCfg) syncBtnCfg.addEventListener('click', syncRiderTrack);

  // Config save
  const saveCfgBtn = document.getElementById('btn-save-config');
  if (saveCfgBtn) saveCfgBtn.addEventListener('click', saveConfig);

  renderClients();
  renderDashboard();
  loadConfigForm();
}

// --- GESTIÓN DE ENVÍO MASIVO (UNIFICADO EN APP.JS) ---
let masivoSearchQuery = '';
let selectedMasivoClients = new Set();
let sendingQueue = [];
let queueCurrentIndex = 0;
let baseMasivoTemplateText = '';

export function initMasivoView() {
  masivoSearchQuery = '';
  renderMasivoTemplatesDropdown();
  initMasivoVisualBuilderTags();
  renderMassClientsList();
  updateSelectedCountDisplay();
}

function renderMasivoTemplatesDropdown() {
  const select = document.getElementById('masivo-tpl-select');
  if (!select) return;
  select.innerHTML = '<option value="">-- Cargar una plantilla existente --</option>';
  state.templates.forEach(tpl => {
    const opt = document.createElement('option');
    opt.value = tpl.id;
    opt.textContent = tpl.title;
    select.appendChild(opt);
  });
}

function initMasivoVisualBuilderTags() {
  const container = document.getElementById('masivo-builder-tags');
  if (!container) return;
  container.innerHTML = '';
  const defaultTags = ['nombre', 'producto', 'cobrar', 'telefono', 'direccion', 'distrito', 'empresa', 'ruta'];
  defaultTags.forEach(tag => {
    const chip = document.createElement('div');
    chip.className = 'tag-chip';
    chip.textContent = `{${tag}}`;
    chip.addEventListener('click', () => insertMasivoTagText(`{${tag}}`));
    container.appendChild(chip);
  });
}

function insertMasivoTagText(tagFormat) {
  const textarea = document.getElementById('masivo-text-area');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  textarea.value = val.substring(0, start) + tagFormat + val.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + tagFormat.length;
}

function renderMassClientsList() {
  const container = document.getElementById('masivo-clients-container');
  if (!container) return;
  container.innerHTML = '';

  const filtered = state.clients.filter(client => {
    return client.name.toLowerCase().includes(masivoSearchQuery) ||
           client.district.toLowerCase().includes(masivoSearchQuery);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 12px; color: var(--text-secondary); font-size: 0.8rem;">Ningún cliente encontrado.</div>`;
    return;
  }

  filtered.forEach(client => {
    const item = document.createElement('label');
    item.className = 'masivo-client-item';
    const isChecked = selectedMasivoClients.has(client.id);

    item.innerHTML = `
      <input type="checkbox" value="${client.id}" ${isChecked ? 'checked' : ''}>
      <div class="masivo-client-info">
        <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">${client.name}</span>
        <span style="font-size: 0.72rem; color: var(--text-secondary);">${client.product} • ${client.district}</span>
      </div>
      <span class="status-badge status-${client.status.toLowerCase()}">${client.status}</span>
    `;
    item.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) selectedMasivoClients.add(client.id);
      else selectedMasivoClients.delete(client.id);
      updateSelectedCountDisplay();
    });
    container.appendChild(item);
  });
}

function updateSelectedCountDisplay() {
  const countEl = document.getElementById('masivo-selected-count');
  if (countEl) countEl.textContent = selectedMasivoClients.size;
}

function selectMasivoAll(shouldSelectAll) {
  if (shouldSelectAll) {
    state.clients.forEach(c => selectedMasivoClients.add(c.id));
  } else {
    selectedMasivoClients.clear();
  }
  renderMassClientsList();
  updateSelectedCountDisplay();
}

function startMassSendingQueue() {
  const rawText = document.getElementById('masivo-text-area').value;
  if (!rawText.trim()) {
    showToast("Por favor, redacta o selecciona un mensaje");
    return;
  }
  if (selectedMasivoClients.size === 0) {
    showToast("Selecciona al menos un destinatario");
    return;
  }
  baseMasivoTemplateText = rawText;
  sendingQueue = Array.from(selectedMasivoClients).map(id => state.clients.find(c => c.id === id)).filter(Boolean);
  queueCurrentIndex = 0;

  const modal = document.getElementById('masivo-queue-modal');
  if (modal) modal.classList.add('active');
  updateQueueModalState();
}

function updateQueueModalState() {
  const total = sendingQueue.length;
  document.getElementById('masivo-queue-progress').textContent = `${queueCurrentIndex} de ${total} Procesados`;
  const percent = (queueCurrentIndex / total) * 100;
  document.getElementById('masivo-queue-bar').style.width = `${percent}%`;

  if (queueCurrentIndex < total) {
    const client = sendingQueue[queueCurrentIndex];
    document.getElementById('masivo-queue-client-name').textContent = client.name;
    if (typeof window.parseTemplateText === 'function') {
      document.getElementById('masivo-queue-text-preview').value = window.parseTemplateText(baseMasivoTemplateText, client);
    }
  } else {
    showToast("Cola de envío masivo completada");
    closeMassSendingQueue();
    selectMasivoAll(false);
  }
}

function closeMassSendingQueue() {
  const modal = document.getElementById('masivo-queue-modal');
  if (modal) modal.classList.remove('active');
  sendingQueue = [];
}

function processNextInQueue() {
  if (queueCurrentIndex >= sendingQueue.length) return;
  const client = sendingQueue[queueCurrentIndex];
  const message = document.getElementById('masivo-queue-text-preview').value;
  const cleaned = cleanPhoneNumber(client.phone);

  if (cleaned.length >= 9) {
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank');
    queueCurrentIndex++;
    updateQueueModalState();
  } else {
    showToast(`Número inválido para ${client.name}`);
    queueCurrentIndex++;
    updateQueueModalState();
  }
}

function inicializarMasivo() {
  const select = document.getElementById('masivo-tpl-select');
  if (select) {
    select.addEventListener('change', () => {
      if (!select.value) return;
      const tpl = state.templates.find(t => t.id == select.value);
      if (tpl) document.getElementById('masivo-text-area').value = tpl.text;
    });
  }

  const btnAll = document.getElementById('btn-masivo-select-all');
  if (btnAll) btnAll.addEventListener('click', () => selectMasivoAll(true));

  const btnNone = document.getElementById('btn-masivo-select-none');
  if (btnNone) btnNone.addEventListener('click', () => selectMasivoAll(false));

  const searchInput = document.getElementById('masivo-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      masivoSearchQuery = e.target.value.toLowerCase().trim();
      renderMassClientsList();
    });
  }

  const btnStart = document.getElementById('btn-start-mass-sending');
  if (btnStart) btnStart.addEventListener('click', startMassSendingQueue);

  const btnStop = document.getElementById('btn-stop-masivo-queue');
  if (btnStop) btnStop.addEventListener('click', closeMassSendingQueue);

  const btnNext = document.getElementById('btn-next-masivo-queue');
  if (btnNext) btnNext.addEventListener('click', processNextInQueue);
}

// --- INTEGRACIÓN RIDERTRACK ---
export function syncRiderTrack() {
  showToast("Sincronizando con RiderTrack...");
  const riderTrackResponse = [
    { name: "Carlos Mendoza", product: "Polera Over-Size Negra Elite", phone: "987654321", district: "Miraflores", address: "Av. Larco 743 Apt 202 - Portería Vigilada", cobrar: 120.00, status: "Entregado", observation: "RiderTrack: Dejado en vigilancia.", fecha: "25/05/2026", hora: "14:30" },
    { name: "Ana Isabel Ruiz", product: "Pack Termos Inteligentes + Taza Cerámica", phone: "+51 941-234-567", district: "Surco", address: "Calle Las Begonias 145", cobrar: 95.00, status: "Entregado", observation: "RiderTrack: Pack completo.", fecha: "25/05/2026", hora: "12:15" },
    { name: "Julia Ramos", product: "Zapatillas Nike Air Max Run", phone: "933112244", district: "La Molina", address: "Calle Los Álamos 120", cobrar: 280.00, status: "Pendiente", observation: "RiderTrack: Prioritario mañana.", fecha: "26/05/2026", hora: "09:00" }
  ];

  let updated = 0, added = 0;
  riderTrackResponse.forEach(incoming => {
    const incomingPhone = cleanPhoneNumber(incoming.phone);
    const existingIndex = state.clients.findIndex(c => cleanPhoneNumber(c.phone) === incomingPhone || c.name.toLowerCase().trim() === incoming.name.toLowerCase().trim());

    if (existingIndex !== -1) {
      state.clients[existingIndex] = { ...state.clients[existingIndex], product: incoming.product, cobrar: incoming.cobrar, address: incoming.address, district: incoming.district, status: incoming.status, observation: incoming.observation, ruta: incoming.district };
      updated++;
    } else {
      state.clients.unshift({ id: Date.now() + Math.floor(Math.random() * 1000), ...incoming, ruta: incoming.district });
      added++;
    }
  });

  saveState();
  renderDashboard();
  renderClients();
  showToast(`RiderTrack: ${updated} actualizados, ${added} nuevos.`);
}

// --- CAPA DE ARRANQUE ---
window.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);
  initClock();
  initNavigation();

  // Inicializadores requeridos
  inicializarClientes();
  inicializarMasivo();
  inicializarRutas();
  inicializarClientePlus();
});