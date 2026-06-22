// ════════════════════════════════════════════════════════
//  SIDE PANEL
// ════════════════════════════════════════════════════════
function openPanel(opp) {
  currentOpp = opp;
  renderPanelHeader(opp);
  renderPanelForm(opp);
  renderPanelActions(opp);
  renderTimeline(opp);

  document.getElementById('side-panel').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
  currentOpp = null;
}

function renderPanelHeader(opp) {
  document.getElementById('panel-company').textContent = opp._entrepriseNom;

  const statusEl = document.getElementById('panel-status');
  statusEl.textContent      = opp.statut;
  statusEl.style.background = STATUT_BG[opp.statut]    || '#f4f6fb';
  statusEl.style.color      = STATUT_COLOR[opp.statut] || '#6b7280';

  document.getElementById('panel-amount').textContent = formatEuros(opp.valeur_estilmee);
}

// ── Formulaire édition ────────────────────────────────
function renderPanelForm(opp) {
  // Entreprises
  const entOpts = allEntreprises.map(e =>
    `<option value="${e.id}" ${e.id === opp.Entreprise ? 'selected' : ''}>${escHtml(e.Nom)}</option>`
  ).join('');

  // Contacts
  const contactOpts = allContacts.map(c => {
    const nom = c.nom_prenom || `${c.Prenom} ${c.Nom}`.trim();
    return `<option value="${c.id}" ${c.id === opp.contact_principale ? 'selected' : ''}>${escHtml(nom)}</option>`;
  }).join('');

  // Assigné
  const assigneeOpts = allContacts.map(c => {
    const nom = c.nom_prenom || `${c.Prenom} ${c.Nom}`.trim();
    return `<option value="${c.id}" ${c.id === opp.assignee_a ? 'selected' : ''}>${escHtml(nom)}</option>`;
  }).join('');

  // Statut
  const statutOpts = STATUTS.map(s =>
    `<option value="${s}" ${s === opp.statut ? 'selected' : ''}>${s}</option>`
  ).join('');

  // Priorité
  const prioOpts = PRIORITES.map(p =>
    `<option value="${p}" ${p === opp.Priorite ? 'selected' : ''}>${p}</option>`
  ).join('');

  // Date closing
  const closingVal = opp.date_closing_estimee
    ? new Date(opp.date_closing_estimee * 1000).toISOString().slice(0,10)
    : '';

  document.getElementById('panel-form').innerHTML = `
    <div class="form-section-title">FICHE OPPORTUNITÉ</div>

    <div class="form-grid">
      <div class="form-group">
        <label>TITRE</label>
        <input type="text" id="edit-titre" value="${escHtml(opp.titre)}">
      </div>
      <div class="form-group">
        <label>ENTREPRISE</label>
        <select id="edit-entreprise">
          <option value="">— Choisir —</option>
          ${entOpts}
        </select>
      </div>

      <div class="form-group">
        <label>CONTACT PRINCIPAL</label>
        <select id="edit-contact">
          <option value="">— Choisir —</option>
          ${contactOpts}
        </select>
      </div>
      <div class="form-group">
        <label>STATUT</label>
        <select id="edit-statut">${statutOpts}</select>
      </div>

      <div class="form-group">
        <label>PRIORITÉ</label>
        <select id="edit-priorite">${prioOpts}</select>
      </div>
      <div class="form-group">
        <label>VALEUR ESTIMÉE (€)</label>
        <input type="number" id="edit-valeur" value="${opp.valeur_estilmee || 0}">
      </div>

      <div class="form-group">
        <label>CLOSING ESTIMÉ</label>
        <input type="date" id="edit-closing" value="${closingVal}">
      </div>
      <div class="form-group">
        <label>ASSIGNÉ À</label>
        <select id="edit-assignee">
          <option value="">— Choisir —</option>
          ${assigneeOpts}
        </select>
      </div>

      <div class="form-group form-full">
        <label>DESCRIPTION</label>
        <textarea id="edit-description">${escHtml(opp.description)}</textarea>
      </div>
    </div>

    <div class="form-actions">
      <button id="btn-save-fiche" class="btn-save">💾 Enregistrer</button>
      <button id="btn-cancel-edit" class="btn-cancel">✕ Annuler</button>
    </div>
  `;

  document.getElementById('btn-save-fiche').addEventListener('click',  () => saveFiche(opp));
  document.getElementById('btn-cancel-edit').addEventListener('click', () => openPanel(opp));
}

// ── Actions directes ──────────────────────────────────
function renderPanelActions(opp) {
  document.getElementById('panel-actions').innerHTML = `
    <div class="quick-actions">
      <div class="quick-action phone" onclick="showCallNumber()">
        <div class="icon">📞</div><span>Appel</span>
      </div>
      <div class="quick-action email" onclick="openEmailLink()">
        <div class="icon">📧</div><span>Email</span>
      </div>
      <div class="quick-action note" onclick="openLogModal('Note')">
        <div class="icon">📝</div><span>Note</span>
      </div>
      <div class="quick-action rdv" onclick="openLogModal('Réunion')">
        <div class="icon">📅</div><span>RDV</span>
      </div>
    </div>
  `;
}

// ── Sauvegarde ────────────────────────────────────────
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

  // Mise à jour locale
  opp.titre                = newTitre;
  opp.Entreprise           = newEntreprise;
  opp.contact_principale   = newContact;
  opp.statut               = newStatut;
  opp.Priorite             = newPriorite;
  opp.valeur_estilmee      = newValeur;
  opp.date_closing_estimee = closingTs;
  opp.assignee_a           = newAssignee;
  opp.description          = newDesc;
  enrichOpp(opp);

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['UpdateRecord', 'Opportunites', opp.id, {
        titre               : newTitre,
        Entreprise          : newEntreprise,
        contact_principale  : newContact,
        statut              : newStatut,
        Priorite            : newPriorite,
        valeur_estilmee     : newValeur,
        date_closing_estimee: closingTs,
        assignee_a          : newAssignee,
        description         : newDesc,
      }]]);
      showToast('✅ Fiche sauvegardée !');
    } catch(err) {
      console.error(err);
      showToast('❌ Erreur lors de la sauvegarde');
      return;
    }
  }

  renderKanban();
  renderPanelHeader(opp);
}

// ── Actions contact ───────────────────────────────────
function showCallNumber() {
  if (!currentOpp) return;
  const contact = allContacts.find(c => c.id === currentOpp.contact_principale);
  const phone = contact?.numero_pro;
  if (!phone) { showToast('❌ Aucun numéro pour ce contact'); return; }
  navigator.clipboard?.writeText(phone);
  showToast(`📞 ${phone} — copié !`);
  openLogModal('Appel');
}

function openEmailLink() {
  if (!currentOpp) return;
  const contact = allContacts.find(c => c.id === currentOpp.contact_principale);
  const email = contact?.Email_fonctionnel || contact?.email_perso;
  if (!email) { showToast('❌ Aucun email pour ce contact'); return; }
  const subject = encodeURIComponent(`CRM PUI - ${currentOpp.titre}`);
  window.open(`mailto:${email}?subject=${subject}`, '_blank');
  openLogModal('Email');
}
