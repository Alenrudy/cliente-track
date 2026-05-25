/**
 * ClienteTrack Alpha - mensajes.js
 * Módulo para la Biblioteca de Mensajes, Categorías, Tags, y Mensajería Inteligente (Fase 4)
 */

const getState = () => window.state || { templates: [], categories: [], customTags: [], clients: [], config: {} };
const saveGlobalState = () => {
  if (typeof window.saveState === 'function') window.saveState();
};
const toast = (msg) => {
  if (typeof window.showToast === 'function') window.showToast(msg);
};

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
window.initMensajesView = initMensajesView;

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

  const state = getState();

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

// --- LISTADO DE PLANTILLAS ---
function renderTemplatesList() {
  const container = document.getElementById('tpl-list-container');
  if (!container) return;
  container.innerHTML = '';

  const state = getState();

  const filtered = (state.templates || []).filter(tpl => {
    const matchSearch = tpl.title.toLowerCase().includes(msgSearchQuery) || tpl.text.toLowerCase().includes(msgSearchQuery);
    
    let matchFilter = true;
    if (selectedMsgCategoryFilter === 'Favoritos') {
      matchFilter = tpl.favorite;
    } else if (selectedMsgCategoryFilter !== 'Todos') {
      matchFilter = tpl.categoryId === selectedMsgCategoryFilter;
    }

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
    card.innerHTML = `
      <div class="tpl-header">
        <span class="tpl-title">
          <span class="color-dot" style="background: ${cat.color};"></span>
          ${cat.icon} ${tpl.title}
        </span>
        <button class="fav-btn" onclick="toggleTemplateFavorite(${tpl.id})">
          ${tpl.favorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="tpl-text-preview">${tpl.text}</div>
      <div class="tpl-actions">
        <button class="btn btn-sm" onclick="duplicateTemplate(${tpl.id})" style="padding: 4px 8px; font-size:0.7rem;">📋 Duplicar</button>
        <button class="btn btn-sm btn-qr" onclick="openTemplateModal(${tpl.id})" style="padding: 4px 8px; font-size:0.7rem;">✏️ Editar</button>
        <button class="btn btn-sm" onclick="deleteTemplate(${tpl.id})" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--color-fallido); padding: 4px 8px; font-size:0.7rem;">🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- MODAL PLANTILLA (CREAR / EDITAR) ---
export function openTemplateModal(tplId = null) {
  const state = getState();
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

  const state = getState();
  const systemTags = ['nombre', 'producto', 'cobrar', 'telefono', 'direccion', 'empresa', 'ruta', 'hora', 'fecha', 'estado', 'observacion'];
  
  systemTags.forEach(tag => {
    const chip = document.createElement('div');
    chip.className = 'tag-chip';
    chip.textContent = `{${tag}}`;
    chip.onclick = () => insertTagText(`{${tag}}`);
    container.appendChild(chip);
  });

  state.customTags?.forEach(tag => {
    const chip = document.createElement('div');
    chip.className = 'tag-chip';
    chip.style.borderColor = 'var(--color-reprogramado)';
    chip.textContent = `{${tag.name}}`;
    chip.onclick = () => insertTagText(`{${tag.name}}`);
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
  const state = getState();
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

  saveGlobalState();
  closeTemplateModal();
  renderTemplatesList();
  toast("Plantilla guardada correctamente");
}

function toggleTemplateFavorite(id) {
  const state = getState();
  const tpl = state.templates?.find(t => t.id === id);
  if (tpl) {
    tpl.favorite = !tpl.favorite;
    saveGlobalState();
    renderTemplatesList();
  }
}
window.toggleTemplateFavorite = toggleTemplateFavorite;

function duplicateTemplate(id) {
  const state = getState();
  const tpl = state.templates?.find(t => t.id === id);
  if (tpl) {
    const duplicated = { ...tpl, id: Date.now(), title: tpl.title + ' (Copia)', favorite: false };
    state.templates.push(duplicated);
    saveGlobalState();
    renderTemplatesList();
    toast("Plantilla duplicada");
  }
}
window.duplicateTemplate = duplicateTemplate;

function deleteTemplate(id) {
  if (confirm("¿Seguro de eliminar esta plantilla?")) {
    const state = getState();
    state.templates = state.templates.filter(t => t.id !== id);
    saveGlobalState();
    renderTemplatesList();
    toast("Plantilla eliminada");
  }
}
window.deleteTemplate = deleteTemplate;


// --- CRUD CATEGORIAS ---
export function openCategoryModal(catId = null) {
  const state = getState();
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
  const state = getState();
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

  saveGlobalState();
  closeCategoryModal();
  renderCategoriesListCRUD();
  toast("Categoría guardada");
}

function renderCategoriesListCRUD() {
  const container = document.getElementById('categories-crud-container');
  if (!container) return;
  container.innerHTML = '';

  const state = getState();
  state.categories?.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'crud-item';
    item.innerHTML = `
      <div class="crud-item-info">
        <span class="color-dot" style="background: ${cat.color};"></span>
        <span>${cat.icon}</span>
        <strong>${cat.name}</strong>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-sm" onclick="openCategoryModal('${cat.id}')" style="padding:4px 8px;">✏️</button>
        <button class="btn btn-sm" onclick="deleteCategory('${cat.id}')" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--color-fallido); padding:4px 8px;">🗑️</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function deleteCategory(id) {
  if (confirm("Al eliminar la categoría, sus plantillas quedarán sin clasificación. ¿Continuar?")) {
    const state = getState();
    state.categories = state.categories.filter(c => c.id !== id);
    state.templates?.forEach(t => {
      if (t.categoryId === id) t.categoryId = 'cat-personalizados';
    });
    saveGlobalState();
    renderCategoriesListCRUD();
    toast("Categoría eliminada");
  }
}
window.deleteCategory = deleteCategory;


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
  const state = getState();
  const rawName = document.getElementById('tag-name-input').value.trim();
  const label = document.getElementById('tag-label-input').value.trim();
  const name = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!name) {
    toast("Nombre de marcador inválido");
    return;
  }

  const exists = state.customTags?.some(t => t.name === name);
  if (exists) {
    toast("El tag ya existe");
    return;
  }

  const newTag = { id: 'tag-custom-' + Date.now(), name, label };
  state.customTags.push(newTag);
  
  saveGlobalState();
  closeTagModal();
  renderTagsListCRUD();
  toast(`Tag {${name}} creado correctamente`);
}

