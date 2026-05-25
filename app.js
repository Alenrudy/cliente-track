/**
 * ClienteTrack Alpha - app.js
 * Orquestador principal de la aplicación utilizando ES Modules nativos.
 */

// NOTA DE CONTROL: Estos módulos se irán habilitando en los siguientes pasos de la migración.
// Descomentar únicamente a medida que creemos cada archivo JavaScript.
/*
import { loadState, state } from './storage.js';
import { renderDashboard, loadConfigForm, saveConfig } from './config.js';
import { renderClients, initClientesEvents } from './clientes.js';
import { initMensajesView } from './mensajes.js';
import { initMasivoView } from './masivo.js';
import { renderQRs, initQREvents } from './qr.js';
import { syncRiderTrack } from './ridertrack.js';
*/

// --- ESTADO TEMPORAL PARA EVITAR ERRORES HASTA LA CREACIÓN DE STORAGE.JS ---
// Este objeto se eliminará por completo una vez que importemos 'state' desde 'storage.js'.
let state = {
  theme: 'dark'
};

// --- GESTIÓN GLOBAL DE NOTIFICACIONES (TOAST) ---
export function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// --- TIEMPO DINÁMICO (CLOCK) ---
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

// --- MANEJO DEL MODO CLARO / OSCURO ---
const themeSlider = document.getElementById('theme-slider');

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  
  // Guardado preventivo si el módulo storage está activo
  // saveState(); 

  if (themeSlider) {
    themeSlider.value = theme === 'light' ? 1 : 0;
  }
}

function initThemeSlider() {
  if (!themeSlider) return;
  themeSlider.addEventListener('input', (e) => {
    const selected = e.target.value == '1' ? 'light' : 'dark';
    applyTheme(selected);
  });
}

// --- INTERFAZ DE NAVEGACIÓN ENTRE VISTAS ---
function initNavigation() {
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const views = document.querySelectorAll('.view-content');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      const targetView = item.getAttribute('data-target');
      const viewElement = document.getElementById(targetView);
      if (viewElement) {
        viewElement.classList.add('active');
      }

      // Descomentar los disparadores de renderizado a medida que se migren los módulos:
      /*
      if (targetView === 'view-dashboard') renderDashboard();
      if (targetView === 'view-clientes') renderClients();
      if (targetView === 'view-mensajes') initMensajesView();
      if (targetView === 'view-masivo') initMasivoView();
      if (targetView === 'view-qr') renderQRs();
      if (targetView === 'view-config') loadConfigForm();
      */
    });
  });
}

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar persistencia de datos (Descomentar al implementar storage.js)
  // loadState();
  
  // 2. Aplicar el tema actual
  applyTheme(state.theme);
  initThemeSlider();

  // 3. Activar componentes básicos
  initClock();
  initNavigation();

  // 4. Registrar escuchas de eventos de otros módulos (Descomentar paulatinamente)
  // initClientesEvents();
  // initQREvents();

  // 5. Renderizado de inicio (Descomentar al implementar config.js / clientes.js)
  // renderDashboard();
  // renderClients();
  // renderQRs();
  // loadConfigForm();
});