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

// ════════════════════════════════════════════════════════
//  CHARGEMENT GRIST
// ════════════════════════════════════════════════════════
async function loadAllData() {
  grist.ready({ requiredAccess: 'full', allowSelectBy: true });

  try {
    const [opps, contacts, entreprises, interactions] = await Promise.all([
      grist.docApi.fetchTable('Opportunites'),
      grist.docApi.fetchTable('Annuaire'),
      grist.docApi.fetchTable('Entreprise'),
      grist.docApi.fetchTable('Interactions'),
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
      Nom    : entreprises.Nom?.[i]     || '',
      Secteur: entreprises.Secteur?.[i] || '',
      Ville  : entreprises.Ville?.[i]   || '',
    }));

    allInteractions = interactions.id.map((id, i) => ({
      id,
      type_interaction: interactions.type_interaction?.[i] || '',
      Date            : interactions.Date?.[i]             || 0,
      contact         : interactions.contact?.[i]          || 0,
      Opportunite     : interactions.Opportunite?.[i]      || 0,
      Assigne         : interactions.Assigne?.[i]          || 0,
      contenu         : interactions.contenu?.[i]          || '',
      duree           : interactions.duree?.[i]            || 0,
    }));

    allOpportunites = opps.id.map((id, i) => ({
      id,
      titre               : opps.titre?.[i]                || '(Sans titre)',
      Entreprise          : opps.Entreprise?.[i]           || 0,
      contact_principale  : opps.contact_principale?.[i]   || 0,
      statut              : opps.statut?.[i]               || 'Prospect',
      Priorite            : opps.Priorite?.[i]             || 'Moyenne',
      valeur_estilmee     : opps.valeur_estilmee?.[i]      || 0,
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
      interactions: allInteractions.length
    });

    gristReady = true;
    renderKanban();

  } catch(e) {
    console.error('❌ Erreur chargement données:', e);
  }
}

function enrichOpp(opp) {
  const ent = allEntreprises.find(e => e.id === opp.Entreprise);
  opp._entrepriseNom = ent?.Nom || '—';

  const contact = allContacts.find(c => c.id === opp.contact_principale);
  opp._contactNom = contact
    ? (contact.nom_prenom || `${contact.Prenom} ${contact.Nom}`.trim())
    : '—';

  const assignee = allContacts.find(c => c.id === opp.assignee_a);
  opp._assigneeNom = assignee
    ? (assignee.nom_prenom || `${assignee.Prenom} ${assignee.Nom}`.trim())
    : '—';
   // 🔍 DEBUG : Affiche les champs de l'opp
  console.log(`📋 Opp ${opp.id}:`, {
    titre: opp.titre,
    valeur_estimee: opp.valeur_estimee,
    montant: opp.montant,
    valeur: opp.valeur,
    // Affiche TOUS les champs pour voir ce qu'on a
}

function getContactNom(id) {
  const c = allContacts.find(c => c.id === id);
  if (!c) return '—';
  return c.nom_prenom || `${c.Prenom} ${c.Nom}`.trim();
}
