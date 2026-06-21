// ════════════════════════════════════════════════════════
//  CRM PUI — Université de Bordeaux
//  Widget Grist — JS principal
//  Version 0.4 — Juin 2026
// ════════════════════════════════════════════════════════

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

// Chargement table Annuaire
grist.docApi.fetchTable('Annuaire').then(data => {
  allContacts = data.id.map((id, i) => ({
    id,
    nom_prenom        : data.nom_prenom?.[i]         || '',
    Nom               : data.Nom?.[i]                || '',
    Prenom            : data.Prenom?.[i]             || '',
    email_perso       : data.email_perso?.[i]        || '',
    Email_fonctionnel : data.Email_fonctionnel?.[i]  || '',
    numero_pro        : data.numero_pro?.[i]         || '',
    Poste             : data.Poste?.[i]              || '',
    Structure         : data.Structure?.[i]          || 0,
  }));
  console.log('✅ Annuaire chargé:', allContacts.length, 'contacts');
}).catch(e => console.warn('Annuaire non chargé', e));

// Chargement table Entreprise
grist.docApi.fetchTable('Entreprise').then(data => {
  allEntreprises = data.id.map((id, i) => ({
    id,
    Nom     : data.Nom?.[i]      || '',
    Secteur : data.Secteur?.[i]  || '',
    taille  : data.taille?.[i]   || '',
    site_web_: data.site_web_?.[i] || '',
    Ville   : data.Ville?.[i]    || '',
  }));
  console.log('✅ Entreprises chargées:', allEntreprises.length);
}).catch(e => console.warn('Entreprise non chargé', e));

// Chargement table Opportunites
grist.docApi.fetchTable('Opportunites').then(data => {
  allOpportunites = data.id.map((id, i) => normalizeOpp({
    id,
    titre               : data.titre?.[i]                || '',
    statut              : data.statut?.[i]               || 'Prospect',
    Priorite            : data.Priorite?.[i]             || 'Moyenne',
    valeur_estilmee     : data.valeur_estilmee?.[i]      || 0,
    date_closing_estimee: data.date_closing_estimee?.[i] || '',
    description         : data.description?.[i]          || '',
    Entreprise          : data.Entreprise?.[i]           || 0,
    contact_principale  : data.contact_principale?.[i]   || 0,
    assignee_a          : data.assignee_a?.[i]           || 0,
  }));
  enrichOpps();
  gristReady = true;
  renderKanban();
  console.log('✅ Opportunites chargées:', allOpportunites.length);
}).catch(e => console.warn('Opportunites non chargé', e));

// Chargement table Interactions
grist.docApi.fetchTable('Interactions').then(data => {
  allInteractions = data.id.map((id, i) => ({
    id,
    type_interaction: data.type_interaction?.[i] || 'Note',
    Date            : data.Date?.[i]              || 0,
    contact         : data.contact?.[i]           || 0,
    Opportunite     : data.Opportunite?.[i]       || 0,
    Assigne         : data.Assigne?.[i]           || 0,
    contenu         : data.contenu?.[i]           || '',
    duree           : data.duree?.[i]             || 0,
  }));
  allInteractions.forEach(i => resolveInteractionNames(i));
  console.log('✅ Interactions chargées:', allInteractions.length);
}).catch(e => console.warn('Interactions non chargé', e));

// ════════════════════════════════════════════════════════
//  NORMALISATION & ENRICHISSEMENT
// ════════════════════════════════════════════════════════
function normalizeOpp(r) {
  return {
    id                  : r.id,
    titre               : r.titre               || '(Sans titre)',
    statut              : r.statut              || 'Prospect',
    Priorite            : r.Priorite            || 'Moyenne',
    valeur_estilmee     : r.valeur_estilmee     || 0,
    date_closing_estimee: r.date_closing_estimee|| '',
    description         : r.description         || '',
    Entreprise          : r.Entreprise          || 0,
    contact_principale  : r.contact_principale  || 0,
    assignee_a          : r.assignee_a          || 0,
    _entrepriseNom      : '',
    _contactNom         : '',
    _assigneeNom        : '',
  };
}

