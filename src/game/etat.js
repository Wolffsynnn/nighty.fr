// ═══════════════════════════════════════════════════════════
// 📦 ÉTAT DU JEU
// ═══════════════════════════════════════════════════════════
//
// Ce fichier contient :
//   - La structure de l'état global du jeu (ctx.jeu)
//   - Les fonctions d'initialisation
//   - Les fonctions utilitaires de lecture
// ═══════════════════════════════════════════════════════════

import { TOUS_LES_ROLES } from '../role/index.js';

// ═══════════════════════════════════════════════════════════
// 🏗️ STRUCTURE D'UN JOUEUR
// ═══════════════════════════════════════════════════════════

/**
 * Crée un joueur vierge à partir des données Firestore.
 */
export function creerJoueur(dataFirestore) {
  return {
    // ─── Identité ───
    uid: dataFirestore.uid,
    pseudo: dataFirestore.pseudo,
    avatar: dataFirestore.avatar || null,

    // ─── Rôle et camp ───
    role: dataFirestore.role || null,       // Rôle actuel (id)
    roleOrigine: null,                       // Si infecté : ancien rôle
    camp: dataFirestore.camp || null,        // Camp actuel
    campOrigine: dataFirestore.camp || null, // Camp d'origine

    // ─── État de vie ───
    vivant: true,
    mortTour: null,
    mortCause: null,

    // ─── Statut / effets ───
    muet: false,
    muetTour: null,
    marqueNightmares: false,
    infecte: false,
    protege: false,
    malediction: false,

    // ─── Rôles spéciaux ───
    badge: [],
    estMaire: false,
    estAdjoint: false,

    // ─── Rôles cumulés ───
    rolesSecondaires: [],

    // ─── Info de partie ───
    positionSlot: dataFirestore.positionSlot ?? 0,
    dernierVote: null,
  };
}

// ═══════════════════════════════════════════════════════════
// 🏗️ STRUCTURE DE L'ÉTAT DU JEU
// ═══════════════════════════════════════════════════════════

/**
 * Crée un état de jeu vierge.
 */
export function creerEtatVierge() {
  return {
    // ─── Infos générales ───
    gameId: null,
    villageName: '',
    maxPlayers: 0,
    hostId: null,
    type: 'public',           // 'public' | 'private'

    // ─── Tours et phases ───
    tour: 1,                  // Numéro du tour actuel
    phase: 'avant-crepuscule',
    phaseIndex: 0,            // Position dans la liste des phases du tour
    enCours: false,           // Partie lancée ou pas

    // ─── Joueurs ───
    joueurs: [],              // Liste des joueurs (voir creerJoueur)
    roles: TOUS_LES_ROLES,    // Référence à tous les rôles

    // ─── Résolutions de nuit ───
    mortsNuit: [],            // [{ uid, cause, tour }]
    cibleLoups: null,         // UID de la cible votée par les loups
    sauveParSorciere: null,   // UID sauvé par la potion de vie
    protectionsGarde: [],     // UIDs protégés par le Garde
    protectionsAnge: [],      // UIDs protégés par l'Ange Gardien

    // ─── Effets persistants ───
    marques: [],              // Nightmares : [{ cible, par, tourMarque, tourMort }]
    marquesContrees: [],      // Nightmares contrées (permet de re-marquer)
    muets: [],                // Maire 2.0 : [{ cible, tour, par }]
    potions: {},              // Sorcière : { [uid]: { vie: bool, mort: bool } }
    infections: {},           // Loup Noir : { [uid]: { disponible, utilise, cible } }
    amoureux: null,           // Cupidon : [uid1, uid2]
    maledictions: [],         // Ange Déchu : [{ cible, par, tour }]

    // ─── Rôles spéciaux ───
    maire: { actif: null, successeur: null, electionReportee: false },
    maire2: {
      actif: null,
      adjoint: null,
      adjointNomme: false,
      dernierMuet: null,
      electionReportee: false,
    },

    angeGardien: {},          // { [uid]: { derniereNuitProtection } }
    angeDechu: {},            // { [uid]: { derniereNuitMalediction } }
    rodeur: {},               // { [uid]: { cibleActuelle, nuitDebut, nuitsRestantes, anciennesCibles } }
    marionettiste: {},        // { [uid]: { cibleNuit, pouvoirVole, aUnPouvoir } }
    loupBlanc: {},            // { [uid]: { derniereNuitTue } }
    chasseur: {},             // { [uid]: { dejaTire, mortNuit, mortJour } }
    fossoyeur: {},            // { [uid]: { dejaRevele } }
    mentaliste: {},           // { [uid]: { infoEnvoyeeCeTour } }
    voyanteBavarde: {},       // { [uid]: { derniereVision } }
    motsBavards: {},          // Loup Bavard : { [uid]: { motActuel, reussiCeJour, jours } }
    loupBlancKills: [],       // Kill secret du Loup Blanc

    // ─── Chats ───
    messagesPublic: [],
    messagesLoups: [],
    messagesMorts: [],
    messagesNightmares: [],

    // ─── Journal de partie ───
    journal: [],
  };
}

