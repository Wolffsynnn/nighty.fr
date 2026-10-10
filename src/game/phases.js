// ═══════════════════════════════════════════════════════════
// 🎬 PHASES DU JEU
// ═══════════════════════════════════════════════════════════
//
// Ce fichier contient :
//   - La définition de l'ordre des phases
//   - Les fonctions pour passer d'une phase à la suivante
//   - Les fonctions pour passer au tour suivant
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 📋 DÉFINITION DES PHASES
// ═══════════════════════════════════════════════════════════

/**
 * Ordre des phases d'un tour complet.
 *
 * Un tour = 1 NUIT + 1 JOUR
 *
 *  NUIT :
 *    - avant-crepuscule : rôles préparatoires (Marionettiste, Cupidon, Anges)
 *    - crepuscule       : rôles voyance/protection (Voyante, Garde)
 *    - minuit           : loups + nightmares + petite fille
 *    - apres-minuit     : résolutions secrètes (infection Loup Noir, kill Loup Blanc, potions Sorcière)
 *
 *  JOUR :
 *    - aube             : annonce des morts, résolutions de mort (Chasseur, Fossoyeur, Maire)
 *    - jour             : discussion, actions de jour (Maire 2.0 muet/adjoint)
 *    - vote             : vote du village
 *    - soir             : exécution, résolutions (Chasseur si mort au vote, Maire succession)
 */
