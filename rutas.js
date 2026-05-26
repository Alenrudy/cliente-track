/**
 * ClienteTrack Alpha - rutas.js
 * Módulo de Planificación, Secuenciación y Optimización de Rutas de Entrega
 */

import { state, saveState, showToast, renderClients, renderDashboard } from './app.js';

// --- INICIALIZADOR DEL MÓDULO ---
export function inicializarRutas() {
  injectRutasUI();
  injectRutasModal();
  bindRutasEvents();
}
window.inicializarRutas = inicializarRutas;

// Inyecta el botón de acceso en el Dashboard de forma dinámica para no modificar index.html
function injectRutasUI() {
  const dashboard = document.getElementById('view-dashboard');
  if (!dashboard) return;

  if (document.getElementById('rutas-dashboard-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'rutas-dashboard-banner';
  banner.className = 'card';
  banner.style.cssText = 'background: rgba(139, 92, 246, 0.08); border-color: rgba(139, 92, 246, 0.25); display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; margin-bottom: 12px;';
  banner.innerHTML = `
    <span style="font-size: 0.85rem; font-weight: 600;">Planificación & Secuencia de Ruta</span>
    <button class="btn btn-qr" id="btn-open-rutas" style="background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); color: var(--color-reprogramado); padding: 8px 14px; font-size: 0.75rem;">🗺️ Optimizar Ruta</button>
  `;

  const syncBanner = dashboard.querySelector('.sync-banner');
  if (syncBanner) {
    syncBanner.after(banner);
  } else {
    dashboard.prepend(banner);
  }
}

// Inyecta la ventana modal del itinerario optimizado de forma dinámica
function injectRutasModal() {
  if (document.getElementById('rutas-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'rutas-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 440px;">
      <div class="modal-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <span>🗺️ Ruta e Itinerario Optimizado</span>
        <button class="btn btn-cancel" id="btn-close-rutas" style="padding: 4px 8px; font-size: 0.75rem;">Cerrar</button>
      </div>
      
      <div class="form-group">
        <div class="card" style="padding: 12px; margin-bottom: 12px; background: var(--input-bg);">
          <span class="detail-label" style="margin-bottom: 2px; text-transform: uppercase;">Orden Secuencial</span>
          <div style="font-size: 0.75rem; color: var(--text-secondary);">
            Agrupado automáticamente por distrito. Prioriza entregas <strong style="color: var(--color-pendiente);">Pendientes</strong> y respeta integraciones de RiderTrack.
          </div>
        </div>

        <div id="rutas-summary-container" style="max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
          <!-- Itinerario de entregas inyectado dinámicamente -->
        </div>

        <div class="config-field" style="margin-top: 12px;">
          <label>Resumen de Ruta (Para copiar al repartidor)</label>
          <textarea class="notes-textarea" id="rutas-text-summary" style="height: 110px; font-family: monospace; font-size: 0.75rem; background: var(--input-bg);" readonly></textarea>
        </div>
      </div>

      <div class="modal-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px;">
        <button class="btn" id="btn-copy-rutas-summary">📋 Copiar Texto</button>
        <button class="btn" id="btn-save-rutas-order" style="background: var(--accent); color: white; border-color: var(--accent);">💾 Guardar Itinerario</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Conexión de escuchadores de eventos
function bindRutasEvents() {
  const btnOpen = document.getElementById('btn-open-rutas');
  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      const modal = document.getElementById('rutas-modal');
      if (modal) {
        modal.classList.add('active');
        optimizarYRenderizarRuta();
      }
    });
  }

  const btnClose = document.getElementById('btn-close-rutas');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      const modal = document.getElementById('rutas-modal');
      if (modal) modal.classList.remove('active');
    });
  }

  const btnCopy = document.getElementById('btn-copy-rutas-summary');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const txt = document.getElementById('rutas-text-summary');
      if (txt && txt.value) {
        navigator.clipboard.writeText(txt.value).then(() => {
          showToast("Resumen de ruta copiado al portapapeles");
        }).catch(() => showToast("Error al copiar resumen"));
      }
    });
  }

  const btnSave = document.getElementById('btn-save-rutas-order');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      salvarSecuenciaEstablecida();
    });
  }

  // Delegación de eventos para marcar como entregado rápidamente dentro de la modal de rutas
  const container = document.getElementById('rutas-summary-container');
  if (container) {
    container.addEventListener('click', (e) => {
      const btnCheck = e.target.closest('.btn-ruta-check-entregado');
      if (btnCheck) {
        const clientId = parseInt(btnCheck.getAttribute('data-id'));
        if (!isNaN(clientId)) {
          marcarComoEntregadoRuta(clientId);
        }
      }
    });
  }
}

