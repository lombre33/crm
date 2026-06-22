// ════════════════════════════════════════════════════════
//  TIMELINE & LOG INTERACTIONS
// ════════════════════════════════════════════════════════

// 🔑 Types d'interaction disponibles
const INTERACTION_TYPES = [
  'Appel',
  'Email',
  'Réunion',
  'Visite',
  'Devis',
  'Contrat',
  'Note',
  'Autre'
];

// 🔑 Icônes par type d'interaction
const INTERACTION_ICONS = {
  'Appel': '☎️',
  'Email': '📧',
  'Réunion': '🤝',
  'Visite': '🚗',
  'Devis': '📄',
  'Contrat': '📋',
  'Note': '📝',
  'Autre': '📌'
};



function renderTimeline(opp) {
  const container = document.getElementById('panel-timeline');
  if (!container) return;

  const oppInters = allInteractions
    .filter(i => i.Opportunite === opp.id)
    .sort((a, b) => b.Date - a.Date);

  if (oppInters.length === 0) {
    container.innerHTML = `<div class="timeline-empty">Aucune interaction encore</div>`;
    return;
  }

  container.innerHTML = oppInters.map(inter => {
    const icon = INTERACTION_ICONS[inter.type_interaction] || '📌';
    const contactNom = getContactNom(inter.contact);
    return `
      <div class="timeline-item" data-inter-id="${inter.id}">
        <div class="timeline-icon">${icon}</div>
        <div class="timeline-body">
          <div class="timeline-header">
            <span class="timeline-type">${inter.type_interaction}</span>
            <span class="timeline-date">${formatDatetime(inter.Date)}</span>
          </div>
          <div class="timeline-contact">👤 ${escHtml(contactNom)}</div>
          <div class="timeline-content">${escHtml(inter.contenu)}</div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.timeline-item').forEach(el => {
    el.addEventListener('click', () => {
      openInteractionDetail(parseInt(el.dataset.interId));
    });
  });
}

// ── Modal log interaction ─────────────────────────────
function openLogModal(type = 'Note') {
  const modal = document.getElementById('log-modal');

  const typeOpts = INTERACTION_TYPES.map(t =>
    `<option value="${t}" ${t === type ? 'selected' : ''}>${INTERACTION_ICONS[t]} ${t}</option>`
  ).join('');

  document.getElementById('log-modal-body').innerHTML = `
    <div class="form-group">
      <label>TYPE</label>
      <select id="log-type">${typeOpts}</select>
    </div>
    <div class="form-group">
      <label>CONTENU</label>
      <textarea id="log-contenu" placeholder="Décrivez l'interaction..." style="min-height:90px;"></textarea>
    </div>
    <div class="form-group" id="log-duree-group">
      <label>DURÉE (minutes)</label>
      <input type="number" id="log-duree" value="30" min="0">
    </div>
    <div class="form-actions">
      <button id="btn-log-save" class="btn-save">✅ Logger</button>
      <button id="btn-log-cancel" class="btn-cancel">✕ Annuler</button>
    </div>
  `;

  document.getElementById('log-type').addEventListener('change', function() {
    const showDuree = ['Appel','Réunion'].includes(this.value);
    document.getElementById('log-duree-group').style.display = showDuree ? '' : 'none';
  });

  // Afficher durée seulement pour Appel/Réunion
  if (!['Appel','Réunion'].includes(type)) {
    document.getElementById('log-duree-group').style.display = 'none';
  }

  document.getElementById('btn-log-save').addEventListener('click', saveLogInteraction);
  document.getElementById('btn-log-cancel').addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.classList.add('open');
}

async function saveLogInteraction() {
  if (!currentOpp) return;

  const type    = document.getElementById('log-type').value;
  const contenu = document.getElementById('log-contenu').value.trim();
  const duree   = parseInt(document.getElementById('log-duree')?.value) || 0;

  if (!contenu) { showToast('⚠️ Veuillez saisir un contenu'); return; }

  const nowTs = Math.floor(Date.now() / 1000);
  const inter = {
    id              : Date.now(),
    type_interaction: type,
    Date            : nowTs,
    contact         : currentOpp.contact_principale || 0,
    Opportunite     : currentOpp.id,
    Assigne         : currentOpp.assignee_a || 0,
    contenu,
    duree,
  };

  allInteractions.unshift(inter);
  renderTimeline(currentOpp);
  document.getElementById('log-modal').classList.remove('open');
  showToast(`✅ ${type} loggé !`);

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['AddRecord', 'Interactions', null, {
        type_interaction: type,
        Date            : nowTs,
        contact         : inter.contact,
        Opportunite     : inter.Opportunite,
        Assigne         : inter.Assigne,
        contenu,
        duree,
      }]]);
    } catch(err) {
      console.error('Interaction non sauvegardée', err);
      showToast('❌ Erreur enregistrement interaction');
    }
  }
}

// ── Détail interaction ────────────────────────────────
function openInteractionDetail(interactionId) {
  const inter = allInteractions.find(i => i.id === interactionId);
  if (!inter) return;

  const modal = document.getElementById('inter-detail-modal');

  const typeOpts = INTERACTION_TYPES.map(t =>
    `<option value="${t}" ${t === inter.type_interaction ? 'selected':''}>${t}</option>`
  ).join('');

  const contactOpts = allContacts.map(c => {
    const nom = c.nom_prenom || `${c.Prenom} ${c.Nom}`.trim();
    return `<option value="${c.id}" ${c.id === inter.contact ? 'selected':''}>${escHtml(nom)}</option>`;
  }).join('');

  const dateVal = inter.Date
    ? new Date(inter.Date * 1000).toISOString().slice(0,16)
    : '';

  document.getElementById('inter-detail-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group">
        <label>TYPE</label>
        <select id="inter-edit-type">${typeOpts}</select>
      </div>
      <div class="form-group">
        <label>DATE</label>
        <input type="datetime-local" id="inter-edit-date" value="${dateVal}">
      </div>
      <div class="form-group">
        <label>CONTACT</label>
        <select id="inter-edit-contact">
          <option value="">— Choisir —</option>
          ${contactOpts}
        </select>
      </div>
      <div class="form-group">
        <label>DURÉE (min)</label>
        <input type="number" id="inter-edit-duree" value="${inter.duree || 0}" min="0">
      </div>
      <div class="form-group form-full">
        <label>CONTENU</label>
        <textarea id="inter-edit-contenu" style="min-height:100px;">${escHtml(inter.contenu || '')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button id="btn-save-inter" class="btn-save">💾 Enregistrer</button>
      <button id="btn-delete-inter" class="btn-danger">🗑️ Supprimer</button>
      <button id="btn-close-inter" class="btn-cancel">✕ Fermer</button>
    </div>
  `;

  document.getElementById('btn-save-inter').addEventListener('click',  () => saveInteractionDetail(inter));
  document.getElementById('btn-delete-inter').addEventListener('click', () => deleteInteraction(inter.id));
  document.getElementById('btn-close-inter').addEventListener('click',  () => {
    document.getElementById('inter-detail-modal').classList.remove('open');
  });

  document.getElementById('inter-detail-overlay').classList.add('open');
}

async function saveInteractionDetail(inter) {
  const newType    = document.getElementById('inter-edit-type').value;
  const newDate    = document.getElementById('inter-edit-date').value;
  const newContact = parseInt(document.getElementById('inter-edit-contact').value) || 0;
  const newDuree   = parseInt(document.getElementById('inter-edit-duree').value)   || 0;
  const newContenu = document.getElementById('inter-edit-contenu').value.trim();
  const newDateTs  = newDate ? Math.floor(new Date(newDate).getTime() / 1000) : inter.Date;

  inter.type_interaction = newType;
  inter.Date             = newDateTs;
  inter.contact          = newContact;
  inter.duree            = newDuree;
  inter.contenu          = newContenu;

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['UpdateRecord', 'Interactions', inter.id, {
        type_interaction: newType,
        Date            : newDateTs,
        contact         : newContact,
        duree           : newDuree,
        contenu         : newContenu,
      }]]);
      showToast('✅ Interaction mise à jour !');
    } catch(err) {
      showToast('❌ Erreur lors de la sauvegarde');
      return;
    }
  }

  document.getElementById('inter-detail-overlay').classList.remove('open');
  if (currentOpp) renderTimeline(currentOpp);
}

async function deleteInteraction(interactionId) {
  if (!confirm('Supprimer cette interaction ?')) return;

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['RemoveRecord', 'Interactions', interactionId]]);
    } catch(err) {
      showToast('❌ Erreur lors de la suppression');
      return;
    }
  }

  allInteractions = allInteractions.filter(i => i.id !== interactionId);
  document.getElementById('inter-detail-overlay').classList.remove('open');
  if (currentOpp) renderTimeline(currentOpp);
  showToast('✅ Interaction supprimée !');
}
