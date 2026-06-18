// ════════════════════════════════════════════════════════
//  CRM PUI — Université de Bordeaux
//  Widget Grist — JS principal
//  Version 0.2 — Juin 2026
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

// ── Données de démo ───────────────────────────────────────
const DEMO_OPPS = [
  { id:1, titre:'Partenariat R&D',       _entrepriseNom:'Nova Tech SAS',      _contactNom:'Marie Dupont',   statut:'Prospect',      Priorite:'Haute',   valeur_estilmee:12000, date_closing_estimee:'2026-09-01', _assigneeNom:'Jean BD',    description:'Collaboration sur projet IA.' },
  { id:2, titre:'Formation innovation',  _entrepriseNom:'Innovate Solutions',  _contactNom:'Thomas Leroy',   statut:'Prospect',      Priorite:'Moyenne', valeur_estilmee:5500,  date_closing_estimee:'2026-08-15', _assigneeNom:'Claire CHAF',description:'Programme 6 mois.' },
  { id:3, titre:'Licence technologique', _entrepriseNom:'Groupe Leclerc',      _contactNom:'Pierre Moreau',  statut:'En discussion', Priorite:'Haute',   valeur_estilmee:18000, date_closing_estimee:'2026-07-30', _assigneeNom:'Jean BD',    description:'Transfert de licence brevet.' },
  { id:4, titre:'Accompagnement startup',_entrepriseNom:'StartX',              _contactNom:'Lucie Bernard',  statut:'En discussion', Priorite:'Moyenne', valeur_estilmee:8000,  date_closing_estimee:'2026-08-01', _assigneeNom:'Claire CHAF',description:'Suivi incubation 12 mois.' },
  { id:5, titre:'Contrat de recherche',  _entrepriseNom:'BioLab Corp',         _contactNom:'Sophie Martin',  statut:'Proposition',   Priorite:'Haute',   valeur_estilmee:35000, date_closing_estimee:'2026-07-15', _assigneeNom:'Jean BD',    description:'Contrat pluriannuel.' },
  { id:6, titre:'Prestation conseil',    _entrepriseNom:'EcoGreen SARL',       _contactNom:'Nicolas Petit',  statut:'Proposition',   Priorite:'Basse',   valeur_estilmee:7000,  date_closing_estimee:'2026-09-30', _assigneeNom:'Claire CHAF',description:'Conseil transition écologique.' },
  { id:7, titre:'Transfert technologique',_entrepriseNom:'Finance & Co',       _contactNom:'Laurent Blanc',  statut:'Gagné',         Priorite:'Haute',   valeur_estilmee:25000, date_closing_estimee:'2026-06-01', _assigneeNom:'Jean BD',    description:'Transfert finalisé.' },
  { id:8, titre:'Formation continue',    _entrepriseNom:'Boulangerie Durand',  _contactNom:'Marie Leblanc',  statut:'Gagné',         Priorite:'Moyenne', valeur_estilmee:4200,  date_closing_estimee:'2026-05-30', _assigneeNom:'Claire CHAF',description:'Formation managers.' },
  { id:9, titre:'Expertise technique',   _entrepriseNom:'Architex Construct',  _contactNom:'Frédéric Müller',statut:'Perdu',         Priorite:'Basse',   valeur_estilmee:8500,  date_closing_estimee:'2026-04-01', _assigneeNom:'Jean BD',    description:'Budget non validé.' },
];

const DEMO_INTERACTIONS = [
  { id:1, type_interaction:'Appel',  Date:'2026-06-17T14:30:00', _contactNom:'Pierre Moreau', Opportunite:3, _assigneeNom:'Jean BD',    contenu:'Appel de suivi, client positif.', duree:15 },
  { id:2, type_interaction:'Email',  Date:'2026-06-16T10:15:00', _contactNom:'Pierre Moreau', Opportunite:3, _assigneeNom:'Jean BD',    contenu:'Envoi du devis détaillé V2.',     duree:0  },
  { id:3, type_interaction:'Note',   Date:'2026-06-14T09:00:00', _contactNom:'Pierre Moreau', Opportunite:3, _assigneeNom:'Jean BD',    contenu:'Client intéressé par option premium.', duree:0 },
];