// Algoritmo de agrupación por distritos y prioridad de estados
export function optimizarYRenderizarRuta() {
  const container = document.getElementById('rutas-summary-container');
  const txtSummary = document.getElementById('rutas-text-summary');
  if (!container || !txtSummary) return;

  container.innerHTML = '';

  const clients = state.clients || [];
  if (clients.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 12px; font-size:0.8rem; color: var(--text-secondary);">No hay clientes registrados en la base de datos.</div>`;
    txtSummary.value = "Sin rutas activas.";
    return;
  }

  // Agrupamiento inicial por distrito
  const agrupados = {};
  clients.forEach(client => {
    const dstr = (client.district || 'Sin Distrito').toUpperCase().trim();
    if (!agrupados[dstr]) agrupados[dstr] = [];
    agrupados[dstr].push(client);
  });

  // Ordenamiento secuencial de distritos y clientes (Priorizando Pendiente/Reprogramado/Empresa sobre entregados)
  const distritosOrdenados = Object.keys(agrupados).sort();
  let optimizedSequenceList = [];
  let summaryText = `🗺️ PLANIFICACIÓN DE ENTREGA - ITINERARIO DE RUTAS\n`;
  summaryText += `Negocio: ${state.config?.businessName || 'Mi Negocio'}\n`;
  summaryText += `Generado el: ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}\n`;
  summaryText += `--------------------------------------------------------\n\n`;

  distritosOrdenados.forEach(distrito => {
    // Ordenar los clientes dentro de cada distrito: Pendientes/Reprogramados/Empresa van al inicio
    const listaClientes = agrupados[distrito].sort((a, b) => {
      const getPriority = (status) => {
        if (['Pendiente', 'Reprogramado'].includes(status)) return 1;
        if (status === 'Empresa') return 2;
        return 3; // Entregados o fallidos al final
      };
      return getPriority(a.status) - getPriority(b.status);
    });

    const dstrSection = document.createElement('div');
    dstrSection.style.cssText = 'border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 8px;';
    dstrSection.innerHTML = `<div class="detail-label" style="font-weight:700; color: var(--accent); margin-bottom: 4px;">📍 DISTRITO: ${distrito}</div>`;

    summaryText += `📍 DISTRITO: ${distrito}\n`;

    listaClientes.forEach((client, idx) => {
      optimizedSequenceList.push(client);

      const clientRow = document.createElement('div');
      clientRow.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding: 6px 8px; background: rgba(30,41,59,0.3); border-radius:6px; margin-bottom:4px; font-size: 0.8rem;';
      
      const isPending = ['Pendiente', 'Reprogramado', 'Empresa'].includes(client.status);
      const actionButtonHtml = isPending 
        ? `<button class="btn btn-ruta-check-entregado" data-id="${client.id}" style="padding: 2px 6px; background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: var(--color-entregado); font-size: 0.7rem;">✓ Entregado</button>` 
        : `<span style="font-size:0.7rem; color: var(--text-secondary); text-transform:uppercase;">Listo</span>`;

      clientRow.innerHTML = `
        <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
          <span style="font-weight:600;">${idx + 1}. ${client.name} <span class="status-badge status-${client.status.toLowerCase()}" style="font-size:0.55rem; padding:1px 4px; margin-left:4px;">${client.status}</span></span>
          <span style="font-size:0.7rem; color: var(--text-secondary);">${client.product} • S/ ${parseFloat(client.cobrar).toFixed(2)}</span>
          <span style="font-size:0.7rem; color: var(--text-secondary); word-break:break-all;">${client.address}</span>
        </div>
        <div style="margin-left:8px;">
          ${actionButtonHtml}
        </div>
      `;
      dstrSection.appendChild(clientRow);

      summaryText += `  [${idx + 1}] ${client.name} (${client.status})\n`;
      summaryText += `      📦 Pedido: ${client.product}\n`;
      summaryText += `      💵 Cobrar: S/ ${parseFloat(client.cobrar).toFixed(2)}\n`;
      summaryText += `      🗺️ Dirección: ${client.address}\n`;
      if (client.observation) {
        summaryText += `      ⚠️ Notas: ${client.observation}\n`;
      }
      summaryText += `\n`;
    });

    container.appendChild(dstrSection);
  });

  txtSummary.value = summaryText;
}

// Marcar rápidamente como entregado y recalcular
function marcarComoEntregadoRuta(clientId) {
  const client = state.clients?.find(c => c.id === clientId);
  if (client) {
    client.status = 'Entregado';
    saveState();
    renderClients();
    renderDashboard();
    optimizarYRenderizarRuta();
    showToast(`${client.name} marcado como Entregado.`);
  }
}

// Salva la secuencia actual establecida en el itinerario temporalmente en una propiedad del objeto de cada cliente
function salvarSecuenciaEstablecida() {
  const stateRef = state.clients || [];
  
  // Guardamos un índice de secuencia basado en el ordenamiento actual del Itinerario
  let orderIndex = 1;
  const agrupados = {};
  stateRef.forEach(client => {
    const dstr = (client.district || 'Sin Distrito').toUpperCase().trim();
    if (!agrupados[dstr]) agrupados[dstr] = [];
    agrupados[dstr].push(client);
  });

  const distritosOrdenados = Object.keys(agrupados).sort();
  distritosOrdenados.forEach(distrito => {
    const listaClientes = agrupados[distrito].sort((a, b) => {
      const getPriority = (status) => {
        if (['Pendiente', 'Reprogramado'].includes(status)) return 1;
        if (status === 'Empresa') return 2;
        return 3;
      };
      return getPriority(a.status) - getPriority(b.status);
    });

    listaClientes.forEach(client => {
      client.rutaSequence = orderIndex++;
    });
  });

  saveState();
  showToast("Secuencia de ruta guardada con éxito.");
  const modal = document.getElementById('rutas-modal');
  if (modal) modal.classList.remove('active');
}