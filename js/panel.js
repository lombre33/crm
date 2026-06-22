// ════════════════════════════════════════════════════════
//  SIDE PANEL — Affichage + Édition + Actions
// ════════════════════════════════════════════════════════

function openPanel(opp) {
  if (!opp) return;
  currentOpp = opp;
  
  renderPanelHeader(opp);
  renderPanelDetails(opp);
  renderPanelActions(opp);
  renderTimeline(opp);

  const panel = document.getElementById('side-panel');
  const overlay = document.getElementById('overlay');
  
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('open');
}

function closePanel() {
  const panel = document.getElementById('side-panel');
  const overlay = document.getElementById('overlay');
  
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  
  currentOpp = null;
}

// ════════════════════════════════════════════════════════
//  HEADER DU PANEL
// ════════════════════════════════════════════════════════
function renderPanelHeader(opp) {
  const companyEl = document.getElementById('panel-company');
  const contactEl = document.getElementById('panel-contact');
  const statusEl = document.getElementById('panel-status');
  const amountEl = document.getElementById('panel-amount');

  // 🔑 Utiliser _entrepriseNom avec underscore
  if (companyEl) companyEl.textContent = opp._entrepriseNom || '—';
  
  // 🔑 Ajouter le contact aussi dans le header
  if (contactEl) contactEl.textContent = '👤 ' + (opp._contactNom || '—');
  
  if (statusEl) {
    statusEl.textContent = opp.statut || '—';
    statusEl.style.background = STATUT_BG[opp.statut] || '#f1f5f9';
    statusEl.style.color = STATUT_COLOR[opp.statut] || '#475569';
  }
  
  if (amountEl) amountEl.textContent = formatEuros(opp.valeur_estimee || 0);
}


// ════════════════════════════════════════════════════════
//  DÉTAILS & FORMULAIRE
// ════════════════════════════════════════════════════════
function renderPanelDetails(opp) {
  const detailsEl = document.getElementById('panel-details');
  if (!detailsEl) return;

  // 🔑 Utiliser les valeurs enrichies avec underscore
  const entrepriseNom = opp._entrepriseNom || '—';
  const contactNom = opp._contactNom || '—';
  const assignee = allContacts.find(c => c.id === opp.assignee_a);
  const assigneeNom = assignee?.nom_prenom || `${assignee?.Prenom} ${assignee?.Nom}`.trim() || '—';

  const closingDate = opp.date_closing_estimee
    ? formatDate(opp.date_closing_estimee)
    : '—';

  detailsEl.innerHTML = `
    <div class="panel-section">
      <div class="panel-section-title">📊 DÉTAILS</div>
      <div class="panel-info-grid">
        <div class="panel-info-item">
          <div class="panel-info-label">Entreprise</div>
          <div class="panel-info-value">${escHtml(entrepriseNom)}</div>
        </div>
        <div class="panel-info-item">
          <div class="panel-info-label">Contact</div>
          <div class="panel-info-value">${escHtml(contactNom)}</div>
        </div>
        <div class="panel-info-item">
          <div class="panel-info-label">Priorité</div>
          <div class="panel-info-value">${opp.Priorite || '—'}</div>
        </div>
        <div class="panel-info-item">
          <div class="panel-info-label">Assigné</div>
          <div class="panel-info-value">${escHtml(assigneeNom)}</div>
        </div>
        <div class="panel-info-item">
          <div class="panel-info-label">Closing</div>
          <div class="panel-info-value">${closingDate}</div>
        </div>
      </div>
    </div>
    



    <div class="panel-section">
      <div class="panel-section-title">📝 DESCRIPTION</div>
      <div class="panel-description">
        ${escHtml(opp.description || 'Aucune description')}
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">⚡ ACTIONS RAPIDES</div>
      <div class="panel-actions">
        <button class="btn-log-type call" onclick="logCallAction()">
          <span>📞</span> Appel
        </button>
        <button class="btn-log-type email" onclick="logEmailAction()">
          <span>📧</span> Email
        </button>
        <button class="btn-log-type meeting" onclick="logMeetingAction()">
          <span>📅</span> Réunion
        </button>
        <button class="btn-log-type note" onclick="logNoteAction()">
          <span>📝</span> Note
        </button>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">✏️ MODIFIER</div>
      <button id="btn-edit-opp" class="btn-primary" style="width: 100%;">
        ✎ Éditer la fiche
      </button>
    </div>
  `;

  // Event listener pour l'édition
  document.getElementById('btn-edit-opp')?.addEventListener('click', () => {
    renderPanelEditForm(opp);
  });
}