export const ORDRE_PHASES = [
    'avant-crepuscule',
    'crepuscule',
    'minuit',
    'apres-minuit',
    'aube',
    'jour',
    'vote',
    'soir',
  ];
  
  /**
   * Phase de démarrage d'un tour (début de la nuit).
   */
  export const PREMIERE_PHASE = 'avant-crepuscule';
  
  /**
   * Phase de fin d'un tour (fin du jour).
   */
  export const DERNIERE_PHASE = 'soir';
  
  /**
   * Phases qui se déroulent la NUIT.
   */
  export const PHASES_NUIT = [
    'avant-crepuscule',
    'crepuscule',
    'minuit',
    'apres-minuit',
  ];
  
  /**
   * Phases qui se déroulent le JOUR.
   */
  export const PHASES_JOUR = [
    'aube',
    'jour',
    'vote',
    'soir',
  ];
  
  // ═══════════════════════════════════════════════════════════
  // 🔧 FONCTIONS DE GESTION DES PHASES
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Retourne l'index d'une phase dans l'ordre.
   */
  export function getPhaseIndex(phase) {
    return ORDRE_PHASES.indexOf(phase);
  }
  
  /**
   * Retourne la phase suivante (ou null si c'est la fin du tour).
   */
  export function getPhaseSuivante(phaseActuelle) {
    const index = getPhaseIndex(phaseActuelle);
    if (index === -1) return null;
    if (index >= ORDRE_PHASES.length - 1) return null;
    return ORDRE_PHASES[index + 1];
  }
  
  /**
   * Vérifie si c'est une phase de nuit.
   */
  export function estPhaseNuit(phase) {
    return PHASES_NUIT.includes(phase);
  }
  
  /**
   * Vérifie si c'est une phase de jour.
   */
  export function estPhaseJour(phase) {
    return PHASES_JOUR.includes(phase);
  }
  
  /**
   * Vérifie si c'est la dernière phase du tour.
   */
  export function estDernierePhase(phase) {
    return phase === DERNIERE_PHASE;
  }
  
  /**
   * Vérifie si c'est la première phase du tour.
   */
  export function estPremierePhase(phase) {
    return phase === PREMIERE_PHASE;
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔄 PASSAGE À LA PHASE SUIVANTE
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Passe à la phase suivante.
   *
   * @param {Object} ctx - Le contexte du jeu
   * @returns {Object} { phaseActuelle, phaseSuivante, nouveauTour, finDePartie }
   */
  export function passerPhaseSuivante(ctx) {
    const phaseActuelle = ctx.jeu.phase;
    const phaseSuivante = getPhaseSuivante(phaseActuelle);
  
    // ─── Fin du tour : on passe au tour suivant ───
    if (!phaseSuivante) {
      return passerTourSuivant(ctx);
    }
  
    // ─── Sinon : on avance juste de phase ───
    ctx.jeu.phase = phaseSuivante;
    ctx.jeu.phaseIndex = getPhaseIndex(phaseSuivante);
  
    ctx.journaliser(`🎬 Passage à la phase : ${phaseSuivante}`);
  
    return {
      phaseActuelle,
      phaseSuivante,
      nouveauTour: false,
      finDePartie: false,
    };
  }
  
  /**
   * Passe au tour suivant (nouvelle nuit).
   *
   * @param {Object} ctx - Le contexte du jeu
   * @returns {Object} { phaseActuelle, phaseSuivante, nouveauTour, finDePartie }
   */
  export function passerTourSuivant(ctx) {
    const tourPrecedent = ctx.jeu.tour;
  
    // ✅ NOUVEAU TOUR
    ctx.jeu.tour += 1;
    ctx.jeu.phase = PREMIERE_PHASE;
    ctx.jeu.phaseIndex = 0;
  
    // ─── Reset des effets de la nuit précédente ───
    resetEffetsNuit(ctx);
  
    ctx.journaliser(`🌙 ═══════ DÉBUT DU TOUR ${ctx.jeu.tour} ═══════`);
  
    return {
      phaseActuelle: DERNIERE_PHASE,
      phaseSuivante: PREMIERE_PHASE,
      nouveauTour: true,
      tourPrecedent,
      tourActuel: ctx.jeu.tour,
      finDePartie: false,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🧹 RESET DES EFFETS ENTRE LES TOURS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Reset les effets temporaires entre les tours.
   * (Ceux qui ne durent qu'une seule nuit ou un seul jour)
   */
  export function resetEffetsNuit(ctx) {
    // ─── Protections (durent 1 nuit) ───
    ctx.jeu.protectionsGarde = [];
    ctx.jeu.protectionsAnge = [];
  
    // ─── Mort de la nuit (résolue à l'aube) ───
    ctx.jeu.mortsNuit = [];
    ctx.jeu.cibleLoups = null;
    ctx.jeu.sauveParSorciere = null;
  
    // ─── Muets (durent 1 jour) ───
    ctx.jeu.muets = ctx.jeu.muets.filter(m => m.tour >= ctx.jeu.tour);
  
    // ─── Marques Nightmares déjà mortes ───
    // (on garde uniquement les marques futures)
    ctx.jeu.marques = ctx.jeu.marques.filter(m => m.tourMort > ctx.jeu.tour);
  
    // ─── Journal de phase ───
    // (on garde tout, c'est l'historique complet)
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🎮 POINT D'ENTRÉE : DÉMARRAGE DE LA PARTIE
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Démarre la partie : initialise l'état, appelle onGameStart sur tous les rôles.
   *
   * @param {Object} ctx - Le contexte du jeu
   */
  export function demarrerPartie(ctx) {
    ctx.jeu.tour = 1;
    ctx.jeu.phase = PREMIERE_PHASE;
    ctx.jeu.phaseIndex = 0;
    ctx.jeu.enCours = true;
  
    // ─── Appelle onGameStart de tous les rôles ───
    ctx.jeu.joueurs.forEach(joueur => {
      const roleDef = ctx.jeu.roles.find(r => r.id === joueur.role);
      if (roleDef && typeof roleDef.onGameStart === 'function') {
        const ctxRole = {
          jeu: ctx.jeu,
          moi: joueur,
          journaliser: ctx.journaliser,
          envoyerMessage: ctx.envoyerMessage,
          reveleAuVillage: ctx.reveleAuVillage,
          tuer: ctx.tuer,
        };
        roleDef.onGameStart(ctxRole);
      }
    });
  
    ctx.journaliser(`🎮 Partie démarrée ! Tour 1, phase : ${PREMIERE_PHASE}`);
  
    return {
      tour: 1,
      phase: PREMIERE_PHASE,
    };
  }