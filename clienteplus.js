/**
 * ClienteTrack Alpha - clienteplus.js
 * Módulo Fase 4 — Panel Empresa WA + Estados Rápidos + Reporte
 */

import { state, saveState, showToast, renderDashboard, renderClients, getMensajeDefault, cleanPhoneNumber } from './app.js';

export function inicializarClientePlus() {
  injectStatusStyles();
  injectReporteBtn();
  injectPanelEmpresaModal();
  bindEvents();
  console.log('ClientePlus v4.1 ✅');
}

// ─────────────────────────────────────────────
// ESTILOS: nuevos estados + panel empresa
// ─────────────────────────────────────────────
function injectStatusStyles() {
  if (document.getElementById('cp-status-styles')) return;
  const s = document.createElement('style');
  s.id = 'cp-status-styles';
  s.textContent = `
    .status-dirección-incorrecta,
    .status-direccion-incorrecta { background:rgba(239,68,68,0.15);   color:#f87171; border-color:rgba(239,68,68,0.3); }
    .status-no-contesta          { background:rgba(245,158,11,0.15);  color:#fbbf24; border-color:rgba(245,158,11,0.3); }
    .status-sin-whatsapp         { background:rgba(100,116,139,0.15); color:#94a3b8; border-color:rgba(100,116,139,0.3); }
    .status-reprogramado         { background:rgba(139,92,246,0.15);  color:#a78bfa; border-color:rgba(139,92,246,0.3); }
    .status-empresa              { background:rgba(99,102,241,0.15);  color:#818cf8; border-color:rgba(99,102,241,0.3); }
    .status-rechazo              { background:rgba(239,68,68,0.2);    color:#fc8181; border-color:rgba(239,68,68,0.4); }

    [id^="msg-panel-"], [id^="qr-panel-"] { animation: cpFadeIn 0.2s ease; }
    @keyframes cpFadeIn {
      from { opacity:0; transform:translateY(-4px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* ── Panel Empresa WA (desplegable dentro de la tarjeta) ── */
    .cp-empresa-panel {
      margin-top: 10px;
      background: rgba(99,102,241,0.05);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 12px;
      padding: 12px;
      animation: cpFadeIn 0.2s ease;
    }
    .cp-empresa-panel-title {
      font-size: 0.7rem;
      color: #818cf8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }
    .cp-accion-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 7px;
      margin-bottom: 12px;
    }
    .cp-accion-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 6px;
      background: var(--input-bg);
      border: 1.5px solid var(--border-color);
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-primary);
      transition: all 0.18s;
      text-align: center;
      line-height: 1.3;
    }
    .cp-accion-btn:active { transform: scale(0.96); }
    .cp-accion-btn .cp-accion-icon { font-size: 1.3rem; }
    .cp-accion-btn:hover  { border-color: #818cf8; background: rgba(99,102,241,0.1); }

    .cp-accion-btn[data-status="Entregado"]            { border-color:rgba(16,185,129,0.3);  color:#34d399; }
    .cp-accion-btn[data-status="Fallido"]              { border-color:rgba(239,68,68,0.3);   color:#f87171; }
    .cp-accion-btn[data-status="No contesta"]          { border-color:rgba(245,158,11,0.3);  color:#fbbf24; }
    .cp-accion-btn[data-status="Sin WhatsApp"]         { border-color:rgba(100,116,139,0.3); color:#94a3b8; }
    .cp-accion-btn[data-status="Dirección incorrecta"] { border-color:rgba(239,68,68,0.3);   color:#f87171; }
    .cp-accion-btn[data-status="Rechazo"]              { border-color:rgba(239,68,68,0.4);   color:#fc8181; }
    .cp-accion-btn[data-status="Reprogramado"]         { border-color:rgba(139,92,246,0.3);  color:#a78bfa; }
    .cp-accion-btn[data-status="Pendiente"]            { border-color:rgba(245,158,11,0.3);  color:#fbbf24; }

    /* ── Área de mensaje editable dentro del panel ── */
    .cp-empresa-msg-area {
      display: none;
      animation: cpFadeIn 0.2s ease;
    }
    .cp-empresa-msg-label {
      font-size: 0.65rem;
      color: var(--text-secondary);
      font-weight: 600;
      margin-bottom: 5px;
    }
    .cp-empresa-msg-textarea {
      width: 100%;
      background: var(--input-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 10px;
      color: var(--text-primary);
      font-size: 0.82rem;
      line-height: 1.6;
      resize: vertical;
      margin-bottom: 8px;
      min-height: 110px;
    }
    .cp-empresa-msg-btns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .cp-empresa-msg-btns .cp-btn-back {
      grid-column: 1 / -1;
      font-size: 0.75rem;
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────
// BOTÓN REPORTE en Dashboard
// ─────────────────────────────────────────────
function injectReporteBtn() {
  const dash = document.getElementById('view-dashboard');
  if (!dash || document.getElementById('cp-reporte-btn')) return;
  const wrap = document.createElement('div');
  wrap.id = 'cp-reporte-btn';
  wrap.className = 'card';
  wrap.style.cssText = 'background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.25);display:flex;justify-content:space-between;align-items:center;padding:12px 16px;margin-bottom:12px;';
  wrap.innerHTML = `
    <span style="font-size:0.85rem;font-weight:600;">📊 Reporte Consolidado</span>
    <button class="btn" id="cp-btn-reporte"
      style="background:rgba(16,185,129,0.15);border-color:rgba(16,185,129,0.3);color:var(--color-entregado);padding:8px 14px;font-size:0.75rem;">
      Generar
    </button>
  `;
  const sync = dash.querySelector('.sync-banner');
  if (sync) sync.after(wrap);
  else dash.prepend(wrap);
}

// ─────────────────────────────────────────────
// PANEL EMPRESA WA — modal desplegable
// Nota: se inyecta UNA VEZ en el body y se reutiliza.
// ─────────────────────────────────────────────
function injectPanelEmpresaModal() {
  if (document.getElementById('cp-empresa-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'cp-empresa-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-container" style="max-width:400px;">

      <!-- CABECERA -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">🏢 Acciones Empresa</div>
          <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:2px;" id="cp-emp-client-sub">Selecciona un estado</div>
        </div>
        <button class="btn btn-cancel" id="cp-emp-close" style="padding:4px 10px;font-size:0.75rem;">✕</button>
      </div>

      <!-- GRILLA DE ACCIONES -->
      <div id="cp-emp-acciones">
        <div class="cp-accion-grid">
          <button class="cp-accion-btn" data-status="Entregado">
            <span class="cp-accion-icon">🟢</span>Entregado
          </button>
          <button class="cp-accion-btn" data-status="Fallido">
            <span class="cp-accion-icon">🔴</span>Fallido
          </button>
          <button class="cp-accion-btn" data-status="No contesta">
            <span class="cp-accion-icon">📞</span>No contesta
          </button>
          <button class="cp-accion-btn" data-status="Sin WhatsApp">
            <span class="cp-accion-icon">💬</span>Sin WhatsApp
          </button>
          <button class="cp-accion-btn" data-status="Dirección incorrecta">
            <span class="cp-accion-icon">📍</span>Dir. incorrecta
          </button>
          <button class="cp-accion-btn" data-status="Rechazo">
            <span class="cp-accion-icon">❌</span>Rechazo
          </button>
          <button class="cp-accion-btn" data-status="Reprogramado">
            <span class="cp-accion-icon">🔄</span>Reprogramar
          </button>
          <button class="cp-accion-btn" data-status="Pendiente">
            <span class="cp-accion-icon">⏳</span>Pendiente
          </button>
        </div>
        <div style="font-size:0.62rem;color:var(--text-secondary);text-align:center;margin-top:-4px;">
          Toca un estado para generar el mensaje automáticamente
        </div>
      </div>

      <!-- PANEL MENSAJE EDITABLE (oculto hasta elegir estado) -->
      <div id="cp-emp-msg-panel" style="display:none;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div>
            <span style="font-size:0.75rem;font-weight:700;color:var(--text-primary);" id="cp-emp-estado-label">Estado</span>
            <span style="font-size:0.68rem;color:var(--text-secondary);margin-left:6px;" id="cp-emp-client-name-label"></span>
          </div>
          <button class="btn" id="cp-emp-back"
            style="font-size:0.7rem;padding:4px 10px;background:transparent;border-color:var(--border-color);">
            ← Volver
          </button>
        </div>

        <div style="font-size:0.62rem;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">
          ✏️ Edita antes de enviar
        </div>
        <div style="font-size:0.58rem;color:var(--text-secondary);margin-bottom:8px;line-height:1.6;">
          Tags: {nombre} {producto} {cobrar} {direccion} {telefono} {ruta} {fecha} {hora}
        </div>

        <textarea id="cp-emp-msg-text" rows="7"
          style="width:100%;background:var(--input-bg);border:1px solid var(--border-color);border-radius:8px;padding:10px;color:var(--text-primary);font-size:0.82rem;line-height:1.6;resize:vertical;margin-bottom:10px;">
        </textarea>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn" id="cp-emp-copy"
            style="background:rgba(99,102,241,0.1);border-color:rgba(99,102,241,0.3);color:#818cf8;font-size:0.78rem;">
            📋 Copiar
          </button>
          <button class="btn btn-whatsapp" id="cp-emp-wa-empresa"
            style="font-size:0.78rem;">
            📲 Enviar WA Empresa
          </button>
        </div>
        <div style="font-size:0.6rem;color:var(--text-secondary);text-align:center;margin-top:8px;line-height:1.5;">
          "Enviar WA Empresa" abre WhatsApp sin número fijo.<br>
          Tú eliges el contacto o grupo de empresa.
        </div>
      </div>

    </div>
  `;
  document.body.appendChild(modal);
}