// ════════════════════════════════════════════════════════
//  FORMULAIRE D'ÉDITION
// ════════════════════════════════════════════════════════
function renderPanelEditForm(opp) {
  const detailsEl = document.getElementById('panel-details');
  if (!detailsEl) return;

  // Options select
  const entOpts = allEntreprises.map(e =>
    `<option value="${e.id}" ${e.id === opp.Entreprise ? 'selected' : ''}>${escHtml(e.Nom)}</option>`
  ).join('');

  const contactOpts = allContacts.map(c => {
    const nom = c.nom_prenom || `${c.Prenom} ${c.Nom}`.trim();
    return `<option value="${c.id}" ${c.id === opp.contact_principale ? 'selected' : ''}>${escHtml(nom)}</option>`;
  }).join('');

  const assigneeOpts = allContacts.map(c => {
    const nom = c.nom_prenom || `${c.Prenom} ${c.Nom}`.trim();
    return `<option value="${c.id}" ${c.id === opp.assignee_a ? 'selected' : ''}>${escHtml(nom)}</option>`;
  }).join('');

  const statutOpts = STATUTS.map(s =>
    `<option value="${s}" ${s === opp.statut ? 'selected' : ''}>${s}</option>`
  ).join('');

  const prioOpts = PRIORITES.map(p =>
    `<option value="${p}" ${p === opp.Priorite ? 'selected' : ''}>${p}</option>`
  ).join('');

  const closingVal = opp.date_closing_estimee
    ? new Date(opp.date_closing_estimee * 1000).toISOString().slice(0, 10)
    : '';

  detailsEl.innerHTML = `
    <div class="panel-section">
      <div class="panel-section-title">✏️ ÉDITER LA FICHE</div>
      
      <div class="form-group">
        <label class="form-label">Titre</label>
        <input type="text" id="edit-titre" class="form-input" value="${escHtml(opp.titre)}">
      </div>

      <div class="form-input-row">
        <div class="form-group">
          <label class="form-label">Entreprise</label>
          <select id="edit-entreprise" class="form-select">
            <option value="">— Choisir —</option>
            ${entOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Contact</label>
          <select id="edit-contact" class="form-select">
            <option value="">— Choisir —</option>
            ${contactOpts}
          </select>
        </div>
      </div>

      <div class="form-input-row">
        <div class="form-group">
          <label class="form-label">Statut</label>
          <select id="edit-statut" class="form-select">${statutOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Priorité</label>
          <select id="edit-priorite" class="form-select">${prioOpts}</select>
        </div>
      </div>

      <div class="form-input-row">
        <div class="form-group">
          <label class="form-label">Valeur (€)</label>
          <input type="number" id="edit-valeur" class="form-input" value="${opp.valeur_estimee || 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Closing estimé</label>
          <input type="date" id="edit-closing" class="form-input" value="${closingVal}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Assigné à</label>
        <select id="edit-assignee" class="form-select">
          <option value="">— Choisir —</option>
          ${assigneeOpts}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="edit-description" class="form-textarea">${escHtml(opp.description || '')}</textarea>
      </div>
    </div>

    <div class="panel-edit-actions">
      <button id="btn-save-fiche" class="btn-save">💾 Enregistrer</button>
      <button id="btn-cancel-edit" class="btn-cancel">✕ Annuler</button>
      <button id="btn-delete-opp" class="btn-danger">🗑️ Supprimer</button>
    </div>
  `;

  document.getElementById('btn-save-fiche')?.addEventListener('click', () => saveFiche(opp));
  document.getElementById('btn-cancel-edit')?.addEventListener('click', () => renderPanelDetails(opp));
  document.getElementById('btn-delete-opp')?.addEventListener('click', () => deleteOpp(opp));
}

// ════════════════════════════════════════════════════════
//  SAUVEGARDE
// ════════════════════════════════════════════════════════
async function saveFiche(opp) {
  const newTitre = document.getElementById('edit-titre').value.trim();
  const newEntreprise = parseInt(document.getElementById('edit-entreprise').value) || 0;
  const newContact = parseInt(document.getElementById('edit-contact').value) || 0;
  const newStatut = document.getElementById('edit-statut').value;
  const newPriorite = document.getElementById('edit-priorite').value;
  const newValeur = parseFloat(document.getElementById('edit-valeur').value) || 0;
  const newClosing = document.getElementById('edit-closing').value;
  const newAssignee = parseInt(document.getElementById('edit-assignee').value) || 0;
  const newDesc = document.getElementById('edit-description').value.trim();

  if (!newTitre) {
    showToast('❌ Le titre est obligatoire');
    return;
  }

  const closingTs = newClosing ? Math.floor(new Date(newClosing).getTime() / 1000) : null;

  // Mise à jour locale
  opp.titre = newTitre;
  opp.Entreprise = newEntreprise;
  opp.contact_principale = newContact;
  opp.statut = newStatut;
  opp.Priorite = newPriorite;
  opp.valeur_estimee = newValeur;
  opp.date_closing_estimee = closingTs;
  opp.assignee_a = newAssignee;
  opp.description = newDesc;
  enrichOpp(opp);

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        ['UpdateRecord', 'Opportunites', opp.id, {
          titre: newTitre,
          Entreprise: newEntreprise,
          contact_principale: newContact,
          statut: newStatut,
          Priorite: newPriorite,
          valeur_estimee: newValeur,
          date_closing_estimee: closingTs,
          assignee_a: newAssignee,
          description: newDesc,
        }]
      ]);
      showToast('✅ Fiche sauvegardée !');
    } catch (err) {
      console.error('Erreur save:', err);
      showToast('❌ Erreur lors de la sauvegarde');
      return;
    }
  }

  renderKanban();
  renderPanelDetails(opp);
}

