// ════════════════════════════════════════════════════════
//  ENTREPRISES — Module Complet
// ════════════════════════════════════════════════════════
console.log('✅ enterprises.js chargé');

// ── État ──────────────────────────────────────────────
let currentEnterprise = null;
let filteredEnterprises = [];

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();
  initEnterprisesEvents();
  
  // 🆕 AFFICHER TOUTES LES ENTREPRISES PAR DÉFAUT
  filteredEnterprises = [...allEntreprises];
  
  renderEnterprisesGrid();
  initFilters();
});


// ════════════════════════════════════════════════════════
//  EVENTS
// ════════════════════════════════════════════════════════
function initEnterprisesEvents() {
  // Bouton nouvelle entreprise
  document.getElementById('btn-new-enterprise')
    ?.addEventListener('click', createNewEnterprise);

  // Fermer panel
  document.getElementById('close-enterprise-panel')
    ?.addEventListener('click', closeEnterprisePanel);

  // Overlay
  document.getElementById('overlay')
    ?.addEventListener('click', closeEnterprisePanel);
}

// ════════════════════════════════════════════════════════
//  FILTRES
// ════════════════════════════════════════════════════════
function initFilters() {
  // Remplir dropdowns secteurs
  const secteurSelect = document.getElementById('filter-secteur');
  const villes = [...new Set(allEntreprises.map(e => e.Ville).filter(Boolean))];
  const secteurs = [...new Set(allEntreprises.map(e => e.Secteur).filter(Boolean))];

  secteurs.forEach(sectId => {
    const secteur = allSecteurs?.find(s => s.id === sectId);
    if (secteur) {
      const opt = document.createElement('option');
      opt.value = sectId;
      opt.textContent = secteur.nom || `Secteur ${sectId}`;
      secteurSelect.appendChild(opt);
    }
  });

  // Remplir dropdowns villes
  const villeSelect = document.getElementById('filter-ville');
  villes.forEach(villeId => {
    const ville = allVilles?.find(v => v.id === villeId);
    if (ville) {
      const opt = document.createElement('option');
      opt.value = villeId;
      opt.textContent = ville.nom || `Ville ${villeId}`;
      villeSelect.appendChild(opt);
    }
  });

  // Events filtres
  document.getElementById('filter-search')?.addEventListener('input', applyFilters);
  document.getElementById('filter-secteur')?.addEventListener('change', applyFilters);
  document.getElementById('filter-ville')?.addEventListener('change', applyFilters);
  document.getElementById('filter-taille')?.addEventListener('change', applyFilters);
}

function applyFilters() {
  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const secteur = document.getElementById('filter-secteur')?.value || '';
  const ville = document.getElementById('filter-ville')?.value || '';
  const taille = document.getElementById('filter-taille')?.value || '';

  filteredEnterprises = allEntreprises.filter(ent => {
    const matchSearch = !search || ent.Nom.toLowerCase().includes(search);
    const matchSecteur = !secteur || ent.Secteur === parseInt(secteur);
    const matchVille = !ville || ent.Ville === parseInt(ville);
    const matchTaille = !taille || ent.taille === taille;

    return matchSearch && matchSecteur && matchVille && matchTaille;
  });

  renderEnterprisesGrid();
}

// ════════════════════════════════════════════════════════
//  RENDU GRILLE
// ════════════════════════════════════════════════════════
function renderEnterprisesGrid() {
  const grid = document.getElementById('enterprises-grid');
  if (!grid) return;

  if (filteredEnterprises.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="empty-state-icon">🏢</div>
        <p>Aucune entreprise trouvée</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredEnterprises.map(ent => {
    const secteur = allSecteurs?.find(s => s.id === ent.Secteur);
    const ville = allVilles?.find(v => v.id === ent.Ville);

    return `
      <div class="enterprise-card" data-ent-id="${ent.id}">
        <div class="enterprise-card-title">${escHtml(ent.Nom)}</div>
        <div class="enterprise-card-info">
          🏷️ ${escHtml(secteur?.nom || '—')}
        </div>
        <div class="enterprise-card-info">
          📍 ${escHtml(ville?.nom || '—')}
        </div>
        <div class="enterprise-card-info">
          📏 ${escHtml(ent.taille || '—')}
        </div>
        <div class="enterprise-card-info">
          🔗 ${escHtml(ent.site_web_ || '—')}
        </div>
        <div class="enterprise-card-badge">${escHtml(ent.Siret || 'SIRET —')}</div>
      </div>
    `;
  }).join('');

  // Events sur cartes
  grid.querySelectorAll('.enterprise-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const entId = parseInt(card.dataset.entId);
      const ent = allEntreprises.find(e => e.id === entId);
      if (ent) openEnterprisePanel(ent);
    });
  });
}

