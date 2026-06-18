// ════════════════════════════════════════════════════════
//  CRM PUI — Université de Bordeaux
//  Widget Grist — JS principal
//  Version 0.1 POC — Juin 2026
// ════════════════════════════════════════════════════════

// ── État global ──────────────────────────────────────────
let allOpportunites = [];
let allInteractions = [];
let allContacts = [];
let currentOpp = null;
let currentActionType = null;
let gristReady = false;
let draggedCardId = null;

// ── Données de démo (fallback si Grist non connecté) ─────
const DEMO_OPPS = [
  { id: 1, Titre: 'Partenariat R&D', Entreprise: 'Nova Tech SAS', Contact_principal: 'Marie Dupont', Statut: 'Prospect', Priorite: 'Haute', Valeur_estimee: 12000, Date_creation: '2026-05-10', Date_closing_estimee: '2026-09-01', Responsable: 'Jean BD', Description: 'Collaboration sur projet IA appliquée.' },
  { id: 2, Titre: 'Formation innovation', Entreprise: 'Innovate Solutions', Contact_principal: 'Thomas Leroy', Statut: 'Prospect', Priorite: 'Moyenne', Valeur_estimee: 5500, Date_creation: '2026-05-20', Date_closing_estimee: '2026-08-15', Responsable: 'Claire CHAF', Description: 'Programme de formation sur 6 mois.' },
  { id: 3, Titre: 'Licence technologique', Entreprise: 'Groupe Leclerc', Contact_principal: 'Pierre Moreau', Statut: 'En discussion', Priorite: 'Haute', Valeur_estimee: 18000, Date_creation: '2026-04-15', Date_closing_estimee: '2026-07-30', Responsable: 'Jean BD', Description: 'Transfert de licence brevet UBx.' },
  { id: 4, Titre: 'Accompagnement startup', Entreprise: 'StartX', Contact_principal: 'Lucie Bernard', Statut: 'En discussion', Priorite: 'Moyenne', Valeur_estimee: 8000, Date_creation: '2026-05-01', Date_closing_estimee: '2026-08-01', Responsable: 'Claire CHAF', Description: 'Suivi incubation 12 mois.' },
  { id: 5, Titre: 'Contrat de recherche', Entreprise: 'BioLab Corp', Contact_principal: 'Sophie Martin', Statut: 'Proposition', Priorite: 'Haute', Valeur_estimee: 35000, Date_creation: '2026-03-10', Date_closing_estimee: '2026-07-15', Responsable: 'Jean BD', Description: 'Contrat de recherche pluriannuel.' },
  { id: 6, Titre: 'Prestation conseil', Entreprise: 'EcoGreen SARL', Contact_principal: 'Nicolas Petit', Statut: 'Proposition', Priorite: 'Basse', Valeur_estimee: 7000, Date_creation: '2026-04-20', Date_closing_estimee: '2026-09-30', Responsable: 'Claire CHAF', Description: 'Conseil transition écologique.' },
  { id: 7, Titre: 'Transfert technologique', Entreprise: 'Finance & Co', Contact_principal: 'Laurent Blanc', Statut: 'Gagné', Priorite: 'Haute', Valeur_estimee: 25000, Date_creation: '2026-02-01', Date_closing_estimee: '2026-06-01', Responsable: 'Jean BD', Description: 'Transfert finalisé avec succès.' },
  { id: 8, Titre: 'Formation continue', Entreprise: 'Boulangerie Durand', Contact_principal: 'Marie Leblanc', Statut: 'Gagné', Priorite: 'Moyenne', Valeur_estimee: 4200, Date_creation: '2026-03-15', Date_closing_estimee: '2026-05-30', Responsable: 'Claire CHAF', Description: 'Formation managers signée.' },
  { id: 9, Titre: 'Expertise technique', Entreprise: 'Architex Construct', Contact_principal: 'Frédéric Müller', Statut: 'Perdu', Priorite: 'Basse', Valeur_estimee: 8500, Date_creation: '2026-01-10', Date_closing_estimee: '2026-04-01', Responsable: 'Jean BD', Description: 'Budget non validé côté client.' },
];

const DEMO_INTERACTIONS = [
  { id: 1, Type: 'Appel', Date: '2026-06-17T14:30:00', Contact: 'Pierre Moreau', Opportunite: 'Licence technologique', Auteur: 'Jean BD', Contenu: 'Appel de suivi, client positif.', Duree_minutes: 15, opp_id: 3 },
  { id: 2, Type: 'Email', Date: '2026-06-16T10:15:00', Contact: 'Pierre Moreau', Opportunite: 'Licence technologique', Auteur: 'Jean BD', Contenu: 'Envoi du devis détaillé V2.', Duree_minutes: 0, opp_id: 3 },
  { id: 3, Type: 'Note', Date: '2026-06-14T09:00:00', Contact: 'Pierre Moreau', Opportunite: 'Licence technologique', Auteur: 'Jean BD', Contenu: 'Client intéressé par option premium. Relancer fin juin.', Duree_minutes: 0, opp_id: 3 },
];