const INTERACTION_ICONS = { Appel:'📞', Email:'📧', Note:'📝', Réunion:'📅' };
const STATUTS = ['Prospect','En discussion','Proposition','Gagné','Perdu'];

// ── Init Grist ────────────────────────────────────────────
grist.ready({ requiredAccess: 'full', allowSelectBy: true });

// Chargement table Annuaire
grist.docApi.fetchTable('Annuaire').then(data => {
  allContacts = data.id.map((id, i) => ({
    id,
    nom_prenom : data.nom_prenom?.[i] || '',
    Nom        : data.Nom?.[i]        || '',
    Prenom     : data.Prenom?.[i]     || '',
    email_perso: data.email_perso?.[i]|| '',
    Email_fonctionnel: data.Email_fonctionnel?.[i] || '',
    numero_pro : data.numero_pro?.[i] || '',
    Poste      : data.Poste?.[i]      || '',
    Structure  : data.Structure?.[i]  || 0,
  }));
}).catch(e => console.warn('Annuaire non chargé', e));

// Chargement table Entreprise
grist.docApi.fetchTable('Entreprise').then(data => {
  allEntreprises = data.id.map((id, i) => ({
    id,
    Nom    : data.Nom?.[i]     || '',
    Secteur: data.Secteur?.[i] || '',
    taille : data.taille?.[i]  || '',
    site_web_: data.site_web_?.[i] || '',
    Ville  : data.Ville?.[i]   || 0,
  }));
}).catch(e => console.warn('Entreprise non chargé', e));

// Chargement table Interactions
grist.docApi.fetchTable('Interactions').then(data => {
  allInteractions = data.id.map((id, i) => ({
    id,
    type_interaction: data.type_interaction?.[i] || '',
    Date     : data.Date?.[i]      || '',
    contact  : data.contact?.[i]   || 0,
    Opportunite: data.Opportunite?.[i] || 0,
    Assigne  : data.Assigne?.[i]   || 0,
    contenu  : data.contenu?.[i]   || '',
    duree    : data.duree?.[i]     || 0,
  }));
}).catch(e => console.warn('Interactions non chargé', e));

// Chargement table Opportunites (principal)
grist.onRecords(records => {
  if (records && records.length > 0) {
    gristReady = true;
    allOpportunites = records.map(r => normalizeOpp(r));
    enrichOpps();
    renderKanban();
  } else {
    // Mode démo
    allOpportunites = DEMO_OPPS;
    allInteractions = DEMO_INTERACTIONS;
    renderKanban();
  }
});

// ── Normalisation champs Grist → noms internes ───────────
function normalizeOpp(r) {
  return {
    id                 : r.id,
    titre              : r.titre              || '(Sans titre)',
    statut             : r.statut             || 'Prospect',
    Priorite           : r.Priorite           || 'Moyenne',
    valeur_estilmee    : r.valeur_estilmee    || 0,
    date_closing_estimee: r.date_closing_estimee || '',
    description        : r.description        || '',
    // References (IDs)
    Entreprise         : r.Entreprise         || 0,
    contact_principale : r.contact_principale || 0,
    assignee_a         : r.assignee_a         || 0,
    // Noms résolus (remplis par enrichOpps)
    _entrepriseNom     : '',
    _contactNom        : '',
    _assigneeNom       : '',
  };
}

