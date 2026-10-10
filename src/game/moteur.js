// ═══════════════════════════════════════════════════════════
// ⚙️ MOTEUR DU JEU
// ═══════════════════════════════════════════════════════════
//
// C'est le "chef d'orchestre" de la partie.
//
// Son rôle :
//   1. Créer le contexte (ctx) utilisé par tous les rôles
//   2. Faire tourner la boucle : phase → phase → tour suivant
//   3. Appeler les bons rôles au bon moment
//   4. Gérer les messages, morts, victoires
// ═══════════════════════════════════════════════════════════

import { passerPhaseSuivante, ORDRE_PHASES, demarrerPartie } from './phases.js';
import { getFirestoreFns } from '../utils/firebase.js';

// ═══════════════════════════════════════════════════════════
// 🏗️ CRÉATION DU CONTEXTE (ctx)
// ═══════════════════════════════════════════════════════════

/**
 * Crée le contexte principal utilisé par tous les rôles.
 *
 * Le ctx contient :
 *   - ctx.jeu             : l'état global du jeu
 *   - ctx.journaliser     : log interne
 *   - ctx.envoyerMessage  : message privé à un joueur
 *   - ctx.reveleAuVillage : message public
 *   - ctx.tuer            : tuer un joueur
 *   - ctx.ctxPour         : crée un sous-ctx pour un rôle
 */
export function creerContexte(jeu) {
  const ctx = {
    // ─── État du jeu ───
    jeu,

    // ─── Journal (log interne pour debug/replay) ───
    journaliser(message) {
      const entree = {
        tour: jeu.tour,
        phase: jeu.phase,
        message,
        at: Date.now(),
      };
      jeu.journal.push(entree);
      console.log(`[JEU] ${message}`);
    },

    // ─── Envoie un message privé à un joueur ───
    envoyerMessage(uid, texte) {
      jeu.messagesPublic.push({
        type: 'prive',
        destinataire: uid,
        texte,
        at: Date.now(),
      });
    },

    // ─── Révèle un message à tout le village ───
    reveleAuVillage(texte) {
      jeu.messagesPublic.push({
        type: 'public',
        texte,
        at: Date.now(),
      });
    },

    // ─── Tue un joueur ───
    tuer(uid) {
      const joueur = jeu.joueurs.find(j => j.uid === uid);
      if (!joueur || !joueur.vivant) return false;

      joueur.vivant = false;
      joueur.mortTour = jeu.tour;
      joueur.mortCause = 'inconnu';

      ctx.journaliser(`💀 ${joueur.pseudo} est mort.`);
      return true;
    },

    // ─── Crée un sous-ctx pour un rôle spécifique ───
    ctxPour(joueur) {
      return {
        jeu,
        moi: joueur,
        cible: null,           // Rempli par le moteur avant appel
        cibleVie: null,
        cibleMort: null,
        cible2: null,
        muetCible: null,
        adjointCible: null,
        actionControlee: null,
        journaliser: ctx.journaliser,
        envoyerMessage: ctx.envoyerMessage,
        reveleAuVillage: ctx.reveleAuVillage,
        tuer: ctx.tuer,
      };
    },
  };

  return ctx;
}

// ═══════════════════════════════════════════════════════════
// 🔁 BOUCLE PRINCIPALE
// ═══════════════════════════════════════════════════════════

/**
 * Fait avancer la partie d'une phase.
 *
 * Étapes :
 *   1. Exécute la phase actuelle (appelle les rôles concernés)
 *   2. Vérifie les conditions de victoire
 *   3. Passe à la phase suivante
 */
