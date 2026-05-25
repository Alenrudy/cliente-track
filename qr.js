/**
 * ClienteTrack Alpha - qr.js
 * Módulo de Gestión de Códigos QR Globales y QR Inteligente por Cliente (Fase 4)
 */

import { state, saveState, showToast, cleanPhoneNumber } from './app.js';

let activeClientQRId = null;
let currentClientQRType = 'yape'; // 'yape', 'plin', 'empresa'

function ensureStateIntegrity() {
  if (!state.qrs) state.qrs = {};
  if (!state.qrs.plin) state.qrs.plin = '';
  if (state.config && !state.config.plinNum) {
    state.config.plinNum = state.config.yapeNum || '';
  }
}

// --- RENDERIZADO DE QRs GLOBALES ---
export function renderQRs() {
  ensureStateIntegrity();

  const yapePreview = document.getElementById('qr-yape-preview');
  if (yapePreview) {
    if (state.qrs?.yape) {
      yapePreview.innerHTML = `<img src="${state.qrs.yape}" class="qr-image" alt="QR Yape">`;
    } else {
      yapePreview.innerHTML = `<span class="qr-placeholder-text">Ninguna imagen cargada.<br>Sube tu código QR de Yape.</span>`;
    }
  }

  const plinPreview = document.getElementById('qr-plin-preview');
  if (plinPreview) {
    if (state.qrs?.plin) {
      plinPreview.innerHTML = `<img src="${state.qrs.plin}" class="qr-image" alt="QR Plin">`;
    } else {
      plinPreview.innerHTML = `<span class="qr-placeholder-text">Ninguna imagen cargada.<br>Sube tu código QR de Plin.</span>`;
    }
  }

  const empresaPreview = document.getElementById('qr-empresa-preview');
  if (empresaPreview) {
    if (state.qrs?.empresa) {
      empresaPreview.innerHTML = `<img src="${state.qrs.empresa}" class="qr-image" alt="QR Empresa">`;
    } else {
      empresaPreview.innerHTML = `<span class="qr-placeholder-text">Ninguna imagen cargada.<br>Sube tu código QR corporativo.</span>`;
    }
  }
}
window.renderQRs = renderQRs;

function handleGlobalImageUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    state.qrs[type] = e.target.result;
    saveState();
    renderQRs();
    showToast(`QR global ${type.toUpperCase()} cargado correctamente`);
  };
  reader.readAsDataURL(file);
}

function copyGlobalQRInfo(type) {
  let text = '';
  if (type === 'yape') {
    text = `Celular Yape: ${state.config?.yapeNum || 'No configurado'}`;
  } else if (type === 'plin') {
    text = `Celular Plin: ${state.config?.plinNum || 'No configurado'}`;
  } else {
    text = `Datos Empresa: ${state.config?.businessInfo || 'No configurado'}`;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast("Información copiada al portapapeles");
  }).catch(() => {
    showToast("Error al copiar");
  });
}

