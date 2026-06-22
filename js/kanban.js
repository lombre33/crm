// ════════════════════════════════════════════════════════
//  KANBAN — Render + Cards + Drag & Drop
// ════════════════════════════════════════════════════════

function renderKanban() {
  STATUTS.forEach(statut => {
    const col = document.querySelector(`.kanban-col[data-statut="${statut}"]`);
    if (!col) return;

    const container = col.querySelector('.cards-container');
    if (!container) return;

    const cards = allOpportunites.filter(o => o.statut === statut);

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

  initDragDrop();
}

function createCard(opp) {
  const card = document.createElement('div');
  card.className = 'kanban-card';  // ← CORRIGÉ : 'opportunity-card' → 'kanban-card'
  card.draggable = true;
  card.dataset.id = opp.id;

  const prioIcon = { 'Haute':'🔴', 'Moyenne':'🟡', 'Basse':'⚪' }[opp.Priorite] || '⚪';
  const prioColor = { 'Haute':'#dc2626', 'Moyenne':'#d97706', 'Basse':'#059669' }[opp.Priorite] || '#6b7280';

  card.innerHTML = `
    <div class="card-title">${escHtml(opp.titre)}</div>
    <div class="card-company">${escHtml(opp.entreprise_nom || '—')}</div>
    <div class="card-contact">
      <div class="contact-avatar">${(opp.contact_nom || '?')[0].toUpperCase()}</div>
      <span>${escHtml(opp.contact_nom || '—')}</span>
    </div>
    <div class="card-footer">
      <div class="card-amount">${formatEuros(opp.valeur_estimee)}</div>
      <span class="card-priority" style="background: ${prioColor}20; color: ${prioColor};">
        ${prioIcon} ${opp.Priorite}
      </span>
    </div>
    <div class="card-date">📅 ${formatDate(opp.date_clotureestimee)}</div>
  `;

  // Ouverture du panel au clic
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    openPanel(opp);
  });

  return card;
}

function initDragDrop() {
  const cards = document.querySelectorAll('.kanban-card');
  const cols = document.querySelectorAll('.kanban-col');

  // Drag sur les cartes
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedCardId = parseInt(card.dataset.id);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedCardId = null;
    });
  });

  // Drop sur les colonnes
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
      
      if (!opp || opp.statut === newStatut) return;

      const oldStatut = opp.statut;
      opp.statut = newStatut;
      renderKanban();

      // Sync avec Grist
      if (gristReady) {
        try {
          await grist.docApi.applyUserActions([
            ['UpdateRecord', 'Opportunites', opp.id, { statut: newStatut }]
          ]);
          showToast(`✅ Déplacé vers "${newStatut}"`);
        } catch (err) {
          console.error('Erreur drag-drop:', err);
          opp.statut = oldStatut;
          renderKanban();
          showToast('❌ Erreur : impossible de déplacer');
        }
      }

      draggedCardId = null;
    });
  });
}

// Animation feedback drag
const style = document.createElement('style');
style.textContent = `
  .kanban-card.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }
  .kanban-col.drag-over {
    background: rgba(59, 130, 246, 0.08) !important;
    border-color: rgba(59, 130, 246, 0.3) !important;
  }
`;
document.head.appendChild(style);
