/**
 * ClienteTrack Alpha - clienteplus.js
 * Módulo de Funcionalidades Avanzadas (Fase 4)
 */

import { state, saveState, showToast, renderDashboard, renderClients } from './app.js';

export function inicializarClientePlus() {
  injectStatusStyles();
  injectReporteBtn();
  bindEvents();
  console.log('ClientePlus inicializado ✅');
}

// Estilos para nuevos estados
function injectStatusStyles() {
  if (document.getElementById('cp-status-styles')) return;
  const style = document.createElement('style');
  style.id = 'cp-status-styles';
  style.textContent = `
    .status-dirección-incorrecta, .status-direccion-incorrecta { background:rgba(239,68,68,0.15); color:#f87171; }
    .status-no-contesta { background:rgba(245,158,11,0.15); color:#fbbf24; }
    .status-sin-whatsapp { background:rgba(100,116,139,0.15); color:#94a3b8; }
    .status-reprogramado { background:rgba(139,92,246,0.15); color:#a78bfa; }
    [id^="msg-panel-"], [id^="qr-panel-"] { animation: cpFadeIn 0.2s ease; }
    @keyframes cpFadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(style);
}

// Botón reporte en dashboard
function injectReporteBtn() {
  const dashboard = document.getElementById('view-dashboard');
  if (!dashboard || document.getElementById('cp-reporte-btn')) return;

  const banner = document.createElement('div');
  banner.id = 'cp-reporte-btn';
  banner.className = 'card';
  banner.style.cssText = 'background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.25);display:flex;justify-content:space-between;align-items:center;padding:12px 16px;margin-bottom:12px;';
  banner.innerHTML = `
    <span style="font-size:0.85rem;font-weight:600;">📊 Reporte Consolidado</span>
    <button class="btn" id="cp-btn-reporte" style="background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.3);color:var(--color-entregado);padding:8px 14px;font-size:0.75rem;">Generar</button>
  `;

  const sync = dashboard.querySelector('.sync-banner');
  if (sync) sync.after(banner);
  else dashboard.prepend(banner);
}

function bindEvents() {
  document.addEventListener('click', e => {
    if (e.target.closest('#cp-btn-reporte')) generarReporte();
  });
}

// Reporte corporativo
function generarReporte() {
  const clients = state.clients || [];
  const total = clients.length;
  const stats = {
    entregados: clients.filter(c=>c.status==='Entregado').length,
    pendientes: clients.filter(c=>c.status==='Pendiente').length,
    fallidos: clients.filter(c=>c.status==='Fallido').length,
    reprogramados: clients.filter(c=>c.status==='Reprogramado').length,
    noContesta: clients.filter(c=>c.status==='No contesta').length,
    sinWA: clients.filter(c=>c.status==='Sin WhatsApp').length,
    dirInc: clients.filter(c=>c.status==='Dirección incorrecta').length,
    montoCobrado: clients.filter(c=>c.status==='Entregado').reduce((a,c)=>a+parseFloat(c.cobrar||0),0),
    montoPendiente: clients.filter(c=>['Pendiente','Empresa','Reprogramado'].includes(c.status)).reduce((a,c)=>a+parseFloat(c.cobrar||0),0),
  };

  const report = [
    `📊 REPORTE CORPORATIVO`,
    `Empresa: ${state.config?.businessName||'Mi Negocio'}`,
    `Fecha: ${new Date().toLocaleDateString('es-PE')}`,
    `──────────────────────`,
    `📦 Total: ${total}`,
    `✅ Entregados: ${stats.entregados}`,
    `⏳ Pendientes: ${stats.pendientes}`,
    `❌ Fallidos: ${stats.fallidos}`,
    `🔄 Reprogramados: ${stats.reprogramados}`,
    `📞 No contesta: ${stats.noContesta}`,
    `📵 Sin WhatsApp: ${stats.sinWA}`,
    `📍 Dir. incorrecta: ${stats.dirInc}`,
    `──────────────────────`,
    `💰 Recaudado: S/ ${stats.montoCobrado.toFixed(2)}`,
    `💵 Pendiente: S/ ${stats.montoPendiente.toFixed(2)}`,
    `──────────────────────`,
    `Generado por ClienteTrack.`
  ].join('\n');

  if (navigator.clipboard) {
    navigator.clipboard.writeText(report).then(() => showToast('Reporte copiado al portapapeles'));
  }
  if (navigator.share) {
    navigator.share({ title: 'Reporte ClienteTrack', text: report }).catch(()=>{});
  } else {
    alert(report);
  }
}

export { generarReporte };
