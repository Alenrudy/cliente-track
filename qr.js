/**
 * ClienteTrack Alpha - qr.js
 * Módulo de Gestión de Códigos QR Globales y QR Inteligente por Cliente (Fase 4)
 */

// Abstracción resiliente de estado para garantizar la sincronización incremental
const getState = () => window.state || { qrs: {}, clients: [], config: {} };
const saveGlobalState = () => {
  if (typeof window.saveState === 'function') window.saveState();
};
const toast = (msg) => {
  if (typeof window.showToast === 'function') window.showToast(msg);
};

let activeClientQRId = null;
let currentClientQRType = 'yape'; // 'yape', 'plin', 'empresa'

// Inicializar QRs Globales y soporte para Plin en el estado
function ensureStateIntegrity() {
  const state = getState();
  if (!state.qrs) state.qrs = {};
  if (!state.qrs.plin) state.qrs.plin = '';
  if (state.config && !state.config.plinNum) {
    state.config.plinNum = state.config.yapeNum || '';
  }
}

// --- RENDERIZADO DE QRs GLOBALES ---
export function renderQRs() {
  ensureStateIntegrity();
  const state = getState();

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

// --- CONTROLADOR DE SUBIDA GLOBAL ---
function handleGlobalImageUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const state = getState();
    state.qrs[type] = e.target.result;
    saveGlobalState();
    renderQRs();
    toast(`QR global ${type.toUpperCase()} cargado correctamente`);
  };
  reader.readAsDataURL(file);
}

// --- ACCIONES GLOBALES DE COPIAR, COMPARTIR Y AMPLIAR ---
function copyGlobalQRInfo(type) {
  const state = getState();
  let text = '';
  if (type === 'yape') {
    text = `Celular Yape: ${state.config?.yapeNum || 'No configurado'}`;
  } else if (type === 'plin') {
    text = `Celular Plin: ${state.config?.plinNum || 'No configurado'}`;
  } else {
    text = `Datos Empresa: ${state.config?.businessInfo || 'No configurado'}`;
  }

  navigator.clipboard.writeText(text).then(() => {
    toast("Información copiada al portapapeles");
  }).catch(() => {
    toast("Error al copiar");
  });
}