// ── Init Grist ────────────────────────────────────────────
grist.ready({
  requiredAccess: 'full'});

grist.onRecords(records => {
  if (records && records.length > 0) {
    gristReady = true;
    allOpportunites = records.map(r => ({
      id: r.id,
      Titre: r.Titre || '(Sans titre)',
      Entreprise: r.Entreprise || '—',
      Contact_principal: r.Contact_principal || '—',
      Statut: r.Statut || 'Prospect',
      Priorite: r.Priorite || 'Moyenne',
      Valeur_estimee: r.Valeur_estimee || 0,
      Date_creation: r.Date_creation || '',
      Date_closing_estimee: r.Date_closing_estimee || '',
      Responsable: r.Responsable || '—',
      Description: r.Description || '',
    }));
    renderKanban();
  } else {
    // Mode démo
    allOpportunites = DEMO_OPPS;
    allInteractions = DEMO_INTERACTIONS;
    renderKanban();
  }
});

// ── Rendu Kanban ──────────────────────────────────────────
const STATUTS = ['Prospect', 'En discussion', 'Proposition', 'Gagné', 'Perdu'];

const STATUT_ICONS = {
  'Appel': '📞', 'Email': '📧', 'Note': '📝', 'Réunion': '📅'
};

function renderKanban() {
  STATUTS.forEach(statut => {
    const cards = allOpportunites.filter(o => o.Statut === statut);
    const container = document.getElementById('col-' + statut);
    const countEl = document.getElementById('count-' + statut);
    const totalEl = document.getElementById('total-' + statut);

    if (!container) return;

    container.innerHTML = '';
    countEl.textContent = cards.length;

    const total = cards.reduce((sum, o) => sum + (o.Valeur_estimee || 0), 0);
    totalEl.textContent = total > 0 ? formatEuros(total) : '';

    cards.forEach(opp => {
      container.appendChild(createCard(opp));
    });
  });

  initDragDrop();
}

