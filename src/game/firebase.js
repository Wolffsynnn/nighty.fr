// ═══════════════════════════════════════════════════════════
// 🔥 FIREBASE — MOTEUR DU JEU
// ═══════════════════════════════════════════════════════════
//
// Ce fichier gère TOUTE la communication Firestore du jeu :
//   - Doc principal : games/{gameId}
//   - Sous-collections : messages, actions, journal
//   - Nettoyage automatique des vieilles parties
//   - Suppression récursive (parent + sous-collections)
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
// 📄 DOC PRINCIPAL — games/{gameId}
// ═══════════════════════════════════════════════════════════

/**
 * Sauvegarde l'état complet du jeu dans le doc principal.
 * ⚠️ À n'utiliser QUE quand l'état change beaucoup (phase, tour, morts…).
 */
export async function sauvegarderEtat(gameId, jeu) {
  const { doc, updateDoc } = await getFirestoreFns();

  const data = {
    tour: jeu.tour,
    phase: jeu.phase,
    phaseIndex: jeu.phaseIndex,
    enCours: jeu.enCours,
    gagnant: jeu.gagnant || null,

    joueurs: jeu.joueurs,
    mortsNuit: jeu.mortsNuit,
    cibleLoups: jeu.cibleLoups,
    sauveParSorciere: jeu.sauveParSorciere,
    protectionsGarde: jeu.protectionsGarde,
    protectionsAnge: jeu.protectionsAnge,

    marques: jeu.marques,
    marquesContrees: jeu.marquesContrees,
    muets: jeu.muets,
    potions: jeu.potions,
    infections: jeu.infections,
    amoureux: jeu.amoureux,
    maledictions: jeu.maledictions,

    maire: jeu.maire,
    maire2: jeu.maire2,

    angeGardien: jeu.angeGardien,
    angeDechu: jeu.angeDechu,
    rodeur: jeu.rodeur,
    marionettiste: jeu.marionettiste,
    loupBlanc: jeu.loupBlanc,
    chasseur: jeu.chasseur,
    fossoyeur: jeu.fossoyeur,
    mentaliste: jeu.mentaliste,
    voyanteBavarde: jeu.voyanteBavarde,
    motsBavards: jeu.motsBavards,
    loupBlancKills: jeu.loupBlancKills,

    updatedAt: Date.now(),
  };

  await updateDoc(doc(window.firebaseDB, 'games', gameId), data);
}

/**
 * Charge l'état du jeu depuis Firestore.
 */
export async function chargerEtat(gameId) {
  const { doc, getDoc } = await getFirestoreFns();
  const snap = await getDoc(doc(window.firebaseDB, 'games', gameId));
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Écoute les changements du doc principal en temps réel.
 * Retourne une fonction unsubscribe.
 */
export async function ecouterEtat(gameId, callback) {
  const { doc, onSnapshot } = await getFirestoreFns();
  return onSnapshot(doc(window.firebaseDB, 'games', gameId), (snap) => {
    if (!snap.exists()) return callback(null);
    callback(snap.data());
  });
}

/**
 * Met à jour un champ précis du doc principal (sans tout réécrire).
 */
export async function majChamp(gameId, champ, valeur) {
  const { doc, updateDoc } = await getFirestoreFns();
  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    [champ]: valeur,
  });
}

// ═══════════════════════════════════════════════════════════
// 💬 SOUS-COLLECTION — messages
// ═══════════════════════════════════════════════════════════

/**
 * Envoie un message dans une sous-collection.
 *
 * @param {string} gameId
 * @param {string} chatId - 'public' | 'loups' | 'morts' | 'nightmares' | 'prive'
 * @param {Object} message - { uid, pseudo, texte, ... }
 */
export async function envoyerMessageFirestore(gameId, chatId, message) {
  const { collection, addDoc } = await getFirestoreFns();

  await addDoc(
    collection(window.firebaseDB, 'games', gameId, 'messages'),
    {
      chatId,
      uid: message.uid,
      pseudo: message.pseudo,
      texte: message.texte,
      anonyme: message.anonyme || false,
      couleur: message.couleur || null,
      destinataire: message.destinataire || null,   // Pour les messages privés
      tour: message.tour || null,
      phase: message.phase || null,
      at: Date.now(),
    }
  );
}

/**
 * Écoute les messages d'un chat en temps réel.
 */
export async function ecouterMessages(gameId, chatId, callback) {
  const { collection, query, where, orderBy, onSnapshot } = await getFirestoreFns();

  const q = query(
    collection(window.firebaseDB, 'games', gameId, 'messages'),
    where('chatId', '==', chatId),
    orderBy('at', 'asc')
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(messages);
  });
}

/**
 * Charge tous les messages d'un chat (une seule fois).
 */
