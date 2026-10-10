// ═══════════════════════════════════════════════════════════
// ⏱️ TIMER DES PHASES
// ═══════════════════════════════════════════════════════════
//
// Gère l'avancement automatique des phases.
//
// Mécanique :
//   1. Chaque phase a une durée fixe (DUREES_PHASES)
//   2. Au lancement : on écrit `phaseStartedAt` + `phaseDuree`
//   3. Chaque client écoute et calcule le temps restant
//   4. Quand c'est fini → le premier client qui le voit avance (transaction)
//   5. Le tour augmente automatiquement après 'soir'
// ═══════════════════════════════════════════════════════════

import { ORDRE_PHASES, PREMIERE_PHASE, DERNIERE_PHASE } from './phases.js';

// ═══════════════════════════════════════════════════════════
// ⏱️ DURÉES DES PHASES (en ms)
// ═══════════════════════════════════════════════════════════
// ⚠️ Durées courtes pour TESTER. À rallonger plus tard.
// ═══════════════════════════════════════════════════════════

export const DUREES_PHASES = {
  'avant-crepuscule': 15 * 1000,   // 15 sec — setup
  'crepuscule':       20 * 1000,   // 20 sec — voyante, garde
  'minuit':           25 * 1000,   // 25 sec — loups votent
  'apres-minuit':     20 * 1000,   // 20 sec — résolutions
  'aube':             15 * 1000,   // 15 sec — annonce morts
  'jour':             60 * 1000,   // 60 sec — discussion
  'vote':             120 * 1000,  // 120 sec — vote (à ajuster)
  'soir':             20 * 1000,   // 20 sec — résolutions
};

// ═══════════════════════════════════════════════════════════
// 📚 IMPORTS
// ═══════════════════════════════════════════════════════════

let firestoreFns = null;

async function getFirestoreFns() {
  if (!firestoreFns) {
    firestoreFns = await import(
      'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js'
    );
  }
  return firestoreFns;
}

// ═══════════════════════════════════════════════════════════
// 📝 INITIALISER LE TIMER
// ═══════════════════════════════════════════════════════════

/**
 * Initialise les champs du timer dans Firestore (au lancement de la partie).
 * À appeler une seule fois quand la partie démarre.
 *
 * @param {string} gameId
 * @param {string} phase
 */
export async function initialiserTimerPhase(gameId, phase) {
  const { doc, updateDoc } = await getFirestoreFns();

  const duree = DUREES_PHASES[phase] || 30000;

  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    phaseStartedAt: Date.now(),
    phaseDuree: duree,
  });

  console.log(`⏱️ Timer initialisé : ${phase} pour ${duree / 1000} sec.`);
}

// ═══════════════════════════════════════════════════════════
// 🎧 ÉCOUTER LE TIMER DE PHASE
// ═══════════════════════════════════════════════════════════

/**
 * Écoute le doc Firestore et gère l'avancement automatique des phases.
 *
 * @param {string} gameId
 * @param {Object} callbacks
 * @param {Function} callbacks.onTick      - Appelé avec (restantMs, phase, tour)
 * @param {Function} callbacks.onPhaseChange - Appelé avec (nouvellePhase, nouveauTour)
 * @returns {Function} unsubscribe
 */
export async function ecouterTimerPhase(gameId, callbacks = {}) {
  const { doc, onSnapshot } = await getFirestoreFns();

  let timerInterval = null;
  let dernierTickKey = null;   // Pour ne pas relancer plusieurs fois le timer

  function stopperTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  const unsubscribe = onSnapshot(
    doc(window.firebaseDB, 'games', gameId),
    (snap) => {
      if (!snap.exists()) {
        stopperTimer();
        return;
      }

      const data = snap.data();

      // ─── Partie pas encore lancée ou finie ───
      if (!data.enCours) {
        stopperTimer();
        return;
      }

      const { phase, tour, phaseStartedAt, phaseDuree } = data;

      // Si pas de timer configuré → rien à faire
      if (!phaseStartedAt || !phaseDuree) return;

      // Évite de relancer le timer pour le même (phase+tour+start)
      const tickKey = `${phase}-${tour}-${phaseStartedAt}`;
      if (tickKey === dernierTickKey) return;
      dernierTickKey = tickKey;

      stopperTimer();

      timerInterval = setInterval(() => {
        const restant = (phaseStartedAt + phaseDuree) - Date.now();

        if (restant <= 0) {
          stopperTimer();

          // ✅ Le premier client qui voit la fin avance à la phase suivante
          avancerPhaseSiPossible(gameId);

          if (typeof callbacks.onTick === 'function') {
            callbacks.onTick(0, phase, tour);
          }
          return;
        }

        if (typeof callbacks.onTick === 'function') {
          callbacks.onTick(restant, phase, tour);
        }
      }, 250);
    }
  );

  return () => {
    stopperTimer();
    unsubscribe();
  };
}

// ═══════════════════════════════════════════════════════════
// ▶️ AVANCER À LA PHASE SUIVANTE (anti-doublon)
// ═══════════════════════════════════════════════════════════

/**
 * Avance à la phase suivante de manière atomique.
 * Le premier client qui écrit gagne, les autres abandonnent.
 *
 * @param {string} gameId
 */
export async function avancerPhaseSiPossible(gameId) {
  const { doc, runTransaction } = await getFirestoreFns();

  try {
    const gameRef = doc(window.firebaseDB, 'games', gameId);

    const resultat = await runTransaction(window.firebaseDB, async (transaction) => {
      const snap = await transaction.get(gameRef);
      if (!snap.exists()) return { ok: false, raison: 'introuvable' };

      const data = snap.data();
      if (!data.enCours) return { ok: false, raison: 'pas-en-cours' };

      const phaseActuelle = data.phase;
      const tourActuel = data.tour || 1;

      // Récupère l'index de la phase actuelle
      const indexActuel = ORDRE_PHASES.indexOf(phaseActuelle);
      if (indexActuel === -1) return { ok: false, raison: 'phase-inconnue' };

      let nouvellePhase;
      let nouveauTour = tourActuel;

      // ─── Fin du cycle (dernière phase) ───
      if (indexActuel >= ORDRE_PHASES.length - 1) {
        nouvellePhase = PREMIERE_PHASE;
        nouveauTour = tourActuel + 1;
      } else {
        nouvellePhase = ORDRE_PHASES[indexActuel + 1];
      }

      const nouvelleDuree = DUREES_PHASES[nouvellePhase] || 30000;

      transaction.update(gameRef, {
        phase: nouvellePhase,
        phaseIndex: ORDRE_PHASES.indexOf(nouvellePhase),
        tour: nouveauTour,
        phaseStartedAt: Date.now(),
        phaseDuree: nouvelleDuree,
      });

      return {
        ok: true,
        anciennePhase: phaseActuelle,
        nouvellePhase,
        nouveauTour,
      };
    });

    if (resultat.ok) {
      console.log(`▶️ Phase avancée : ${resultat.anciennePhase} → ${resultat.nouvellePhase} (Tour ${resultat.nouveauTour})`);
    }

    return resultat;

  } catch (err) {
    console.log('⏸️ Transaction perdue (un autre client a avancé).');
    return { ok: false, raison: 'transaction-perdue', err };
  }
}

// ═══════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════

export default {
  DUREES_PHASES,
  initialiserTimerPhase,
  ecouterTimerPhase,
  avancerPhaseSiPossible,
};