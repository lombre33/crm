// ════════════════════════════════════════════════════════
//  APP — Init + Events UI + Utilitaires
// ════════════════════════════════════════════════════════

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
  initEvents();
  
  // Affiche le kanban par défaut (vue Opportunités active)
  // ⚠️ Seulement si on est sur index.html
  if (document.getElementById('kanban-view')) {
    showKanban();
  }
});

// ── Init App ──────────────────────────────────────────
async function initApp() {
  try {
    await loadAllData();      // ← Charge les données
    
    // Initialise le dropdown SEULEMENT si on est sur index.html
    if (typeof initFilterAssignee === 'function') {
      initFilterAssignee();
    }
    
    // Affiche le kanban SEULEMENT si on est sur index.html
    if (typeof renderKanban === 'function') {
      renderKanban();
    }
  } catch (err) {
    console.error('❌ Erreur chargement données:', err);
  }
}

// ── Events UI ─────────────────────────────────────────
function initEvents() {
  // Panel
  document.getElementById('close-panel')
    ?.addEventListener('click', closePanel);
  document.getElementById('overlay')
    ?.addEventListener('click', closePanel);

  // Recherche
  document.getElementById('search-input')
    ?.addEventListener('input', function() {
      const q = this.value.toLowerCase().trim();
      document.querySelectorAll('.kanban-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

  // Nouvelle opportunité
  document.getElementById('btn-new')
    ?.addEventListener('click', () => showToast('🚧 Bientôt disponible !'));

  // Fermeture modals
  document.getElementById('log-modal')
    ?.addEventListener('click', e => {
      if (e.target === document.getElementById('log-modal'))
        document.getElementById('log-modal').classList.remove('open');
    });

  document.getElementById('inter-detail-overlay')
    ?.addEventListener('click', e => {
      if (e.target === document.getElementById('inter-detail-overlay'))
        document.getElementById('inter-detail-overlay').classList.remove('open');
    });
}

// ── Navigation Multi-pages ────────────────────────────
function initNavigation() {
  const navContainer = document.querySelector('.nav-tabs');
  
  if (!navContainer) {
    console.warn('⚠️ .nav-tabs non trouvé');
    return;
  }
  
  navContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.nav-tab');
    if (!tab) return;
    
    e.preventDefault();
    const view = tab.dataset.view;
    
    const pages = {
      'opportunites': 'index.html',
      'entreprises': 'enterprises.html',
      'contacts': 'contacts.html',
      'dashboard': 'dashboard.html',
      'interactions': 'interactions.html',
      'evenements': 'evenements.html'
    };

    const targetPage = pages[view];
    if (targetPage) {
      window.location.href = targetPage;
    }
  });
}

// ── Affichage Kanban ──────────────────────────────────
function showKanban() {
  const kanban = document.getElementById('kanban-view');
  if (kanban) {
    kanban.classList.add('active');
  }
  document.querySelectorAll('.placeholder-view').forEach(pv => pv.classList.remove('active'));
}

function hideKanban() {
  const kanban = document.getElementById('kanban-view');
  if (kanban) {
    kanban.classList.remove('active');
  }
}

// ════════════════════════════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════════════════════════════
function formatEuros(val) {
  if (!val) return '0 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  }).format(val);
}

function formatDate(d) {
  if (!d) return '—';
  const date = typeof d === 'number' ? new Date(d * 1000) : new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
}

function formatDatetime(d) {
  if (!d) return '—';
  const date = typeof d === 'number' ? new Date(d * 1000) : new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' }) +
    ' à ' + date.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