// ─────────────────────────────────────────────
// GENERADOR DE MENSAJES CON TAGS DINÁMICOS
// ─────────────────────────────────────────────
function buildMsgEmpresa(client, status) {
  const now   = new Date();
  const nombre    = (client.name    || '').split(' ')[0];
  const producto  = client.product  || 'pedido';
  const cobrar    = parseFloat(client.cobrar || 0).toFixed(2);
  const direccion = client.address  || '';
  const telefono  = client.phone    || '';
  const ruta      = client.district || '';
  const fecha     = now.toLocaleDateString('es-PE');
  const hora      = now.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });
  const empresa   = state.config?.businessName || '';

  const templates = {
    'Entregado':
      `✅ ENTREGADO\n\nCliente: ${nombre}\nProducto: ${producto}\nDirección: ${direccion}\nTeléfono: ${telefono}\n\nMonto cobrado: S/ ${cobrar}\nFecha: ${fecha} • ${hora}\nRuta: ${ruta}`,

    'Fallido':
      `🔴 ENTREGA FALLIDA\n\nCliente: ${nombre}\nProducto: ${producto}\nDirección: ${direccion}\nTeléfono: ${telefono}\n\nMonto pendiente: S/ ${cobrar}\nFecha: ${fecha} • ${hora}\nRuta: ${ruta}\n\nMotivo: No se pudo concretar la entrega.`,

    'No contesta':
      `📞 NO CONTESTA LLAMADAS\n\nCliente: ${nombre}\nTeléfono: ${telefono}\nProducto: ${producto}\nDirección: ${direccion}\n\nMonto: S/ ${cobrar}\nFecha: ${fecha} • ${hora}\n\nSe intentó contactar sin respuesta.`,

    'Sin WhatsApp':
      `💬 SIN WHATSAPP\n\nCliente: ${nombre}\nTeléfono: ${telefono}\nProducto: ${producto}\nDirección: ${direccion}\n\nMonto: S/ ${cobrar}\nFecha: ${fecha} • ${hora}\n\nEl número no tiene WhatsApp activo.`,

    'Dirección incorrecta':
      `📍 DIRECCIÓN INCORRECTA\n\nCliente: ${nombre}\nProducto: ${producto}\nDirección registrada: ${direccion}\nTeléfono: ${telefono}\n\nMonto: S/ ${cobrar}\nFecha: ${fecha} • ${hora}\n\nLa dirección no coincide. Se requiere corrección.`,

    'Rechazo':
      `❌ RECHAZO DE ENTREGA\n\nCliente: ${nombre}\nProducto: ${producto}\nDirección: ${direccion}\nTeléfono: ${telefono}\n\nMonto: S/ ${cobrar}\nFecha: ${fecha} • ${hora}\n\nEl cliente rechazó recibir el pedido.`,

    'Reprogramado':
      `🔄 ENTREGA REPROGRAMADA\n\nCliente: ${nombre}\nProducto: ${producto}\nDirección: ${direccion}\nTeléfono: ${telefono}\n\nMonto: S/ ${cobrar}\nFecha original: ${fecha} • ${hora}\nRuta: ${ruta}\n\nSe requiere reprogramar la entrega.`,

    'Pendiente':
      `⏳ PENDIENTE DE ENTREGA\n\nCliente: ${nombre}\nProducto: ${producto}\nDirección: ${direccion}\nTeléfono: ${telefono}\n\nMonto: S/ ${cobrar}\nFecha: ${fecha} • ${hora}\nRuta: ${ruta}`,
  };

  return templates[status] || `Reporte: ${nombre} — ${status}\nProducto: ${producto}\nMonto: S/ ${cobrar}\nFecha: ${fecha} • ${hora}`;
}

