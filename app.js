/**
 * ClienteTrack Alpha - app.js
 * Orquestador principal de la aplicación y gestión de Clientes (ES Modules nativos)
 */

import { inicializarQR, renderQRs } from './qr.js';
import { inicializarMensajes } from './mensajes.js';
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
              <option value="Pendiente" ${client.status === 'Pendiente' ? 'selecte