// ═══════════════════════════════════════════════════════════
// 📢 NOTIFICATIONS — Messages système du chat
// ═══════════════════════════════════════════════════════════
//
// Chaque fonction retourne un objet :
//   { text: string, couleur: string, pour?: uid }
//
// Couleurs disponibles : 'vert', 'rouge', 'jaune', 'bleu', 'violet'
//
// Si `pour` est défini → message privé (visible uniquement par ce uid)
// Sinon → message public (visible par tous)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 🎨 COULEURS (pour référence)
// ═══════════════════════════════════════════════════════════

export const COULEURS = {
    VERT:   'vert',    // 🟢 Positif pour le village
    ROUGE:  'rouge',   // 🔴 Négatif pour le village
    JAUNE:  'jaune',   // 🟡 Neutre
    BLEU:   'bleu',    // 🔵 Info
    VIOLET: 'violet',  // 🟣 Nightmares
  };
  
  // ═══════════════════════════════════════════════════════════
  // 🌆 MESSAGES DE PHASE (tous en bleu)
  // ═══════════════════════════════════════════════════════════
  
  const MESSAGES_PHASES = {
    'avant-crepuscule': '🌆 Le soleil se couche doucement, l\'Avant-Crépuscule commence.',
    'crepuscule':       '🌇 Le Crépuscule commence.',
    'minuit':           '🌙 Minuit commence, les loups se réveillent.',
    'apres-minuit':     '🌌 La nuit continue, l\'Après-Minuit commence.',
    'nuit':             '🌃 La nuit profonde s\'installe.',
    'aube':             '🌅 Le village se réveille et les annonces commencent.',
    'vote-maire':       '🗳️ Les villageois votent pour leur Maire.',
    'vote-village':     '🗳️ Les villageois votent pour éliminer un suspect.',
    'soir':             '🌇 Le village s\'endort pour la nuit.',
  };
  
  export function messagePhase(phase) {
    const text = MESSAGES_PHASES[phase];
    if (!text) return null;
    return { text, couleur: COULEURS.BLEU };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🌅 AUBE — Morts de la nuit
  // ═══════════════════════════════════════════════════════════
  
  export function aucunMort() {
    return {
      text: '🌅 Aucun mort cette nuit. Le village a été épargné... cette fois.',
      couleur: COULEURS.VERT,
    };
  }
  
  export function mortUnique(pseudo) {
    return {
      text: `🌅 Cette nuit, ${pseudo} est mort(e).`,
      couleur: COULEURS.ROUGE,
    };
  }
  
  export function plusieursMorts(pseudos) {
    return {
      text: `🌅 Cette nuit, plusieurs morts : ${pseudos.join(', ')}.`,
      couleur: COULEURS.ROUGE,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🐺 LOUPS / GARDE
  // ═══════════════════════════════════════════════════════════
  
  export function cibleProtegee() {
    return {
      text: '🐺 Les loups ont attaqué cette nuit, mais la cible était protégée !',
      couleur: COULEURS.JAUNE,
    };
  }
  
  export function egaliteLoups() {
    return {
      text: '🐺 Égalité dans le vote des loups → personne ne meurt.',
      couleur: COULEURS.JAUNE,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔮 VOYANCE (privée)
  // ═══════════════════════════════════════════════════════════
  
  export function voyancePrivee(pourUid, ciblePseudo, roleNom) {
    return {
      text: `🔮 Tu vois que ${ciblePseudo} est : ${roleNom}.`,
      couleur: COULEURS.BLEU,
      pour: pourUid,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔮 VOYANTE BAVARDE (révélation publique)
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Détermine la couleur selon le camp du rôle révélé.
   * @param {string} camp - 'village' | 'loups' | 'neutre' | 'nightmares'
   */
  function couleurSelonCamp(camp) {
    if (camp === 'village')    return COULEURS.VERT;
    if (camp === 'loups')      return COULEURS.ROUGE;
    if (camp === 'nightmares') return COULEURS.VIOLET;
    return COULEURS.JAUNE; // neutre
  }
  
  export function voyanteBavardeRevelation(roleNom, camp) {
    return {
      text: `La Voyante Bavarde a regardé le rôle du ${roleNom} cette nuit.`,
      couleur: couleurSelonCamp(camp),
      type: 'info-voyance', // ✅ NOUVEAU : pour déclencher la bulle bleue
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🛡️ GARDE (privé)
  // ═══════════════════════════════════════════════════════════
  
  export function gardeProtege(pourUid, ciblePseudo) {
    return {
      text: `🛡️ Tu protèges ${ciblePseudo} cette nuit.`,
      couleur: COULEURS.JAUNE,
      pour: pourUid,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🌑 NIGHTMARES (privé)
  // ═══════════════════════════════════════════════════════════
  
  export function nightmaresCibleMarquee(pourUid) {
    return {
      text: '⚠️ Tu ressens une présence sombre t\'envahir...',
      couleur: COULEURS.VIOLET,
      pour: pourUid,
    };
  }
  
  export function nightmaresConfirmation(pourUid, ciblePseudo) {
    return {
      text: `🌑 Tu as marqué ${ciblePseudo}. Il mourra au tour suivant.`,
      couleur: COULEURS.VIOLET,
      pour: pourUid,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🏆 FIN DE PARTIE
  // ═══════════════════════════════════════════════════════════
  
  export function finDePartie(gagnant) {
    const labels = {
      'village':    '🏡 Le Village',
      'loups':      '🐺 Les Loups-Garous',
      'nightmares': '🌑 Les Nightmares',
    };
    const couleur = couleurSelonCamp(gagnant);
  
    return {
      text: `🎉 FIN DE PARTIE — ${labels[gagnant] || gagnant} remportent la victoire !`,
      couleur,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📦 EXPORT DEFAULT (pratique pour l'import)
  // ═══════════════════════════════════════════════════════════
  
  export default {
    COULEURS,
    messagePhase,
    aucunMort,
    mortUnique,
    plusieursMorts,
    cibleProtegee,
    egaliteLoups,
    voyancePrivee,
    voyanteBavardeRevelation,
    gardeProtege,
    nightmaresCibleMarquee,
    nightmaresConfirmation,
    finDePartie,
  };