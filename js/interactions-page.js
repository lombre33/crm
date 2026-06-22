// ════════════════════════════════════════════════════════
//  INTERACTIONS PAGE — Timeline + Filtres + Panel
// ════════════════════════════════════════════════════════
console.log('✅ interactions-page.js chargé');

// ── État ──────────────────────────────────────────────
let filteredInteractions = [];
let selectedInteraction = null;

// ── Filtres actifs ──────────────────────────────────
let filterType = '';
let filterContact = '';
let filterEntreprise = '';
let filterAssignee = '';
let filterDate = '';

// ════════════════════════════════════════════════════════
//  INIT PAGE
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Attendre que les données Grist soient chargées
  let tries = 0;
  while (!gristReady && tries < 50) {
    await new Promise(r => setTimeout(r, 100));
    tries++;
  }

  if (gristReady) {
    initInteractionsPage();
  } else {
    console.warn('⚠️ Grist non prêt après 5s');
  }
});

async function initInteractionsPage() {
  console.log('🔄 Initialisation page Interactions...');

  // Remplir les selects de filtres
  populateFilterSelects();

  // Event listeners filtres
  document.getElementById('filter-type')?.addEventListener('change', applyInteractionFilters);
  document.getElementById('filter-contact')?.addEventListener('change', applyInteractionFilters);
  document.getElementById('filter-entreprise')?.addEventListener('change', applyInteractionFilters);
  document.getElementById('filter-assignee')?.addEventListener('change', applyInteractionFilters);
  document.getElementById('filter-date')?.addEventListener('change', applyInteractionFilters);

  // Button nouvelle interaction
  document.getElementById('btn-new-interaction')?.addEventListener('click', () => {
    showToast('➕ Nouvelle interaction (bientôt disponible)');
  });

  // Première render
  applyInteractionFilters();

  console.log('✅ Page Interactions initialisée');
}

// ════════════════════════════════════════════════════════
//  POPULATE FILTER SELECTS
// ════════════════════════════════════════════════════════
function populateFilterSelects() {
  // Contacts uniques
  const contactIds = new Set(allInteractions.map(i => i.contact).filter(Boolean));
  const contactSelect = document.getElementById('filter-contact');
  if (contactSelect) {
    Array.from(contactIds).forEach(id => {
      const contact = allContacts.find(c => c.id === id);
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = contact ? (contact.nom_prenom || `${contact.Prenom} ${contact.Nom}`) : `Contact ${id}`;
      contactSelect.appendChild(opt);
    });
  }

  // Entreprises uniques
  const entrepriseIds = new Set(allInteractions.map(i => i.Entreprise).filter(Boolean));
  const entrepriseSelect = document.getElementById('filter-entreprise');
  if (entrepriseSelect) {
    Array.from(entrepriseIds).forEach(id => {
      const ent = allEntreprises.find(e => e.id === id);
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = ent ? ent.Nom : `Entreprise ${id}`;
      entrepriseSelect.appendChild(opt);
    });
  }

  // Assignees uniques
  const assigneeIds = new Set(allInteractions.map(i => i.assignee_a).filter(Boolean));
  const assigneeSelect = document.getElementById('filter-assignee');
  if (assigneeSelect) {
    Array.from(assigneeIds).forEach(id => {
      const inter = allInteractions.find(i => i.assignee_a === id);
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = inter ? (inter._assigneeNom || `Assignee ${id}`) : `Assignee ${id}`;
      assigneeSelect.appendChild(opt);
    });
  }

  console.log('✅ Filtres peuplés');
}

