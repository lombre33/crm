// ════════════════════════════════════════════════════════
//  KANBAN
// ════════════════════════════════════════════════════════
function renderKanban() {
  STATUTS.forEach(statut => {
    const col = document.querySelector(`.kanban-col[data-statut="${statut}"]`);
    if (!col) return;

    const container = col.querySelector('.cards-container');
    if (!container) return;

    const cards = allOpportunites.filter(o => o.statut === statut);

    // Total colonne
    const total = cards.reduce((sum, o) => sum + (o.valeur_estilmee || 0), 0);
    const colTotal = col.querySelector('.col-total');
    if (colTotal) colTotal.textContent = formatEuros(total);

    // Count badge
    const countBadge = col.querySelector('.col-count');
    if (countBadge) countBadge.textContent = cards.length;

    container.innerHTML = '';
    cards.forEach(opp => container.appendChild(createCard(opp)));
  });

  initDragDrop();
}

function createCard(opp) {
  const card = document.createElement('div');
  card.className = 'opportunity-card';
  card.draggable = true;
  card.dataset.id = opp.id;

  const prioColor = PRIORITE_COLOR[opp.Priorite] || '#6b7280';
  const prioIcon  = { Haute:'🔴', Moyenne:'🟡', Basse:'⚪' }[opp.Priorite] || '⚪';

  card.innerHTML = `
    <div class="card-title">${escHtml(opp.titre)}</div>
    <div class="card-company">🏢 ${escHtml(opp._entrepriseNom)}</div>
    <div class="card-contact">👤 ${escHtml(opp._contactNom)}</div>
    <div class="card-footer">
      <div class="card-amount">💰 ${formatEuros(opp.valeur_estilmee)}</div>
      <div class="card-prio" style="color:${prioColor}; font-weight:600; font-size:0.78rem;">
        ${prioIcon} ${opp.Priorite}
      </div>
    </div>
  `;

  card.addEventListener('click', () => openPanel(opp));
  return card;
}

function initDragDrop() {
  const cards = document.querySelectorAll('.opportunity-card');
  const cols   = document.querySelectorAll('.kanban-col');

  cards.forEach(card => {
    card.addEventListener('dragstart', () => {
      draggedCardId = parseInt(card.dataset.id);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });

  cols.forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', async () => {
      col.classList.remove('drag-over');
      if (!draggedCardId) return;

      const newStatut = col.dataset.statut;
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
          opp.statut = oldStatut;
          renderKanban();
          showToast('❌ Erreur lors de la mise à jour');
        }
      }
    });
  });
}