export async function avancerUnePhase(ctx) {
  const phaseActuelle = ctx.jeu.phase;

  ctx.journaliser(`▶️ Phase : ${phaseActuelle} (Tour ${ctx.jeu.tour})`);

  // ─── 1. Exécute la phase ───
  switch (phaseActuelle) {
    case 'avant-crepuscule':
    case 'crepuscule':
    case 'minuit':
    case 'apres-minuit':
      await executerPhaseNuit(ctx, phaseActuelle);
      break;

    case 'aube':
      await executerPhaseAube(ctx);
      break;

    case 'jour':
      await executerPhaseJour(ctx);
      break;

    case 'vote':
      await executerPhaseVote(ctx);
      break;

    case 'soir':
      await executerPhaseSoir(ctx);
      break;
  }

  // ─── 2. Vérifie la victoire ───
  const victoire = verifierVictoire(ctx);
  if (victoire) {
    ctx.journaliser(`🏆 Victoire : ${victoire.gagnant}`);
    ctx.jeu.enCours = false;
    ctx.jeu.gagnant = victoire;
    return { finDePartie: true, victoire };
  }

  // ─── 3. Phase suivante ───
  const transition = passerPhaseSuivante(ctx);

  return {
    finDePartie: false,
    transition,
  };
}

// ═══════════════════════════════════════════════════════════
// 🌙 EXÉCUTION DES PHASES DE NUIT
// ═══════════════════════════════════════════════════════════

async function executerPhaseNuit(ctx, phase) {
  // ─── Récupère tous les rôles qui agissent dans cette phase ───
  const rolesActifs = ctx.jeu.roles.filter(role =>
    role.phases?.includes(phase)
  );

  // ─── Trie par priorité (petit = avant) ───
  rolesActifs.sort((a, b) => (a.priorite || 99) - (b.priorite || 99));

  for (const roleDef of rolesActifs) {
    // ─── Récupère les joueurs vivants avec ce rôle ───
    const joueurs = ctx.jeu.joueurs.filter(j =>
      j.vivant && j.role === roleDef.id
    );

    for (const joueur of joueurs) {
      const sousCtx = ctx.ctxPour(joueur);

      // ─── onNightStart ───
      if (typeof roleDef.onNightStart === 'function') {
        const debut = roleDef.onNightStart(sousCtx);
        if (debut) {
          ctx.journaliser(`  ⏳ ${roleDef.nom} (${joueur.pseudo}) : onNightStart`);
        }
      }

      // ─── onNightAction ───
      // ⚠️ Les cibles viennent de l'interface joueur (Firestore)
      //    → à connecter plus tard
      if (typeof roleDef.onNightAction === 'function') {
        roleDef.onNightAction(sousCtx);
      }
    }
  }

  // ─── Message de fin de phase ───
  ctx.journaliser(`  ✔️ Phase ${phase} terminée.`);
}

// ═══════════════════════════════════════════════════════════
// 🌅 PHASE AUBE
// ═══════════════════════════════════════════════════════════