function enrichOpps() {
  allOpportunites.forEach(opp => {
    const ent = allEntreprises.find(e => e.id === opp.Entreprise);
    opp._entrepriseNom = ent ? ent.Nom : (opp.Entreprise ? '(' + opp.Entreprise + ')' : '—');

    const contact = allContacts.find(c => c.id === opp.contact_principale);
    opp._contactNom = contact
      ? (contact.nom_prenom || (contact.Prenom + ' ' + contact.Nom).trim())
      : (opp.contact_principale ? '(' + opp.contact_principale + ')' : '—');

    const assignee = allContacts.find(c => c.id === opp.assignee_a);
    opp._assigneeNom = assignee
      ? (assignee.nom_prenom || (assignee.Prenom + ' ' + assignee.Nom).trim())
      : (opp.assignee_a ? '(' + opp.assignee_a + ')' : '—');
  });
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

  return inter;
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

  const statusBgColor = statusBg(opp.statut);
  const statusTextColor = statusColor(opp.statut);

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

  card.addEventListener('click', () => openPanelEdit(opp));

  card.querySelectorAll('.card-action').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openQuickActionModal(btn.dataset.action, opp);
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
      } else {
        showToast(`✅ Déplacé vers "${newStatut}"`);
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

  renderPanelEdit(opp);
  renderTimeline(opp);

  document.getElementById('side-panel').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
  currentOpp = null;
}

function renderPanelEdit(opp) {
  const statutOptions = STATUTS.map(s =>
    `<option value="${s}" ${s === opp.statut ? 'selected' : ''}>${s}</option>`
  ).join('');

  const prioriteOptions = ['Haute','Moyenne','Basse'].map(p =>
    `<option value="${p}" ${p === opp.Priorite ? 'selected' : ''}>${p}</option>`
  ).join('');

  const entrepriseOptions = allEntreprises.map(e =>
    `<option value="${e.id}" ${e.id == opp.Entreprise ? 'selected' : ''}>${e.Nom}</option>`
  ).join('');

  const contactOptions = allContacts.map(c => {
    const nom = c.nom_prenom || (c.Prenom + ' ' + c.Nom).trim();
    return `<option value="${c.id}" ${c.id == opp.contact_principale ? 'selected' : ''}>${nom}</option>`;
  }).join('');

  const assigneeOptions = allContacts.map(c => {
    const nom = c.nom_prenom || (c.Prenom + ' ' + c.Nom).trim();
    return `<option value="${c.id}" ${c.id == opp.assignee_a ? 'selected' : ''}>${nom}</option>`;
  }).join('');

  const closingVal = opp.date_closing_estimee
    ? (typeof opp.date_closing_estimee === 'number'
        ? new Date(opp.date_closing_estimee * 1000).toISOString().slice(0,10)
        : String(opp.date_closing_estimee).slice(0,10))
    : '';

  const panelContent = document.getElementById('panel-content');
  panelContent.innerHTML = `
    <div class="panel-section">
      <div class="panel-section-title">Éditer la fiche</div>
      <div>
        <label>Titre</label>
        <input type="text" id="edit-titre" value="${escHtml(opp.titre)}">
      </div>
      <div>
        <label>Entreprise</label>
        <select id="edit-entreprise">${entrepriseOptions}</select>
      </div>
      <div>
        <label>Contact principal</label>
        <select id="edit-contact">${contactOptions}</select>
      </div>
      <div>
        <label>Statut</label>
        <select id="edit-statut">${statutOptions}</select>
      </div>
      <div>
        <label>Priorité</label>
        <select id="edit-priorite">${prioriteOptions}</select>
      </div>
      <div>
        <label>Valeur estimée (€)</label>
        <input type="number" id="edit-valeur" value="${opp.valeur_estilmee || 0}">
      </div>
      <div>
        <label>Date de closing estimée</label>
        <input type="date" id="edit-closing" value="${closingVal}">
      </div>
      <div>
        <label>Assigné à</label>
        <select id="edit-assignee">${assigneeOptions}</select>
      </div>
      <div>
        <label>Description</label>
        <textarea id="edit-description" style="min-height: 80px;">${escHtml(opp.description)}</textarea>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 14px;">
        <button id="btn-save-fiche" style="flex: 1; background: #10b981; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600;">
          💾 Enregistrer
        </button>
        <button id="btn-cancel-edit" style="flex: 1; background: #ef4444; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600;">
          ✕ Annuler
        </button>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Actions directes</div>
      <div class="quick-actions">
        <div class="quick-action phone" onclick="showCallNumber()" style="cursor: pointer;">
          <div class="icon">📞</div><span>Appel</span>
        </div>
        <div class="quick-action email" onclick="openEmailLink()" style="cursor: pointer;">
          <div class="icon">📧</div><span>Email</span>
        </div>
        <div class="quick-action contact" onclick="openAddContactModal()" style="cursor: pointer;">
          <div class="icon">👥</div><span>+ Contact</span>
        </div>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Logger une interaction</div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 6px;">
            Type d'interaction
          </label>
          <select id="interaction-type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.85rem;">
            <option value="Appel">📞 Appel</option>
            <option value="Email">📧 Email</option>
            <option value="Note">📝 Note</option>
            <option value="Réunion">📅 Réunion</option>
          </select>
        </div>
        <div>
          <label style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 6px;">
            Contenu
          </label>
          <textarea id="interaction-content" placeholder="Décrivez l'interaction..." 
            style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 0.85rem; min-height: 70px; resize: vertical;"></textarea>
        </div>
        <button id="btn-log-interaction" style="background: #2563eb; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: inherit;">
          ✅ Logger l'interaction
        </button>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Timeline</div>
      <div id="timeline-container"></div>
    </div>
  `;

  document.getElementById('btn-save-fiche').addEventListener('click',  () => saveFiche(opp));
  document.getElementById('btn-cancel-edit').addEventListener('click', () => closePanel());
  document.getElementById('btn-log-interaction').addEventListener('click', () => logInteractionFromPanel());
}