// ════════════════════════════════════════════════════════
//  OUVRIR PANEL ÉDITION
// ════════════════════════════════════════════════════════
function openEnterprisePanel(ent) {
  currentEnterprise = ent;
  renderEnterpriseForm(ent);
  
  document.getElementById('panel-enterprise-title').textContent = escHtml(ent.Nom);
  document.getElementById('enterprise-panel').classList.add('open');
  document.getElementById('overlay').classList.add('visible');
}

function closeEnterprisePanel() {
  document.getElementById('enterprise-panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('visible');
  currentEnterprise = null;
}

// ════════════════════════════════════════════════════════
//  RENDU FORMULAIRE
// ════════════════════════════════════════════════════════
function renderEnterpriseForm(ent) {
  const formEl = document.getElementById('enterprise-panel-form');
  if (!formEl) return;

  // Récupérer les données liées
  const secteur = allSecteurs?.find(s => s.id === ent.Secteur);
  const ville = allVilles?.find(v => v.id === ent.Ville);
  const contact = allContacts?.find(c => c.id === ent.Contact_principale);

  // Créer les options de dropdowns
  const secteurOptions = (allSecteurs || []).map(s => 
    `<option value="${s.id}" ${ent.Secteur === s.id ? 'selected' : ''}>${escHtml(s.nom)}</option>`
  ).join('');

  const villeOptions = (allVilles || []).map(v => 
    `<option value="${v.id}" ${ent.Ville === v.id ? 'selected' : ''}>${escHtml(v.nom)}</option>`
  ).join('');

  const contactOptions = (allContacts || []).map(c => 
    `<option value="${c.id}" ${ent.Contact_principale === c.id ? 'selected' : ''}>
      ${escHtml(c.nom_prenom || `${c.Prenom} ${c.Nom}`)}
    </option>`
  ).join('');

  formEl.innerHTML = `
    <form id="enterprise-form">
      <!-- NOM -->
      <div class="enterprise-form-row">
        <label>Nom</label>
        <input type="text" id="ent-Nom" value="${escHtml(ent.Nom)}" required>
      </div>

      <!-- SIRET -->
      <div class="enterprise-form-row">
        <label>SIRET</label>
        <input type="text" id="ent-Siret" value="${escHtml(ent.Siret)}">
      </div>

      <!-- SECTEUR (Reference) -->
      <div class="enterprise-form-row">
        <label>Secteur</label>
        <select id="ent-Secteur">
          <option value="">— Aucun —</option>
          ${secteurOptions}
        </select>
      </div>

      <!-- VILLE (Reference) -->
      <div class="enterprise-form-row">
        <label>Ville</label>
        <select id="ent-Ville">
          <option value="">— Aucune —</option>
          ${villeOptions}
        </select>
      </div>

      <!-- TAILLE -->
      <div class="enterprise-form-row">
        <label>Taille</label>
        <select id="ent-taille">
          <option value="">— Non définie —</option>
          <option value="TPE" ${ent.taille === 'TPE' ? 'selected' : ''}>TPE</option>
          <option value="PME" ${ent.taille === 'PME' ? 'selected' : ''}>PME</option>
          <option value="ETI" ${ent.taille === 'ETI' ? 'selected' : ''}>ETI</option>
          <option value="GE" ${ent.taille === 'GE' ? 'selected' : ''}>GE</option>
        </select>
      </div>

      <!-- SITE WEB -->
      <div class="enterprise-form-row">
        <label>Site web</label>
        <input type="url" id="ent-site_web_" value="${escHtml(ent.site_web_)}">
      </div>

      <!-- ADRESSE 1 -->
      <div class="enterprise-form-row">
        <label>Adresse</label>
        <input type="text" id="ent-Adresse_1" value="${escHtml(ent.Adresse_1)}">
      </div>

      <!-- ADRESSE 2 -->
      <div class="enterprise-form-row">
        <label>Adresse 2</label>
        <input type="text" id="ent-Adresse_2" value="${escHtml(ent.Adresse_2)}">
      </div>

      <!-- ADRESSE 3 -->
      <div class="enterprise-form-row">
        <label>Adresse 3</label>
        <input type="text" id="ent-Adresse_3" value="${escHtml(ent.Adresse_3)}">
      </div>

      <!-- CODE POSTAL -->
      <div class="enterprise-form-row">
        <label>Code Postal</label>
        <input type="text" id="ent-CP" value="${escHtml(ent.CP)}">
      </div>

      <!-- CONTACT PRINCIPAL (Reference) -->
      <div class="enterprise-form-row">
        <label>Contact principal</label>
        <select id="ent-Contact_principale">
          <option value="">— Aucun —</option>
          ${contactOptions}
        </select>
      </div>

      <!-- BOUTONS -->
      <div class="enterprise-form-actions">
        <button type="button" class="btn-save-enterprise" onclick="saveEnterprise()">
          💾 Sauvegarder
        </button>
        <button type="button" class="btn-cancel-enterprise" onclick="closeEnterprisePanel()">
          ✕ Annuler
        </button>
        <button type="button" class="btn-delete-enterprise" onclick="deleteEnterprise()">
          🗑️ Supprimer
        </button>
      </div>
    </form>
  `;
}

// ════════════════════════════════════════════════════════
//  CRÉER NOUVELLE ENTREPRISE
// ════════════════════════════════════════════════════════
function createNewEnterprise() {
  const newEnt = {
    id: null, // Sera assigné par Grist
    Nom: 'Nouvelle entreprise',
    Siret: '',
    Secteur: null,
    Ville: null,
    taille: '',
    site_web_: '',
    Adresse_1: '',
    Adresse_2: '',
    Adresse_3: '',
    CP: '',
    Contact_principale: null,
    siret_Auto: ''
  };

  openEnterprisePanel(newEnt);
}

// ════════════════════════════════════════════════════════
//  SAUVEGARDER
// ════════════════════════════════════════════════════════
async function saveEnterprise() {
  if (!currentEnterprise) return;

  const Nom = document.getElementById('ent-Nom').value.trim();
  const Siret = document.getElementById('ent-Siret').value.trim();
  const Secteur = parseInt(document.getElementById('ent-Secteur').value) || null;
  const Ville = parseInt(document.getElementById('ent-Ville').value) || null;
  const taille = document.getElementById('ent-taille').value;
  const site_web_ = document.getElementById('ent-site_web_').value.trim();
  const Adresse_1 = document.getElementById('ent-Adresse_1').value.trim();
  const Adresse_2 = document.getElementById('ent-Adresse_2').value.trim();
  const Adresse_3 = document.getElementById('ent-Adresse_3').value.trim();
  const CP = document.getElementById('ent-CP').value.trim();
  const Contact_principale = parseInt(document.getElementById('ent-Contact_principale').value) || null;

  if (!Nom) {
    showToast('❌ Le nom est obligatoire');
    return;
  }

  const data = {
    Nom,
    Siret: Siret || null,
    Secteur: Secteur || null,
    Ville: Ville || null,
    taille: taille || null,
    site_web_: site_web_ || null,
    Adresse_1: Adresse_1 || null,
    Adresse_2: Adresse_2 || null,
    Adresse_3: Adresse_3 || null,
    CP: CP || null,
    Contact_principale: Contact_principale || null,
  };

  if (gristReady) {
    try {
      if (currentEnterprise.id) {
        // UPDATE
        await grist.docApi.applyUserActions([
          ['UpdateRecord', 'Entreprise', currentEnterprise.id, data]
        ]);
        showToast('✅ Entreprise mise à jour');
      } else {
        // CREATE
        await grist.docApi.applyUserActions([
          ['AddRecord', 'Entreprise', null, data]
        ]);
        showToast('✅ Entreprise créée');
        await loadAllData();
      }
      
      closeEnterprisePanel();
      renderEnterprisesGrid();
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
      showToast('❌ Erreur lors de la sauvegarde');
    }
  }
}

// ════════════════════════════════════════════════════════
//  SUPPRIMER
// ════════════════════════════════════════════════════════
async function deleteEnterprise() {
  if (!currentEnterprise) return;
  if (!currentEnterprise.id) {
    closeEnterprisePanel();
    return;
  }

  if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) return;

  if (gristReady) {
    try {
      await grist.docApi.applyUserActions([
        ['RemoveRecord', 'Entreprise', currentEnterprise.id]
      ]);
      showToast('✅ Entreprise supprimée');
      await loadAllData();
      closeEnterprisePanel();
      renderEnterprisesGrid();
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      showToast('❌ Erreur lors de la suppression');
    }
  }
}

// ════════════════════════════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════════════════════════════
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
