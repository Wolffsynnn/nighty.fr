// ═══════════════════════════════════════════════════════════
// ⏱️ TIMER DES PHASES
// ═══════════════════════════════════════════════════════════

import { resoudrePhaseTerminee } from './resolution.js';
import { prochainePhaseActive, ORDRE_PHASES } from './roles-actifs.js';
import * as NOTIF from './notifications.js';

// ═══════════════════════════════════════════════════════════
// ⏱️ DURÉES DES PHASES (en ms)
// ═══════════════════════════════════════════════════════════

export const DUREES_PHASES = {
  'regarder-role':    10 * 1000,
  'avant-crepuscule': 45 * 1000,
  'crepuscule':       45 * 1000,
  'minuit':           90 * 1000,
  'apres-minuit':     30 * 1000,
  'nuit':             45 * 1000,
  'aube':             10 * 1000,
  'vote-maire':       90 * 1000,
  'vote-village':     180 * 1000,
  'soir':             10 * 1000,
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
  let dernierePhase = null;

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

      // 🆕 DÉTECTION DE CHANGEMENT DE PHASE via snapshot
      const phaseKey = `${phase}-${tour}`;
      if (dernierePhase !== null && dernierePhase !== phaseKey) {
        // La phase a changé → on déclenche la résolution de la phase PRÉCÉDENTE
        console.log(`🔄 Changement détecté : ${dernierePhase} → ${phaseKey}`);
        declencherResolution(gameId, data);
      }
      dernierePhase = phaseKey;

      const tickKey = `${phase}-${tour}-${phaseStartedAt}`;
      if (tickKey === dernierTickKey) return;
      dernierTickKey = tickKey;

      stopperTimer();

      timerInterval = setInterval(() => {
        const restant = (phaseStartedAt + phaseDuree) - Date.now();

        if (restant <= 0) {
          stopperTimer();
          avancerPhaseSiPossible(gameId, phaseStartedAt);

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
// 🔧 DÉCLENCHEMENT DE LA RÉSOLUTION (au changement de phase)
// ═══════════════════════════════════════════════════════════

let phasesResolues = new Set(); // évite les doublons en local

async function declencherResolution(gameId, data) {
  const phaseActuelle = data.phase;
  const tourActuel = data.tour || 1;

  // Retrouve la phase précédente
  const idx = ORDRE_PHASES.indexOf(phaseActuelle);
  const idxPrecedent = idx === 0 ? ORDRE_PHASES.length - 1 : idx - 1;
  const phasePrecedente = ORDRE_PHASES[idxPrecedent];

  // Tour précédent
  const tourPrecedent = idx === 0 ? tourActuel - 1 : tourActuel;

  const cle = `${phasePrecedente}-${tourPrecedent}`;
  if (phasesResolues.has(cle)) return;
  phasesResolues.add(cle);

  console.log(`🔧 Résolution de ${phasePrecedente} (tour ${tourPrecedent})`);

  try {
    await resoudrePhaseTerminee(gameId, phasePrecedente, tourPrecedent);
  } catch (err) {
    console.warn('⚠️ Résolution échouée:', err);
    phasesResolues.delete(cle); // permet de réessayer
  }

  // 🆕 Envoie le message de la NOUVELLE phase
  await envoyerMessagePhase(gameId, phaseActuelle);
}

// ═══════════════════════════════════════════════════════════
// 📢 MESSAGE DE PHASE
// ═══════════════════════════════════════════════════════════

const phasesDejaAnnoncees = new Set();

async function envoyerMessagePhase(gameId, phase) {
  // Récupère tour pour la clé d'unicité
  const { doc, getDoc, updateDoc, arrayUnion } = await getFirestoreFns();
  const snap = await getDoc(doc(window.firebaseDB, 'games', gameId));
  if (!snap.exists()) return;

  const data = snap.data();
  const cle = `${phase}-${data.tour || 1}`;

  if (phasesDejaAnnoncees.has(cle)) return;
  phasesDejaAnnoncees.add(cle);

  const notif = NOTIF.messagePhase(phase);
  if (!notif) return;

  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    messages: arrayUnion({
      pseudo: '📢 Système',
      text: notif.text,
      at: Date.now(),
      systeme: true,
      pour: null,
      couleur: notif.couleur,
    })
  });

  console.log(`📢 Message de phase envoyé : ${phase}`);
}

// ═══════════════════════════════════════════════════════════
// ▶️ AVANCER À LA PHASE SUIVANTE ACTIVE
// ═══════════════════════════════════════════════════════════

export async function avancerPhaseSiPossible(gameId, phaseStartedAtAttendu) {
  const { doc, runTransaction } = await getFirestoreFns();

  try {
    const gameRef = doc(window.firebaseDB, 'games', gameId);

    const resultat = await runTransaction(window.firebaseDB, async (transaction) => {
      const snap = await transaction.get(gameRef);
      if (!snap.exists()) return { ok: false, raison: 'introuvable' };

      const data = snap.data();
      if (!data.enCours) return { ok: false, raison: 'pas-en-cours' };

      // ✅ VERROU : si un autre client a déjà avancé la phase, on abandonne
      if (data.phaseStartedAt !== phaseStartedAtAttendu) {
        return { ok: false, raison: 'deja-avancee-par-un-autre-client' };
      }

      const phaseActuelle = data.phase;
      const tourActuel = data.tour || 1;

      const jeuMini = {
        joueurs: reconstruireJoueurs(data),
        roles: data.roles || [],
      };

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
        ancienTour: tourActuel,
        nouvellePhase: suivant.phase,
        nouveauTour: suivant.tour,
      };
    });

    if (resultat.ok) {
      console.log(`▶️ ${resultat.anciennePhase} → ${resultat.nouvellePhase} (Tour ${resultat.nouveauTour})`);
    } else {
      console.log(`⏸️ Avancée ignorée : ${resultat.raison}`);
    }

    return resultat;

  } catch (err) {
    // Conflit multi-client = normal
    if (err.code === 'failed-precondition' || err.code === 'aborted') {
      console.log('⏸️ Conflit multi-client (normal).');
      return { ok: false, raison: 'conflit-multi-client' };
    }

    console.warn('⏸️ Transaction échouée :', err);
    return { ok: false, raison: 'transaction-perdue', err };
  }
}

// ═══════════════════════════════════════════════════════════
// 🔧 UTILITAIRE
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

export default {
  DUREES_PHASES,
  initialiserTimerPhase,
  ecouterTimerPhase,
  avancerPhaseSiPossible,
};