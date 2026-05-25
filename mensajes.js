/**
 * ClienteTrack Alpha - mensajes.js
 * Módulo para la Biblioteca de Mensajes, Categorías, Tags, y Mensajería Inteligente (Fase 4)
 */

import { state, saveState, showToast, cleanPhoneNumber } from './app.js';

let activeMessagesSubView = 'sub-biblioteca';
let selectedMsgCategoryFilter = 'Todos';
let msgSearchQuery = '';
let activeClientContextId = null;

// --- INICIALIZADOR DE VISTA DE MENSAJES ---
export function initMensajesView() {
  renderMessagesSubTabs();
  renderTemplateCategoriesFilter();
  renderTemplatesList();
  renderCategoriesListCRUD();
  renderTagsListCRUD();
}

function renderMessagesSubTabs() {
  const tabs = document.querySelectorAll('.sub-tab-btn');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const subTarget = tab.getAttribute('data-sub');
      document.querySelectorAll('.messages-subview').forEach(v => v.classList.remove('active'));
      document.getElementById(subTarget).classList.add('active');
      activeMessagesSubView = subTarget;

      if (subTarget === 'sub-biblioteca') {
        renderTemplateCategoriesFilter();
        renderTemplatesList();
      } else if (subTarget === 'sub-categorias') {
        renderCategoriesListCRUD();
      } else if (subTarget === 'sub-tags') {
        renderTagsListCRUD();
      }
    };
  });
}

// --- FILTRO DE CATEGORÍAS ---
function renderTemplateCategoriesFilter() {
  const container = document.getElementById('tpl-categories-filter');
  if (!container) return;
  container.innerHTML = '';

  const chipAll = document.createElement('div');
  chipAll.className = `filter-chip ${selectedMsgCategoryFilter === 'Todos' ? 'active' : ''}`;
  chipAll.textContent = '📚 Todos';
  chipAll.onclick = () => {
    selectedMsgCategoryFilter = 'Todos';
    renderTemplateCategoriesFilter();
    renderTemplatesList();
  };
  container.appendChild(chipAll);

  const chipFav = document.createElement('div');
  chipFav.className = `filter-chip ${selectedMsgCategoryFilter === 'Favoritos' ? 'active' : ''}`;
  chipFav.textContent = '❤️ Favoritos';
  chipFav.onclick = () => {
    selectedMsgCategoryFilter = 'Favoritos';
    renderTemplateCategoriesFilter();
    renderTemplatesList();
  };
  container.appendChild(chipFav);

  state.categories?.forEach(cat => {
    const chip = document.createElement('div');
    chip.className = `filter-chip ${selectedMsgCategoryFilter === cat.id ? 'active' : ''}`;
    chip.innerHTML = `${cat.icon} ${cat.name}`;
    chip.onclick = () => {
      selectedMsgCategoryFilter = cat.id;
      renderTemplateCategoriesFilter();
      renderTemplatesList();
    };
    container.appendChild(chip);
  });
}

