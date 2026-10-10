// ═══════════════════════════════════════════════════════════
// 🚀 LANCEMENT AUTOMATIQUE DE LA PARTIE
// ═══════════════════════════════════════════════════════════
//
// Mécanique :
//   1. Quand un joueur rejoint → on vérifie si la partie est pleine
//   2. Si pleine → on écrit `lancementAt = maintenant + 8 sec`
//   3. Tous les clients voient le compte à rebours (temps réel)
//   4. Si un joueur QUITTE → on annule `lancementAt`
//   5. À la fin des 8 sec → le premier client à le voir lance
//      (transaction Firestore = anti-doublon)
//   6. Le lancement attribue les rôles aux joueurs (shuffle)
// ═══════════════════════════════════════════════════════════

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
// ⏱️ CONSTANTES
// ═══════════════════════════════════════════════════════════

/** Durée du compte à rebours avant lancement (en ms) */
export const DUREE_AVANT_LANCEMENT = 8 * 1000;   // 8 secondes

// ═══════════════════════════════════════════════════════════
// 📝 PROGRAMMER LE LANCEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Vérifie si la partie est pleine. Si oui ET pas déjà programmée → programme le lancement.
 *
 * À appeler juste après qu'un joueur rejoint la partie.
 *
 * @param {string} gameId
 */
export async function verifierEtProgrammerLancement(gameId) {
  const { doc, getDoc, updateDoc } = await getFirestoreFns();

  try {
    const gameRef = doc(window.firebaseDB, 'games', gameId);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) return { ok: false, raison: 'introuvable' };

    const data = snap.data();

    // Déjà en cours de lancement ou lancée
    if (data.enCours) return { ok: false, raison: 'deja-en-cours' };
    if (data.lancementAt) return { ok: false, raison: 'deja-programme' };

    // Partie pas pleine
    const nbJoueurs = (data.players || []).length;
    if (nbJoueurs < data.maxPlayers) {
      return { ok: false, raison: 'pas-plein', nbJoueurs, max: data.maxPlayers };
    }

    // ✅ Programme le lancement
    const lancementAt = Date.now() + DUREE_AVANT_LANCEMENT;

    await updateDoc(gameRef, { lancementAt });

    console.log(`🚀 Lancement programmé dans ${DUREE_AVANT_LANCEMENT / 1000} sec.`);
    return { ok: true, lancementAt };

  } catch (err) {
    console.warn('⚠️ Erreur verifierEtProgrammerLancement :', err);
    return { ok: false, raison: 'erreur', err };
  }
}

// ═══════════════════════════════════════════════════════════
// ❌ ANNULER LE LANCEMENT
// ═══════════════════════════════════════════════════════════

/**
 * Annule le compte à rebours (si un joueur quitte avant la fin).
 *
 * À appeler juste après qu'un joueur quitte la partie.
 *
 * @param {string} gameId
 */
export async function annulerLancement(gameId) {
  const { doc, updateDoc } = await getFirestoreFns();

  try {
    await updateDoc(doc(window.firebaseDB, 'games', gameId), {
      lancementAt: null,
    });
    console.log(`❌ Lancement annulé.`);
    return { ok: true };
  } catch (err) {
    console.warn('⚠️ Erreur annulerLancement :', err);
    return { ok: false, err };
  }
}

// ═══════════════════════════════════════════════════════════
// 🎧 ÉCOUTER LE LANCEMENT (VERSION FIXÉE — UNE SEULE FOIS)
// ═══════════════════════════════════════════════════════════

/**
 * Écoute en temps réel l'état de lancement de la partie.
 *
 * ✅ FIX : ne s'arrête plus à 0 → lance directement sans afficher "0"
 *
 * @param {string} gameId
 * @param {Object} callbacks
 * @param {Function} callbacks.onCountdown  - Appelé avec (restantMs) pendant le compte à rebours
 * @param {Function} callbacks.onAnnule     - Appelé si le lancement est annulé
 * @param {Function} callbacks.onLance      - Appelé quand la partie est lancée
 * @returns {Function} unsubscribe
 */