function createCard(opp) {
  const card = document.createElement('div');
  card.className = 'opportunity-card';
  card.draggable = true;
  card.dataset.id = opp.id;

  const dateRel = opp.Date_creation ? relativeDate(opp.Date_creation) : '';

  card.innerHTML = `
    <div class="card-company">${opp.Entreprise}</div>
    <div class="card-contact">👤 ${opp.Contact_principal}</div>
    <div class="card-meta">
      <div class="card-amount">${formatEuros(opp.Valeur_estimee)}</div>
      <div class="card-priority priority-${opp.Priorite}">${opp.Priorite}</div>
    </div>
    <div class="card-footer">
      <div class="card-actions">
        <button class="card-action" data-action="Appel" title="Appel">📞</button>
        <button class="card-action" data-action="Email" title="Email">📧</button>
        <button class="card-action" data-action="Note" title="Note">📝</button>
      </div>
      <div class="card-date">${dateRel}</div>
    </div>
  `;

  // Ouvrir le panel au clic sur la carte (pas sur les boutons)
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.card-action')) {
      openPanel(opp);
    }
  });

  // Actions rapides sur la carte
  card.querySelectorAll('.card-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
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
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });

  document.querySelectorAll('.kanban-column').forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });
    col.addEventListener('drop', async e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const newStatut = col.dataset.status;
      if (!draggedCardId || !newStatut) return;

      const opp = allOpportunites.find(o => o.id === draggedCardId);
      if (!opp || opp.Statut === newStatut) return;

      const oldStatut = opp.Statut;
      opp.Statut = newStatut;
      renderKanban();

      if (gristReady) {
        try {
          await grist.getTable('Opportunites').update({
            id: opp.id,
            fields: { Statut: newStatut }
          });
          showToast(`✅ Déplacé vers "${newStatut}"`);
        } catch(err) {
          console.error(err);
          opp.Statut = oldStatut;
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

  document.getElementById('panel-company').textContent = opp.Entreprise;
  document.getElementById('panel-contact').textContent = '👤 ' + opp.Contact_principal;

  const statusEl = document.getElementById('panel-status');
  statusEl.textContent = opp.Statut;
  statusEl.style.background = statusBg(opp.Statut);
  statusEl.style.color = statusColor(opp.Statut);

  document.getElementById('panel-amount').textContent = formatEuros(opp.Valeur_estimee);

  document.getElementById('panel-details').innerHTML = `
    <div class="detail-item">
      <span class="detail-label">Titre</span>
      <span class="detail-value">${opp.Titre}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Priorité</span>
      <span class="detail-value">${opp.Priorite}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Responsable</span>
      <span class="detail-value">${opp.Responsable}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Closing estimé</span>
      <span class="detail-value">${formatDate(opp.Date_closing_estimee)}</span>
    </div>
    ${opp.Description ? `<div class="detail-item" style="grid-column:1/-1">
      <span class="detail-label">Description</span>
      <span class="detail-value">${opp.Description}</span>
    </div>` : ''}
  `;

  renderTimeline(opp);

  document.getElementById('side-panel').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
  currentOpp = null;
}

function renderTimeline(opp) {
  const timeline = document.getElementById('panel-timeline');
  const items = allInteractions.filter(i =>
    i.opp_id === opp.id || i.Opportunite === opp.Titre
  ).sort((a, b) => new Date(b.Date) - new Date(a.Date));

  if (items.length === 0) {
    timeline.innerHTML = '<div class="timeline-empty">Aucune interaction enregistrée</div>';
    return;
  }

  timeline.innerHTML = items.map(item => `
    <div class="timeline-item">
      <div class="timeline-dot ${item.Type.toLowerCase()}">${STATUT_ICONS[item.Type] || '💬'}</div>
      <div class="timeline-content">
        <div class="timeline-title">${item.Type}${item.Duree_minutes ? ' — ' + item.Duree_minutes + ' min' : ''}</div>
        <div class="timeline-body">${item.Contenu}</div>
        <div class="timeline-date">${formatDatetime(item.Date)} · ${item.Auteur}</div>
      </div>
    </div>
  `).join('');
}

// ── Modal Quick Action ────────────────────────────────────
function openModal(type, opp) {
  currentOpp = opp;
  currentActionType = type;

  const icons = { Appel: '📞', Email: '📧', Note: '📝', Réunion: '📅' };
  document.getElementById('modal-title').textContent = `${icons[type] || '📝'} ${type} — ${opp.Entreprise}`;
  document.getElementById('modal-note').value = '';

  const showDuree = ['Appel', 'Réunion'].includes(type);
  document.getElementById('modal-duree-label').style.display = showDuree ? 'block' : 'none';
  document.getElementById('modal-duree').style.display = showDuree ? 'block' : 'none';
  document.getElementById('modal-duree').value = type === 'Appel' ? 15 : 60;

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

async function confirmAction() {
  const contenu = document.getElementById('modal-note').value.trim();
  const duree = parseInt(document.getElementById('modal-duree').value) || 0;

  if (!contenu) { showToast('⚠️ Merci de saisir un contenu'); return; }

  const interaction = {
    id: Date.now(),
    Type: currentActionType,
    Date: new Date().toISOString(),
    Contact: currentOpp.Contact_principal,
    Opportunite: currentOpp.Titre,
    Auteur: 'Moi',
    Contenu: contenu,
    Duree_minutes: duree,
    opp_id: currentOpp.id,
  };

  allInteractions.unshift(interaction);

  if (gristReady) {
    try {
      await grist.getTable('Interactions').create({
        fields: {
          Type: interaction.Type,
          Date: interaction.Date,
          Contact: interaction.Contact,
          Opportunite: interaction.Opportunite,
          Auteur: interaction.Auteur,
          Contenu: interaction.Contenu,
          Duree_minutes: interaction.Duree_minutes,
        }
      });
    } catch(err) { console.error(err); }
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

    document.getElementById('kanban-view').style.display = view === 'opportunites' ? 'flex' : 'none';
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
    const txt = card.textContent.toLowerCase();
    card.style.display = txt.includes(q) ? '' : 'none';
  });
});

// ── Bouton Nouvelle Oppo ──────────────────────────────────
document.getElementById('btn-new').addEventListener('click', () => {
  showToast('🚧 Formulaire de création — bientôt disponible !');
});

// ── Boutons Ajouter (colonnes) ────────────────────────────
document.querySelectorAll('.add-card-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    showToast('🚧 Ajout rapide — bientôt disponible !');
  });
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
  showToast('🚧 Édition complète — bientôt disponible !');
});

// ── Utilitaires ───────────────────────────────────────────
function formatEuros(val) {
  if (!val) return '0 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDatetime(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' à ' +
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function relativeDate(d) {
  if (!d) return '';
  const now = new Date();
  const date = new Date(d);
  const diff = Math.floor((now - date) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Il y a 1 jour';
  if (diff < 7) return `Il y a ${diff} jours`;
  if (diff < 30) return `Il y a ${Math.floor(diff/7)} sem.`;
  return `Il y a ${Math.floor(diff/30)} mois`;
}

function statusBg(statut) {
  const map = {
    'Prospect': '#eff6ff', 'En discussion': '#fffbeb',
    'Proposition': '#f5f3ff', 'Gagné': '#ecfdf5', 'Perdu': '#fef2f2'
  };
  return map[statut] || '#f4f6fb';
}

function statusColor(statut) {
  const map = {
    'Prospect': '#2563eb', 'En discussion': '#d97706',
    'Proposition': '#7c3aed', 'Gagné': '#059669', 'Perdu': '#dc2626'
  };
  return map[statut] || '#6b7280';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