// ─────────────────────────────────────────────
// EVENTOS
// ─────────────────────────────────────────────
let cpEmpClienteActivo = null;

function bindEvents() {

  // ── Reporte ──
  document.addEventListener('click', e => {
    if (e.target.closest('#cp-btn-reporte')) generarReporte();
  });

  // ── Abrir panel empresa (llamado desde app.js → waEmpresaCliente) ──
  window.abrirPanelEmpresa = (clientId) => {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;
    cpEmpClienteActivo = clientId;

    // Reset: mostrar grilla, ocultar msg panel
    const acc  = document.getElementById('cp-emp-acciones');
    const msg  = document.getElementById('cp-emp-msg-panel');
    if (acc) acc.style.display = 'block';
    if (msg) msg.style.display = 'none';

    // Subtítulo con nombre del cliente
    const sub = document.getElementById('cp-emp-client-sub');
    if (sub) sub.textContent = `${(client.name||'').split(' ')[0]} • S/ ${parseFloat(client.cobrar||0).toFixed(2)}`;

    const modal = document.getElementById('cp-empresa-modal');
    if (modal) modal.classList.add('active');
  };

  // ── Cerrar modal ──
  document.addEventListener('click', e => {
    if (e.target.closest('#cp-emp-close') || e.target.id === 'cp-empresa-modal') {
      document.getElementById('cp-empresa-modal')?.classList.remove('active');
      cpEmpClienteActivo = null;
    }
  });

  // ── Click en una acción rápida ──
  document.addEventListener('click', e => {
    const btn = e.target.closest('.cp-accion-btn');
    if (!btn || !cpEmpClienteActivo) return;
    const status = btn.getAttribute('data-status');
    if (!status) return;

    const client = state.clients.find(c => c.id === cpEmpClienteActivo);
    if (!client) return;

    // Actualizar estado del cliente
    client.status = status;
    saveState();
    renderClients();
    renderDashboard();

    // Generar mensaje empresa
    const msg = buildMsgEmpresa(client, status);

    // Mostrar panel mensaje
    const acc = document.getElementById('cp-emp-acciones');
    const panel = document.getElementById('cp-emp-msg-panel');
    const ta  = document.getElementById('cp-emp-msg-text');
    const lbl = document.getElementById('cp-emp-estado-label');
    const nlbl = document.getElementById('cp-emp-client-name-label');

    if (acc)  acc.style.display  = 'none';
    if (panel) panel.style.display = 'block';
    if (ta)   ta.value = msg;
    if (lbl)  lbl.textContent = btn.textContent.trim();
    if (nlbl) nlbl.textContent = (client.name||'').split(' ')[0];

    showToast(`Estado → ${status}`);
  });

  // ── Volver a la grilla ──
  document.addEventListener('click', e => {
    if (!e.target.closest('#cp-emp-back')) return;
    const acc  = document.getElementById('cp-emp-acciones');
    const panel = document.getElementById('cp-emp-msg-panel');
    if (acc)   acc.style.display   = 'block';
    if (panel) panel.style.display = 'none';
  });

  // ── Copiar mensaje ──
  document.addEventListener('click', e => {
    if (!e.target.closest('#cp-emp-copy')) return;
    const ta = document.getElementById('cp-emp-msg-text');
    if (ta && navigator.clipboard) {
      navigator.clipboard.writeText(ta.value).then(() => showToast('Mensaje copiado'));
    }
  });

  // ── Enviar WA Empresa — SIN número fijo ──
  // Abre https://wa.me/ sin número para que el usuario elija el contacto/grupo
  document.addEventListener('click', e => {
    if (!e.target.closest('#cp-emp-wa-empresa')) return;
    const ta = document.getElementById('cp-emp-msg-text');
    const msg = ta ? ta.value.trim() : '';
    if (!msg) { showToast('Sin mensaje para enviar'); return; }
    // wa.me sin número = el usuario elige a quién enviar
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  });
}

