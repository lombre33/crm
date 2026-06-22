// ════════════════════════════════════════════════════════
//  CRM PUI — Université de Bordeaux
//  Widget Grist — JS principal
//  Version 0.4 — Juin 2026
// ════════════════════════════════════════════════════════
/*
// ── État global ──────────────────────────────────────────
let allOpportunites     = [];
let allInteractions     = [];
let allContacts         = [];
let allEntreprises      = [];
let currentOpp          = null;
let currentActionType   = null;
let gristReady          = false;
let draggedCardId       = null;

const INTERACTION_ICONS = { Appel:'📞', Email:'📧', Note:'📝', Réunion:'📅' };
const STATUTS = ['Prospect','En discussion','Proposition','Gagné','Perdu'];

// ════════════════════════════════════════════════════════
//  INIT GRIST
// ════════════════════════════════════════════════════════
grist.ready({ requiredAccess: 'full', allowSelectBy: true });

// Chargement table Opportunites
grist.docApi.fetchTable('Opportunites').then(data => {
  allOpportunites = data.id.map((id, i) => ({
    id,
    titre               : data.titre?.[i]                || '',
    Entreprise          : data.Entreprise?.[i]           || 0,
    contact_principale  : data.contact_principale?.[i]   || 0,
    statut              : data.statut?.[i]               || 'Prospect',
    Priorite            : data.Priorite?.[i]             || 'Moyenne',
    valeur_estilmee     : data.valeur_estilmee?.[i]      || 0,
    date_closing_estimee: data.date_closing_estimee?.[i] || 0,
    assignee_a          : data.assignee_a?.[i]           || 0,
    description         : data.description?.[i]          || '',
  }));
  allOpportunites.forEach(o => resolveOpportunityNames(o));
  renderKanban();
  console.log('✅ Opportunités chargées:', allOpportunites.length);
}).catch(e => console.warn('Opportunités non chargée', e));

// Chargement table Contacts
grist.docApi.fetchTable('Annuaire').then(data => {
  allContacts = data.id.map((id, i) => ({
    id,
    Nom              : data.Nom?.[i]               || '',
    Prenom           : data.Prenom?.[i]            || '',
    nom_prenom       : data.nom_prenom?.[i]        || '',
    Email_fonctionnel: data.Email_fonctionnel?.[i] || '',
    email_perso      : data.email_perso?.[i]       || '',
    numero_pro       : data.numero_pro?.[i]        || '',
    Structure        : data.Structure?.[i]         || 0,
  }));
  console.log('✅ Contacts chargés:', allContacts.length);
  renderKanban();
}).catch(e => console.warn('Contacts non chargé', e));

// Chargement table Entreprises
grist.docApi.fetchTable('Entreprises').then(data => {
  allEntreprises = data.id.map((id, i) => ({
    id,
    nom              : data.nom?.[i]          || '',
    secteur          : data.secteur?.[i]      || '',
    statut           : data.statut?.[i]       || '',
  }));
  console.log('✅ Entreprises chargées:', allEntreprises.length);
  renderKanban();
}).catch(e => console.warn('Entreprises non chargée', e));

// Chargement table Interactions
grist.docApi.fetchTable('Interactions').then(data => {
  allInteractions = data.id.map((id, i) => ({
    id,
    type_interaction: data.type_interaction?.[i] || 'Note',
    Date            : data.Date?.[i]             || 0,
    contact         : data.contact?.[i]          || 0,
    Opportunite     : data.Opportunite?.[i]      || 0,
    Assigne         : data.Assigne?.[i]          || 0,
    contenu         : data.contenu?.[i]          || '',
    duree           : data.duree?.[i]            || 0,
  }));
  allInteractions.forEach(i => resolveInteractionNames(i));
  console.log('✅ Interactions chargées:', allInteractions.length);
}).catch(e => console.warn('Interactions non chargé', e));

grist.onOptions(updateOptions => {
  gristReady = true;
  console.log('✅ Grist prêt !');
});

// ════════════════════════════════════════════════════════
//  RESOLVE NAMES
// ════════════════════════════════════════════════════════
function resolveOpportunityNames(opp) {
  const entreprise = allEntreprises.find(e => e.id === opp.Entreprise);
  opp._entrepriseNom = entreprise
    ? (entreprise.nom || '(' + opp.Entreprise + ')')
    : (opp.Entreprise ? '(' + opp.Entreprise + ')' : '—');

  const contact = allContacts.find(c => c.id === opp.contact_principale);
  opp._contactNom = contact
    ? (contact.nom_prenom || (contact.Prenom + ' ' + contact.Nom).trim())
    : (opp.contact_principale ? '(' + opp.contact_principale + ')' : '—');

  const assignee = allContacts.find(c => c.id === opp.assignee_a);
  opp._assigneeNom = assignee
    ? (assignee.nom_prenom || (assignee.Prenom + ' ' + assignee.Nom).trim())
    : (opp.assignee_a ? '(' + opp.assignee_a + ')' : '—');
}

function resolveInteractionNames(inter) {
  const contact = allContacts.find(c => c.id === inter.contact);
  inter._contactNom = contact
    ? (contact.nom_prenom || (contact.Prenom + ' ' + contact.Nom).trim())
    : '—';

  const assignee = allContacts.find(c => c.id === inter.Assigne);
  inter._assigneeNom = assignee
    ? (assignee.nom_prenom || (assignee.Prenom + ' ' + assignee.Nom).trim())
    : '—';
}

// ════════════════════════════════════════════════════════
//  KANBAN
// ════════════════════════════════════════════════════════
function renderKanban() {
  STATUTS.forEach(statut => {
    const cards     = allOpportunites.filter(o => o.statut === statut);
    const container = document.getElementById('col-' + statut);
    const countEl   = document.getElementById('count-' + statut);
    const totalEl   = document.getElementById('total-' + statut);
    if (!container) return;

    container.innerHTML = '';
    if (countEl) countEl.textContent = cards.length;

    const total = cards.reduce((s, o) => s + (o.valeur_estilmee || 0), 0);
    if (totalEl) totalEl.textContent = total > 0 ? formatEuros(total) : '';

    cards.forEach(opp => container.appendChild(createCard(opp)));
  });

  initDragDrop();
}

function createCard(opp) {
  const card = document.createElement('div');
  card.className = 'opportunity-card';
  card.draggable = true;
  card.dataset.id = opp.id;

  card.innerHTML = `
    <div class="card-company">📍 ${escHtml(opp._entrepriseNom)}</div>
    <div class="card-title">${escHtml(opp.titre)}</div>
    <div class="card-contact">👤 ${escHtml(opp._contactNom)}</div>
    
    <div class="card-meta">
      <div class="card-amount">${formatEuros(opp.valeur_estilmee)}</div>
      <div class="card-priority priority-${opp.Priorite || 'Moyenne'}">
        ${opp.Priorite || 'Moyenne'}
      </div>
    </div>

    <div class="card-footer">
      <div class="card-actions">
        <button class="card-action" data-action="Appel" title="Appel">📞</button>
        <button class="card-action" data-action="Email" title="Email">📧</button>
        <button class="card-action" data-action="Note" title="Note">📝</button>
      </div>
      <div class="card-date">${formatDate(opp.date_closing_estimee)}</div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (!e.target.classList.contains('card-action')) {
      openPanelEdit(opp);
    }
  });

  card.querySelectorAll('.card-action').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const actionType = btn.dataset.action;
      openQuickActionModal(actionType, opp);
    });
  });

  return card;
}

// ════════════════════════════════════════════════════════
//  DRAG & DROP
// ════════════════════════════════════════════════════════
function initDragDrop() {
  document.querySelectorAll('.opportunity-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      draggedCardId = parseInt(card.dataset.id);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  document.querySelectorAll('.kanban-column').forEach(col => {
    col.addEventListener('dragover',  e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', ()  => col.classList.remove('drag-over'));
    col.addEventListener('drop', async e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const newStatut = col.dataset.status;
      if (!draggedCardId || !newStatut) return;

      const opp = allOpportunites.find(o => o.id === draggedCardId);
      if (!opp || opp.statut === newStatut) return;

      const oldStatut = opp.statut;
      opp.statut = newStatut;
      renderKanban();

      if (gristReady) {
        try {
          await grist.docApi.applyUserActions([
            ['UpdateRecord', 'Opportunites', opp.id, { statut: newStatut }]
          ]);
          showToast(`✅ Déplacé vers "${newStatut}"`);
        } catch(err) {
          console.error(err);
          opp.statut = oldStatut;
          renderKanban();
          showToast('❌ Erreur lors de la mise à jour');
        }
      }
    });
  });
}

// ════════════════════════════════════════════════════════
//  SIDE PANEL
// ════════════════════════════════════════════════════════
function openPanelEdit(opp) {
  currentOpp = opp;

  document.getElementById('panel-company').textContent = opp._entrepriseNom;
  document.getElementById('panel-contact').textContent = '👤 ' + opp._contactNom;

  const statusEl = document.getElementById('panel-status');
  statusEl.textContent      = opp.statut;
  statusEl.style.background = statusBg(opp.statut);
  statusEl.style.color      = statusColor(opp.statut);

  document.getElementById('panel-amount').textContent = formatEuros(opp.valeur_estilmee);

  renderPanelDetails(opp);
  renderTimeline(opp);

  document.getElementById('side-panel').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
}

function renderPanelDetails(opp) {
  const panelDetails = document.getElementById('panel-details');
  if (!panelDetails) return;

  const closingVal = opp.date_closing_estimee
    ? new Date(opp.date_closing_estimee * 1000).toISOString().split('T')[0]
    : '';

  panelDetails.innerHTML = `
    <div class="detail-item">
      <div class="detail-label">Titre</div>
      <div class="detail-value">${escHtml(opp.titre)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Entreprise</div>
      <div class="detail-value">${escHtml(opp._entrepriseNom)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Contact</div>
      <div class="detail-value">${escHtml(opp._contactNom)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Statut</div>
      <div class="detail-value">${opp.statut}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Priorité</div>
      <div class="detail-value">${opp.Priorite || 'Moyenne'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Valeur (€)</div>
      <div class="detail-value">${formatEuros(opp.valeur_estilmee)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Date closing</div>
      <div class="detail-value">${formatDate(opp.date_closing_estimee)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Assigné à</div>
      <div class="detail-value">${escHtml(opp._assigneeNom)}</div>
    </div>
    <div class="detail-item" style="grid-column: 1/-1;">
      <div class="detail-label">Description</div>
      <div class="detail-value" style="white-space: pre-wrap; line-height: 1.4;">${escHtml(opp.description)}</div>
    </div>
  `;
}

function renderTimeline(opp) {
  const interactions = allInteractions.filter(i => i.Opportunite === opp.id);
  const timeline = document.getElementById('panel-timeline');
  if (!timeline) return;

  const items = interactions.sort((a, b) => (b.Date || 0) - (a.Date || 0));

  if (items.length === 0) {
    timeline.innerHTML = '<div class="timeline-empty">Aucune interaction</div>';
    return;
  }

  timeline.innerHTML = items.map(item => `
    <div class="timeline-item" data-inter-id="${item.id}" style="cursor: pointer;">
      <div class="timeline-dot ${item.type_interaction.toLowerCase()}">
        ${INTERACTION_ICONS[item.type_interaction] || '💬'}
      </div>
      <div class="timeline-content">
        <div class="timeline-title">
          ${item.type_interaction}
          ${item.duree ? ' — ' + item.duree + ' min' : ''}
        </div>
        <div class="timeline-body">${escHtml(item.contenu)}</div>
        <div class="timeline-date">
          ${formatDatetime(item.Date)}
          ${item._assigneeNom !== '—' ? ' · ' + item._assigneeNom : ''}
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.timeline-item').forEach(el => {
    el.addEventListener('click', () => {
      const interId = parseInt(el.dataset.interId);
      openInteractionDetail(interId);
    });
  });
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
  currentOpp = null;
}

// ════════════════════════════════════════════════════════
//  QUICK ACTIONS
// ════════════════════════════════════════════════════════
function openQuickActionModal(type, opp) {
  if (!opp) return;
  
  currentOpp = opp;
  currentActionType = type;

  const icons = { 'Appel':'📞', 'Email':'📧', 'Note':'📝', 'Réunion':'📅' };
  document.getElementById('modal-title').textContent = 
    `${icons[type] || '📝'} ${type}`;
  
  document.getElementById('modal-note').value = '';
  document.getElementById('modal-duree').value = 30;

  // Afficher champ durée seulement pour Appel et Réunion
  const dureeLabel = document.getElementById('modal-duree-label');
  const dureeInput = document.getElementById('modal-duree');
  
  if (type === 'Appel' || type === 'Réunion') {
    dureeLabel.style.display = 'block';
    dureeInput.style.display = 'block';
  } else {
    dureeLabel.style.display = 'none';
    dureeInput.style.display = 'none';
  }

  document.getElementById('modal-overlay').classList.add('open');
}

document.getElementById('modal-confirm').addEventListener('click', async () => {
  const content = document.getElementById('modal-note').value.trim();
  const duree = parseInt(document.getElementById('modal-duree').value) || 0;

  if (!content) {
    showToast('❌ Veuillez entrer un contenu');
    return;
  }

  const nowTs = Math.floor(Date.now() / 1000);
  
  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['AddRecord', 'Interactions', null, {
        type_interaction: currentActionType,
        Date            : nowTs,
        contact         : currentOpp?.contact_principale || 0,
        Opportunite     : currentOpp?.id || 0,
        Assigne         : currentOpp?.assignee_a || 0,
        contenu         : content,
        duree           : duree,
      }]]);
      showToast(`✅ ${currentActionType} enregistrée !`);
    } catch(err) {
      console.error(err);
      showToast('❌ Erreur lors de l\'enregistrement');
      return;
    }
  }

  // Ajouter localement
  const inter = {
    id              : Date.now(),
    type_interaction: currentActionType,
    Date            : nowTs,
    contact         : currentOpp?.contact_principale || 0,
    Opportunite     : currentOpp?.id || 0,
    Assigne         : currentOpp?.assignee_a || 0,
    contenu         : content,
    duree           : duree,
  };
  resolveInteractionNames(inter);
  allInteractions.unshift(inter);

  if (currentOpp) renderTimeline(currentOpp);
  document.getElementById('modal-overlay').classList.remove('open');
});

// ════════════════════════════════════════════════════════
//  MODAL DÉTAIL INTERACTION
// ════════════════════════════════════════════════════════
function openInteractionDetail(interactionId) {
  const inter = allInteractions.find(i => i.id === interactionId);
  if (!inter) return;

  const dateVal = typeof inter.Date === 'number' 
    ? new Date(inter.Date * 1000).toISOString().slice(0, 16)
    : String(inter.Date).slice(0, 16);

  const modal = document.getElementById('inter-detail-overlay');
  const content = document.getElementById('inter-detail-modal');

  const typeOptions = ['Appel', 'Email', 'Note', 'Réunion']
    .map(t => `<option value="${t}" ${t === inter.type_interaction ? 'selected' : ''}>${INTERACTION_ICONS[t]} ${t}</option>`)
    .join('');

  const contactOptions = [{ id: 0, nom: '—' }, ...allContacts]
    .map(c => `<option value="${c.id}" ${c.id === inter.contact ? 'selected' : ''}>${escHtml(c.nom_prenom || (c.Prenom + ' ' + c.Nom).trim())}</option>`)
    .join('');

  const assigneeOptions = [{ id: 0, nom: '—' }, ...allContacts]
    .map(c => `<option value="${c.id}" ${c.id === inter.Assigne ? 'selected' : ''}>${escHtml(c.nom_prenom || (c.Prenom + ' ' + c.Nom).trim())}</option>`)
    .join('');

  content.innerHTML = `
    <div class="inter-detail-header">
      <h3>${INTERACTION_ICONS[inter.type_interaction] || '💬'} ${inter.type_interaction}</h3>
      <button class="btn-close-inter" onclick="closeInteractionDetail()">✕</button>
    </div>

    <div class="inter-detail-form">
      <div>
        <label>Type d'interaction</label>
        <select id="inter-edit-type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.85rem;">
          ${typeOptions}
        </select>
      </div>

      <div>
        <label>Date & Heure</label>
        <input type="datetime-local" id="inter-edit-date" value="${dateVal}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.85rem;">
      </div>

      <div>
        <label>Contact</label>
        <select id="inter-edit-contact" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.85rem;">
          ${contactOptions}
        </select>
      </div>

      <div>
        <label>Assigné à</label>
        <select id="inter-edit-assignee" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.85rem;">
          ${assigneeOptions}
        </select>
      </div>

      <div>
        <label>Durée (min)</label>
        <input type="number" id="inter-edit-duree" value="${inter.duree || 0}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.85rem;">
      </div>

      <div>
        <label>Contenu</label>
        <textarea id="inter-edit-contenu" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.85rem; min-height: 100px; resize: vertical;">${escHtml(inter.contenu || '')}</textarea>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 16px;">
        <button id="btn-save-inter" class="btn-secondary" style="flex: 1;">💾 Enregistrer</button>
        <button id="btn-delete-inter" class="btn-danger" style="flex: 1;">🗑️ Supprimer</button>
        <button onclick="closeInteractionDetail()" style="flex: 1; background: #f3f4f6; border: 1px solid #d1d5db; padding: 10px; border-radius: 6px; cursor: pointer; font-family: inherit;">Fermer</button>
      </div>
    </div>
  `;

  document.getElementById('btn-save-inter').addEventListener('click', () => saveInteraction(inter.id));
  document.getElementById('btn-delete-inter').addEventListener('click', () => deleteInteraction(inter.id));

  modal.classList.add('open');
}

function closeInteractionDetail() {
  document.getElementById('inter-detail-overlay').classList.remove('open');
}

async function saveInteraction(interactionId) {
  const inter = allInteractions.find(i => i.id === interactionId);
  if (!inter) return;

  const newType    = document.getElementById('inter-edit-type').value;
  const newDate    = document.getElementById('inter-edit-date').value;
  const newContact = parseInt(document.getElementById('inter-edit-contact').value) || 0;
  const newAssignee= parseInt(document.getElementById('inter-edit-assignee').value) || 0;
  const newDuree   = parseInt(document.getElementById('inter-edit-duree').value) || 0;
  const newContenu = document.getElementById('inter-edit-contenu').value.trim();

  const dateTs = newDate
    ? Math.floor(new Date(newDate).getTime() / 1000)
    : inter.Date;

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        ['UpdateRecord', 'Interactions', interactionId, {
          type_interaction: newType,
          Date            : dateTs,
          contact         : newContact,
          Assigne         : newAssignee,
          duree           : newDuree,
          contenu         : newContenu,
        }]
      ]);
      showToast('✅ Interaction mise à jour !');
    } catch(err) {
      console.error(err);
      showToast('❌ Erreur lors de la mise à jour');
      return;
    }
  }

  inter.type_interaction = newType;
  inter.Date = dateTs;
  inter.contact = newContact;
  inter.Assigne = newAssignee;
  inter.duree = newDuree;
  inter.contenu = newContenu;
  resolveInteractionNames(inter);

  if (currentOpp) renderTimeline(currentOpp);
  closeInteractionDetail();
}

async function deleteInteraction(interactionId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette interaction ?')) return;

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        ['RemoveRecord', 'Interactions', interactionId]
      ]);
      showToast('✅ Interaction supprimée !');
    } catch(err) {
      console.error(err);
      showToast('❌ Erreur lors de la suppression');
      return;
    }
  }

  allInteractions = allInteractions.filter(i => i.id !== interactionId);
  if (currentOpp) renderTimeline(currentOpp);
  closeInteractionDetail();
}

// ════════════════════════════════════════════════════════
//  NAVIGATION ONGLETS
// ════════════════════════════════════════════════════════
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const view = tab.dataset.view;
    document.getElementById('kanban-view').style.display =
      view === 'opportunites' ? 'flex' : 'none';
    document.querySelectorAll('.placeholder-view').forEach(pv => pv.classList.remove('active'));
    if (view !== 'opportunites') {
      document.getElementById('view-' + view)?.classList.add('active');
    }
    closePanel();
  });
});

// ════════════════════════════════════════════════════════
//  ÉVÉNEMENTS UI
// ════════════════════════════════════════════════════════
document.getElementById('search-input').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  document.querySelectorAll('.opportunity-card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

document.getElementById('btn-new').addEventListener('click', () => {
  showToast('🚧 Formulaire de création — bientôt disponible !');
});

document.querySelectorAll('.add-card-btn').forEach(btn => {
  btn.addEventListener('click', () => showToast('🚧 Ajout rapide — bientôt disponible !'));
});

document.getElementById('close-panel').addEventListener('click', closePanel);
document.getElementById('overlay').addEventListener('click', closePanel);

document.getElementById('modal-cancel').addEventListener('click',  () => {
  document.getElementById('modal-overlay').classList.remove('open');
});

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('open');
  }
});

document.getElementById('btn-edit-fiche').addEventListener('click', () => {
  showToast('🚧 Édition fiche complète — bientôt disponible !');
});

// ════════════════════════════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════════════════════════════
function formatEuros(val) {
  if (!val) return '0 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  }).format(val);
}

function formatDate(d) {
  if (!d) return '—';
  const date = typeof d === 'number' ? new Date(d * 1000) : new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

function formatDatetime(d) {
  if (!d) return '—';
  const date = typeof d === 'number' ? new Date(d * 1000) : new Date(d);
  if (isNaN(date)) return String(d);
  return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }) +
    ' à ' + date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

function statusBg(statut) {
  return {
    Prospect       : '#eff6ff',
    'En discussion': '#fffbeb',
    Proposition    : '#f5f3ff',
    Gagné          : '#ecfdf5',
    Perdu          : '#fef2f2'
  }[statut] || '#f4f6fb';
}

function statusColor(statut) {
  return {
    Prospect       : '#2563eb',
    'En discussion': '#d97706',
    Proposition    : '#7c3aed',
    Gagné          : '#059669',
    Perdu          : '#dc2626'
  }[statut] || '#6b7280';
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}*/