// --- LISTADO DE PLANTILLAS (CON CLASES PARA EVENTOS) ---
function renderTemplatesList() {
  const container = document.getElementById('tpl-list-container');
  if (!container) return;
  container.innerHTML = '';

  const filtered = (state.templates || []).filter(tpl => {
    const matchSearch = tpl.title.toLowerCase().includes(msgSearchQuery) || tpl.text.toLowerCase().includes(msgSearchQuery);
    let matchFilter = true;
    if (selectedMsgCategoryFilter === 'Favoritos') matchFilter = tpl.favorite;
    else if (selectedMsgCategoryFilter !== 'Todos') matchFilter = tpl.categoryId === selectedMsgCategoryFilter;
    return matchSearch && matchFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-muted-sm text-center" style="padding: 24px;">No hay plantillas guardadas en este criterio.</div>`;
    return;
  }

  filtered.forEach(tpl => {
    const cat = state.categories?.find(c => c.id === tpl.categoryId) || { icon: '📝', color: '#64748b' };
    const card = document.createElement('div');
    card.className = 'tpl-card';
    card.setAttribute('data-id', tpl.id);
    card.innerHTML = `
      <div class="tpl-header">
        <span class="tpl-title">
          <span class="color-dot" style="background: ${cat.color};"></span>
          ${cat.icon} ${tpl.title}
        </span>
        <button class="fav-btn btn-tpl-fav">
          ${tpl.favorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="tpl-text-preview">${tpl.text}</div>
      <div class="tpl-actions">
        <button class="btn btn-sm btn-tpl-duplicate">📋 Duplicar</button>
        <button class="btn btn-sm btn-qr btn-tpl-edit">✏️ Editar</button>
        <button class="btn btn-sm btn-tpl-delete" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--color-fallido);">🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- MODAL PLANTILLA (CREAR / EDITAR) ---
export function openTemplateModal(tplId = null) {
  const catSelect = document.getElementById('tpl-category-select');
  if (catSelect) {
    catSelect.innerHTML = '';
    state.categories?.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.icon} ${cat.name}`;
      catSelect.appendChild(opt);
    });
  }

  initVisualBuilderTags();

  if (tplId) {
    const tpl = state.templates?.find(t => t.id === tplId);
    if (tpl) {
      document.getElementById('tpl-modal-title').textContent = 'Editar Plantilla';
      document.getElementById('tpl-id').value = tpl.id;
      document.getElementById('tpl-title-input').value = tpl.title;
      document.getElementById('tpl-category-select').value = tpl.categoryId;
      document.getElementById('tpl-fav-checkbox').checked = tpl.favorite;
      document.getElementById('tpl-text-area').value = tpl.text;
    }
  } else {
    document.getElementById('tpl-modal-title').textContent = 'Nueva Plantilla de Mensaje';
    document.getElementById('template-form').reset();
    document.getElementById('tpl-id').value = '';
  }

  const modal = document.getElementById('template-modal');
  if (modal) modal.classList.add('active');
}
window.openTemplateModal = openTemplateModal;

function closeTemplateModal() {
  const modal = document.getElementById('template-modal');
  if (modal) modal.classList.remove('active');
}
window.closeTemplateModal = closeTemplateModal;

// --- CONSTRUCTOR VISUAL DE TAGS ---
function initVisualBuilderTags() {
  const container = document.getElementById('visual-builder-tags');
  if (!container) return;
  container.innerHTML = '';

  const systemTags = ['nombre', 'producto', 'cobrar', 'telefono', 'direccion', 'empresa', 'ruta', 'hora', 'fecha', 'estado', 'observacion'];
  
  systemTags.forEach(tag => {
    const chip = document.createElement('div');
    chip.className = 'tag-chip';
    chip.textContent = `{${tag}}`;
    chip.addEventListener('click', () => insertTagText(`{${tag}}`));
    container.appendChild(chip);
  });

  state.customTags?.forEach(tag => {
    const chip = document.createElement('div');
    chip.className = 'tag-chip';
    chip.style.borderColor = 'var(--color-reprogramado)';
    chip.textContent = `{${tag.name}}`;
    chip.addEventListener('click', () => insertTagText(`{${tag.name}}`));
    container.appendChild(chip);
  });
}

function insertTagText(tagFormat) {
  const textarea = document.getElementById('tpl-text-area');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;

  textarea.value = val.substring(0, start) + tagFormat + val.substring(end);
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + tagFormat.length;
}

function handleTemplateSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('tpl-id').value;
  const title = document.getElementById('tpl-title-input').value.trim();
  const categoryId = document.getElementById('tpl-category-select').value;
  const favorite = document.getElementById('tpl-fav-checkbox').checked;
  const text = document.getElementById('tpl-text-area').value;

  if (id) {
    const tpl = state.templates?.find(t => t.id == id);
    if (tpl) {
      tpl.title = title;
      tpl.categoryId = categoryId;
      tpl.favorite = favorite;
      tpl.text = text;
    }
  } else {
    const newTpl = { id: Date.now(), title, categoryId, favorite, text };
    state.templates.push(newTpl);
  }

  saveState();
  closeTemplateModal();
  renderTemplatesList();
  showToast("Plantilla guardada correctamente");
}

function toggleTemplateFavorite(id) {
  const tpl = state.templates?.find(t => t.id === id);
  if (tpl) {
    tpl.favorite = !tpl.favorite;
    saveState();
    renderTemplatesList();
  }
}

function duplicateTemplate(id) {
  const tpl = state.templates?.find(t => t.id === id);
  if (tpl) {
    const duplicated = { ...tpl, id: Date.now(), title: tpl.title + ' (Copia)', favorite: false };
    state.templates.push(duplicated);
    saveState();
    renderTemplatesList();
    showToast("Plantilla duplicada");
  }
}