function shareGlobalQR(type) {
  let text = '';
  if (type === 'yape') {
    text = `Para pagar por Yape, usa el número: ${state.config?.yapeNum || 'No registrado'}`;
  } else if (type === 'plin') {
    text = `Para pagar por Plin, usa el número: ${state.config?.plinNum || 'No registrado'}`;
  } else {
    text = `Datos de pago Empresa: ${state.config?.businessInfo || 'No registrado'}`;
  }

  if (navigator.share) {
    navigator.share({ title: 'Datos de Pago', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text);
    showToast("Texto de pago copiado");
  }
}

function zoomGlobalQR(type) {
  const imgData = state.qrs?.[type];
  if (!imgData) {
    showToast("Sube una imagen primero.");
    return;
  }
  
  const modal = document.getElementById('zoom-qr-modal');
  const imgElem = document.getElementById('zoom-image-elem');
  const titleElem = document.getElementById('zoom-title');

  if (modal && imgElem && titleElem) {
    titleElem.textContent = `QR de pago ${type.toUpperCase()}`;
    imgElem.src = imgData;
    modal.classList.add('active');
  }
}

// Interceptor de zoom rápido que reconecta con el QR Inteligente si hay un cliente seleccionado
export function zoomQuickQR(type) {
  const expandedCard = document.querySelector('.client-card.expanded');
  if (expandedCard) {
    const idAttr = expandedCard.id;
    const clientId = parseInt(idAttr.replace('client-card-', ''));
    if (!isNaN(clientId)) {
      openClientSmartQR(clientId);
      return;
    }
  }
  zoomGlobalQR(type);
}
window.zoomQuickQR = zoomQuickQR;

function closeZoomModal() {
  const modal = document.getElementById('zoom-qr-modal');
  if (modal) modal.classList.remove('active');
}
window.closeZoomModal = closeZoomModal;


// ==========================================
// ====== QR INTELIGENTE POR CLIENTE ========
// ==========================================

export function openClientSmartQR(clientId) {
  ensureStateIntegrity();
  const client = state.clients?.find(c => c.id === clientId);
  if (!client) {
    showToast("Cliente no encontrado");
    return;
  }
  
  activeClientQRId = clientId;
  currentClientQRType = client.status === 'Empresa' ? 'empresa' : 'yape';
  
  const select = document.getElementById('client-smart-qr-select');
  if (select) select.value = currentClientQRType;
  
  const title = document.getElementById('client-smart-qr-title');
  if (title) title.textContent = `QR Inteligente - ${client.name}`;
  
  renderClientSmartQR();
  
  const modal = document.getElementById('client-smart-qr-modal');
  if (modal) modal.classList.add('active');
}
window.openClientSmartQR = openClientSmartQR;

function renderClientSmartQR() {
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  const preview = document.getElementById('client-smart-qr-preview');
  if (!preview) return;
  
  let qrData = '';
  if (currentClientQRType === 'yape') qrData = client.qrYape || state.qrs?.yape || '';
  else if (currentClientQRType === 'plin') qrData = client.qrPlin || state.qrs?.plin || '';
  else if (currentClientQRType === 'empresa') qrData = client.qrEmpresa || state.qrs?.empresa || '';
  
  if (qrData) {
    preview.innerHTML = `<img src="${qrData}" class="qr-image" alt="QR Inteligente">`;
  } else {
    preview.innerHTML = `
      <span class="qr-placeholder-text">
        Ningún QR para ${currentClientQRType.toUpperCase()}.<br>
        Sube uno específico para este cliente o configura el QR global.
      </span>`;
  }
}

function handleClientQRUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const client = state.clients?.find(c => c.id === activeClientQRId);
    if (client) {
      if (currentClientQRType === 'yape') client.qrYape = e.target.result;
      else if (currentClientQRType === 'plin') client.qrPlin = e.target.result;
      else if (currentClientQRType === 'empresa') client.qrEmpresa = e.target.result;
      
      saveState();
      renderClientSmartQR();
      showToast(`QR ${currentClientQRType.toUpperCase()} guardado para el cliente.`);
    }
  };
  reader.readAsDataURL(file);
}

function zoomClientSmartQR() {
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  let qrData = '';
  if (currentClientQRType === 'yape') qrData = client.qrYape || state.qrs?.yape || '';
  else if (currentClientQRType === 'plin') qrData = client.qrPlin || state.qrs?.plin || '';
  else if (currentClientQRType === 'empresa') qrData = client.qrEmpresa || state.qrs?.empresa || '';
  
  if (!qrData) {
    showToast("No hay imagen de QR cargada.");
    return;
  }
  
  const modal = document.getElementById('zoom-qr-modal');
  const imgElem = document.getElementById('zoom-image-elem');
  const titleElem = document.getElementById('zoom-title');
  
  if (modal && imgElem && titleElem) {
    titleElem.textContent = `QR ${currentClientQRType.toUpperCase()} - ${client.name}`;
    imgElem.src = qrData;
    modal.classList.add('active');
  }
}