// ── Résolution des References ─────────────────────────────
function enrichOpps() {
  allOpportunites.forEach(opp => {
    const ent = allEntreprises.find(e => e.id === opp.Entreprise);
    opp._entrepriseNom = ent ? ent.Nom : '(Entreprise #' + opp.Entreprise + ')';

    const contact = allContacts.find(c => c.id === opp.contact_principale);
    opp._contactNom = contact
      ? (contact.nom_prenom || (contact.Prenom + ' ' + contact.Nom).trim())
      : (opp.contact_principale ? '(Contact #' + opp.contact_principale + ')' : '—');

    const assignee = allContacts.find(c => c.id === opp.assignee_a);
    opp._assigneeNom = assignee
      ? (assignee.nom_prenom || (assignee.Prenom + ' ' + assignee.Nom).trim())
      : (opp.assignee_a ? '(Agent #' + opp.assignee_a + ')' : '—');
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

// ── Rendu Kanban ──────────────────────────────────────────
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

// ── Création carte ────────────────────────────────────────
function createCard(opp) {
  const card = document.createElement('div');
  card.className  = 'opportunity-card';
  card.draggable  = true;
  card.dataset.id = opp.id;

  const dateRel = opp.date_closing_estimee
    ? '🎯 ' + formatDate(opp.date_closing_estimee)
    : '';

  card.innerHTML = `
    <div class="card-company">${opp._entrepriseNom}</div>
    <div class="card-title">${opp.titre}</div>
    <div class="card-contact">👤 ${opp._contactNom}</div>
    <div class="card-meta">
      <div class="card-amount">${formatEuros(opp.valeur_estilmee)}</div>
      <div class="card-priority priority-${opp.Priorite}">${opp.Priorite}</div>
    </div>
    <div class="card-footer">
      <div class="card-actions">
        <button class="card-action" data-action="Appel"   title="Appel">📞</button>
        <button class="card-action" data-action="Email"   title="Email">📧</button>
        <button class="card-action" data-action="Note"    title="Note">📝</button>
        <button class="card-action" data-action="Réunion" title="Réunion">📅</button>
      </div>
      <div class="card-date">${dateRel}</div>
    </div>
  `;

  card.addEventListener('click', e => {
    if (!e.target.closest('.card-action')) openPanel(opp);
  });

  card.querySelectorAll('.card-action').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openModal(btn.dataset.action, opp);
    });
  });

  return card;
}

// ── Drag & Drop ───────────────────────────────────────────
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
        showToast(`✅ Déplacé vers "${newStatut}" (démo)`);
      }
    });
  });
}

// ── Side Panel ────────────────────────────────────────────
function openPanel(opp) {
  currentOpp = opp;

  document.getElementById('panel-company').textContent  = opp._entrepriseNom;
  document.getElementById('panel-contact').textContent  = '👤 ' + opp._contactNom;

  const statusEl = document.getElementById('panel-status');
  statusEl.textContent       = opp.statut;
  statusEl.style.background  = statusBg(opp.statut);
  statusEl.style.color       = statusColor(opp.statut);

  document.getElementById('panel-amount').textContent = formatEuros(opp.valeur_estilmee);

  renderPanelDetails(opp);
  renderTimeline(opp);

  document.getElementById('side-panel').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
}

function renderPanelDetails(opp) {
  // Mode lecture par défaut
  document.getElementById('panel-details').innerHTML = `
    <div class="detail-item">
      <span class="detail-label">Titre</span>
      <span class="detail-value" id="dv-titre">${opp.titre}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Entreprise</span>
      <span class="detail-value" id="dv-entreprise">${opp._entrepriseNom}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Contact principal</span>
      <span class="detail-value" id="dv-contact">${opp._contactNom}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Statut</span>
      <span class="detail-value" id="dv-statut">${opp.statut}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Priorité</span>
      <span class="detail-value" id="dv-priorite">${opp.Priorite}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Valeur estimée</span>
      <span class="detail-value" id="dv-valeur">${formatEuros(opp.valeur_estilmee)}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Closing estimé</span>
      <span class="detail-value" id="dv-closing">${formatDate(opp.date_closing_estimee)}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Assigné à</span>
      <span class="detail-value" id="dv-assignee">${opp._assigneeNom}</span>
    </div>
    <div class="detail-item detail-full">
      <span class="detail-label">Description</span>
      <span class="detail-value" id="dv-description">${opp.description || '—'}</span>
    </div>
  `;
}