// ════════════════════════════════════════════════════════
//  ACTIONS DIRECTES
// ════════════════════════════════════════════════════════
function renderPanelActions(opp) {
  // Vide pour éviter les doublons
  // Les actions sont dans renderPanelDetails
}

function logCallAction() {
  if (!currentOpp) return;
  const contact = allContacts.find(c => c.id === currentOpp.contact_principale);
  const phone = contact?.numero_pro || contact?.numero_perso;
  
  if (!phone) {
    showToast('❌ Aucun numéro pour ce contact');
    return;
  }
  
  navigator.clipboard?.writeText(phone);
  showToast(`📞 ${phone} copié ! Appel logué.`);
  logInteraction('Appel', `Appel vers ${contact.nom_prenom}`);
}

function logEmailAction() {
  if (!currentOpp) return;
  const contact = allContacts.find(c => c.id === currentOpp.contact_principale);
  const email = contact?.Email_fonctionnel || contact?.email_perso;
  
  if (!email) {
    showToast('❌ Aucun email pour ce contact');
    return;
  }
  
  const subject = encodeURIComponent(`CRM PUI - ${currentOpp.titre}`);
  window.open(`mailto:${email}?subject=${subject}`, '_blank');
  
  showToast(`📧 Email logué`);
  logInteraction('Email', `Email vers ${contact.nom_prenom}`);
}

function logMeetingAction() {
  if (!currentOpp) return;
  currentActionType = 'Réunion';
  openLogModal();
}

function logNoteAction() {
  if (!currentOpp) return;
  currentActionType = 'Note';
  openLogModal();
}

// ════════════════════════════════════════════════════════
//  LOG INTERACTION (placeholder)
// ════════════════════════════════════════════════════════
function logInteraction(type, content) {
  if (!currentOpp || !gristReady) return;

  const interaction = {
    opportunite_id: currentOpp.id,
    type: type,
    contenu: content,
    date_creation: Math.floor(Date.now() / 1000)
  };

  grist.docApi.applyUserActions([
    ['AddRecord', 'Interactions', null, interaction]
  ]).catch(err => console.error('Erreur log:', err));
}

// ════════════════════════════════════════════════════════
//  DELETE
// ════════════════════════════════════════════════════════
async function deleteOpp(opp) {
  if (!confirm(`Supprimer l'opportunité "${opp.titre}" ?`)) return;

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        ['RemoveRecord', 'Opportunites', opp.id]
      ]);
      showToast('✅ Opportunité supprimée');
    } catch (err) {
      console.error('Erreur delete:', err);
      showToast('❌ Erreur lors de la suppression');
      return;
    }
  }

  allOpportunites = allOpportunites.filter(o => o.id !== opp.id);
  closePanel();
  renderKanban();
}

// ════════════════════════════════════════════════════════
//  TIMELINE (placeholder)
// ════════════════════════════════════════════════════════
function renderTimeline(opp) {
  const timelineEl = document.getElementById('panel-timeline');
  if (!timelineEl) return;

  const interactions = allInteractions.filter(i => i.opportunite_id === opp.id);

  if (interactions.length === 0) {
    timelineEl.innerHTML = '<div class="timeline-empty">Aucune interaction pour le moment</div>';
    return;
  }

  const timeline = interactions
    .sort((a, b) => (b.date_creation || 0) - (a.date_creation || 0))
    .map(inter => `
      <div class="timeline-item">
        <div class="timeline-dot ${inter.type.toLowerCase()}">
          ${{ 'Appel': '📞', 'Email': '📧', 'Réunion': '📅', 'Note': '📝' }[inter.type] || '•'}
        </div>
        <div class="timeline-body">
          <div class="timeline-header">
            <span class="timeline-type">${inter.type}</span>
            <span class="timeline-date">${formatDatetime(inter.date_creation)}</span>
          </div>
          <div class="timeline-content">${escHtml(inter.contenu)}</div>
        </div>
      </div>
    `).join('');

  timelineEl.innerHTML = `<div class="timeline">${timeline}</div>`;
}
