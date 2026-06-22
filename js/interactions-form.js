// ════════════════════════════════════════════════════════
//  MODAL INTERACTIONS — Formulaire + Édition
// ════════════════════════════════════════════════════════
console.log('✅ interactions-form.js chargé');

let currentInteraction = null; // Interaction en cours d'édition

// ════════════════════════════════════════════════════════
//  OUVRIR LE FORMULAIRE (NEW ou EDIT)
// ════════════════════════════════════════════════════════
function openInteractionForm(interaction = null) {
  if (!currentOpp) {
    showToast('❌ Aucune opportunité sélectionnée');
    return;
  }

  currentInteraction = interaction;
  renderInteractionModal(interaction);
  
  const modal = document.getElementById('interaction-modal');
  if (modal) modal.classList.add('open');
}

function closeInteractionForm() {
  const modal = document.getElementById('interaction-modal');
  if (modal) modal.classList.remove('open');
  currentInteraction = null;
}

// ════════════════════════════════════════════════════════
//  RENDU MODAL
// ════════════════════════════════════════════════════════
function renderInteractionModal(interaction = null) {
  const modalEl = document.getElementById('interaction-modal');
  if (!modalEl) return;

  const isEdit = !!interaction;
  const title = isEdit ? '✏️ Éditer l\'interaction' : '➕ Nouvelle interaction';
  
  const type = interaction?.type_interaction || 'Email';
  const contenu = interaction?.contenu || '';
  let dateVal = new Date().toISOString().slice(0, 16);
  if (interaction?.Date && interaction.Date > 0) {
    try {
      dateVal = new Date(interaction.Date * 1000).toISOString().slice(0, 16);
    } catch (e) {
      console.warn('⚠️ Date invalide:', interaction.Date);
    }
  }

  const typeOpts = ['Email', 'Appel', 'Réunion', 'Visite', 'Devis', 'Contrat', 'Note', 'Autre']
    .map(t => `<option value="${t}" ${t === type ? 'selected' : ''}>${t}</option>`)
    .join('');

  modalEl.innerHTML = `
    <div class="interaction-modal-content">
      <div class="interaction-modal-header">
        <h2>${title}</h2>
        <button class="interaction-close-btn" onclick="closeInteractionForm()">✕</button>
      </div>

      <div class="interaction-modal-body">
        <div class="form-group">
          <label class="form-label">Type d'interaction</label>
          <select id="inter-type" class="form-select">
            ${typeOpts}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Date & Heure</label>
          <input type="datetime-local" id="inter-date" class="form-input" value="${dateVal}">
        </div>

        <div class="form-group">
          <label class="form-label">Contenu / Notes</label>
          <textarea id="inter-contenu" class="form-textarea" placeholder="Décrivez cette interaction...">${escHtml(contenu)}</textarea>
        </div>

        ${isEdit ? `
          <div class="form-group">
            <label class="form-label">Créée le</label>
            <div class="form-info">${formatDatetime(interaction.Date)}</div>
          </div>
        ` : ''}
      </div>

      <div class="interaction-modal-footer">
        <button id="btn-save-inter" class="btn-primary" onclick="saveInteraction()">
          ${isEdit ? '💾 Mettre à jour' : '➕ Ajouter interaction'}
        </button>
        <button class="btn-cancel" onclick="closeInteractionForm()">Annuler</button>
        ${isEdit ? `
          <button class="btn-danger" onclick="deleteInteraction(${interaction.id})">
            🗑️ Supprimer
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════
//  SAUVEGARDER INTERACTION
// ════════════════════════════════════════════════════════
async function saveInteraction() {
  if (!currentOpp) return;

  const type = document.getElementById('inter-type').value;
  const dateStr = document.getElementById('inter-date').value;
  const contenu = document.getElementById('inter-contenu').value.trim();

  if (!contenu) {
    showToast('❌ Le contenu est obligatoire');
    return;
  }

  if (!dateStr) {
    showToast('❌ La date est obligatoire');
    return;
  }

  const dateTs = Math.floor(new Date(dateStr).getTime() / 1000);

  console.log('💾 Sauvegarde interaction:', {
    isEdit: !!currentInteraction,
    type,
    dateTs,
    contenu
  });

  if (gristReady) {
    try {
      if (currentInteraction) {
        // ÉDITION
        await grist.docApi.applyUserActions([
          ['UpdateRecord', 'Interactions', currentInteraction.id, {
            type_interaction: type,
            Date: dateTs,
            contenu: contenu
          }]
        ]);
        showToast('✅ Interaction mise à jour !');
        console.log('✅ Interaction éditée:', currentInteraction.id);
      } else {
        // CRÉATION
        await grist.docApi.applyUserActions([
          ['AddRecord', 'Interactions', null, {
            Opportunite: currentOpp.id,
            type_interaction: type,
            Date: dateTs,
            contenu: contenu
          }]
        ]);
        showToast('✅ Interaction ajoutée !');
        console.log('✅ Nouvelle interaction créée');
      }

      // Recharger les interactions
      await loadInteractions();
      
      // Re-render timeline
      renderTimeline(currentOpp);
      
      closeInteractionForm();
    } catch (err) {
      console.error('❌ Erreur save interaction:', err);
      showToast('❌ Erreur lors de la sauvegarde');
    }
  }
}

// ════════════════════════════════════════════════════════
//  SUPPRIMER INTERACTION
// ════════════════════════════════════════════════════════
async function deleteInteraction(interactionId) {
  if (!confirm('Supprimer cette interaction ?')) return;

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        ['RemoveRecord', 'Interactions', interactionId]
      ]);
      showToast('✅ Interaction supprimée');
      console.log('🗑️ Interaction supprimée:', interactionId);

      await loadInteractions();
      renderTimeline(currentOpp);
      closeInteractionForm();
    } catch (err) {
      console.error('❌ Erreur delete interaction:', err);
      showToast('❌ Erreur lors de la suppression');
    }
  }
}

// ════════════════════════════════════════════════════════
//  STYLES MODAL
// ════════════════════════════════════════════════════════
if (!document.getElementById('interaction-modal-styles')) {
  const style = document.createElement('style');
  style.id = 'interaction-modal-styles';
  style.textContent = `
    #interaction-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }

    #interaction-modal.open {
      display: flex;
    }

    .interaction-modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .interaction-modal-header {
      padding: 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .interaction-modal-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .interaction-close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #94a3b8;
      transition: color 0.2s;
      padding: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .interaction-close-btn:hover {
      color: #475569;
    }

    .interaction-modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .interaction-modal-body .form-group {
      margin-bottom: 20px;
    }

    .interaction-modal-body .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .interaction-modal-body .form-select,
    .interaction-modal-body .form-input,
    .interaction-modal-body .form-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .interaction-modal-body .form-select:focus,
    .interaction-modal-body .form-input:focus,
    .interaction-modal-body .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .interaction-modal-body .form-textarea {
      resize: vertical;
      min-height: 120px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .form-info {
      font-size: 14px;
      color: #64748b;
      padding: 10px 12px;
      background: #f1f5f9;
      border-radius: 6px;
    }

    .interaction-modal-footer {
      padding: 20px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    .interaction-modal-footer button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }
  `;
  document.head.appendChild(style);
}