function shareGlobalQR(type) {
  const state = getState();
  let text = '';
  if (type === 'yape') {
    text = `Para realizar el pago por Yape, usa el número: ${state.config?.yapeNum || 'No registrado'}`;
  } else if (type === 'plin') {
    text = `Para realizar el pago por Plin, usa el número: ${state.config?.plinNum || 'No registrado'}`;
  } else {
    text = `Datos de pago Empresa: ${state.config?.businessInfo || 'No registrado'}`;
  }

  if (navigator.share) {
    navigator.share({ title: 'Datos de Pago', text: text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text);
    toast("Texto de pago copiado al portapapeles");
  }
}

function zoomGlobalQR(type) {
  const state = getState();
  const imgData = state.qrs?.[type];
  if (!imgData) {
    toast("Por favor, sube una imagen primero.");
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
  const state = getState();
  const client = state.clients?.find(c => c.id === clientId);
  if (!client) {
    toast("Cliente no encontrado");
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
  const state = getState();
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  const preview = document.getElementById('client-smart-qr-preview');
  if (!preview) return;
  
  // Buscar QR específico del cliente o usar fallback del QR global
  let qrData = '';
  if (currentClientQRType === 'yape') {
    qrData = client.qrYape || state.qrs?.yape || '';
  } else if (currentClientQRType === 'plin') {
    qrData = client.qrPlin || state.qrs?.plin || '';
  } else if (currentClientQRType === 'empresa') {
    qrData = client.qrEmpresa || state.qrs?.empresa || '';
  }
  
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
    const state = getState();
    const client = state.clients?.find(c => c.id === activeClientQRId);
    if (client) {
      if (currentClientQRType === 'yape') client.qrYape = e.target.result;
      else if (currentClientQRType === 'plin') client.qrPlin = e.target.result;
      else if (currentClientQRType === 'empresa') client.qrEmpresa = e.target.result;
      
      saveGlobalState();
      renderClientSmartQR();
      toast(`QR ${currentClientQRType.toUpperCase()} guardado para ${client.name}`);
    }
  };
  reader.readAsDataURL(file);
}

function zoomClientSmartQR() {
  const state = getState();
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  let qrData = '';
  if (currentClientQRType === 'yape') qrData = client.qrYape || state.qrs?.yape || '';
  else if (currentClientQRType === 'plin') qrData = client.qrPlin || state.qrs?.plin || '';
  else if (currentClientQRType === 'empresa') qrData = client.qrEmpresa || state.qrs?.empresa || '';
  
  if (!qrData) {
    toast("No hay imagen de QR cargada para ampliar.");
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
  const state = getState();
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  let text = '';
  if (currentClientQRType === 'yape') {
    text = `Yape titular: ${state.config?.yapeNum || 'No configurado'} (Monto: S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  } else if (currentClientQRType === 'plin') {
    text = `Plin titular: ${state.config?.plinNum || 'No configurado'} (Monto: S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  } else if (currentClientQRType === 'empresa') {
    text = `Datos Pago Empresa: ${state.config?.businessInfo || 'No configurado'} (Monto: S/ ${parseFloat(client.cobrar).toFixed(2)})`;
  }
  
  navigator.clipboard.writeText(text).then(() => {
    toast("Información de pago copiada al portapapeles");
  }).catch(() => {
    toast("Error al copiar");
  });
}

function shareClientSmartQR() {
  const state = getState();
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  let text = '';
  if (currentClientQRType === 'yape') {
    text = `Para pagar S/ ${parseFloat(client.cobrar).toFixed(2)} por Yape, usa el número: ${state.config?.yapeNum || 'No registrado'}`;
  } else if (currentClientQRType === 'plin') {
    text = `Para pagar S/ ${parseFloat(client.cobrar).toFixed(2)} por Plin, usa el número: ${state.config?.plinNum || 'No registrado'}`;
  } else if (currentClientQRType === 'empresa') {
    text = `Datos para pago de S/ ${parseFloat(client.cobrar).toFixed(2)} (Empresa): ${state.config?.businessInfo || 'No registrado'}`;
  }
  
  if (navigator.share) {
    navigator.share({ title: 'Datos de Pago', text: text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text);
    toast("Texto de pago copiado");
  }
}

function sendClientSmartQRWA() {
  const state = getState();
  const client = state.clients?.find(c => c.id === activeClientQRId);
  if (!client) return;
  
  let paymentDetails = '';
  if (currentClientQRType === 'yape') {
    paymentDetails = `Yape al número ${state.config?.yapeNum || 'No configurado'}`;
  } else if (currentClientQRType === 'plin') {
    paymentDetails = `Plin al número ${state.config?.plinNum || 'No configurado'}`;
  } else if (currentClientQRType === 'empresa') {
    paymentDetails = `Transferencia/Pago Empresa: ${state.config?.businessInfo || 'No configurado'}`;
  }
  
  const msg = `Hola ${client.name}, para proceder con la entrega de tu ${client.product}, puedes realizar el pago de S/ ${parseFloat(client.cobrar).toFixed(2)} a través de ${paymentDetails}. ¡Gracias!`;
  const cleanPhone = window.cleanPhoneNumber ? window.cleanPhoneNumber(client.phone) : client.phone.replace(/[^\d]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function closeClientSmartQR() {
  const modal = document.getElementById('client-smart-qr-modal');
  if (modal) modal.classList.remove('active');
  activeClientQRId = null;
}
window.closeClientSmartQR = closeClientSmartQR;


// --- COMPORTAMIENTO DE ENLACES EN CARGA DE DOM ---
document.addEventListener('DOMContentLoaded', () => {
  // Disparadores de carga global
  const btnYape = document.getElementById('btn-upload-yape');
  if (btnYape) btnYape.addEventListener('click', () => document.getElementById('input-upload-yape').click());
  
  const btnPlin = document.getElementById('btn-upload-plin');
  if (btnPlin) btnPlin.addEventListener('click', () => document.getElementById('input-upload-plin').click());

  const btnEmpresa = document.getElementById('btn-upload-empresa');
  if (btnEmpresa) btnEmpresa.addEventListener('click', () => document.getElementById('input-upload-empresa').click());

  // Input file listeners
  const inputYape = document.getElementById('input-upload-yape');
  if (inputYape) inputYape.addEventListener('change', (e) => handleGlobalImageUpload(e, 'yape'));

  const inputPlin = document.getElementById('input-upload-plin');
  if (inputPlin) inputPlin.addEventListener('change', (e) => handleGlobalImageUpload(e, 'plin'));

  const inputEmpresa = document.getElementById('input-upload-empresa');
  if (inputEmpresa) inputEmpresa.addEventListener('change', (e) => handleGlobalImageUpload(e, 'empresa'));

  // Copia, ampliación y compartido de QRs globales
  document.querySelectorAll('[data-qr]').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-qr');
      const action = btn.getAttribute('data-action');
      if (action === 'copy') copyGlobalQRInfo(type);
      if (action === 'zoom') zoomGlobalQR(type);
      if (action === 'share') shareGlobalQR(type);
    });
  });

  // Escuchadores de eventos para el QR inteligente del cliente
  const selectSmartQR = document.getElementById('client-smart-qr-select');
  if (selectSmartQR) {
    selectSmartQR.addEventListener('change', (e) => {
      currentClientQRType = e.target.value;
      renderClientSmartQR();
    });
  }

  const btnClientQrUploadTrigger = document.getElementById('btn-client-qr-upload-trigger');
  if (btnClientQrUploadTrigger) {
    btnClientQrUploadTrigger.addEventListener('click', () => document.getElementById('input-client-qr-upload').click());
  }

  const inputClientQrUpload = document.getElementById('input-client-qr-upload');
  if (inputClientQrUpload) inputClientQrUpload.addEventListener('change', handleClientQRUpload);

  const btnClientQrZoom = document.getElementById('btn-client-qr-zoom');
  if (btnClientQrZoom) btnClientQrZoom.addEventListener('click', zoomClientSmartQR);

  const btnClientQrCopy = document.getElementById('btn-client-qr-copy');
  if (btnClientQrCopy) btnClientQrCopy.addEventListener('click', copyClientSmartQR);

  const btnClientQrShare = document.getElementById('btn-client-qr-share');
  if (btnClientQrShare) btnClientQrShare.addEventListener('click', shareClientSmartQR);

  const btnClientQrWa = document.getElementById('btn-client-qr-wa');
  if (btnClientQrWa) btnClientQrWa.addEventListener('click', sendClientSmartQRWA);

  const btnCloseClientSmartQr = document.getElementById('btn-close-client-smart-qr');
  if (btnCloseClientSmartQr) btnCloseClientSmartQr.addEventListener('click', closeClientSmartQR);
  
  const btnCloseZoomModal = document.getElementById('btn-close-zoom-modal');
  if (btnCloseZoomModal) btnCloseZoomModal.addEventListener('click', closeZoomModal);
  
  // Render inicial de QRs cargados en estado
  renderQRs();
});