// ════════════════════════════════════════════════════════
//  INTERACTIONS PAGE — Module Complet v1.1
// ════════════════════════════════════════════════════════
console.log('✅ interactions-page.js chargé');

// ── État ──────────────────────────────────────────────
let filteredInteractions = [];
let currentInteraction = null;

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
  initInteractionsPageEvents();
  initInteractionFilters();
  applyInteractionFilters();
});

// ════════════════════════════════════════════════════════
//  INIT FILTERS (remplir les dropdowns)
// ════════════════════════════════════════════════════════
function initInteractionFilters() {
  console.log('🔄 Initialisation filtres...', {
    interactions: allInteractions.length,
    contacts: allContacts.length,
    opps: allOpportunites.length,
  });

  // ──────────────────────────────────────────
  // TYPES (valeurs fixes)
  // ──────────────────────────────────────────
  const typeSelect = document.getElementById('filter-type');
  if (typeSelect) {
    const types = ['Appel', 'Email', 'Réunion', 'Note'];
    types.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = `${getInteractionIcon(type)} ${type}`;
      typeSelect.appendChild(opt);
    });
    console.log('✅ Types remplis:', types.length);
  }

  // ──────────────────────────────────────────
  // CONTACTS (unique dans les interactions)
  // ──────────────────────────────────────────
  const contactSelect = document.getElementById('filter-contact');
  if (contactSelect) {
    const contactIds = [...new Set(
      allInteractions
        .map(i => i.contact)
        .filter(id => id && id > 0)
    )];

    console.log('📞 Contact IDs trouvés:', contactIds);

    const uniqueContacts = contactIds
      .map(id => {
        const contact = allContacts.find(c => c.id === id);
        return {
          id,
          nom: contact
            ? (contact.nom_prenom || `${contact.Prenom || ''} ${contact.Nom || ''}`.trim() || `Contact ${id}`)
            : `Contact ${id}`
        };
      })
      .filter(c => c.nom && c.nom !== 'Contact undefined');

    console.log('✅ Contacts uniques:', uniqueContacts);

    uniqueContacts.sort((a, b) => a.nom.localeCompare(b.nom));

    uniqueContacts.forEach(contact => {
      const opt = document.createElement('option');
      opt.value = contact.id;
      opt.textContent = contact.nom;
      contactSelect.appendChild(opt);
    });

    console.log('✅ Dropdown Contacts rempli:', uniqueContacts.length);
  }

  // ──────────────────────────────────────────
  // OPPORTUNITÉS (et leurs entreprises)
  // ──────────────────────────────────────────
  const entrepriseSelect = document.getElementById('filter-entreprise');
  if (entrepriseSelect) {
    const oppIds = [...new Set(
      allInteractions
        .map(i => i.Opportunite)
        .filter(id => id && id > 0)
    )];

    console.log('🎯 Opp IDs trouvés:', oppIds);

    const uniqueOpps = oppIds
      .map(id => {
        const opp = allOpportunites.find(o => o.id === id);
        return {
          id,
          titre: opp?.titre || `Opp ${id}`,
          entrepriseNom: opp?._entrepriseNom || '—'
        };
      })
      .filter(o => o.titre && o.titre !== 'undefined');

    console.log('✅ Opps uniques:', uniqueOpps);

    uniqueOpps.sort((a, b) => a.titre.localeCompare(b.titre));

    uniqueOpps.forEach(opp => {
      const opt = document.createElement('option');
      opt.value = opp.id;
      opt.textContent = `${opp.titre} (${opp.entrepriseNom})`;
      entrepriseSelect.appendChild(opt);
    });

    console.log('✅ Dropdown Opportunités rempli:', uniqueOpps.length);
  }

  // ──────────────────────────────────────────
  // ASSIGNÉS (unique dans les interactions)
  // ──────────────────────────────────────────
  const assigneeSelect = document.getElementById('filter-assignee');
  if (assigneeSelect) {
    const assigneeIds = [...new Set(
      allInteractions
        .map(i => i.Assigne)
        .filter(id => id && id > 0)
    )];

    console.log('👨‍💼 Assignee IDs trouvés:', assigneeIds);

    const uniqueAssignees = assigneeIds
      .map(id => {
        const contact = allContacts.find(c => c.id === id);
        return {
          id,
          nom: contact
            ? (contact.nom_prenom || `${contact.Prenom || ''} ${contact.Nom || ''}`.trim() || `Assignee ${id}`)
            : `Assignee ${id}`
        };
      })
      .filter(a => a.nom && a.nom !== 'Assignee undefined');

    console.log('✅ Assignees uniques:', uniqueAssignees);

    uniqueAssignees.sort((a, b) => a.nom.localeCompare(b.nom));

    uniqueAssignees.forEach(assignee => {
      const opt = document.createElement('option');
      opt.value = assignee.id;
      opt.textContent = assignee.nom;
      assigneeSelect.appendChild(opt);
    });

    console.log('✅ Dropdown Assignees rempli:', uniqueAssignees.length);
  }

  console.log('✅ Tous les filtres initialisés');
}