function renderTagsListCRUD() {
  const container = document.getElementById('tags-crud-container');
  if (!container) return;
  container.innerHTML = '';

  const state = getState();
  if (!state.customTags || state.customTags.length === 0) {
    container.innerHTML = `<div class="text-muted-sm text-center" style="padding: 16px;">No has creado tags personalizados todavía.</div>`;
    return;
  }

  state.customTags.forEach(tag => {
    const item = document.createElement('div');
    item.className = 'crud-item';
    item.innerHTML = `
      <div class="crud-item-info">
        <span class="tag-mono">{${tag.name}}</span>
        <span class="text-muted-sm">— ${tag.label}</span>
      </div>
      <div>
        <button class="btn btn-sm" onclick="deleteCustomTag('${tag.id}')" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--color-fallido); padding:4px 8px;">🗑️</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function deleteCustomTag(id) {
  if (confirm("¿Eliminar este marcador personalizado?")) {
    const state = getState();
    state.customTags = state.customTags.filter(t => t.id !== id);
    saveGlobalState();
    renderTagsListCRUD();
    toast("Tag eliminado");
  }
}
window.deleteCustomTag = deleteCustomTag;


// ==========================================
// ====== MENSAJERÍA INTELIGENTE ============
// ==========================================

export function openClientTemplates(clientId) {
  activeClientContextId = clientId;
  const state = getState();
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

// Motor de parsing con soporte expandido para Tags (Fase 4)
export function parseTemplateText(templateText, clientObj) {
  if (!templateText) return '';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let parsed = templateText;
  const state = getState();

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
  
  const state = getState();
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
  const state = getState();
  const client = state.clients?.find(c => c.id === activeClientContextId);
  const previewArea = document.getElementById('client-tpl-preview-text');
  if (!client || !previewArea) return;

  const messageText = previewArea.value; // Lee el texto editable actual
  if (!messageText) return;

  const cleanPhone = window.cleanPhoneNumber ? window.cleanPhoneNumber(client.phone) : client.phone.replace(/[^\d]/g, '');
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
}

function copyClientTemplateText() {
  const previewArea = document.getElementById('client-tpl-preview-text');
  if (!previewArea) return;
  navigator.clipboard.writeText(previewArea.value).then(() => {
    toast("Mensaje copiado");
  }).catch(() => {
    toast("Error al copiar");
  });
}

function shareClientTemplateText() {
  const previewArea = document.getElementById('client-tpl-preview-text');
  if (!previewArea) return;
  const text = previewArea.value;
  if (navigator.share) {
    navigator.share({ title: 'Mensaje de Coordinación', text: text }).catch(() => {});
  } else {
    copyClientTemplateText();
  }
}


// --- ENLACES DE EVENTOS DOM ---
document.addEventListener('DOMContentLoaded', () => {
  const tplSearchInput = document.getElementById('tpl-search-input');
  if (tplSearchInput) {
    tplSearchInput.addEventListener('input', (e) => {
      msgSearchQuery = e.target.value.toLowerCase().trim();
      renderTemplatesList();
    });
  }

  const btnNewTemplate = document.getElementById('btn-new-template');
  if (btnNewTemplate) btnNewTemplate.addEventListener('click', () => openTemplateModal());

  const btnNewCategory = document.getElementById('btn-new-category');
  if (btnNewCategory) btnNewCategory.addEventListener('click', () => openCategoryModal());

  const btnNewTag = document.getElementById('btn-new-tag');
  if (btnNewTag) btnNewTag.addEventListener('click', () => openTagModal());

  const btnCloseTemplateModal = document.getElementById('btn-close-template-modal');
  if (btnCloseTemplateModal) btnCloseTemplateModal.addEventListener('click', closeTemplateModal);

  const btnCloseCategoryModal = document.getElementById('btn-close-category-modal');
  if (btnCloseCategoryModal) btnCloseCategoryModal.addEventListener('click', closeCategoryModal);

  const btnCloseTagModal = document.getElementById('btn-close-tag-modal');
  if (btnCloseTagModal) btnCloseTagModal.addEventListener('click', closeTagModal);

  const btnCloseClientTplModal = document.getElementById('btn-close-client-tpl-modal');
  if (btnCloseClientTplModal) btnCloseClientTplModal.addEventListener('click', closeClientTemplatesModal);

  // Forms submit listeners
  const templateForm = document.getElementById('template-form');
  if (templateForm) templateForm.addEventListener('submit', handleTemplateSubmit);

  const categoryForm = document.getElementById('category-form');
  if (categoryForm) categoryForm.addEventListener('submit', handleCategorySubmit);

  const tagForm = document.getElementById('tag-form');
  if (tagForm) tagForm.addEventListener('submit', handleTagSubmit);

  // Mensajería Inteligente inputs
  const clientTplSelect = document.getElementById('client-tpl-select');
  if (clientTplSelect) clientTplSelect.addEventListener('change', renderParsedPreview);

  const btnClientTplWa = document.getElementById('btn-client-tpl-wa');
  if (btnClientTplWa) btnClientTplWa.addEventListener('click', sendClientTemplateWA);

  const btnClientTplCopy = document.getElementById('btn-client-tpl-copy');
  if (btnClientTplCopy) btnClientTplCopy.addEventListener('click', copyClientTemplateText);

  const btnClientTplShare = document.getElementById('btn-client-tpl-share');
  if (btnClientTplShare) btnClientTplShare.addEventListener('click', shareClientTemplateText);
  
  // Render de inicio de biblioteca
  initMensajesView();
});