// ════════════════════════════════════════════════════════
//  APPLY FILTERS
// ════════════════════════════════════════════════════════
function applyInteractionFilters() {
  filterType = document.getElementById('filter-type')?.value || '';
  filterContact = document.getElementById('filter-contact')?.value || '';
  filterEntreprise = document.getElementById('filter-entreprise')?.value || '';
  filterAssignee = document.getElementById('filter-assignee')?.value || '';
  filterDate = document.getElementById('filter-date')?.value || '';

  // Filtrer
  filteredInteractions = allInteractions.filter(inter => {
    if (filterType && inter.type_interaction !== filterType) return false;
    if (filterContact && inter.contact !== parseInt(filterContact)) return false;
    if (filterEntreprise && inter.Entreprise !== parseInt(filterEntreprise)) return false;
    if (filterAssignee && inter.assignee_a !== parseInt(filterAssignee)) return false;

    // Filtre date : comparer la date (timestamp vers Date)
    if (filterDate) {
      const filterDateObj = new Date(filterDate);
      const interDate = typeof inter.Date === 'number' ? new Date(inter.Date * 1000) : new Date(inter.Date);
      const sameDay =
        filterDateObj.getFullYear() === interDate.getFullYear() &&
        filterDateObj.getMonth() === interDate.getMonth() &&
        filterDateObj.getDate() === interDate.getDate();
      if (!sameDay) return false;
    }

    return true;
  });

  // Trier par date décroissante (récent en premier)
  filteredInteractions.sort((a, b) => {
    const dateA = typeof a.Date === 'number' ? a.Date : 0;
    const dateB = typeof b.Date === 'number' ? b.Date : 0;
    return dateB - dateA;
  });

  renderInteractionsTimeline();

  console.log(`🔍 ${filteredInteractions.length} interactions affichées`);
}

