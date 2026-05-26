/**
 * ClienteTrack Alpha - clienteplus.js
 * Módulo de Funcionalidades Avanzadas — Fase 4
 * Estados rápidos + Mensajes automáticos + Reporte corporativo
 */

import { state, saveState, showToast, renderDashboard, renderClients, getMensajeDefault, cleanPhoneNumber } from './app.js';

export function inicializarClientePlus() {
  injectStatusStyles();
  injectReporteBtn();
  injectEstadosRapidosModal();
  bindEvents();
  console.log('ClientePlus v4 inicializado ✅');
}

// --- ESTILOS NUEVOS ESTADOS ---
function injectStatusStyles() {
  if (document.getElementById('cp-status-styles')) return;
  const style = document.createElement('style');
  style.id = 'cp-status-styles';
  style.textContent = `
    .status-dirección-incorrecta,
    .status-direccion-incorrecta { background:rgba(239,68,68,0.15); color:#f87171; border-color:rgba(239,68,68,0.3); }
    .status-no-contesta         { background:rgba(245,158,11,0.15); color:#fbbf24; border-color:rgba(245,158,11,0.3); }
    .status-sin-whatsapp        { background:rgba(100,116,139,0.15); color:#94a3b8; border-color:rgba(100,116,139,0.3); }
    .status-reprogramado        { background:rgba(139,92,246,0.15); color:#a78bfa; border-color:rgba(139,92,246,0.3); }
    .status-empresa             { background:rgba(99,102,241,0.15); color:#818cf8; border-color:rgba(99,102,241,0.3); }

    /* Fade-in para paneles de cliente */
    [id^="msg-panel-"], [id^="qr-panel-"] {
      animation: cpFadeIn 0.2s ease;
    }
    @keyframes cpFadeIn {
      from { opacity:0; transform:translateY(-4px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* Modal de estados rápidos */
    #cp-estados-modal .modal-container {
      max-width: 380px;
    }
    .cp-estado-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 14px;
      background: var(--input-bg);
      border: 1.5px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-primary);
      transition: all 0.18s;
      text-align: left;
    }
    .cp-estado-btn:hover { border-color: var(--accent); background: rgba(99,102,241,0.08); }
    .cp-estado-btn .cp-estado-icon { font-size: 1.2rem; flex-shrink: 0; }
    .cp-estado-btn .cp-estado-label { flex: 1; }
    .cp-estado-btn .cp-estado-arrow { color: var(--text-secondary); font-size: 0.75rem; }
  `;
  document.head.appendChild(style);
}

// --- BOTÓN REPORTE EN DASHBOARD ---
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