// ════════════════════════════════════════════════════════
//  APPLIQUER LES FILTRES
// ════════════════════════════════════════════════════════
function applyInteractionFilters() {
  const typeFilter = document.getElementById('filter-type')?.value || '';
  const contactFilter = document.getElementById('filter-contact')?.value || '';
  const entrepriseFilter = document.getElementById('filter-entreprise')?.value || '';
  const assigneeFilter = document.getElementById('filter-assignee')?.value || '';
  const dateFilter = document.getElementById('filter-date')?.value || '';

  filteredInteractions = allInteractions.filter(inter => {
    // Type
    if (typeFilter && inter.type_interaction !== typeFilter) return false;

    // Contact
    if (contactFilter && inter.contact !== parseInt(contactFilter)) return false;

    // Opportunité
    if (entrepriseFilter && inter.Opportunite !== parseInt(entrepriseFilter)) return false;

    // Assignee
    if (assigneeFilter && inter.Assigne !== parseInt(assigneeFilter)) return false;

    // Date (simple: année-mois)
    if (dateFilter) {
      const interDate = formatDate(inter.Date);
      if (!interDate.includes(dateFilter)) return false;
    }

    return true;
  });

  // Trier : plus récent en premier
  filteredInteractions.sort((a, b) => (a.Date || 0) - (b.Date || 0));



  renderInteractionsTimeline();
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
        <div class="timeline-empty-icon">💬</div>
        <p>Aucune interaction trouvée</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredInteractions.map(inter => {
    const icon = getInteractionIcon(inter.type_interaction);
    const date = formatDatetime(inter.Date);
    const contact = inter._contactNom || '—';
    const assignee = inter._assigneeNom || '—';
    const opp = inter._opportuniteTitre || '—';
    const entreprise = inter._entrepriseNom || '—';
    const contenu = inter.contenu || '(Pas de contenu)';
    const duree = inter.duree ? `${inter.duree} min` : '—';

    return `
      <div class="timeline-item" data-id="${inter.id}" style="cursor: pointer;">
        <div class="timeline-dot">${icon}</div>
        <div class="timeline-content">
          <div class="timeline-header">
            <div class="timeline-type-badge">${inter.type_interaction}</div>
            <div class="timeline-date">${date}</div>
          </div>

          <div class="timeline-details">
            <p><strong>👤 Contact :</strong> ${contact}</p>
            <p><strong>🏢 Entreprise :</strong> ${entreprise}</p>
            <p><strong>🎯 Opportunité :</strong> ${opp}</p>
            <p><strong>👨‍💼 Assigné à :</strong> ${assignee}</p>
            <p><strong>⏱️ Durée :</strong> ${duree}</p>
            <p><strong>📝 Contenu :</strong></p>
            <p class="timeline-contenu">${contenu}</p>
          </div>

          <div class="timeline-actions">
            <button class="btn-small" onclick="openInteractionPanel(${inter.id})">✏️ Détails</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Ajouter event listeners
  document.querySelectorAll('.timeline-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        openInteractionPanel(parseInt(item.dataset.id));
      }
    });
  });
}

// ════════════════════════════════════════════════════════
//  OPEN INTERACTION PANEL (lecture seule)
// ════════════════════════════════════════════════════════
function openInteractionPanel(interId) {
  const inter = allInteractions.find(i => i.id === interId);
  if (!inter) return;

  currentInteraction = inter;

  const panel = document.getElementById('interactions-panel');
  if (!panel) return;

  const icon = getInteractionIcon(inter.type_interaction);
  const date = formatDatetime(inter.Date);

  panel.innerHTML = `
    <div class="panel-header">
      <h2>${icon} ${inter.type_interaction}</h2>
      <button class="btn-close" onclick="closeInteractionsPanel()">✕</button>
    </div>

    <div class="panel-body">
      <div class="panel-field">
        <label>📅 Date</label>
        <p>${date}</p>
      </div>

      <div class="panel-field">
        <label>👤 Contact</label>
        <p>${inter._contactNom || '—'}</p>
      </div>

      <div class="panel-field">
        <label>🏢 Entreprise</label>
        <p>${inter._entrepriseNom || '—'}</p>
      </div>

      <div class="panel-field">
        <label>🎯 Opportunité</label>
        <p>${inter._opportuniteTitre || '—'}</p>
      </div>

      <div class="panel-field">
        <label>👨‍💼 Assigné à</label>
        <p>${inter._assigneeNom || '—'}</p>
      </div>

      <div class="panel-field">
        <label>⏱️ Durée</label>
        <p>${inter.duree ? inter.duree + ' min' : '—'}</p>
      </div>

      <div class="panel-field">
        <label>📝 Contenu</label>
        <p class="panel-content-text">${inter.contenu || '(Pas de contenu)'}</p>
      </div>

      <div class="panel-actions">
        <button class="btn-secondary" onclick="openInteractionEditModal(${inter.id})">✏️ Modifier</button>
        <button class="btn-danger" onclick="deleteInteraction(${inter.id})">🗑️ Supprimer</button>
      </div>
    </div>
  `;

  panel.classList.add('open');
  document.getElementById('overlay-interactions').classList.add('open');
}

// ════════════════════════════════════════════════════════
//  CLOSE PANEL
// ════════════════════════════════════════════════════════
function closeInteractionsPanel() {
  const panel = document.getElementById('interactions-panel');
  if (panel) panel.classList.remove('open');
  document.getElementById('overlay-interactions')?.classList.remove('open');
  currentInteraction = null;
}

// ════════════════════════════════════════════════════════
//  OPEN EDIT MODAL
// ════════════════════════════════════════════════════════
function openInteractionEditModal(interId) {
  const inter = allInteractions.find(i => i.id === interId);
  if (!inter) return;

  currentInteraction = inter;

  document.getElementById('edit-inter-type').value = inter.type_interaction;
  document.getElementById('edit-inter-date').value = inter.Date ? new Date(inter.Date * 1000).toISOString().split('T')[0] : '';
  document.getElementById('edit-inter-contact').value = inter.contact || '';
  document.getElementById('edit-inter-opp').value = inter.Opportunite || '';
  document.getElementById('edit-inter-assignee').value = inter.Assigne || '';
  document.getElementById('edit-inter-duree').value = inter.duree || '';
  document.getElementById('edit-inter-contenu').value = inter.contenu || '';

  document.getElementById('interaction-edit-modal').classList.add('open');
  document.getElementById('overlay-interactions').classList.add('open');
}

function closeInteractionEditModal() {
  document.getElementById('interaction-edit-modal').classList.remove('open');
}

// ════════════════════════════════════════════════════════
//  SAVE INTERACTION
// ════════════════════════════════════════════════════════
async function saveInteractionEdit() {
  if (!currentInteraction || !gristReady) return;

  const newType = document.getElementById('edit-inter-type').value;
  const newDate = document.getElementById('edit-inter-date').value;
  const newContact = parseInt(document.getElementById('edit-inter-contact').value) || null;
  const newOpp = parseInt(document.getElementById('edit-inter-opp').value) || null;
  const newAssignee = parseInt(document.getElementById('edit-inter-assignee').value) || null;
  const newDuree = document.getElementById('edit-inter-duree').value;
  const newContenu = document.getElementById('edit-inter-contenu').value;

  if (!newType) {
    showToast('❌ Le type est obligatoire');
    return;
  }

  try {
    const dateTs = newDate ? Math.floor(new Date(newDate).getTime() / 1000) : 0;

    await grist.docApi.applyUserActions([
      [
        'UpdateRecord',
        'Interactions',
        currentInteraction.id,
        {
          type_interaction: newType,
          Date: dateTs,
          contact: newContact,
          Opportunite: newOpp,
          Assigne: newAssignee,
          duree: newDuree ? parseInt(newDuree) : null,
          contenu: newContenu,
        },
      ],
    ]);

    showToast('✅ Interaction mise à jour !');
    closeInteractionEditModal();
    await loadInteractions();
    initInteractionFilters();
    applyInteractionFilters();
  } catch (err) {
    console.error(err);
    showToast('❌ Erreur lors de la sauvegarde');
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
      await loadInteractions();
      initInteractionFilters();
      applyInteractionFilters();
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
//  EVENTS
// ════════════════════════════════════════════════════════
function initInteractionFilters() {
  console.log('🔄 Initialisation filtres...', {
    interactions: allInteractions.length,
    contacts: allContacts.length,
    opps: allOpportunites.length,
  });

  // ──────────────────────────────────────────
  // TYPES (valeurs fixes)
  // ──────────────────────────────────────────
  const typeSelect = document.getElementById('filter-type');
  if (typeSelect) {
    const types = ['Appel', 'Email', 'Réunion', 'Note'];
    types.forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = `${getInteractionIcon(type)} ${type}`;
      typeSelect.appendChild(opt);
    });
    console.log('✅ Types remplis:', types.length);
  }

  // ──────────────────────────────────────────
  // CONTACTS (unique dans les interactions)
  // ──────────────────────────────────────────
  const contactSelect = document.getElementById('filter-contact');
  if (contactSelect) {
    const contactIds = [...new Set(
      allInteractions
        .map(i => i.contact)
        .filter(id => id && id > 0)
    )];

    console.log('📞 Contact IDs trouvés:', contactIds);

    const uniqueContacts = contactIds
      .map(id => {
        const contact = allContacts.find(c => c.id === id);
        if (!contact) return null;
        
        // ✅ CORRIGÉ : Utiliser Nom + Prenom si nom_prenom vide
        const nom = (contact.nom_prenom && contact.nom_prenom.trim()) 
          ? contact.nom_prenom 
          : `${contact.Prenom || ''} ${contact.Nom || ''}`.trim();

        return {
          id,
          nom: nom || `Contact ${id}`
        };
      })
      .filter(c => c !== null);

    console.log('✅ Contacts uniques:', uniqueContacts);

    uniqueContacts.sort((a, b) => a.nom.localeCompare(b.nom));

    uniqueContacts.forEach(contact => {
      const opt = document.createElement('option');
      opt.value = contact.id;
      opt.textContent = contact.nom;
      contactSelect.appendChild(opt);
    });

    console.log('✅ Dropdown Contacts rempli:', uniqueContacts.length);
  }

  // ──────────────────────────────────────────
  // ENTREPRISES (via les opps)
  // ──────────────────────────────────────────
  const entrepriseSelect = document.getElementById('filter-entreprise');
  if (entrepriseSelect) {
    const oppIds = [...new Set(
      allInteractions
        .map(i => i.Opportunite)
        .filter(id => id && id > 0)
    )];

    console.log('🎯 Opp IDs trouvés:', oppIds);

    const uniqueEnterprises = oppIds
      .map(oppId => {
        const opp = allOpportunites.find(o => o.id === oppId);
        if (!opp) return null;

        // ✅ CHERCHER L'ENTREPRISE par l'ID
        const entreprise = allEnterprises.find(e => e.id === opp.Entreprise);
        const entrepriseNom = entreprise?.nom || opp._entrepriseNom || '—';

        return {
          oppId,
          entrepriseId: opp.Entreprise,
          entrepriseNom: entrepriseNom,
          oppTitre: opp.titre
        };
      })
      .filter(e => e !== null)
      .filter((e, idx, arr) => arr.findIndex(x => x.entrepriseId === e.entrepriseId) === idx); // Unique par entreprise

    console.log('✅ Entreprises uniques:', uniqueEnterprises);

    uniqueEnterprises.sort((a, b) => a.entrepriseNom.localeCompare(b.entrepriseNom));

    uniqueEnterprises.forEach(ent => {
      const opt = document.createElement('option');
      opt.value = ent.entrepriseId;
      opt.textContent = ent.entrepriseNom;
      contactSelect.appendChild(opt);
    });

    console.log('✅ Dropdown Entreprises rempli:', uniqueEnterprises.length);
  }

  // ──────────────────────────────────────────
  // ASSIGNÉS (unique dans les interactions)
  // ──────────────────────────────────────────
  const assigneeSelect = document.getElementById('filter-assignee');
  if (assigneeSelect) {
    const assigneeIds = [...new Set(
      allInteractions
        .map(i => i.Assigne)
        .filter(id => id && id > 0)
    )];

    console.log('👨‍💼 Assignee IDs trouvés:', assigneeIds);

    const uniqueAssignees = assigneeIds
      .map(id => {
        const contact = allContacts.find(c => c.id === id);
        if (!contact) return null;

        // ✅ CORRIGÉ : Même logique que les contacts
        const nom = (contact.nom_prenom && contact.nom_prenom.trim())
          ? contact.nom_prenom
          : `${contact.Prenom || ''} ${contact.Nom || ''}`.trim();

        return {
          id,
          nom: nom || `Assignee ${id}`
        };
      })
      .filter(a => a !== null);

    console.log('✅ Assignees uniques:', uniqueAssignees);

    uniqueAssignees.sort((a, b) => a.nom.localeCompare(b.nom));

    uniqueAssignees.forEach(assignee => {
      const opt = document.createElement('option');
      opt.value = assignee.id;
      opt.textContent = assignee.nom;
      assigneeSelect.appendChild(opt);
    });

    console.log('✅ Dropdown Assignees rempli:', uniqueAssignees.length);
  }

  console.log('✅ Tous les filtres initialisés');
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