function deleteTemplate(id) {
  if (confirm("¿Seguro de eliminar esta plantilla?")) {
    state.templates = state.templates.filter(t => t.id !== id);
    saveState();
    renderTemplatesList();
    showToast("Plantilla eliminada");
  }
}

// --- CRUD CATEGORIAS ---
export function openCategoryModal(catId = null) {
  if (catId) {
    const cat = state.categories?.find(c => c.id === catId);
    if (cat) {
      document.getElementById('cat-modal-title').textContent = 'Editar Categoría';
      document.getElementById('cat-id').value = cat.id;
      document.getElementById('cat-name-input').value = cat.name;
      document.getElementById('cat-icon-input').value = cat.icon;
      document.getElementById('cat-color-input').value = cat.color;
    }
  } else {
    document.getElementById('cat-modal-title').textContent = 'Crear Categoría';
    document.getElementById('category-form').reset();
    document.getElementById('cat-id').value = '';
    document.getElementById('cat-color-input').value = '#3b82f6';
  }
  const modal = document.getElementById('category-modal');
  if (modal) modal.classList.add('active');
}
window.openCategoryModal = openCategoryModal;

function closeCategoryModal() {
  const modal = document.getElementById('category-modal');
  if (modal) modal.classList.remove('active');
}
window.closeCategoryModal = closeCategoryModal;

function handleCategorySubmit(e) {
  e.preventDefault();
  const id = document.getElementById('cat-id').value;
  const name = document.getElementById('cat-name-input').value.trim();
  const icon = document.getElementById('cat-icon-input').value.trim();
  const color = document.getElementById('cat-color-input').value;

  if (id) {
    const cat = state.categories?.find(c => c.id === id);
    if (cat) {
      cat.name = name;
      cat.icon = icon;
      cat.color = color;
    }
  } else {
    const newCat = { id: 'cat-' + Date.now(), name, icon, color };
    state.categories.push(newCat);
  }

  saveState();
  closeCategoryModal();
  renderCategoriesListCRUD();
  showToast("Categoría guardada");
}

function renderCategoriesListCRUD() {
  const container = document.getElementById('categories-crud-container');
  if (!container) return;
  container.innerHTML = '';

  state.categories?.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'crud-item';
    item.setAttribute('data-id', cat.id);
    item.innerHTML = `
      <div class="crud-item-info">
        <span class="color-dot" style="background: ${cat.color};"></span>
        <span>${cat.icon}</span>
        <strong>${cat.name}</strong>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-sm btn-cat-edit">✏️</button>
        <button class="btn btn-sm btn-cat-delete" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--color-fallido);">🗑️</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function deleteCategory(id) {
  if (confirm("Al eliminar la categoría, sus plantillas quedarán sin clasificación. ¿Continuar?")) {
    state.categories = state.categories.filter(c => c.id !== id);
    state.templates?.forEach(t => {
      if (t.categoryId === id) t.categoryId = 'cat-personalizados';
    });
    saveState();
    renderCategoriesListCRUD();
    showToast("Categoría eliminada");
  }
}

// --- CRUD TAGS PERSONALIZADOS ---
export function openTagModal() {
  document.getElementById('tag-form').reset();
  const modal = document.getElementById('tag-modal');
  if (modal) modal.classList.add('active');
}
window.openTagModal = openTagModal;

function closeTagModal() {
  const modal = document.getElementById('tag-modal');
  if (modal) modal.classList.remove('active');
}
window.closeTagModal = closeTagModal;

function handleTagSubmit(e) {
  e.preventDefault();
  const rawName = document.getElementById('tag-name-input').value.trim();
  const label = document.getElementById('tag-label-input').value.trim();
  const name = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!name) {
    showToast("Nombre de marcador inválido");
    return;
  }

  const exists = state.customTags?.some(t => t.name === name);
  if (exists) {
    showToast("El tag ya existe");
    return;
  }

  const newTag = { id: 'tag-custom-' + Date.now(), name, label };
  state.customTags.push(newTag);
  
  saveState();
  closeTagModal();
  renderTagsListCRUD();
  showToast(`Tag {${name}} creado correctamente`);
}

function renderTagsListCRUD() {
  const container = document.getElementById('tags-crud-container');
  if (!container) return;
  container.innerHTML = '';

  if (!state.customTags || state.customTags.length === 0) {
    container.innerHTML = `<div class="text-muted-sm text-center" style="padding: 16px;">No has creado tags personalizados todavía.</div>`;
    return;
  }

  state.customTags.forEach(tag => {
    const item = document.createElement('div');
    item.className = 'crud-item';
    item.setAttribute('data-id', tag.id);
    item.innerHTML = `
      <div class="crud-item-info">
        <span class="tag-mono">{${tag.name}}</span>
        <span class="text-muted-sm">— ${tag.label}</span>
      </div>
      <div>
        <button class="btn btn-sm btn-tag-delete" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--color-fallido);">🗑️</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function deleteCustomTag(id) {
  if (confirm("¿Eliminar este marcador personalizado?")) {
    state.customTags = state.customTags.filter(t => t.id !== id);
    saveState();
    renderTagsListCRUD();
    showToast("Tag eliminado");
  }
}

