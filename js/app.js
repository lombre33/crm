// ════════════════════════════════════════════════════════
//  APP — Init + Events UI + Utilitaires
// ════════════════════════════════════════════════════════

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  initEvents();
});

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
      document.querySelectorAll('.opportunity-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

  // Nouvelle opportunité
  document.getElementById('btn-new')
    ?.addEventListener('click', () => showToast('🚧 Bientôt disponible !'));

  // Onglets navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const view = tab.dataset.view;
      document.getElementById('kanban-view').style.display =
        view === 'opportunites' ? 'flex' : 'none';
      document.querySelectorAll('.placeholder-view').forEach(pv => pv.classList.remove('active'));
      if (view !== 'opportunites') {
        document.getElementById('view-' + view)?.classList.add('active');
      }
      closePanel();
    });
  });

  // Fermeture modaux
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