function copyClientSmartQR() {
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  let text = '';
  if (currentClientQRType === 'yape') {
    text = `Yape titular: ${state.config?.yapeNum || 'No configurado'} (S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  } else if (currentClientQRType === 'plin') {
    text = `Plin titular: ${state.config?.plinNum || 'No configurado'} (S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  } else if (currentClientQRType === 'empresa') {
    text = `Empresa: ${state.config?.businessInfo || 'No configurado'} (S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  }
  
  navigator.clipboard.writeText(text).then(() => {
    showToast("Copiado al portapapeles");
  }).catch(() => showToast("Error al copiar"));
}

function shareClientSmartQR() {
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  let text = '';
  if (currentClientQRType === 'yape') {
    text = `Pago por Yape (S/ ${parseFloat(client.cobrar).toFixed(2)}): Celular ${state.config?.yapeNum || ''}`;
  } else if (currentClientQRType === 'plin') {
    text = `Pago por Plin (S/ ${parseFloat(client.cobrar).toFixed(2)}): Celular ${state.config?.plinNum || ''}`;
  } else if (currentClientQRType === 'empresa') {
    text = `Pago Empresa (S/ ${parseFloat(client.cobrar).toFixed(2)}): ${state.config?.businessInfo || ''}`;
  }
  
  if (navigator.share) {
    navigator.share({ title: 'Datos de Pago', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text);
    showToast("Texto de pago copiado");
  }
}

// Envío a WhatsApp con soporte de ventana prompt nativa para permitir edición y parseo de tags dinámicos
function sendClientSmartQRWA() {
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  let method = '';
  if (currentClientQRType === 'yape') method = `Yape al celular ${state.config?.yapeNum || ''}`;
  else if (currentClientQRType === 'plin') method = `Plin al celular ${state.config?.plinNum || ''}`;
  else if (currentClientQRType === 'empresa') method = `Pago Empresa: ${state.config?.businessInfo || ''}`;
  
  // Plantilla base para el prompt con tags dinámicos compilados
  const template = `Hola {nombre}, para proceder con tu pedido {producto}, puedes realizar el pago de S/ {cobrar} a través de {metodo}. Dirección de entrega: {direccion}. ¡Muchas gracias!`;
  
  // Reemplazo manual de tags requeridos
  let msg = template
    .replace(/{nombre}/g, client.name || '')
    .replace(/{producto}/g, client.product || '')
    .replace(/{cobrar}/g, parseFloat(client.cobrar || 0).toFixed(2))
    .replace(/{telefono}/g, client.phone || '')
    .replace(/{direccion}/g, client.address || '')
    .replace(/{metodo}/g, method);

  // Cuadro de diálogo de confirmación editable antes del envío
  const messageText = prompt("Edita tu mensaje de pago antes de enviar por WhatsApp:", msg);
  if (messageText === null) return; // Cancelación

  const cleanPhone = cleanPhoneNumber(client.phone);
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
}

function closeClientSmartQR() {
  const modal = document.getElementById('client-smart-qr-modal');
  if (modal) modal.classList.remove('active');
  activeClientQRId = null;
}
window.closeClientSmartQR = closeClientSmartQR;

// --- INICIALIZACIÓN DE LISTENERS ---
export function inicializarQR() {
  const btnYape = document.getElementById('btn-upload-yape');
  if (btnYape) btnYape.addEventListener('click', () => document.getElementById('input-upload-yape').click());
  
  const btnPlin = document.getElementById('btn-upload-plin');
  if (btnPlin) btnPlin.addEventListener('click', () => document.getElementById('input-upload-plin').click());

  const btnEmpresa = document.getElementById('btn-upload-empresa');
  if (btnEmpresa) btnEmpresa.addEventListener('click', () => document.getElementById('input-upload-empresa').click());

  const inYape = document.getElementById('input-upload-yape');
  if (inYape) inYape.addEventListener('change', (e) => handleGlobalImageUpload(e, 'yape'));

  const inPlin = document.getElementById('input-upload-plin');
  if (inPlin) inPlin.addEventListener('change', (e) => handleGlobalImageUpload(e, 'plin'));

  const inEmpresa = document.getElementById('input-upload-empresa');
  if (inEmpresa) inEmpresa.addEventListener('change', (e) => handleGlobalImageUpload(e, 'empresa'));

  // Acciones globales (copiar, ampliar, compartir)
  document.querySelectorAll('[data-qr]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-qr');
      const action = btn.getAttribute('data-action');
      if (action === 'copy') copyGlobalQRInfo(type);
      if (action === 'zoom') zoomGlobalQR(type);
      if (action === 'share') shareGlobalQR(type);
    });
  });

  // Selector inteligente y acciones del cliente
  const selectSmart = document.getElementById('client-smart-qr-select');
  if (selectSmart) {
    selectSmart.addEventListener('change', (e) => {
      currentClientQRType = e.target.value;
      renderClientSmartQR();
    });
  }

  const btnUploadTrigger = document.getElementById('btn-client-qr-upload-trigger');
  if (btnUploadTrigger) btnUploadTrigger.addEventListener('click', () => document.getElementById('input-client-qr-upload').click());

  const inClientUpload = document.getElementById('input-client-qr-upload');
  if (inClientUpload) inClientUpload.addEventListener('change', handleClientQRUpload);

  const btnClientZoom = document.getElementById('btn-client-qr-zoom');
  if (btnClientZoom) btnClientZoom.addEventListener('click', zoomClientSmartQR);

  const btnClientCopy = document.getElementById('btn-client-qr-copy');
  if (btnClientCopy) btnClientCopy.addEventListener('click', copyClientSmartQR);

  const btnClientShare = document.getElementById('btn-client-qr-share');
  if (btnClientShare) btnClientShare.addEventListener('click', shareClientSmartQR);

  const btnClientWA = document.getElementById('btn-client-qr-wa');
  if (btnClientWA) btnClientWA.addEventListener('click', sendClientSmartQRWA);

  const btnCloseSmart = document.getElementById('btn-close-client-smart-qr');
  if (btnCloseSmart) btnCloseSmart.addEventListener('click', closeClientSmartQR);

  const btnCloseZoom = document.getElementById('btn-close-zoom-modal');
  if (btnCloseZoom) btnCloseZoom.addEventListener('click', closeZoomModal);

  renderQRs();
}

// Inicialización auto-ejecutada del módulo QR
document.addEventListener('DOMContentLoaded', () => {
  inicializarQR();
});