async function executerPhaseAube(ctx) {
  // ─── 1. Applique toutes les morts de la nuit ───
  const morts = ctx.jeu.mortsNuit || [];

  morts.forEach(mort => {
    const joueur = ctx.jeu.joueurs.find(j => j.uid === mort.uid);
    if (joueur && joueur.vivant) {
      ctx.tuer(mort.uid);
      joueur.mortCause = mort.cause;
    }
  });

  // ─── 2. Annonce les morts au village ───
  if (morts.length === 0) {
    ctx.reveleAuVillage(`🌅 Aucun mort cette nuit.`);
  } else if (morts.length === 1) {
    const j = ctx.jeu.joueurs.find(x => x.uid === morts[0].uid);
    ctx.reveleAuVillage(`🌅 Cette nuit, ${j?.pseudo} est mort.`);
  } else {
    const pseudos = morts.map(m =>
      ctx.jeu.joueurs.find(j => j.uid === m.uid)?.pseudo
    ).join(', ');
    ctx.reveleAuVillage(`🌅 Cette nuit, plusieurs joueurs sont morts : ${pseudos}.`);
  }

  // ─── 3. Appelle les rôles qui agissent à l'aube ───
  const rolesAube = ctx.jeu.roles.filter(r => r.phases?.includes('aube'));
  rolesAube.sort((a, b) => (a.priorite || 99) - (b.priorite || 99));

  for (const roleDef of rolesAube) {
    // Inclut les MORTS (Chasseur, Fossoyeur, Maire agissent à leur mort)
    const joueurs = ctx.jeu.joueurs.filter(j => j.role === roleDef.id);

    for (const joueur of joueurs) {
      const sousCtx = ctx.ctxPour(joueur);
      if (typeof roleDef.onAube === 'function') {
        roleDef.onAube(sousCtx);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// ☀️ PHASE JOUR
// ═══════════════════════════════════════════════════════════

async function executerPhaseJour(ctx) {
  // ─── Appelle les rôles qui agissent le jour ───
  const rolesJour = ctx.jeu.roles.filter(r => r.phases?.includes('jour'));
  rolesJour.sort((a, b) => (a.priorite || 99) - (b.priorite || 99));

  for (const roleDef of rolesJour) {
    const joueurs = ctx.jeu.joueurs.filter(j => j.vivant && j.role === roleDef.id);

    for (const joueur of joueurs) {
      const sousCtx = ctx.ctxPour(joueur);

      if (typeof roleDef.onDayStart === 'function') {
        roleDef.onDayStart(sousCtx);
      }
      if (typeof roleDef.onDayAction === 'function') {
        roleDef.onDayAction(sousCtx);
      }
    }
  }

  ctx.journaliser(`☀️ Phase jour terminée.`);
}

// ═══════════════════════════════════════════════════════════
// 🗳️ PHASE VOTE
// ═══════════════════════════════════════════════════════════

async function executerPhaseVote(ctx) {
  // ─── Le vote est géré côté client + Firestore ───
  //    Ici on ne fait que récupérer le résultat
  //    ⚠️ À connecter plus tard avec le système de vote

  ctx.journaliser(`🗳️ Phase de vote en cours...`);
}

// ═══════════════════════════════════════════════════════════
// 🌆 PHASE SOIR
// ═══════════════════════════════════════════════════════════

async function executerPhaseSoir(ctx) {
  // ─── Appelle les rôles qui agissent le soir ───
  const rolesSoir = ctx.jeu.roles.filter(r => r.phases?.includes('soir'));
  rolesSoir.sort((a, b) => (a.priorite || 99) - (b.priorite || 99));

  for (const roleDef of rolesSoir) {
    const joueurs = ctx.jeu.joueurs.filter(j => j.role === roleDef.id);

    for (const joueur of joueurs) {
      const sousCtx = ctx.ctxPour(joueur);
      if (typeof roleDef.onSoir === 'function') {
        roleDef.onSoir(sousCtx);
      }
      if (typeof roleDef.onDayEnd === 'function') {
        roleDef.onDayEnd(sousCtx);
      }
    }
  }

  ctx.journaliser(`🌆 Phase soir terminée.`);
}

// ═══════════════════════════════════════════════════════════
// 🏆 VÉRIFICATION DE VICTOIRE
// ═══════════════════════════════════════════════════════════

function verifierVictoire(ctx) {
  // ─── Demande à chaque rôle de vérifier la victoire ───
  for (const roleDef of ctx.jeu.roles) {
    if (typeof roleDef.checkWin !== 'function') continue;

    const joueurs = ctx.jeu.joueurs.filter(j =>
      j.vivant && j.role === roleDef.id
    );

    for (const joueur of joueurs) {
      const sousCtx = ctx.ctxPour(joueur);
      const resultat = roleDef.checkWin(sousCtx);
      if (resultat && resultat.gagnant) {
        return resultat;
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// 🎮 POINT D'ENTRÉE PRINCIPAL
// ═══════════════════════════════════════════════════════════

/**
 * Lance une partie complète.
 *
 * @param {Object} gameData - Données Firestore de la partie
 * @returns {Object} ctx initialisé
 */
export async function lancerPartie(gameData) {
  const { initialiserPartie } = await import('./etat.js');

  // ─── 1. Initialise l'état ───
  const ctx = creerContexte(initialiserPartie(gameData).jeu);

  // ─── 2. Démarre la partie ───
  demarrerPartie(ctx);

  // ─── 3. Boucle principale (à faire tourner tant que la partie est en cours) ───
  // ⚠️ La boucle réelle sera gérée côté Firestore (chaque phase = un write Firestore)

  return ctx;
}