// ═══════════════════════════════════════════════════════════
// ⏱️ TIMER DES PHASES
// ═══════════════════════════════════════════════════════════

import { prochainePhaseActive, ORDRE_PHASES } from './roles-actifs.js';

// ═══════════════════════════════════════════════════════════
// ⏱️ DURÉES DES PHASES (en ms)
// ═══════════════════════════════════════════════════════════

export const DUREES_PHASES = {
  'avant-crepuscule': 15 * 1000,
  'crepuscule':       20 * 1000,
  'minuit':           30 * 1000,
  'apres-minuit':     20 * 1000,
  'aube':             15 * 1000,
  'jour':             60 * 1000,
  'vote':             120 * 1000,
  'soir':             20 * 1000,
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

export async function initialiserTimerPhase(gameId, phase) {
  const { doc, updateDoc } = await getFirestoreFns();

  const duree = DUREES_PHASES[phase] || 30000;

  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    phaseStartedAt: Date.now(),
    phaseDuree: duree,
  });

  console.log(`⏱️ Timer init : ${phase} (${duree / 1000}s)`);
}

// ═══════════════════════════════════════════════════════════
// 🎧 ÉCOUTER LE TIMER DE PHASE
// ═══════════════════════════════════════════════════════════

export async function ecouterTimerPhase(gameId, callbacks = {}) {
  const { doc, onSnapshot } = await getFirestoreFns();

  let timerInterval = null;
  let dernierTickKey = null;

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

      if (!data.enCours) {
        stopperTimer();
        return;
      }

      const { phase, tour, phaseStartedAt, phaseDuree } = data;

      if (!phaseStartedAt || !phaseDuree) return;

      const tickKey = `${phase}-${tour}-${phaseStartedAt}`;
      if (tickKey === dernierTickKey) return;
      dernierTickKey = tickKey;

      stopperTimer();

      timerInterval = setInterval(() => {
        const restant = (phaseStartedAt + phaseDuree) - Date.now();

        if (restant <= 0) {
          stopperTimer();
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
// ▶️ AVANCER À LA PHASE SUIVANTE ACTIVE
// ═══════════════════════════════════════════════════════════

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

      // ─── Reconstruit un mini-objet jeu pour les helpers ───
      const jeuMini = {
        joueurs: reconstruireJoueurs(data),
        roles: data.roles || [],
      };

      // ─── Calcule la prochaine phase active ───
      const suivant = prochainePhaseActive(jeuMini, phaseActuelle, tourActuel);

      const nouvelleDuree = DUREES_PHASES[suivant.phase] || 30000;

      transaction.update(gameRef, {
        phase: suivant.phase,
        phaseIndex: ORDRE_PHASES.indexOf(suivant.phase),
        tour: suivant.tour,
        phaseStartedAt: Date.now(),
        phaseDuree: nouvelleDuree,
      });

      return {
        ok: true,
        anciennePhase: phaseActuelle,
        nouvellePhase: suivant.phase,
        nouveauTour: suivant.tour,
      };
    });

    if (resultat.ok) {
      console.log(`▶️ ${resultat.anciennePhase} → ${resultat.nouvellePhase} (Tour ${resultat.nouveauTour})`);
    }

    return resultat;

  } catch (err) {
    console.log('⏸️ Transaction perdue.');
    return { ok: false, raison: 'transaction-perdue', err };
  }
}

// ═══════════════════════════════════════════════════════════
// 🔧 UTILITAIRE : reconstruire les joueurs depuis Firestore
// ═══════════════════════════════════════════════════════════

function reconstruireJoueurs(data) {
  const joueurs = [];
  const rolesJoueurs = data.rolesJoueurs || {};
  const joueursVivants = data.joueursVivants || [];
  const joueursMorts = data.joueursMorts || [];

  Object.entries(rolesJoueurs).forEach(([uid, roleId]) => {
    const vivant = joueursVivants.includes(uid) && !joueursMorts.includes(uid);
    joueurs.push({ uid, role: roleId, vivant });
  });

  return joueurs;
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