function renderPanelEdit(opp) {
  // Listes pour les selects
  const statutOptions = STATUTS.map(s =>
    `<option value="${s}" ${s === opp.statut ? 'selected' : ''}>${s}</option>`
  ).join('');

  const prioriteOptions = ['Haute','Moyenne','Basse'].map(p =>
    `<option value="${p}" ${p === opp.Priorite ? 'selected' : ''}>${p}</option>`
  ).join('');

  const contactOptions = allContacts.map(c => {
    const nom = c.nom_prenom || (c.Prenom + ' ' + c.Nom).trim();
    return `<option value="${c.id}" ${c.id === opp.contact_principale ? 'selected' : ''}>${nom}</option>`;
  }).join('');

  const entrepriseOptions = allEntreprises.map(e =>
    `<option value="${e.id}" ${e.id === opp.Entreprise ? 'selected' : ''}>${e.Nom}</option>`
  ).join('');

  const assigneeOptions = allContacts.map(c => {
    const nom = c.nom_prenom || (c.Prenom + ' ' + c.Nom).trim();
    return `<option value="${c.id}" ${c.id === opp.assignee_a ? 'selected' : ''}>${nom}</option>`;
  }).join('');

  // Date ISO → input[type=date]
  const closingVal = opp.date_closing_estimee
    ? (typeof opp.date_closing_estimee === 'number'
        ? new Date(opp.date_closing_estimee * 1000).toISOString().slice(0,10)
        : String(opp.date_closing_estimee).slice(0,10))
    : '';

  document.getElementById('panel-details').innerHTML = `
    <div class="detail-item">
      <span class="detail-label">Titre</span>
      <input class="detail-input" id="edit-titre" value="${escHtml(opp.titre)}">
    </div>
    <div class="detail-item">
      <span class="detail-label">Entreprise</span>
      <select class="detail-input" id="edit-entreprise">
        <option value="0">— Choisir —</option>
        ${entrepriseOptions}
      </select>
    </div>
    <div class="detail-item">
      <span class="detail-label">Contact principal</span>
      <select class="detail-input" id="edit-contact">
        <option value="0">— Choisir —</option>
        ${contactOptions}
      </select>
    </div>
    <div class="detail-item">
      <span class="detail-label">Statut</span>
      <select class="detail-input" id="edit-statut">
        ${statutOptions}
      </select>
    </div>
    <div class="detail-item">
      <span class="detail-label">Priorité</span>
      <select class="detail-input" id="edit-priorite">
        ${prioriteOptions}
      </select>
    </div>
    <div class="detail-item">
      <span class="detail-label">Valeur estimée (€)</span>
      <input class="detail-input" type="number" id="edit-valeur" value="${opp.valeur_estilmee || 0}">
    </div>
    <div class="detail-item">
      <span class="detail-label">Closing estimé</span>
      <input class="detail-input" type="date" id="edit-closing" value="${closingVal}">
    </div>
    <div class="detail-item">
      <span class="detail-label">Assigné à</span>
      <select class="detail-input" id="edit-assignee">
        <option value="0">— Choisir —</option>
        ${assigneeOptions}
      </select>
    </div>
    <div class="detail-item detail-full">
      <span class="detail-label">Description</span>
      <textarea class="detail-input detail-textarea" id="edit-description">${escHtml(opp.description || '')}</textarea>
    </div>
    <div class="detail-item detail-full detail-actions">
      <button class="btn-save"   id="btn-save-fiche">💾 Enregistrer</button>
      <button class="btn-cancel-edit" id="btn-cancel-edit">Annuler</button>
    </div>
  `;

  document.getElementById('btn-save-fiche').addEventListener('click', () => saveFiche(opp));
  document.getElementById('btn-cancel-edit').addEventListener('click', () => renderPanelDetails(opp));
}