// ─────────────────────────────────────────────
// REPORTE CORPORATIVO
// ─────────────────────────────────────────────
function generarReporte() {
  const clients = state.clients || [];
  const cobrado  = clients.filter(c => c.status==='Entregado').reduce((a,c) => a+parseFloat(c.cobrar||0),0);
  const pendiente = clients.filter(c => ['Pendiente','Empresa','Reprogramado','No contesta'].includes(c.status)).reduce((a,c) => a+parseFloat(c.cobrar||0),0);
  const fecha = new Date().toLocaleDateString('es-PE');
  const hora  = new Date().toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit'});
  const cnt   = st => clients.filter(c => c.status===st).length;

  const report = [
    `📊 REPORTE CORPORATIVO DE ENTREGAS`,
    `Empresa: ${state.config?.businessName||'Mi Negocio'}`,
    `Fecha: ${fecha} • ${hora}`,
    `──────────────────────────────────`,
    `📦 Total clientes: ${clients.length}`,
    `✅ Entregados:        ${cnt('Entregado')}`,
    `⏳ Pendientes:        ${cnt('Pendiente')}`,
    `🏠 Empresa:           ${cnt('Empresa')}`,
    `❌ Fallidos:          ${cnt('Fallido')}`,
    `🔄 Reprogramados:     ${cnt('Reprogramado')}`,
    `📞 No contesta:       ${cnt('No contesta')}`,
    `📵 Sin WhatsApp:      ${cnt('Sin WhatsApp')}`,
    `📍 Dir. incorrecta:   ${cnt('Dirección incorrecta')}`,
    `❌ Rechazo:           ${cnt('Rechazo')}`,
    `──────────────────────────────────`,
    `💰 Recaudado:   S/ ${cobrado.toFixed(2)}`,
    `💵 Por cobrar:  S/ ${pendiente.toFixed(2)}`,
    `──────────────────────────────────`,
    `Generado por ClienteTrack Plus ✅`
  ].join('\n');

  if (navigator.clipboard) {
    navigator.clipboard.writeText(report).then(() => showToast('Reporte copiado'));
  }
  if (navigator.share) {
    navigator.share({ title: 'Reporte ClienteTrack', text: report }).catch(()=>{});
  } else {
    alert(report);
  }
}

export { generarReporte };
