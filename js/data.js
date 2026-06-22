// ════════════════════════════════════════════════════════
//  STATE GLOBAL
// ════════════════════════════════════════════════════════
let allOpportunites  = [];
let allInteractions  = [];
let allContacts      = [];
let allEntreprises   = [];
let currentOpp       = null;
let gristReady       = false;
let draggedCardId    = null;

// 🆕 NOUVELLES VARIABLES GLOBALES
let allSecteurs      = [];
let allVilles        = [];

// ════════════════════════════════════════════════════════
//  CHARGEMENT GRIST
// ════════════════════════════════════════════════════════
async function loadAllData() {
  grist.ready({ requiredAccess: 'full', allowSelectBy: true });

  try {
    const [opps, contacts, entreprises, interactions, secteurs, villes] = await Promise.all([
      grist.docApi.fetchTable('Opportunites'),
      grist.docApi.fetchTable('Annuaire'),
      grist.docApi.fetchTable('Entreprise'),
      grist.docApi.fetchTable('Interactions'),
      grist.docApi.fetchTable('Secteurs'),      // 🆕
      grist.docApi.fetchTable('Villes'),        // 🆕
    ]);

    allContacts = contacts.id.map((id, i) => ({
      id,
      Nom              : contacts.Nom?.[i]               || '',
      Prenom           : contacts.Prenom?.[i]            || '',
      nom_prenom       : contacts.nom_prenom?.[i]        || '',
      Email_fonctionnel: contacts.Email_fonctionnel?.[i] || '',
      email_perso      : contacts.email_perso?.[i]       || '',
      numero_pro       : contacts.numero_pro?.[i]        || '',
      Structure        : contacts.Structure?.[i]         || 0,
    }));

allEntreprises = entreprises.id.map((id, i) => ({
  id,
  Nom               : entreprises.Nom?.[i]                || '',
  Siret             : entreprises.Siret?.[i]              || '',
  Secteur           : entreprises.Secteur?.[i]            || null,
  Ville             : entreprises.Ville?.[i]              || null,
  taille            : entreprises.taille?.[i]             || '',
  site_web_         : entreprises.site_web_?.[i]          || '',
  Adresse_1         : entreprises.Adresse_1?.[i]          || '',
  Adresse_2         : entreprises.Adresse_2?.[i]          || '',
  Adresse_3         : entreprises.Adresse_3?.[i]          || '',
  CP                : entreprises.CP?.[i]                 || '',
  Contact_principale: entreprises.Contact_principale?.[i] || null,
  completion        : entreprises.completion?.[i]         || 0,  // 🆕 AJOUT
}));


allSecteurs = secteurs.id.map((id, i) => ({
  id,
  nom: secteurs.nom?.[i] || '',
}));

allVilles = villes.id.map((id, i) => ({
  id,
  nom: villes.nom?.[i] || '',
}));

    // 🔥 Extraction propre des interactions
    _parseInteractions(interactions);
    enrichAllInteractions();

    allOpportunites = opps.id.map((id, i) => ({
      id,
      titre               : opps.titre?.[i]                || '(Sans titre)',
      Entreprise          : opps.Entreprise?.[i]           || 0,
      contact_principale  : opps.contact_principale?.[i]   || 0,
      statut              : opps.statut?.[i]               || 'Prospect',
      Priorite            : opps.Priorite?.[i]             || 'Moyenne',
      valeur_estimee      : opps.valeur_estimee?.[i]       || 0,
      date_closing_estimee: opps.date_closing_estimee?.[i] || 0,
      assignee_a          : opps.assignee_a?.[i]           || 0,
      description         : opps.description?.[i]          || '',
    }));

    // Enrichissement des noms
    allOpportunites.forEach(opp => enrichOpp(opp));

    console.log('✅ Données chargées:', {
      opps: allOpportunites.length,
      contacts: allContacts.length,
      entreprises: allEntreprises.length,
      interactions: allInteractions.length,
      secteurs: allSecteurs.length,
      villes: allVilles.length,
    });

    gristReady = true;
  //  renderKanban();

  } catch(e) {
    console.error('❌ Erreur chargement données:', e);
  }
}

// ════════════════════════════════════════════════════════
//  HELPER: Parser les interactions (réutilisable)
// ════════════════════════════════════════════════════════
function _parseInteractions(rawData) {
  allInteractions = rawData.id.map((id, i) => ({
    id,
    type_interaction: rawData.type_interaction?.[i] || '',
    Date            : rawData.Date?.[i]             || 0,
    contact         : rawData.contact?.[i]          || 0,
    Opportunite     : rawData.Opportunite?.[i]      || 0,
    Assigne         : rawData.Assigne?.[i]          || 0,
    contenu         : rawData.contenu?.[i]          || '',
    duree           : rawData.duree?.[i]            || 0,
  }));
}

// ════════════════════════════════════════════════════════
//  RECHARGER LES INTERACTIONS (après ajout/edit/suppression)
// ════════════════════════════════════════════════════════
async function loadInteractions() {
  try {
    const rawData = await grist.docApi.fetchTable('Interactions');
    _parseInteractions(rawData);
    console.log('✅ Interactions rechargées:', allInteractions.length);
    return allInteractions;
  } catch (err) {
    console.error('❌ Erreur chargement interactions:', err);
    return [];
  }
}

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════
function enrichOpp(opp) {
  // ✅ Entreprise
  const ent = allEntreprises.find(e => e.id === opp.Entreprise);
  opp._entrepriseNom = ent?.Nom || '—';

  // ✅ Contact principal
  const contact = allContacts.find(c => c.id === opp.contact_principale);
  opp._contactNom = contact
    ? (contact.nom_prenom || `${contact.Prenom} ${contact.Nom}`.trim())
    : '—';

  // ✅ ASSIGNEE — Nettoyé
  if (opp.assignee_a) {
    const assignee = allContacts.find(c => c.id === opp.assignee_a);
    
    if (assignee) {
      opp._assigneeNom = assignee.nom_prenom || `${assignee.Prenom} ${assignee.Nom}`.trim();
      
      // 🆕 INITIALES
      const prenom = (assignee.Prenom || '').charAt(0).toUpperCase();
      const nom = (assignee.Nom || '').charAt(0).toUpperCase();
      opp._assigneeInitiales = `${prenom}${nom}`;
    } else {
      opp._assigneeNom = '—';
      opp._assigneeInitiales = '';
    }
  } else {
    opp._assigneeNom = '—';
    opp._assigneeInitiales = '';
  }
}


function getContactNom(id) {
  const c = allContacts.find(c => c.id === id);
  if (!c) return '—';
  return c.nom_prenom || `${c.Prenom} ${c.Nom}`.trim();
}

// ════════════════════════════════════════════════════════
//  ENRICHIR LES INTERACTIONS (après chargement)
// ════════════════════════════════════════════════════════
function enrichAllInteractions() {
  allInteractions.forEach(inter => {
    // ✅ Contact
    const contact = allContacts.find(c => c.id === inter.contact);
    inter._contactNom = contact
      ? (contact.nom_prenom || `${contact.Prenom} ${contact.Nom}`.trim())
      : '—';

    // ✅ Assignee
    const assignee = allContacts.find(c => c.id === inter.Assigne);
    inter._assigneeNom = assignee
      ? (assignee.nom_prenom || `${assignee.Prenom} ${assignee.Nom}`.trim())
      : '—';

    // ✅ Opportunité (et son entreprise)
    const opp = allOpportunites.find(o => o.id === inter.Opportunite);
    inter._opportuniteTitre = opp?.titre || '—';
    inter._entrepriseNom = opp?._entrepriseNom || '—';
  });
}