// --- MODAL ESTADOS RÁPIDOS ---
// Permite cambiar estado + generar mensaje automático + abrir WA
function injectEstadosRapidosModal() {
  if (document.getElementById('cp-estados-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'cp-estados-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-title" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span>⚡ Estado Rápido — <span id="cp-estados-client-name">Cliente</span></span>
        <button class="btn btn-cancel" id="cp-estados-close" style="padding:4px 10px;font-size:0.75rem;">✕ Cerrar</button>
      </div>

      <!-- SELECTOR DE ESTADO -->
      <div id="cp-estados-lista">
        <button class="cp-estado-btn" data-status="Entregado">
          <span class="cp-estado-icon">❤️</span>
          <span class="cp-estado-label">Entregado</span>
          <span class="cp-estado-arrow">→</span>
        </button>
        <button class="cp-estado-btn" data-status="Pendiente">
          <span class="cp-estado-icon">⏳</span>
          <span class="cp-estado-label">Pendiente</span>
          <span class="cp-estado-arrow">→</span>
        </button>
        <button class="cp-estado-btn" data-status="Fallido">
          <span class="cp-estado-icon">❌</span>
          <span class="cp-estado-label">Fallido</span>
          <span class="cp-estado-arrow">→</span>
        </button>
        <button class="cp-estado-btn" data-status="Empresa">
          <span class="cp-estado-icon">🏠</span>
          <span class="cp-estado-label">Empresa</span>
          <span class="cp-estado-arrow">→</span>
        </button>
        <button class="cp-estado-btn" data-status="Reprogramado">
          <span class="cp-estado-icon">🔄</span>
          <span class="cp-estado-label">Reprogramar</span>
          <span class="cp-estado-arrow">→</span>
        </button>
        <button class="cp-estado-btn" data-status="Dirección incorrecta">
          <span class="cp-estado-icon">📍</span>
          <span class="cp-estado-label">Dirección incorrecta</span>
          <span class="cp-estado-arrow">→</span>
        </button>
        <button class="cp-estado-btn" data-status="Sin WhatsApp">
          <span class="cp-estado-icon">📵</span>
          <span class="cp-estado-label">Sin WhatsApp</span>
          <span class="cp-estado-arrow">→</span>
        </button>
        <button class="cp-estado-btn" data-status="No contesta">
          <span class="cp-estado-icon">📞</span>
          <span class="cp-estado-label">No contesta</span>
          <span class="cp-estado-arrow">→</span>
        </button>
      </div>

      <!-- PANEL MENSAJE DESPUÉS DE SELECCIONAR ESTADO -->
      <div id="cp-estados-msg-panel" style="display:none;">
        <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">✉️ Mensaje generado automáticamente — edita antes de enviar</div>
        <div style="font-size:0.65rem;color:var(--text-secondary);margin-bottom:8px;">
          Tags disponibles: {nombre} {producto} {cobrar} {direccion} {telefono} {ruta} {fecha} {hora}
        </div>
        <textarea id="cp-estados-msg-text" rows="6" style="width:100%;background:var(--input-bg);border:1px solid var(--border-color);border-radius:8px;padding:10px;color:var(--text-primary);font-size:0.82rem;line-height:1.6;resize:vertical;margin-bottom:10px;"></textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn" id="cp-estados-back" style="font-size:0.78rem;">← Volver</button>
          <button class="btn" id="cp-estados-copy" style="background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.3);color:#818cf8;font-size:0.78rem;">📋 Copiar</button>
          <button class="btn btn-whatsapp" id="cp-estados-wa" style="grid-column:1/-1;font-size:0.82rem;">💬 Enviar por WhatsApp</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// --- BIND EVENTOS ---
let cpClienteActivo = null;

function bindEvents() {
  // Reporte
  document.addEventListener('click', e => {
    if (e.target.closest('#cp-btn-reporte')) generarReporte();
  });

  // Abrir modal estados rápidos (expuesto globalmente)
  window.abrirEstadosRapidos = (clientId) => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    cpClienteActivo = clientId;
    const nameEl = document.getElementById('cp-estados-client-name');
    if (nameEl) nameEl.textContent = (client.name || '').split(' ')[0];
    // Reset: mostrar lista, ocultar panel mensaje
    const lista = document.getElementById('cp-estados-lista');
    const panel = document.getElementById('cp-estados-msg-panel');
    if (lista) lista.style.display = 'block';
    if (panel) panel.style.display = 'none';
    const modal = document.getElementById('cp-estados-modal');
    if (modal) modal.classList.add('active');
  };

  // Cerrar modal
  document.addEventListener('click', e => {
    if (e.target.closest('#cp-estados-close') || e.target.id === 'cp-estados-modal') {
      document.getElementById('cp-estados-modal')?.classList.remove('active');
      cpClienteActivo = null;
    }
  });

  // Click en un estado
  document.addEventListener('click', e => {
    const btn = e.target.closest('.cp-estado-btn');
    if (!btn || !cpClienteActivo) return;
    const status = btn.getAttribute('data-status');
    if (!status) return;

    const client = state.clients.find(c => c.id === cpClienteActivo);
    if (!client) return;

    // Cambiar estado
    client.status = status;
    saveState();
    renderClients();
    renderDashboard();

    // Generar mensaje automático con todos los tags
    const msg = getMensajeDefault(client);

    // Mostrar panel de mensaje
    const lista = document.getElementById('cp-estados-lista');
    const panel = document.getElementById('cp-estados-msg-panel');
    const ta = document.getElementById('cp-estados-msg-text');
    if (lista) lista.style.display = 'none';
    if (panel) panel.style.display = 'block';
    if (ta) ta.value = msg;

    showToast(`Estado → ${status}`);
  });

  // Volver a lista de estados
  document.addEventListener('click', e => {
    if (!e.target.closest('#cp-estados-back')) return;
    document.getElementById('cp-estados-lista').style.display = 'block';
    document.getElementById('cp-estados-msg-panel').style.display = 'none';
  });

  // Copiar mensaje
  document.addEventListener('click', e => {
    if (!e.target.closest('#cp-estados-copy')) return;
    const ta = document.getElementById('cp-estados-msg-text');
    if (ta && navigator.clipboard) {
      navigator.clipboard.writeText(ta.value).then(() => showToast('Mensaje copiado'));
    }
  });

  // Enviar por WhatsApp
  document.addEventListener('click', e => {
    if (!e.target.closest('#cp-estados-wa') || !cpClienteActivo) return;
    const client = state.clients.find(c => c.id === cpClienteActivo);
    if (!client) return;
    const ta = document.getElementById('cp-estados-msg-text');
    const msg = ta ? ta.value : '';
    const tel = cleanPhoneNumber(client.phone);
    if (tel) {
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      if (navigator.clipboard) navigator.clipboard.writeText(msg).then(() => showToast('Sin teléfono — mensaje copiado'));
    }
  });
}

// --- REPORTE CORPORATIVO ---
function generarReporte() {
  const clients = state.clients || [];
  const cobrado = clients.filter(c=>c.status==='Entregado').reduce((a,c)=>a+parseFloat(c.cobrar||0),0);
  const pendiente = clients.filter(c=>['Pendiente','Empresa','Reprogramado','No contesta'].includes(c.status)).reduce((a,c)=>a+parseFloat(c.cobrar||0),0);
  const fecha = new Date().toLocaleDateString('es-PE');
  const hora = new Date().toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit'});

  const count = st => clients.filter(c=>c.status===st).length;

  const report = [
    `📊 REPORTE CORPORATIVO DE ENTREGAS`,
    `Empresa: ${state.config?.businessName||'Mi Negocio'}`,
    `Fecha: ${fecha} • ${hora}`,
    `──────────────────────────────────`,
    `📦 Total clientes: ${clients.length}`,
    `✅ Entregados: ${count('Entregado')}`,
    `⏳ Pendientes: ${count('Pendiente')}`,
    `🏠 Empresa: ${count('Empresa')}`,
    `❌ Fallidos: ${count('Fallido')}`,
    `🔄 Reprogramados: ${count('Reprogramado')}`,
    `📞 No contesta: ${count('No contesta')}`,
    `📵 Sin WhatsApp: ${count('Sin WhatsApp')}`,
    `📍 Dir. incorrecta: ${count('Dirección incorrecta')}`,
    `──────────────────────────────────`,
    `💰 Recaudado: S/ ${cobrado.toFixed(2)}`,
    `💵 Por cobrar: S/ ${pendiente.toFixed(2)}`,
    `──────────────────────────────────`,
    `Generado por ClienteTrack Plus ✅`
  ].join('\n');

  // Copiar al portapapeles
  if (navigator.clipboard) {
    navigator.clipboard.writeText(report).then(() => showToast('Reporte copiado al portapapeles'));
  }
  // Compartir si disponible
  if (navigator.share) {
    navigator.share({ title: 'Reporte ClienteTrack', text: report }).catch(()=>{});
  } else {
    alert(report);
  }
}

export { generarReporte };