// ==========================================
// ====== MENSAJERÍA INTELIGENTE ============
// ==========================================

export function openClientTemplates(clientId) {
  activeClientContextId = clientId;
  const client = state.clients?.find(c => c.id === clientId);
  if (!client) return;

  const title = document.getElementById('client-tpl-modal-title');
  if (title) title.textContent = `Enviar a: ${client.name}`;

  const select = document.getElementById('client-tpl-select');
  if (select) {
    select.innerHTML = '';
    state.templates?.forEach(tpl => {
      const opt = document.createElement('option');
      opt.value = tpl.id;
      opt.textContent = tpl.title;
      select.appendChild(opt);
    });
  }

  renderParsedPreview();
  const modal = document.getElementById('client-templates-modal');
  if (modal) modal.classList.add('active');
}
window.openClientTemplates = openClientTemplates;

function closeClientTemplatesModal() {
  const modal = document.getElementById('client-templates-modal');
  if (modal) modal.classList.remove('active');
  activeClientContextId = null;
}
window.closeClientTemplatesModal = closeClientTemplatesModal;

export function parseTemplateText(templateText, clientObj) {
  if (!templateText) return '';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let parsed = templateText;

  const systemReplacements = {
    '{nombre}': clientObj.name || '',
    '{producto}': clientObj.product || '',
    '{cobrar}': parseFloat(clientObj.cobrar).toFixed(2) || '0.00',
    '{precio}': parseFloat(clientObj.cobrar).toFixed(2) || '0.00',
    '{telefono}': clientObj.phone || '',
    '{direccion}': clientObj.address || '',
    '{distrito}': clientObj.district || '',
    '{hora}': timeStr,
    '{fecha}': dateStr,
    '{estado}': clientObj.status || '',
    '{observacion}': clientObj.observation || '',
    '{yape}': state.config?.yapeNum || '',
    '{plin}': state.config?.plinNum || '',
    '{empresa}': state.config?.businessName || '',
    '{ruta}': clientObj.ruta || clientObj.district || ''
  };

  for (const [key, val] of Object.entries(systemReplacements)) {
    parsed = parsed.replace(new RegExp(escapeRegExp(key), 'g'), val);
  }

  state.customTags?.forEach(tag => {
    const placeholder = `{${tag.name}}`;
    const value = clientObj[tag.name] || '';
    parsed = parsed.replace(new RegExp(escapeRegExp(placeholder), 'g'), value);
  });

  return parsed;
}
window.parseTemplateText = parseTemplateText;

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function renderParsedPreview() {
  const select = document.getElementById('client-tpl-select');
  const previewArea = document.getElementById('client-tpl-preview-text');
  if (!select || !previewArea) return;
  
  const tplId = parseInt(select.value);
  const tpl = state.templates?.find(t => t.id === tplId);
  const client = state.clients?.find(c => c.id === activeClientContextId);

  if (tpl && client) {
    previewArea.value = parseTemplateText(tpl.text, client);
  } else {
    previewArea.value = '';
  }
}
window.renderParsedPreview = renderParsedPreview;

function sendClientTemplateWA() {
  const client = state.clients?.find(c => c.id === activeClientContextId);
  const previewArea = document.getElementById('client-tpl-preview-text');
  if (!client || !previewArea) return;

  const messageText = previewArea.value;
  if (!messageText) return;

  const cleanPhone = cleanPhoneNumber(client.phone);
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
}

function copyClientTemplateText() {
  const previewArea = document.getElementById('client-tpl-preview-text');
  if (!previewArea) return;
  navigator.clipboard.writeText(previewArea.value).then(() => {
    showToast("Mensaje copiado");
  }).catch(() => {
    showToast("Error al copiar");
  });
}

