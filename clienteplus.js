/**
 * ClienteTrack Alpha - clienteplus.js
 * Módulo de Funcionalidades Avanzadas de ClientePlus (Fase 4 Avanzada)
 */

import { state, saveState, showToast, cleanPhoneNumber } from './app.js';

// --- INICIALIZADOR DEL MÓDULO ---
export function inicializarClientePlus() {
  injectFastStatusStyles();
  injectReporteEmpresaUI();
  bindClientePlusEvents();
}
window.inicializarClientePlus = inicializarClientePlus;

// Inyectar dinámicamente estilos CSS para los nuevos estados rápidos sin alterar style.css
function injectFastStatusStyles() {
  if (document.getElementById('fast-status-styles')) return;
  const style = document.createElement('style');
  style.id = 'fast-status-styles';
  style.textContent = `
    .status-direccion-incorrecta { background: rgba(239, 68, 68, 0.15); color: var(--color-fallido); }
    .status-no-contesta { background: rgba(245, 158, 11, 0.15); color: var(--color-pendiente); }
    .status-sin-whatsapp { background: rgba(100, 116, 139, 0.15); color: var(--text-secondary); }
  `;
  document.head.appendChild(style);
}

// Inyectar dinámicamente el botón de Reporte Empresa en el Dashboard
function injectReporteEmpresaUI() {
  const dashboard = document.getElementById('view-dashboard');
  if (!dashboard) return;

  if (document.getElementById('reporte-empresa-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'reporte-empresa-banner';
  banner.className = 'card';
  banner.style.cssText = 'background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25); display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-bottom: 12px;';
  banner.innerHTML = `
    <span style="font-size: 0.85rem; font-weight: 600;">Reporte Consolidado Corporativo</span>
    <button class="btn btn-whatsapp" id="btn-re-empresa" style="background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); color: var(--color-entregado); padding: 8px 14px; font-size: 0.75rem;">📊 Generar Reporte</button>
  `;

  const syncBanner = dashboard.querySelector('.sync-banner');
  if (syncBanner) {
    syncBanner.after(banner);
  } else {
    dashboard.prepend(banner);
  }
}

// --- GENERACIÓN DEL REPORTE CORPORATIVO ---
export function generarReporteEmpresa() {
  const clients = state.clients || [];
  const total = clients.length;
  const entregados = clients.filter(c => c.status === 'Entregado').length;
  const pendientes = clients.filter(c => c.status === 'Pendiente').length;
  const fallidos = clients.filter(c => c.status === 'Fallido').length;
  const reprogramados = clients.filter(c => c.status === 'Reprogramado').length;
  const dirIncorrecta = clients.filter(c => c.status === 'Dirección incorrecta').length;
  const noContesta = clients.filter(c => c.status === 'No contesta').length;
  const sinWA = clients.filter(c => c.status === 'Sin WhatsApp').length;

  const montoCobrado = clients
    .filter(c => c.status === 'Entregado')
    .reduce((acc, curr) => acc + parseFloat(curr.cobrar || 0), 0);

  const montoPendiente = clients
    .filter(c => ['Pendiente', 'Empresa', 'Reprogramado', 'No contesta'].includes(c.status))
    .reduce((acc, curr) => acc + parseFloat(curr.cobrar || 0), 0);

  let report = `📊 REPORTE DE ENTREGAS CORPORATIVO\n`;
  report += `Empresa: ${state.config?.businessName || 'Mi Negocio'}\n`;
  report += `Fecha: ${new Date().toLocaleDateString('es-PE')}\n`;
  report += `--------------------------------------------------------\n`;
  report += `📦 Total Envíos: ${total}\n`;
  report += `✅ Entregados: ${entregados}\n`;
  report += `⏳ Pendientes: ${pendientes}\n`;
  report += `❌ Fallidos: ${fallidos}\n`;
  report += `🔄 Reprogramados: ${reprogramados}\n`;
  report += `📍 Dirección Incorrecta: ${dirIncorrecta}\n`;
  report += `📞 No Contesta: ${noContesta}\n`;
  report += `🚫 Sin WhatsApp: ${sinWA}\n`;
  report += `--------------------------------------------------------\n`;
  report += `💰 Total Recaudado: S/ ${montoCobrado.toFixed(2)}\n`;
  report += `💵 Monto Pendiente: S/ ${montoPendiente.toFixed(2)}\n`;
  report += `--------------------------------------------------------\n`;
  report += `Generado automáticamente por ClienteTrack Plus.`;

  // Reutiliza de forma limpia la modal de texto para copiarlo
  const modal = document.getElementById('rutas-modal');
  if (modal) {
    modal.classList.add('active');
    const title = modal.querySelector('.modal-title span');
    if (title) title.textContent = '📊 Reporte Corporativo de Entregas';
    const txt = document.getElementById('rutas-text-summary');
    if (txt) txt.value = report;
    const container = document.getElementById('rutas-summary-container');
    if (container) {
      container.innerHTML = '<div style="font-size:0.8rem; text-align:center; padding:12px; color:var(--text-secondary);">Copia el reporte superior para compartirlo con la empresa o socios.</div>';
    }
  } else {
    alert(report);
  }
}

// Vinculación de eventos de la capa avanzada
function bindClientePlusEvents() {
  const btnReporte = document.getElementById('btn-re-empresa');
  if (btnReporte) {
    btnReporte.addEventListener('click', generarReporteEmpresa);
  }
}

// --- SOPORTE AVANZADO PARA COMPARTIR DATOS DE PAGO AUTOMÁTICAMENTE (WEB SHARE) ---
export function compartirQRClientePlus(clientId, methodType) {
  const client = state.clients?.find(c => c.id === clientId);
  if (!client) return;

  let text = '';
  if (methodType === 'yape') {
    text = `Yape titular: ${state.config?.yapeNum || 'No configurado'} (Monto: S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  } else if (methodType === 'plin') {
    text = `Plin titular: ${state.config?.plinNum || 'No configurado'} (Monto: S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  } else {
    text = `Datos Pago Empresa: ${state.config?.businessInfo || 'No configurado'} (Monto: S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  }

  if (navigator.share) {
    navigator.share({
      title: 'Datos de Pago',
      text: text
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text);
    showToast("Datos de pago copiados al portapapeles");
  }
}
window.compartirQRClientePlus = compartirQRClientePlus;