export async function chargerMessages(gameId, chatId) {
  const { collection, query, where, orderBy, getDocs } = await getFirestoreFns();

  const q = query(
    collection(window.firebaseDB, 'games', gameId, 'messages'),
    where('chatId', '==', chatId),
    orderBy('at', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ═══════════════════════════════════════════════════════════
// 🎯 SOUS-COLLECTION — actions
// ═══════════════════════════════════════════════════════════

/**
 * Enregistre une action joueur (ciblage, vote, etc.).
 *
 * @param {string} gameId
 * @param {Object} action - { uid, type, cible, tour, phase }
 */
export async function enregistrerAction(gameId, action) {
  const { collection, addDoc } = await getFirestoreFns();

  await addDoc(
    collection(window.firebaseDB, 'games', gameId, 'actions'),
    {
      uid: action.uid,
      type: action.type,           // 'cible-nuit' | 'vote-jour' | ...
      cible: action.cible || null,
      cible2: action.cible2 || null,
      tour: action.tour || null,
      phase: action.phase || null,
      at: Date.now(),
    }
  );
}

/**
 * Récupère les actions d'un tour + phase précis.
 */
export async function chargerActions(gameId, tour, phase) {
  const { collection, query, where, getDocs } = await getFirestoreFns();

  const q = query(
    collection(window.firebaseDB, 'games', gameId, 'actions'),
    where('tour', '==', tour),
    where('phase', '==', phase)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Supprime une action (après traitement).
 */
export async function supprimerAction(gameId, actionId) {
  const { doc, deleteDoc } = await getFirestoreFns();
  await deleteDoc(doc(window.firebaseDB, 'games', gameId, 'actions', actionId));
}

// ═══════════════════════════════════════════════════════════
// 📝 SOUS-COLLECTION — journal (debug)
// ═══════════════════════════════════════════════════════════

/**
 * Ajoute une entrée de journal.
 */
export async function ajouterJournal(gameId, entree) {
  const { collection, addDoc } = await getFirestoreFns();

  await addDoc(
    collection(window.firebaseDB, 'games', gameId, 'journal'),
    {
      tour: entree.tour || null,
      phase: entree.phase || null,
      message: entree.message,
      at: Date.now(),
    }
  );
}

// ═══════════════════════════════════════════════════════════
// 🧹 NETTOYAGE — Vieilles parties
// ═══════════════════════════════════════════════════════════

/**
 * Supprime récursivement une partie (doc + toutes ses sous-collections).
 *
 * ⚠️ Firestore ne supprime PAS les sous-collections automatiquement,
 *    il faut tout supprimer manuellement.
 */
export async function supprimerPartieRecursive(gameId) {
  const { collection, getDocs, doc, deleteDoc } = await getFirestoreFns();

  // ─── Supprime les sous-collections ───
  const sousCollections = ['messages', 'actions', 'journal'];

  for (const nom of sousCollections) {
    const colRef = collection(window.firebaseDB, 'games', gameId, nom);
    const snap = await getDocs(colRef);

    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }

  // ─── Supprime le doc principal ───
  await deleteDoc(doc(window.firebaseDB, 'games', gameId));
}

/**
 * Nettoyeur automatique : supprime les parties finies depuis plus de 1h.
 *
 * Appelé au démarrage de l'app (ou toutes les X min) côté client.
 */
export async function cleanupVieillesParties() {
  const { collection, query, where, getDocs } = await getFirestoreFns();

  const maintenant = Date.now();
  const UNE_HEURE = 60 * 60 * 1000;

  try {
    // ─── Cherche les parties finies ───
    const q = query(
      collection(window.firebaseDB, 'games'),
      where('enCours', '==', false)
    );

    const snap = await getDocs(q);
    let supprimees = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const finAt = data.updatedAt || data.finishedAt || 0;

      if (maintenant - finAt > UNE_HEURE) {
        await supprimerPartieRecursive(d.id);
        supprimees++;
      }
    }

    if (supprimees > 0) {
      console.log(`🧹 ${supprimees} vieille(s) partie(s) supprimée(s).`);
    }
    return supprimees;
  } catch (err) {
    console.warn('⚠️ Erreur cleanup :', err);
    return 0;
  }
}

/**
 * Lance le nettoyeur automatique toutes les X minutes.
 *
 * @param {number} intervalleMin - Intervalle en minutes (par défaut : 30)
 * @returns {number} ID du setInterval (pour pouvoir l'arrêter)
 */
export function demarrerCleanupAuto(intervalleMin = 30) {
  // Premier nettoyage immédiat
  cleanupVieillesParties();

  // Puis toutes les X minutes
  return setInterval(cleanupVieillesParties, intervalleMin * 60 * 1000);
}

// ═══════════════════════════════════════════════════════════
// 🏁 FIN DE PARTIE
// ═══════════════════════════════════════════════════════════

/**
 * Marque une partie comme finie (mais ne la supprime pas tout de suite).
 * Le nettoyeur s'en occupera après 1h.
 */
export async function terminerPartie(gameId, gagnant) {
  const { doc, updateDoc } = await getFirestoreFns();

  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    enCours: false,
    gagnant,
    finishedAt: Date.now(),
  });
}

// ═══════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════

export default {
  // Doc principal
  sauvegarderEtat,
  chargerEtat,
  ecouterEtat,
  majChamp,

  // Messages
  envoyerMessageFirestore,
  ecouterMessages,
  chargerMessages,

  // Actions
  enregistrerAction,
  chargerActions,
  supprimerAction,

  // Journal
  ajouterJournal,

  // Nettoyage
  supprimerPartieRecursive,
  cleanupVieillesParties,
  demarrerCleanupAuto,

  // Fin de partie
  terminerPartie,
};