// ════════════════════════════════════════════════════════
//  RENDER TIMELINE
// ════════════════════════════════════════════════════════
function renderInteractionsTimeline() {
  const container = document.getElementById('interactions-timeline');
  if (!container) return;

  if (filteredInteractions.length === 0) {
    container.innerHTML = `
      <div class="timeline-empty">
        <div class="timeline-empty-icon">💭</div>
        <div class="timeline-empty-text">Aucune interaction trouvée</div>
      </div>
    `;
    return;
  }

  let html = '';

  filteredInteractions.forEach(inter => {
    const typeIcon = getInteractionIcon(inter.type_interaction);
    const typeDotClass = inter.type_interaction.toLowerCase().replace('é', 'e');
    const contact = allContacts.find(c => c.id === inter.contact);
    const contactName = contact ? (contact.nom_prenom || `${contact.Prenom} ${contact.Nom}`) : '—';
    const entreprise = allEntreprises.find(e => e.id === inter.Entreprise);
    const entrepriseName = entreprise ? entreprise.Nom : '—';
    const dateStr = formatDatetime(inter.Date);

    html += `
      <div class="timeline-item" data-inter-id="${inter.id}" onclick="openInteractionsPanel(${inter.id})">
        <div class="timeline-dot ${typeDotClass}">${typeIcon}</div>
        <div class="timeline-card">
          <div class="timeline-card-header">
            <div class="timeline-card-type">${inter.type_interaction}</div>
            <div class="timeline-card-date">${dateStr}</div>
          </div>
          <div class="timeline-card-contact">
            <strong>${escHtml(contactName)}</strong> @ ${escHtml(entrepriseName)}
          </div>
          <div class="timeline-card-content">${escHtml(inter.contenu || '(Aucun contenu)')}</div>
          <div class="timeline-card-footer">
            ${inter.duree ? `<span class="timeline-card-badge">⏱️ ${inter.duree}min</span>` : ''}
            ${inter._assigneeNom ? `<span class="timeline-card-badge">👤 ${escHtml(inter._assigneeNom)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  console.log('✅ Timeline rendue');
}

// ════════════════════════════════════════════════════════
//  OPEN PANEL
// ════════════════════════════════════════════════════════
function openInteractionsPanel(interId) {
  const inter = allInteractions.find(i => i.id === interId);
  if (!inter) return;

  selectedInteraction = inter;

  const contact = allContacts.find(c => c.id === inter.contact);
  const entreprise = allEntreprises.find(e => e.id === inter.Entreprise);

  const contactName = contact ? (contact.nom_prenom || `${contact.Prenom} ${contact.Nom}`) : '—';
  const entrepriseName = entreprise ? entreprise.Nom : '—';
  const dateStr = formatDatetime(inter.Date);
  const typeIcon = getInteractionIcon(inter.type_interaction);

  // Remplir le panel
  const panelTitle = document.getElementById('panel-title');
  if (panelTitle) {
    panelTitle.textContent = `${typeIcon} ${inter.type_interaction}`;
  }

  const panelBody = document.getElementById('panel-body');
  if (panelBody) {
    panelBody.innerHTML = `
      <div class="panel-section">
        <div class="panel-section-title">Infos principales</div>
        <div class="panel-info">
          <div class="panel-info-row">
            <div class="panel-info-label">Date</div>
            <div class="panel-info-value">${dateStr}</div>
          </div>
          <div class="panel-info-row">
            <div class="panel-info-label">Type</div>
            <div class="panel-info-value">${inter.type_interaction}</div>
          </div>
          <div class="panel-info-row">
            <div class="panel-info-label">Personne</div>
            <div class="panel-info-value">${escHtml(contactName)}</div>
          </div>
          <div class="panel-info-row">
            <div class="panel-info-label">Entreprise</div>
            <div class="panel-info-value">${escHtml(entrepriseName)}</div>
          </div>
          ${inter.duree ? `
          <div class="panel-info-row">
            <div class="panel-info-label">Durée</div>
            <div class="panel-info-value">${inter.duree} min</div>
          </div>
          ` : ''}
          ${inter._assigneeNom ? `
          <div class="panel-info-row">
            <div class="panel-info-label">Assigné à</div>
            <div class="panel-info-value">${escHtml(inter._assigneeNom)}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">Contenu</div>
        <div class="panel-info">
          <div class="panel-info-value" style="white-space: pre-wrap; line-height: 1.5;">
            ${escHtml(inter.contenu || '(Aucun contenu)')}
          </div>
        </div>
      </div>

      <div class="panel-actions">
        <button class="btn-panel-edit" onclick="editInteraction(${inter.id})">✏️ Modifier</button>
        <button class="btn-panel-delete" onclick="deleteInteraction(${inter.id})">🗑️ Supprimer</button>
      </div>
    `;
  }

  // Ouvrir le panel
  const panel = document.getElementById('interactions-panel');
  if (panel) {
    panel.classList.add('open');
  }
}

// ════════════════════════════════════════════════════════
//  CLOSE PANEL
// ════════════════════════════════════════════════════════
function closeInteractionsPanel() {
  const panel = document.getElementById('interactions-panel');
  if (panel) {
    panel.classList.remove('open');
  }
  selectedInteraction = null;
}

// ════════════════════════════════════════════════════════
//  EDIT INTERACTION
// ════════════════════════════════════════════════════════
function editInteraction(interId) {
  const inter = allInteractions.find(i => i.id === interId);
  if (!inter) return;

  const contact = allContacts.find(c => c.id === inter.contact);
  const entreprise = allEntreprises.find(e => e.id === inter.Entreprise);
  const assignee = allContacts.find(c => c.id === inter.assignee_a);

  const contactName = contact ? (contact.nom_prenom || `${contact.Prenom} ${contact.Nom}`) : '—';
  const entrepriseName = entreprise ? entreprise.Nom : '—';
  const assigneeName = assignee ? (assignee.nom_prenom || `${assignee.Prenom} ${assignee.Nom}`) : '—';
  const dateStr = new Date(typeof inter.Date === 'number' ? inter.Date * 1000 : inter.Date).toISOString().split('T')[0];

  const modal = document.getElementById('interaction-edit-modal');
  const modalBody = document.getElementById('interaction-edit-body');

  if (modalBody) {
    modalBody.innerHTML = `
      <form id="edit-interaction-form" onsubmit="saveInteractionEdit(event, ${inter.id})">
        <div class="form-group">
          <label for="edit-type">Type</label>
          <select id="edit-type" required>
            <option value="Appel" ${inter.type_interaction === 'Appel' ? 'selected' : ''}>📞 Appel</option>
            <option value="Email" ${inter.type_interaction === 'Email' ? 'selected' : ''}>📧 Email</option>
            <option value="Réunion" ${inter.type_interaction === 'Réunion' ? 'selected' : ''}>🤝 Réunion</option>
            <option value="Note" ${inter.type_interaction === 'Note' ? 'selected' : ''}>📝 Note</option>
          </select>
        </div>

        <div class="form-group">
          <label for="edit-date">Date</label>
          <input type="date" id="edit-date" value="${dateStr}" required>
        </div>

        <div class="form-group">
          <label for="edit-contact">Personne (lecture seule)</label>
          <input type="text" id="edit-contact" value="${escHtml(contactName)}" disabled>
        </div>

        <div class="form-group">
          <label for="edit-entreprise">Entreprise (lecture seule)</label>
          <input type="text" id="edit-entreprise" value="${escHtml(entrepriseName)}" disabled>
        </div>

        <div class="form-group">
          <label for="edit-duree">Durée (minutes)</label>
          <input type="number" id="edit-duree" value="${inter.duree || ''}" min="0">
        </div>

        <div class="form-group">
          <label for="edit-contenu">Contenu</label>
          <textarea id="edit-contenu" rows="6">${escHtml(inter.contenu || '')}</textarea>
        </div>

        <div class="form-group">
          <label for="edit-assignee">Assigné à (lecture seule)</label>
          <input type="text" id="edit-assignee" value="${escHtml(assigneeName)}" disabled>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick="closeInteractionEditModal()">Annuler</button>
          <button type="submit" class="btn-primary">Enregistrer</button>
        </div>
      </form>
    `;
  }

  if (modal) {
    modal.classList.add('open');
  }
}

async function saveInteractionEdit(event, interId) {
  event.preventDefault();

  const newType = document.getElementById('edit-type')?.value;
  const newDateStr = document.getElementById('edit-date')?.value;
  const newDuree = document.getElementById('edit-duree')?.value || null;
  const newContenu = document.getElementById('edit-contenu')?.value;

  if (!newType || !newDateStr) {
    showToast('❌ Type et date obligatoires');
    return;
  }

  // Convertir la date en timestamp
  const dateObj = new Date(newDateStr);
  const newDateTs = Math.floor(dateObj.getTime() / 1000);

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        [
          'UpdateRecord',
          'Interactions',
          interId,
          {
            type_interaction: newType,
            Date: newDateTs,
            duree: newDuree ? parseInt(newDuree) : null,
            contenu: newContenu,
          },
        ],
      ]);
      showToast('✅ Interaction mise à jour !');
      closeInteractionEditModal();
      applyInteractionFilters(); // Re-render
    } catch (err) {
      console.error(err);
      showToast('❌ Erreur lors de la sauvegarde');
    }
  }
}

function closeInteractionEditModal() {
  const modal = document.getElementById('interaction-edit-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

// ════════════════════════════════════════════════════════
//  DELETE INTERACTION
// ════════════════════════════════════════════════════════
async function deleteInteraction(interId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette interaction ?')) return;

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([['RemoveRecord', 'Interactions', interId]]);
      showToast('✅ Interaction supprimée !');
      closeInteractionsPanel();
      allInteractions = allInteractions.filter(i => i.id !== interId);
      applyInteractionFilters(); // Re-render
    } catch (err) {
      console.error(err);
      showToast('❌ Erreur lors de la suppression');
    }
  }
}

// ════════════════════════════════════════════════════════
//  RESET FILTERS
// ════════════════════════════════════════════════════════
function resetInteractionFilters() {
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-contact').value = '';
  document.getElementById('filter-entreprise').value = '';
  document.getElementById('filter-assignee').value = '';
  document.getElementById('filter-date').value = '';

  applyInteractionFilters();
  showToast('🔄 Filtres réinitialisés');
}

// ════════════════════════════════════════════════════════
//  HELPER : GET ICON BY TYPE
// ════════════════════════════════════════════════════════
function getInteractionIcon(type) {
  const icons = {
    Appel: '📞',
    Email: '📧',
    Réunion: '🤝',
    Note: '📝',
  };
  return icons[type] || '💬';
}