async function saveFiche(opp) {
  const newTitre      = document.getElementById('edit-titre').value.trim();
  const newEntreprise = parseInt(document.getElementById('edit-entreprise').value) || 0;
  const newContact    = parseInt(document.getElementById('edit-contact').value)    || 0;
  const newStatut     = document.getElementById('edit-statut').value;
  const newPriorite   = document.getElementById('edit-priorite').value;
  const newValeur     = parseFloat(document.getElementById('edit-valeur').value)   || 0;
  const newClosing    = document.getElementById('edit-closing').value; // 'YYYY-MM-DD'
  const newAssignee   = parseInt(document.getElementById('edit-assignee').value)   || 0;
  const newDesc       = document.getElementById('edit-description').value.trim();

  // Conversion date → timestamp (Grist Date = secondes depuis epoch)
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

  // Mise à jour locale
  opp.titre               = newTitre;
  opp.Entreprise          = newEntreprise;
  opp.contact_principale  = newContact;
  opp.statut              = newStatut;
  opp.Priorite            = newPriorite;
  opp.valeur_estilmee     = newValeur;
  opp.date_closing_estimee = newClosing;
  opp.assignee_a          = newAssignee;
  opp.description         = newDesc;

  // Re-enrichir noms
  const ent = allEntreprises.find(e => e.id === newEntreprise);
  opp._entrepriseNom = ent ? ent.Nom : '—';
  const ct = allContacts.find(c => c.id === newContact);
  opp._contactNom = ct ? (ct.nom_prenom || (ct.Prenom+' '+ct.Nom).trim()) : '—';
  const ag = allContacts.find(c => c.id === newAssignee);
  opp._assigneeNom = ag ? (ag.nom_prenom || (ag.Prenom+' '+ag.Nom).trim()) : '—';

  // Rafraîchir UI
  document.getElementById('panel-company').textContent = opp._entrepriseNom;
  document.getElementById('panel-contact').textContent = '👤 ' + opp._contactNom;
  const statusEl = document.getElementById('panel-status');
  statusEl.textContent      = opp.statut;
  statusEl.style.background = statusBg(opp.statut);
  statusEl.style.color      = statusColor(opp.statut);
  document.getElementById('panel-amount').textContent = formatEuros(opp.valeur_estilmee);

  renderPanelDetails(opp);
  renderKanban();
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
  currentOpp = null;
}

