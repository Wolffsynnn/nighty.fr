// ═══════════════════════════════════════════════════════════
// 🔧 RÉSOLUTION DES PHASES
// ═══════════════════════════════════════════════════════════
//
// Quand une phase se termine, ce fichier :
//   1. Lit les actions que les joueurs ont envoyées
//   2. Applique les pouvoirs (Voyante voit, Loups tuent, Garde protège…)
//   3. Envoie les messages privés
//   4. Envoie les messages publics
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
// 🔧 UTILITAIRES
// ═══════════════════════════════════════════════════════════

async function lireGame(gameId) {
  const { doc, getDoc } = await getFirestoreFns();
  const snap = await getDoc(doc(window.firebaseDB, 'games', gameId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function lireActions(gameId, tour, phase) {
  const { collection, query, where, getDocs } = await getFirestoreFns();
  const q = query(
    collection(window.firebaseDB, 'games', gameId, 'actions'),
    where('tour', '==', tour),
    where('phase', '==', phase)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function ajouterMessage(gameId, msg) {
  const { doc, updateDoc, arrayUnion } = await getFirestoreFns();
  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    messages: arrayUnion({
      pseudo: msg.pseudo || '📢 Système',
      text: msg.text,
      at: Date.now(),
      systeme: msg.systeme || false,
      pour: msg.pour || null,
    })
  });
}

async function ajouterMessageVoyance(gameId, uid, ciblePseudo, roleId) {
  const { doc, updateDoc, arrayUnion } = await getFirestoreFns();
  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    messages: arrayUnion({
      pseudo: '🔮 Vision',
      text: `Tu vois que ${ciblePseudo} est : ${getRoleName(roleId)}`,
      at: Date.now(),
      systeme: true,
      pour: uid,
      voyance: true,
      ciblePseudo,
      roleId,
    })
  });
}

// ═══════════════════════════════════════════════════════════
// 🌆 CRÉPUSCULE → Voyante, Voyante Bavarde, Garde
// ═══════════════════════════════════════════════════════════

async function resoudreCrepuscule(gameId, data, actions, tour) {
  const roles = data.rolesJoueurs || {};

  for (const action of actions) {
    if (action.type !== 'cible') continue;
    const role = roles[action.uid];

    // ─── VOYANTE ───
    if (role === 'voyante') {
      const roleVu = roles[action.cible];
      await ajouterMessageVoyance(gameId, action.uid, action.ciblePseudo, roleVu);
    }

    // ─── VOYANTE BAVARDE ───
    else if (role === 'voyante-bavarde') {
      const roleVu = roles[action.cible];
      await ajouterMessageVoyance(gameId, action.uid, action.ciblePseudo, roleVu);

      const { doc, updateDoc } = await getFirestoreFns();
      await updateDoc(doc(window.firebaseDB, 'games', gameId), {
        voyanteBavardeVision: {
          role: roleVu,
          pseudo: action.ciblePseudo,
          tour,
        }
      });
    }

    // ─── GARDE ───
    else if (role === 'garde') {
      const { doc, updateDoc, arrayUnion } = await getFirestoreFns();
      await updateDoc(doc(window.firebaseDB, 'games', gameId), {
        protectionsGarde: arrayUnion(action.cible),
      });
      await ajouterMessage(gameId, {
        text: `🛡️ Tu protèges ${action.ciblePseudo} cette nuit.`,
        pour: action.uid,
        systeme: true,
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 🌙 MINUIT → Loups, Nightmares, Rodeur
// ═══════════════════════════════════════════════════════════

async function resoudreMinuit(gameId, data, actions, tour) {
  const roles = data.rolesJoueurs || {};

  // ─── Vote des loups ───
  const votesLoups = {};
  for (const action of actions) {
    if (action.type !== 'cible') continue;
    const role = roles[action.uid];
    if (role && role.startsWith('loup')) {
      votesLoups[action.cible] = (votesLoups[action.cible] || 0) + 1;
    }
  }

  // Détermine la cible majoritaire
  let cibleLoups = null;
  let maxVotes = 0;
  let egalite = false;
  for (const [uid, count] of Object.entries(votesLoups)) {
    if (count > maxVotes) {
      maxVotes = count;
      cibleLoups = uid;
      egalite = false;
    } else if (count === maxVotes) {
      egalite = true;
    }
  }

  if (cibleLoups && !egalite) {
    const protegeGarde = (data.protectionsGarde || []).includes(cibleLoups);

    if (protegeGarde) {
      await ajouterMessage(gameId, {
        text: `🐺 Les loups ont attaqué cette nuit, mais la cible était protégée !`,
        systeme: true,
      });
    } else {
      const { doc, updateDoc, arrayUnion } = await getFirestoreFns();
      await updateDoc(doc(window.firebaseDB, 'games', gameId), {
        mortsNuit: arrayUnion({
          uid: cibleLoups,
          cause: 'loups',
          tour,
        })
      });
    }
  } else if (egalite) {
    await ajouterMessage(gameId, {
      text: `🐺 Égalité dans le vote des loups → personne ne meurt.`,
      systeme: true,
    });
  }

  // ─── Nightmares Original ───
  for (const action of actions) {
    if (action.type !== 'cible') continue;
    const role = roles[action.uid];
    if (role === 'nightmares-original') {
      const { doc, updateDoc, arrayUnion } = await getFirestoreFns();
      await updateDoc(doc(window.firebaseDB, 'games', gameId), {
        marques: arrayUnion({
          cible: action.cible,
          par: action.uid,
          tourMarque: tour,
          tourMort: tour + 1,
        })
      });
      await ajouterMessage(gameId, {
        text: `⚠️ Tu ressens une présence sombre t'envahir...`,
        pour: action.cible,
        systeme: true,
      });
      await ajouterMessage(gameId, {
        text: `🌑 Tu as marqué ${action.ciblePseudo}. Il mourra au tour suivant.`,
        pour: action.uid,
        systeme: true,
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 🌅 AUBE → Applique les morts + annonces + fin de partie
// ═══════════════════════════════════════════════════════════

async function resoudreAube(gameId, data, actions, tour) {
  const pseudos = {};
  data.players.forEach((uid, i) => {
    pseudos[uid] = data.playersPseudo[i];
  });

  const mortsNuit = data.mortsNuit || [];
  const mortsAppliquees = [];

  // ✅ FIX BUG 2 — Nightmares : applique les morts différées
  const marques = data.marques || [];
  const marquesQuiTuents = marques.filter(m => m.tourMort === tour);
  const marquesRestantes = marques.filter(m => m.tourMort > tour);

  // Récupère le pseudo + role pour l'annonce nightmares
  for (const marque of marquesQuiTuents) {
    if (!mortsNuit.find(m => m.uid === marque.cible)) {
      mortsNuit.push({
        uid: marque.cible,
        cause: 'nightmares',
        tour,
      });
    }
  }

  // ✅ FIX BUG 1 — Applique les morts + retire le mort des marques
  if (mortsNuit.length > 0) {
    const { doc, updateDoc, arrayRemove, arrayUnion } = await getFirestoreFns();

    for (const mort of mortsNuit) {
      const pseudo = pseudos[mort.uid];
      if (pseudo) mortsAppliquees.push(pseudo);

      await updateDoc(doc(window.firebaseDB, 'games', gameId), {
        joueursVivants: arrayRemove(mort.uid),
        joueursMorts: arrayUnion(mort.uid),
      });
    }

    // Reset les morts de la nuit
    await updateDoc(doc(window.firebaseDB, 'games', gameId), {
      mortsNuit: [],
    });
  }

  // ✅ FIX BUG 2 (suite) — Met à jour les marques restantes
  if (marquesQuiTuents.length > 0 || marques.length !== marquesRestantes.length) {
    const { doc, updateDoc } = await getFirestoreFns();
    await updateDoc(doc(window.firebaseDB, 'games', gameId), {
      marques: marquesRestantes,
    });
  }

  // ✅ FIX BUG 1 (suite) — Reset les protections du Garde chaque aube
  const { doc, updateDoc } = await getFirestoreFns();
  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    protectionsGarde: [],
  });

  // ─── Annonce publique ───
  if (mortsAppliquees.length === 0) {
    await ajouterMessage(gameId, {
      text: `🌅 Aucun mort cette nuit.`,
      systeme: true,
    });
  } else if (mortsAppliquees.length === 1) {
    await ajouterMessage(gameId, {
      text: `🌅 Cette nuit, ${mortsAppliquees[0]} est mort(e).`,
      systeme: true,
    });
  } else {
    await ajouterMessage(gameId, {
      text: `🌅 Cette nuit, plusieurs morts : ${mortsAppliquees.join(', ')}.`,
      systeme: true,
    });
  }

  // ─── Voyante Bavarde : révèle le rôle au village ───
  if (data.voyanteBavardeVision && data.voyanteBavardeVision.tour === tour) {
    await ajouterMessage(gameId, {
      text: `🔮 La Voyante Bavarde a eu une vision : le rôle découvert est ${getRoleName(data.voyanteBavardeVision.role)}.`,
      systeme: true,
    });
    await updateDoc(doc(window.firebaseDB, 'games', gameId), {
      voyanteBavardeVision: null,
    });
  }

  // ✅ FIX BUG 3 — Vérifie la victoire
  const dataApresAube = await lireGame(gameId);
  if (dataApresAube) {
    const resultat = verifierVictoire(dataApresAube);
    if (resultat) {
      await terminerPartie(gameId, resultat.gagnant);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 🏆 FIN DE PARTIE
// ═══════════════════════════════════════════════════════════

function getCampDuRole(roleId) {
  if (!roleId) return 'inconnu';
  if (roleId === 'loup-blanc') return 'neutre';
  if (roleId.startsWith('loup')) return 'loups';
  if (roleId.startsWith('nightmares')) return 'nightmares';
  return 'village';
}

function verifierVictoire(data) {
  const rolesJoueurs = data.rolesJoueurs || {};
  const vivants = data.joueursVivants || [];

  if (vivants.length === 0) return null;

  let nbLoups = 0;
  let nbVillage = 0;
  let nbNightmares = 0;
  let nbNeutres = 0;

  for (const uid of vivants) {
    const camp = getCampDuRole(rolesJoueurs[uid]);
    if (camp === 'loups') nbLoups++;
    else if (camp === 'village') nbVillage++;
    else if (camp === 'nightmares') nbNightmares++;
    else if (camp === 'neutre') nbNeutres++;
  }

  // 🌑 Nightmares : gagnent quand tous les autres sont morts
  if (nbNightmares > 0 && nbLoups === 0 && nbVillage === 0 && nbNeutres === 0) {
    return { gagnant: 'nightmares' };
  }

  // 🏡 Village : gagne quand tous les loups + neutres + nightmares sont morts
  if (nbLoups === 0 && nbNeutres === 0 && nbNightmares === 0 && nbVillage > 0) {
    return { gagnant: 'village' };
  }

  // 🐺 Loups : gagnent quand ils égalent ou dépassent le village
  if (nbLoups > 0 && nbLoups >= nbVillage) {
    return { gagnant: 'loups' };
  }

  return null;
}

async function terminerPartie(gameId, gagnant) {
  const { doc, updateDoc } = await getFirestoreFns();

  const labels = {
    'village': '🏡 Le Village',
    'loups': '🐺 Les Loups-Garous',
    'nightmares': '🌑 Les Nightmares',
  };

  await updateDoc(doc(window.firebaseDB, 'games', gameId), {
    enCours: false,
    status: 'finished',
    gagnant,
    finAt: Date.now(),
  });

  await ajouterMessage(gameId, {
    text: `🎉 FIN DE PARTIE — ${labels[gagnant] || gagnant} remportent la victoire !`,
    systeme: true,
  });

  console.log(`🏆 Partie terminée — gagnant : ${gagnant}`);
}

// ═══════════════════════════════════════════════════════════
// 🚀 DISPATCHER PRINCIPAL
// ═══════════════════════════════════════════════════════════

export async function resoudrePhaseTerminee(gameId, phaseTerminee, tour) {
  try {
    const data = await lireGame(gameId);
    if (!data) return;
    if (!data.enCours) return;

    const actions = await lireActions(gameId, tour, phaseTerminee);

    console.log(`🔧 Résolution de ${phaseTerminee} (tour ${tour}) — ${actions.length} action(s)`);

    switch (phaseTerminee) {
      case 'crepuscule':
        await resoudreCrepuscule(gameId, data, actions, tour);
        break;
      case 'minuit':
        await resoudreMinuit(gameId, data, actions, tour);
        break;
      case 'aube':
        await resoudreAube(gameId, data, actions, tour);
        break;
    }
  } catch (err) {
    console.warn('⚠️ Erreur résolution:', err);
  }
}

// ═══════════════════════════════════════════════════════════
// 📚 NOMS DES RÔLES
// ═══════════════════════════════════════════════════════════

const NOMS_ROLES = {
  'simple-villageois': 'Simple Villageois',
  'loup-garou': 'Loup-Garou',
  'voyante': 'Voyante',
  'sorciere': 'Sorcière',
  'loup-noir': 'Loup Noir',
  'loup-bavard': 'Loup Bavard',
  'loup-blanc': 'Loup Blanc',
  'petite-fille-classique': 'Petite Fille',
  'chasseur': 'Chasseur',
  'garde': 'Garde',
  'cupidon': 'Cupidon',
  'mentaliste': 'Mentaliste',
  'necromancien': 'Nécromancien',
  'fossoyeur': 'Fossoyeur',
  'petite-fille-2-0': 'Petite Fille 2.0',
  'voyante-bavarde': 'Voyante Bavarde',
  'nightmares-original': 'Nightmares',
  'rodeur': 'Le Rodeur',
  'marionettiste': 'La Marionettiste',
};

function getRoleName(id) {
  return NOMS_ROLES[id] || id;
}

export default {
  resoudrePhaseTerminee,
};