// ═══════════════════════════════════════════════════════════
// 🔧 FONCTIONS UTILITAIRES DE LECTURE
// ═══════════════════════════════════════════════════════════

/**
 * Récupère un joueur par son UID.
 */
export function getJoueur(ctx, uid) {
  return ctx.jeu.joueurs.find(j => j.uid === uid) || null;
}

/**
 * Récupère un joueur par son pseudo.
 */
export function getJoueurParPseudo(ctx, pseudo) {
  return ctx.jeu.joueurs.find(j => j.pseudo === pseudo) || null;
}

/**
 * Tous les joueurs vivants.
 */
export function getVivants(ctx) {
  return ctx.jeu.joueurs.filter(j => j.vivant);
}

/**
 * Tous les joueurs morts.
 */
export function getMorts(ctx) {
  return ctx.jeu.joueurs.filter(j => !j.vivant);
}

/**
 * Récupère tous les joueurs d'un camp.
 */
export function getParCamp(ctx, camp) {
  return ctx.jeu.joueurs.filter(j => j.camp === camp);
}

/**
 * Récupère tous les joueurs vivants d'un camp.
 */
export function getVivantsParCamp(ctx, camp) {
  return ctx.jeu.joueurs.filter(j => j.vivant && j.camp === camp);
}

/**
 * Récupère tous les joueurs ayant un rôle donné.
 */
export function getParRole(ctx, roleId) {
  return ctx.jeu.joueurs.filter(j => j.role === roleId);
}

/**
 * Récupère tous les joueurs ayant un rôle donné ET vivants.
 */
export function getVivantsParRole(ctx, roleId) {
  return ctx.jeu.joueurs.filter(j => j.vivant && j.role === roleId);
}

/**
 * Récupère la définition d'un rôle par son id.
 */
export function getRoleDef(ctx, roleId) {
  return ctx.jeu.roles.find(r => r.id === roleId) || null;
}

// ═══════════════════════════════════════════════════════════
// 🏗️ FONCTION D'INITIALISATION D'UNE PARTIE
// ═══════════════════════════════════════════════════════════

/**
 * Initialise l'état du jeu à partir des données Firestore.
 *
 * @param {Object} gameData - Données de la partie (Firestore)
 * @returns {Object} ctx initialisé (prêt à être utilisé par le moteur)
 */
export function initialiserPartie(gameData) {
  const jeu = creerEtatVierge();

  // ─── Infos générales ───
  jeu.gameId = gameData.id;
  jeu.villageName = gameData.villageName || 'Village';
  jeu.maxPlayers = gameData.maxPlayers || 0;
  jeu.hostId = gameData.hostId || null;
  jeu.type = gameData.type || 'public';
  jeu.enCours = true;
  jeu.tour = 1;
  jeu.phase = 'avant-crepuscule';

  // ─── Joueurs ───
  const playersData = (gameData.players || []).map((uid, i) => ({
    uid,
    pseudo: gameData.playersPseudo?.[i] || '?',
    role: gameData.rolesJoueurs?.[uid] || null,
    avatar: gameData.avatars?.[uid] || null,
    positionSlot: gameData.playerSlots?.[uid] ?? i,
    camp: null,   // Sera déduit du rôle juste après
  }));

  jeu.joueurs = playersData.map(creerJoueur);

  // ─── Déduit le camp de chaque joueur depuis son rôle ───
  jeu.joueurs.forEach(j => {
    if (j.role) {
      const roleDef = getRoleDef({ jeu }, j.role);
      j.camp = roleDef?.camp || 'village';
      j.campOrigine = j.camp;
    }
  });

  return { jeu };
}