// ── Timeline interactions ─────────────────────────────────
function renderTimeline(opp) {
  const timeline = document.getElementById('panel-timeline');
  const items = allInteractions
    .filter(i => i.Opportunite === opp.id)
    .map(i => resolveInteractionNames({...i}))
    .sort((a, b) => new Date(b.Date) - new Date(a.Date));

  if (items.length === 0) {
    timeline.innerHTML = '<div class="timeline-empty">Aucune interaction enregistrée</div>';
    return;
  }

  timeline.innerHTML = items.map(item => `
    <div class="timeline-item">
      <div class="timeline-dot">${INTERACTION_ICONS[item.type_interaction] || '💬'}</div>
      <div class="timeline-content">
        <div class="timeline-title">
          ${item.type_interaction}
          ${item.duree ? ' — ' + item.duree + ' min' : ''}
        </div>
        <div class="timeline-body">${item.contenu}</div>
        <div class="timeline-date">
          ${formatDatetime(item.Date)} · ${item._assigneeNom}
          ${item._contactNom !== '—' ? ' · ' + item._contactNom : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// ── Modal Quick Action ────────────────────────────────────
function openModal(type, opp) {
  currentOpp        = opp;
  currentActionType = type;

  const icons = { Appel:'📞', Email:'📧', Note:'📝', Réunion:'📅' };
  document.getElementById('modal-title').textContent =
    `${icons[type] || '📝'} ${type} — ${opp._entrepriseNom}`;
  document.getElementById('modal-note').value = '';

  const showDuree = ['Appel','Réunion'].includes(type);
  document.getElementById('modal-duree-label').style.display = showDuree ? 'block' : 'none';
  document.getElementById('modal-duree').style.display       = showDuree ? 'block' : 'none';
  document.getElementById('modal-duree').value = type === 'Appel' ? 15 : 60;

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

async function confirmAction() {
  const contenu = document.getElementById('modal-note').value.trim();
  const duree   = parseInt(document.getElementById('modal-duree').value) || 0;
  if (!contenu) { showToast('⚠️ Merci de saisir un contenu'); return; }

  const nowIso = new Date().toISOString();
  const nowTs  = Math.floor(Date.now() / 1000); // pour Grist Date

  const interaction = {
    id              : Date.now(),
    type_interaction: currentActionType,
    Date            : nowIso,
    contact         : currentOpp.contact_principale,
    Opportunite     : currentOpp.id,
    Assigne         : currentOpp.assignee_a,
    contenu,
    duree,
    _contactNom     : currentOpp._contactNom,
    _assigneeNom    : currentOpp._assigneeNom,
  };

  allInteractions.unshift(interaction);

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['AddRecord', 'Interactions', null, {
        type_interaction: currentActionType,
        Date            : nowTs,
        contact         : currentOpp.contact_principale || 0,
        Opportunite     : currentOpp.id,
        Assigne         : currentOpp.assignee_a         || 0,
        contenu,
        duree           : String(duree),
      }]]);
    } catch(err) { console.error('Interaction non sauvegardée', err); }
  }

  if (currentOpp) renderTimeline(currentOpp);
  closeModal();
  showToast(`✅ ${currentActionType} enregistré·e !`);
}

// ── Navigation ────────────────────────────────────────────
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

// ── Recherche ─────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  document.querySelectorAll('.opportunity-card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});

// ── Bouton Nouvelle Oppo ──────────────────────────────────
document.getElementById('btn-new').addEventListener('click', () => {
  showToast('🚧 Formulaire de création — bientôt disponible !');
});

// ── Boutons Ajouter (colonnes) ────────────────────────────
document.querySelectorAll('.add-card-btn').forEach(btn => {
  btn.addEventListener('click', () => showToast('🚧 Ajout rapide — bientôt disponible !'));
});

// ── Actions rapides (panel) ───────────────────────────────
document.querySelectorAll('.quick-action').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentOpp) return;
    openModal(btn.dataset.type, currentOpp);
  });
});

// ── Fermeture panel ───────────────────────────────────────
document.getElementById('close-panel').addEventListener('click', closePanel);
document.getElementById('overlay').addEventListener('click', closePanel);

// ── Modal événements ──────────────────────────────────────
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-confirm').addEventListener('click', confirmAction);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ── Bouton éditer fiche ───────────────────────────────────
document.getElementById('btn-edit-fiche').addEventListener('click', () => {
  if (!currentOpp) return;
  renderPanelEdit(currentOpp);
});

// ── Utilitaires ───────────────────────────────────────────
function formatEuros(val) {
  if (!val) return '0 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  }).format(val);
}

function formatDate(d) {
  if (!d) return '—';
  // Grist Date = secondes depuis epoch
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
  return { Prospect:'#eff6ff','En discussion':'#fffbeb',
    Proposition:'#f5f3ff', Gagné:'#ecfdf5', Perdu:'#fef2f2' }[statut] || '#f4f6fb';
}

function statusColor(statut) {
  return { Prospect:'#2563eb','En discussion':'#d97706',
    Proposition:'#7c3aed', Gagné:'#059669', Perdu:'#dc2626' }[statut] || '#6b7280';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&').replace(/</g,'<')
    .replace(/>/g,'>').replace(/"/g,'"');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
