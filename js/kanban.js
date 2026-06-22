// ════════════════════════════════════════════════════════
//  FILTRE KANBAN
// ════════════════════════════════════════════════════════
let filteredOpportunitesAssignee = null; // ID de l'assignee sélectionné
let allAssignees = []; // Liste des assignees disponibles

// ════════════════════════════════════════════════════════
//  KANBAN — Render + Cards + Drag & Drop
// ════════════════════════════════════════════════════════

function renderKanban() {
  console.log('🔄 Rendu Kanban — Opps:', allOpportunites.length);

  // 🔑 APPLIQUER LE FILTRE ASSIGNEE
  const oppsAffichees = filteredOpportunitesAssignee 
    ? allOpportunites.filter(o => o.assignee_a === filteredOpportunitesAssignee)
    : allOpportunites;

  console.log(`📊 Filtre assignee: ${filteredOpportunitesAssignee || 'AUCUN'} → ${oppsAffichees.length} opps`);

  STATUTS.forEach(statut => {
    const col = document.querySelector(`.kanban-col[data-statut="${statut}"]`);
    if (!col) {
      console.warn(`⚠️ Colonne "${statut}" non trouvée`);
      return;
    }

    const container = col.querySelector('.cards-container');
    if (!container) {
      console.warn(`⚠️ Container pour "${statut}" non trouvé`);
      return;
    }

    // Filtrer les opps par statut (en utilisant les opps filtrées)
    const cards = oppsAffichees.filter(o => o.statut === statut);
    console.log(`📊 ${statut}: ${cards.length} opps`);

    // Total colonne
    const total = cards.reduce((sum, o) => sum + (o.valeur_estimee || 0), 0);
    const colTotal = col.querySelector('.col-total');
    if (colTotal) colTotal.textContent = formatEuros(total);

    // Count badge
    const countBadge = col.querySelector('.col-count');
    if (countBadge) countBadge.textContent = cards.length;

    // Vide le container
    container.innerHTML = '';

    // Crée les cartes
    cards.forEach(opp => {
      enrichOpp(opp);
      const cardEl = createCard(opp);
      container.appendChild(cardEl);
    });

    // Message "vide" si aucune carte
    if (cards.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-message';
      emptyMsg.textContent = 'Aucune opportunité';
      emptyMsg.style.cssText = `
        text-align: center;
        color: #cbd5e1;
        font-size: 12.5px;
        padding: 20px 10px;
        font-style: italic;
      `;
      container.appendChild(emptyMsg);
    }
  });

  // Initialiser drag & drop
  initDragDrop();
}

// ════════════════════════════════════════════════════════
//  CRÉER UNE CARTE
// ════════════════════════════════════════════════════════

// DEBUUUUUUUUUUUUUUUUUG
console.log(`🔍 DEBUG createCard - Opp ${opp.id}:`, {
  valeur_estimee: opp.valeur_estimee,
  valeur_estilmee: opp.valeur_estilmee, // ← ⚠️ C'est peut-être ça !
  allFields: opp
});