export async function ecouterLancement(gameId, callbacks = {}) {
  const { doc, onSnapshot } = await getFirestoreFns();

  let timerInterval = null;
  let dernierLancementAt = null;
  let dejaLance = false;

  function stopperTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  const unsubscribe = onSnapshot(
    doc(window.firebaseDB, 'games', gameId),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      // ─── Partie lancée → on stoppe TOUT ───
      if (data.enCours === true) {
        stopperTimer();
        dernierLancementAt = null;

        if (!dejaLance && typeof callbacks.onLance === 'function') {
          dejaLance = true;
          callbacks.onLance(data);
        }
        return;
      }

      // Reset du flag si la partie repasse en attente
      if (dejaLance) dejaLance = false;

      // ─── Lancement annulé ───
      if (!data.lancementAt && dernierLancementAt) {
        stopperTimer();
        dernierLancementAt = null;
        if (typeof callbacks.onAnnule === 'function') {
          callbacks.onAnnule();
        }
        return;
      }

      // ─── Nouveau compte à rebours ───
      if (data.lancementAt && data.lancementAt !== dernierLancementAt) {
        dernierLancementAt = data.lancementAt;
        stopperTimer();

        timerInterval = setInterval(() => {
          // Sécurité : si le timer a été reset entre-temps, on stop
          if (!dernierLancementAt) {
            stopperTimer();
            return;
          }

          const restant = dernierLancementAt - Date.now();

          // ✅ FIX : on ne s'arrête plus à 0 → on lance direct
          if (restant <= 0) {
            stopperTimer();
            dernierLancementAt = null;
            lancerPartieSiPossible(gameId);
            return;
          }

          if (typeof callbacks.onCountdown === 'function') {
            callbacks.onCountdown(restant);
          }
        }, 100);
      }
    }
  );

  return () => {
    stopperTimer();
    unsubscribe();
  };
}

// ═══════════════════════════════════════════════════════════
// 🚀 LANCEMENT EFFECTIF (anti-doublon + attribution des rôles)
// ═══════════════════════════════════════════════════════════

/**
 * Lance la partie de manière atomique.
 * Utilise une transaction Firestore : le premier client qui écrit gagne.
 *
 * ✅ Attribue aussi les rôles aux joueurs (shuffle + assignation).
 *
 * @param {string} gameId
 * @returns {Object} { ok, raison, data }
 */
export async function lancerPartieSiPossible(gameId) {
  const { doc, runTransaction } = await getFirestoreFns();

  try {
    const gameRef = doc(window.firebaseDB, 'games', gameId);

    const resultat = await runTransaction(window.firebaseDB, async (transaction) => {
      const snap = await transaction.get(gameRef);
      if (!snap.exists()) return { ok: false, raison: 'introuvable' };

      const data = snap.data();

      // ─── Déjà lancée ───
      if (data.enCours === true) {
        return { ok: false, raison: 'deja-en-cours' };
      }

      // ─── Partie pas pleine → on annule ───
      const nbJoueurs = (data.players || []).length;
      if (nbJoueurs < data.maxPlayers) {
        transaction.update(gameRef, { lancementAt: null });
        return { ok: false, raison: 'pas-plein' };
      }

      // ═══════════════════════════════════════════════════
      // 🎭 ATTRIBUTION DES RÔLES
      // ═══════════════════════════════════════════════════

      const composition = data.composition || [];
      const joueurs = data.players || [];

      if (composition.length !== joueurs.length) {
        console.warn('⚠️ Composition ≠ Joueurs → pas de lancement');
        return { ok: false, raison: 'composition-invalide' };
      }

      // ─── Mélange (Fisher-Yates) ───
      const rolesMelanges = [...composition];
      for (let i = rolesMelanges.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rolesMelanges[i], rolesMelanges[j]] = [rolesMelanges[j], rolesMelanges[i]];
      }

      // ─── Assigne un rôle à chaque joueur ───
      const rolesJoueurs = {};
      joueurs.forEach((uid, index) => {
        rolesJoueurs[uid] = rolesMelanges[index];
      });

      // ─── Lance la partie avec les rôles ───
      transaction.update(gameRef, {
        enCours: true,
        phase: 'avant-crepuscule',
        phaseIndex: 0,
        tour: 1,
        lancementAt: null,
        startedAt: Date.now(),
        status: 'playing',
        rolesJoueurs: rolesJoueurs,
        joueursVivants: joueurs,
        joueursMorts: [],
      });

      return { ok: true };
    });

    if (resultat.ok) {
      console.log(`🎮 Partie lancée ! Rôles attribués.`);
    } else {
      console.log(`⏸️ Lancement refusé : ${resultat.raison}`);
    }

    return resultat;

  } catch (err) {
    console.log('⏸️ Transaction perdue (un autre client a lancé).');
    return { ok: false, raison: 'transaction-perdue', err };
  }
}

// ═══════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════

export default {
  DUREE_AVANT_LANCEMENT,
  verifierEtProgrammerLancement,
  annulerLancement,
  ecouterLancement,
  lancerPartieSiPossible,
};