function shareClientTemplateText() {
  const previewArea = document.getElementById('client-tpl-preview-text');
  if (!previewArea) return;
  const text = previewArea.value;
  if (navigator.share) {
    navigator.share({ title: 'Mensaje de Coordinación', text }).catch(() => {});
  } else {
    copyClientTemplateText();
  }
}

// --- CONEXIÓN DE EVENTOS DE MENSAJES ---
export function inicializarMensajes() {
  const btnNewTpl = document.getElementById('btn-new-template');
  if (btnNewTpl) btnNewTpl.addEventListener('click', () => openTemplateModal());

  const btnNewCat = document.getElementById('btn-new-category');
  if (btnNewCat) btnNewCat.addEventListener('click', () => openCategoryModal());

  const btnNewTag = document.getElementById('btn-new-tag');
  if (btnNewTag) btnNewTag.addEventListener('click', () => openTagModal());

  const btnCloseTpl = document.getElementById('btn-close-template-modal');
  if (btnCloseTpl) btnCloseTpl.addEventListener('click', closeTemplateModal);

  const btnCloseCat = document.getElementById('btn-close-category-modal');
  if (btnCloseCat) btnCloseCat.addEventListener('click', closeCategoryModal);

  const btnCloseTag = document.getElementById('btn-close-tag-modal');
  if (btnCloseTag) btnCloseTag.addEventListener('click', closeTagModal);

  const btnCloseClientTpl = document.getElementById('btn-close-client-tpl-modal');
  if (btnCloseClientTpl) btnCloseClientTpl.addEventListener('click', closeClientTemplatesModal);

  const templateForm = document.getElementById('template-form');
  if (templateForm) templateForm.addEventListener('submit', handleTemplateSubmit);

  const categoryForm = document.getElementById('category-form');
  if (categoryForm) categoryForm.addEventListener('submit', handleCategorySubmit);

  const tagForm = document.getElementById('tag-form');
  if (tagForm) tagForm.addEventListener('submit', handleTagSubmit);

  const clientTplSelect = document.getElementById('client-tpl-select');
  if (clientTplSelect) clientTplSelect.addEventListener('change', renderParsedPreview);

  const btnClientWA = document.getElementById('btn-client-tpl-wa');
  if (btnClientWA) btnClientWA.addEventListener('click', sendClientTemplateWA);

  const btnClientCopy = document.getElementById('btn-client-tpl-copy');
  if (btnClientCopy) btnClientCopy.addEventListener('click', copyClientTemplateText);

  const btnClientShare = document.getElementById('btn-client-tpl-share');
  if (btnClientShare) btnClientShare.addEventListener('click', shareClientTemplateText);

  // Delegación de eventos en Listado de Plantillas Biblioteca
  const tplListContainer = document.getElementById('tpl-list-container');
  if (tplListContainer) {
    tplListContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.tpl-card');
      if (!card) return;
      const tplId = parseInt(card.getAttribute('data-id'));

      if (e.target.closest('.btn-tpl-fav')) {
        toggleTemplateFavorite(tplId);
      } else if (e.target.closest('.btn-tpl-duplicate')) {
        duplicateTemplate(tplId);
      } else if (e.target.closest('.btn-tpl-edit')) {
        openTemplateModal(tplId);
      } else if (e.target.closest('.btn-tpl-delete')) {
        deleteTemplate(tplId);
      }
    });
  }

  // Delegación de eventos en Listado CRUD de Categorías
  const categoriesCrudContainer = document.getElementById('categories-crud-container');
  if (categoriesCrudContainer) {
    categoriesCrudContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.crud-item');
      if (!item) return;
      const catId = item.getAttribute('data-id');

      if (e.target.closest('.btn-cat-edit')) {
        openCategoryModal(catId);
      } else if (e.target.closest('.btn-cat-delete')) {
        deleteCategory(catId);
      }
    });
  }

  // Delegación de eventos en Listado CRUD de Tags
  const tagsCrudContainer = document.getElementById('tags-crud-container');
  if (tagsCrudContainer) {
    tagsCrudContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.crud-item');
      if (!item) return;
      const tagId = item.getAttribute('data-id');

      if (e.target.closest('.btn-tag-delete')) {
        deleteCustomTag(tagId);
      }
    });
  }

  initMensajesView();
}