function renderTimeline(opp) {
  const interactions = allInteractions.filter(i => i.Opportunite === opp.id);
  const timeline = document.getElementById('timeline-container');
  if (!timeline) return;

  const items = interactions.sort((a, b) => (b.Date || 0) - (a.Date || 0));

  timeline.innerHTML = items.map(item => `
    <div class="timeline-item" data-inter-id="${item.id}" style="cursor: pointer;">
      <div class="timeline-dot">${INTERACTION_ICONS[item.type_interaction] || '💬'}</div>
      <div class="timeline-content">
        <div class="timeline-title">
          ${item.type_interaction}
          ${item.duree ? ' — ' + item.duree + ' min' : ''}
        </div>
        <div class="timeline-body">${item.contenu}</div>
        <div class="timeline-date">
          ${formatDatetime(item.Date)}
          ${item._assigneeNom !== '—' ? ' · ' + item._assigneeNom : ''}
          ${item._contactNom  !== '—' ? ' · ' + item._contactNom  : ''}
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

async function saveFiche(opp) {
  const newTitre      = document.getElementById('edit-titre').value.trim();
  const newEntreprise = parseInt(document.getElementById('edit-entreprise').value) || 0;
  const newContact    = parseInt(document.getElementById('edit-contact').value)    || 0;
  const newStatut     = document.getElementById('edit-statut').value;
  const newPriorite   = document.getElementById('edit-priorite').value;
  const newValeur     = parseFloat(document.getElementById('edit-valeur').value)   || 0;
  const newClosing    = document.getElementById('edit-closing').value;
  const newAssignee   = parseInt(document.getElementById('edit-assignee').value)   || 0;
  const newDesc       = document.getElementById('edit-description').value.trim();

  const closingTs = newClosing
    ? Math.floor(new Date(newClosing).getTime() / 1000)
    : null;

  const fields = {
    titre               : newTitre,
    Entreprise          : newEntreprise,
    contact_principale  : newContact,
    statut              : newStatut,
    Priorite            : newPriorite,
    valeur_estilmee     : newValeur,
    date_closing_estimee: closingTs,
    assignee_a          : newAssignee,
    description         : newDesc,
  };

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        ['UpdateRecord', 'Opportunites', opp.id, fields]
      ]);
      showToast('✅ Fiche enregistrée !');
    } catch(err) {
      console.error(err);
      showToast('❌ Erreur lors de la sauvegarde');
      return;
    }
  } else {
    showToast('✅ Fiche enregistrée (démo)');
  }

  opp.titre                = newTitre;
  opp.Entreprise           = newEntreprise;
  opp.contact_principale   = newContact;
  opp.statut               = newStatut;
  opp.Priorite             = newPriorite;
  opp.valeur_estilmee      = newValeur;
  opp.date_closing_estimee = newClosing;
  opp.assignee_a           = newAssignee;
  opp.description          = newDesc;

  enrichOpps();
  renderKanban();
  renderPanelEdit(opp);
  renderTimeline(opp);
}

// ════════════════════════════════════════════════════════
//  ACTIONS RAPIDES
// ════════════════════════════════════════════════════════

function showCallNumber() {
  if (!currentOpp) return;
  
  const contact = allContacts.find(c => c.id === currentOpp.contact_principale);
  if (!contact) {
    showToast('❌ Aucun contact assigné');
    return;
  }

  const phone = contact.numero_pro || contact.email_perso || '';
  if (!phone) {
    showToast('❌ Aucun numéro pour ce contact');
    return;
  }
  
  navigator.clipboard.writeText(phone).then(() => {
    showToast(`📞 ${phone} (copié)`);
  });
  
  window.location.href = `tel:${phone}`;
  
  logInteractionDirect('Appel', contact.id, `Appel vers ${phone}`);
}

function openEmailLink() {
  if (!currentOpp) return;
  
  const contact = allContacts.find(c => c.id === currentOpp.contact_principale);
  if (!contact) {
    showToast('❌ Aucun contact assigné');
    return;
  }

  const email = contact.Email_fonctionnel || contact.email_perso || '';
  if (!email) {
    showToast('❌ Aucun email pour ce contact');
    return;
  }
  
  const subject = `CRM PUI - ${currentOpp.titre || 'Opportunité'}`;
  const body = `Bonjour,\n\nJe vous contacte concernant votre opportunité.\n\nCordialement`;
  
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
  
  logInteractionDirect('Email', contact.id, `Email envoyé à ${email}`);
}

function openAddContactModal() {
  if (!currentOpp) return;
  
  const modal = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  
  modalTitle.textContent = '👥 Ajouter un contact à l\'opportunité';
  
  const selectHTML = `
    <label style="font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 6px;">
      Contact à ajouter *
    </label>
    <select id="add-contact-select" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; margin-bottom: 14px;">
      <option value="">-- Sélectionner --</option>
      ${allContacts.map(c => {
        const nom = c.nom_prenom || `${c.Prenom || ''} ${c.Nom || ''}`.trim();
        return `<option value="${c.id}">${nom}</option>`;
      }).join('')}
    </select>
  `;
  
  const modalContent = document.querySelector('.modal');
  modalContent.innerHTML = selectHTML;
  
  document.getElementById('modal-confirm').textContent = '✅ Ajouter';
  document.getElementById('modal-confirm').onclick = async () => {
    const contactId = document.getElementById('add-contact-select').value;
    if (!contactId) {
      showToast('❌ Veuillez sélectionner un contact');
      return;
    }
    
    await addContactToOpportunity(currentOpp.id, parseInt(contactId));
    modal.classList.remove('open');
  };
  
  document.getElementById('modal-cancel').textContent = '✕ Annuler';
  document.getElementById('modal-cancel').onclick = () => {
    modal.classList.remove('open');
  };
  
  modal.classList.add('open');
}

async function addContactToOpportunity(oppId, contactId) {
  try {
    let opp = allOpportunites.find(o => o.id === oppId);
    if (!opp) return;
    
    // Remplacer le contact principal pour l'instant
    if (gristReady) {
      await grist.docApi.applyUserActions([
        ['UpdateRecord', 'Opportunites', oppId, {
          'contact_principale': contactId
        }]
      ]);
    }
    
    opp.contact_principale = contactId;
    enrichOpps();
    renderKanban();
    renderPanelEdit(opp);
    showToast('✅ Contact ajouté');
  } catch (err) {
    console.error('Erreur:', err);
    showToast('❌ Erreur');
  }
}

function logInteractionFromPanel() {
  if (!currentOpp) {
    showToast('❌ Aucune opportunité sélectionnée');
    return;
  }
  
  const type = document.getElementById('interaction-type').value;
  const content = document.getElementById('interaction-content').value.trim();
  
  if (!content) {
    showToast('⚠️ Veuillez remplir le contenu');
    return;
  }
  
  logInteractionDirect(type, currentOpp.contact_principale, content);
  
  document.getElementById('interaction-content').value = '';
  renderTimeline(currentOpp);
  showToast('✅ Interaction enregistrée');
}

async function logInteractionDirect(type, contactId, content) {
  const nowTs = Math.floor(Date.now() / 1000);
  
  const interaction = {
    id              : Date.now(),
    type_interaction: type,
    Date            : nowTs,
    contact         : contactId || 0,
    Opportunite     : currentOpp?.id || 0,
    Assigne         : currentOpp?.assignee_a || 0,
    contenu         : content,
    duree           : 0,
  };

  allInteractions.unshift(interaction);

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['AddRecord', 'Interactions', null, {
        type_interaction: type,
        Date            : nowTs,
        contact         : contactId || 0,
        Opportunite     : currentOpp?.id || 0,
        Assigne         : currentOpp?.assignee_a || 0,
        contenu         : content,
        duree           : 0,
      }]]);
    } catch(err) {
      console.error('Interaction non sauvegardée', err);
      showToast('❌ Erreur lors de l\'enregistrement');
    }
  }
}

// ════════════════════════════════════════════════════════
//  MODAL DÉTAIL INTERACTION
// ════════════════════════════════════════════════════════
function openInteractionDetail(interactionId) {
  const inter = allInteractions.find(i => i.id === interactionId);
  if (!inter) return;

  const dateVal = typeof inter.Date === 'number' 
    ? new Date(inter.Date * 1000).toISOString().slice(0, 16)
    : String(inter.Date).slice(0, 16);

  const contactOptions = allContacts.map(c => {
    const nom = c.nom_prenom || (c.Prenom + ' ' + c.Nom).trim();
    return `<option value="${c.id}" ${c.id == inter.contact ? 'selected' : ''}>${nom}</option>`;
  }).join('');

  const assigneeOptions = allContacts.map(c => {
    const nom = c.nom_prenom || (c.Prenom + ' ' + c.Nom).trim();
    return `<option value="${c.id}" ${c.id == inter.Assigne ? 'selected' : ''}>${nom}</option>`;
  }).join('');

  const typeOptions = ['Appel', 'Email', 'Note', 'Réunion'].map(t =>
    `<option value="${t}" ${t === inter.type_interaction ? 'selected' : ''}>${t}</option>`
  ).join('');

  const overlay = document.getElementById('inter-detail-overlay');
  const modal = document.getElementById('inter-detail-modal');

  modal.innerHTML = `
    <div class="detail-header">
      <h2>${INTERACTION_ICONS[inter.type_interaction] || '💬'} ${inter.type_interaction}</h2>
      <button style="background: none; border: none; font-size: 1.5rem; cursor: pointer;" onclick="closeInteractionDetail()">✕</button>
    </div>
    <div class="detail-body">
      <div class="detail-item">
        <span class="detail-label">Type</span>
        <select class="detail-input" id="inter-edit-type">${typeOptions}</select>
      </div>
      
      <div class="detail-item">
        <span class="detail-label">Date & Heure</span>
        <input type="datetime-local" class="detail-input" id="inter-edit-date" value="${dateVal}">
      </div>
      
      <div class="detail-item">
        <span class="detail-label">Contact</span>
        <select class="detail-input" id="inter-edit-contact">${contactOptions}</select>
      </div>
      
      <div class="detail-item">
        <span class="detail-label">Assigné à</span>
        <select class="detail-input" id="inter-edit-assignee">${assigneeOptions}</select>
      </div>
      
      <div class="detail-item">
        <span class="detail-label">Durée (min)</span>
        <input type="number" class="detail-input" id="inter-edit-duree" value="${inter.duree || 0}">
      </div>
      
      <div class="detail-item detail-full">
        <span class="detail-label">Contenu</span>
        <textarea class="detail-input detail-textarea" id="inter-edit-contenu">${escHtml(inter.contenu || '')}</textarea>
      </div>
      
      <div class="detail-item detail-full detail-actions">
        <button class="btn-save" id="btn-save-inter">💾 Enregistrer</button>
        <button class="btn-secondary" id="btn-duplicate-inter">📋 Dupliquer</button>
        <button class="btn-danger" id="btn-delete-inter">🗑️ Supprimer</button>
        <button class="btn-cancel-edit" id="btn-cancel-inter">✕ Fermer</button>
      </div>
    </div>
  `;

  document.getElementById('btn-save-inter').addEventListener('click', () => saveInteractionDetail(inter));
  document.getElementById('btn-duplicate-inter').addEventListener('click', () => duplicateInteraction(inter));
  document.getElementById('btn-delete-inter').addEventListener('click', () => deleteInteraction(inter.id));
  document.getElementById('btn-cancel-inter').addEventListener('click', closeInteractionDetail);

  overlay.classList.add('open');
}

function closeInteractionDetail() {
  document.getElementById('inter-detail-overlay').classList.remove('open');
}

async function saveInteractionDetail(inter) {
  const newType     = document.getElementById('inter-edit-type').value;
  const newDate     = document.getElementById('inter-edit-date').value;
  const newContact  = parseInt(document.getElementById('inter-edit-contact').value) || 0;
  const newAssignee = parseInt(document.getElementById('inter-edit-assignee').value) || 0;
  const newDuree    = parseInt(document.getElementById('inter-edit-duree').value)    || 0;
  const newContenu  = document.getElementById('inter-edit-contenu').value.trim();

  const newDateTs = Math.floor(new Date(newDate).getTime() / 1000);

  const fields = {
    type_interaction: newType,
    Date            : newDateTs,
    contact         : newContact,
    Assigne         : newAssignee,
    duree           : newDuree,
    contenu         : newContenu,
  };

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        ['UpdateRecord', 'Interactions', inter.id, fields]
      ]);
      showToast('✅ Interaction mise à jour !');
    } catch(err) {
      console.error(err);
      showToast('❌ Erreur lors de la mise à jour');
      return;
    }
  }

  Object.assign(inter, fields);
  if (currentOpp) renderTimeline(currentOpp);
  closeInteractionDetail();
}

async function duplicateInteraction(inter) {
  const nowTs = Math.floor(Date.now() / 1000);

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['AddRecord', 'Interactions', null, {
        type_interaction: inter.type_interaction,
        Date            : nowTs,
        contact         : inter.contact,
        Opportunite     : inter.Opportunite,
        Assigne         : inter.Assigne,
        contenu         : inter.contenu + ' [COPIE]',
        duree           : inter.duree,
      }]]);
      showToast('✅ Interaction dupliquée !');
    } catch(err) {
      console.error(err);
      showToast('❌ Erreur lors de la duplication');
      return;
    }
  }

  if (currentOpp) renderTimeline(currentOpp);
  closeInteractionDetail();
}

async function deleteInteraction(interactionId) {
  if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer cette interaction ?')) return;

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
  return String(str)
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
}
function openQuickActionModal(type, opp = null) {
  if (!opp && !currentOpp) return;
  
  currentOpp = opp || currentOpp;
  currentActionType = type;

  const icons = { 'Appel':'📞', 'Email':'📧', 'Note':'📝', 'Réunion':'📅' };
  document.getElementById('modal-title').textContent = 
    `${icons[type] || '📝'} ${type} — ${currentOpp._entrepriseNom}`;
  
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

function openAddContactToOpp() {
  if (!currentOpp) return;
  showToast('🚧 Ajout de contact — bientôt disponible !');
}

function callContact() {
  if (!currentOpp) return;
  const contact = allContacts.find(c => c.id === currentOpp.contact_principale);
  if (!contact || !contact.numero_pro) {
    showToast('❌ Aucun numéro pour ce contact');
    return;
  }
  showToast(`📞 Numéro : ${contact.numero_pro}`);
}

function sendEmail() {
  if (!currentOpp) return;
  const contact = allContacts.find(c => c.id === currentOpp.contact_principale);
  if (!contact || !contact.Email_fonctionnel) {
    showToast('❌ Aucun email pour ce contact');
    return;
  }
  showToast(`📧 Email : ${contact.Email_fonctionnel}`);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}