function createCard(opp) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  card.draggable = true;
  card.dataset.id = opp.id;

  // Couleur + icône priorité
  const prioColor = PRIORITE_COLOR[opp.Priorite] || '#6b7280';
  const prioIcon = {
    'Haute': '🔴',
    'Moyenne': '🟡',
    'Basse': '⚪'
  }[opp.Priorite] || '⚪';

  const entrepriseNom = opp._entrepriseNom || '—';
  const contactNom = opp._contactNom || '—';
  const valeur = formatEuros(opp.valeur_estimee || 0);
  
  // 🆕 INITIALES ASSIGNEE
  const assigneeInitiales = opp._assigneeInitiales || '';

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">${escHtml(opp.titre)}</div>
      <div class="card-prio" style="color: ${prioColor}; font-weight: 600;">
        ${prioIcon} ${opp.Priorite || '—'}
      </div>
    </div>
    <div class="card-body">
      <div class="card-field">
        <span class="card-label">🏢</span>
        <span class="card-value">${escHtml(entrepriseNom)}</span>
      </div>
      <div class="card-field">
        <span class="card-label">👤</span>
        <span class="card-value">${escHtml(contactNom)}</span>
      </div>
    </div>
    <div class="card-footer">
      <div class="card-amount">💰 ${valeur}</div>
      ${assigneeInitiales ? `<div class="card-assignee">${escHtml(assigneeInitiales)}</div>` : ''}
    </div>
  `;

  // ⚡ EVENT LISTENER : Click sur la carte
  const handleCardClick = (e) => {
    e.stopPropagation();
    console.log('🖱️ Clic carte:', opp.id, opp.titre);
    
    if (typeof openPanel !== 'function') {
      console.error('❌ openPanel() n\'existe pas !');
      return;
    }
    
    openPanel(opp);
  };
  
  card.addEventListener('click', handleCardClick);

  // Event listeners drag & drop
  card.addEventListener('dragstart', (e) => {
    draggedCardId = parseInt(card.dataset.id);
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    console.log('🎯 Drag start:', draggedCardId);
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  return card;
}



// ════════════════════════════════════════════════════════
//  DRAG & DROP
// ════════════════════════════════════════════════════════
function initDragDrop() {
  const cards = document.querySelectorAll('.kanban-card');
  const cols = document.querySelectorAll('.kanban-col');

  console.log(`🎯 Drag-drop init: ${cards.length} cartes, ${cols.length} colonnes`);

  // Comportement colonnes
  cols.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
      e.dataTransfer.dropEffect = 'move';
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');

      if (!draggedCardId) return;

      const newStatut = col.dataset.statut;
      const opp = allOpportunites.find(o => o.id === draggedCardId);

      if (!opp) {
        console.error('❌ Opp non trouvée:', draggedCardId);
        return;
      }

      if (opp.statut === newStatut) {
        console.log('ℹ️ Même statut, rien à faire');
        return;
      }

      console.log(`📌 Déplacement: ${opp.titre} → ${newStatut}`);

      const oldStatut = opp.statut;
      opp.statut = newStatut;
      renderKanban();

      // Sync Grist
      if (gristReady) {
        try {
          await grist.docApi.applyUserActions([
            ['UpdateRecord', 'Opportunites', opp.id, { statut: newStatut }]
          ]);
          showToast(`✅ Déplacé vers "${newStatut}"`);
        } catch (err) {
          console.error('❌ Erreur drag-drop:', err);
          opp.statut = oldStatut;
          renderKanban();
          showToast('❌ Erreur : impossible de déplacer');
        }
      }

      draggedCardId = null;
    });
  });
}

// ════════════════════════════════════════════════════════
//  STYLE FEEDBACK DRAG (avec ghost image)
// ════════════════════════════════════════════════════════
if (!document.getElementById('kanban-styles')) {
  const style = document.createElement('style');
  style.id = 'kanban-styles';
  style.textContent = `
    .kanban-card {
      cursor: grab;
      transition: all 0.2s ease;
    }
    
    .kanban-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .kanban-card.dragging {
      opacity: 0.7;
      transform: rotate(3deg) scale(1.02);
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      background: rgba(255, 255, 255, 0.95);
    }
    
    .kanban-col.drag-over {
      background: rgba(59, 130, 246, 0.1) !important;
      border: 2px dashed rgba(59, 130, 246, 0.5) !important;
    }
  `;
  document.head.appendChild(style);
}
// ════════════════════════════════════════════════════════
//  INITIALISER LE FILTRE ASSIGNEE
// ════════════════════════════════════════════════════════
function initFilterAssignee() {
  const select = document.getElementById('filter-assignee');
  if (!select) {
    console.warn('⚠️ Dropdown filter-assignee non trouvé');
    return;
  }

  // Extraire les assignees uniques
  const assigneeIds = new Set(allOpportunites
    .filter(o => o.assignee_a)
    .map(o => o.assignee_a)
  );

  console.log(`📋 Assignees uniques trouvés: ${assigneeIds.size}`);

  // Remplir allAssignees avec les noms
  allAssignees = Array.from(assigneeIds).map(id => {
    const opp = allOpportunites.find(o => o.assignee_a === id);
    return {
      id: id,
      nom: opp ? (opp._assigneeNom || `Assignee ${id}`) : `Assignee ${id}`
    };
  });

  // Trier par nom
  allAssignees.sort((a, b) => a.nom.localeCompare(b.nom));

  // Remplir le select
  select.innerHTML = '<option value="">📋 Tous mes collègues</option>';
  allAssignees.forEach(assignee => {
    const opt = document.createElement('option');
    opt.value = assignee.id;
    opt.textContent = assignee.nom;
    select.appendChild(opt);
  });

  // Event listener
  select.addEventListener('change', (e) => {
    filteredOpportunitesAssignee = e.target.value ? parseInt(e.target.value) : null;
    console.log(`🔍 Filtre changé → assignee ${filteredOpportunitesAssignee}`);
    renderKanban();
  });

  console.log('✅ Filtre assignee initialisé');
}
