// ═══════════════════════════════════════════════════════════
// 📚 TOUS LES MOTS DU JEU (par rôle)
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 🗣️ LOUP BAVARD — Mots à cacher
// ─────────────────────────────────────────────
export const MOTS_LOUP_BAVARD = [
    'revoir', 'loup', 'chat', 'nuit', 'village', 'mort',
    'sang', 'ombre', 'lune', 'forêt', 'peur', 'traître',
    'ami', 'secret', 'mensonge', 'chasse', 'cri', 'proie',
    'garde', 'cible', 'vote', 'ruse', 'sombre', 'hurle',
    'rage', 'crocs', 'griffe', 'meute', 'silence', 'peur',
    'chasse', 'hurlement', 'traque', 'proie', 'bête', 'féroce',
    'morsure', 'dévore', 'sanglant', 'sauvage', 'nocturne', 'lune',
  ];
  
  // ─────────────────────────────────────────────
  // 🌑 NIGHTMARES — Textes corrompus affichés à la victime
  // ─────────────────────────────────────────────
  export const TEXTES_NIGHTMARES = [
    'Tu es faible, tout le monde le sait.',
    'Personne ne pleurera ta mort.',
    'Tu vas mourir cette nuit.',
    'On vient te chercher.',
    'Ils t\'ont déjà oublié.',
    'Tu n\'aurais jamais dû jouer.',
    'Tes alliés te trahissent.',
    'Chaque pas te rapproche de la fin.',
    'Tu entends ce bruit ? C\'est pour toi.',
    'Il est trop tard pour fuir.',
    'Personne ne peut te sauver.',
    'Regarde derrière toi.',
    'Ta mort sera lente.',
    'Tu n\'es rien.',
    'Ils rient de toi.',
    'Ta fin approche.',
  ];
  
  // ─────────────────────────────────────────────
  // 🎭 MARIONNETTISTE — Textes affichés sur les fils
  // ─────────────────────────────────────────────
  export const TEXTES_MARIONNETTISTE = [
    'Tu n\'es qu\'une marionnette...',
    'Tes fils se resserrent.',
    'Tu ne peux plus bouger.',
    'Quelqu\'un tire les ficelles.',
    'Tu danses pour moi.',
    'Obéis.',
    'Tu ne contrôles rien.',
    'Regarde tes mains bouger seules.',
    'Tu es à moi.',
    'La représentation commence.',
  ];
  
  // ─────────────────────────────────────────────
  // 💀 NÉCROMANCIEN — Textes affichés (chat des morts)
  // ─────────────────────────────────────────────
  export const TEXTES_NECROMANCIEN = [
    '🌫️ Le voile se lève...',
    '💀 Les esprits s\'éveillent.',
    '👻 Tu entends leurs murmures.',
    '🕯️ Le chat des morts s\'ouvre.',
  ];
  
  // ─────────────────────────────────────────────
  // 🌫️ RODEUR — Carte affichée à la cible
  // ─────────────────────────────────────────────
  export const TEXTE_RODEUR = {
    titre: 'Vous êtes la cible du Rodeur.',
    texte: 'Vous avez 2 tours pour tuer celui qui rode.',
  };
  
  // ─────────────────────────────────────────────
  // ⚰️ FOSSOYEUR — Message d'annonce
  // ─────────────────────────────────────────────
  export const TEXTE_FOSSOYEUR = {
    titre: '⚰️ Le Fossoyeur a parlé...',
    avant: 'Parmi ces 2 joueurs, un est un Loup :',
  };
  
  // ─────────────────────────────────────────────
  // 🌑 NIGHTMARES — Message de mort
  // ─────────────────────────────────────────────
  export const TEXTE_MORT_NIGHTMARES = '{PSEUDO} n\'a pas survécu à ses cauchemars...';
  
  // ─────────────────────────────────────────────
  // 📝 UTILITAIRE — Choisir un élément aléatoire
  // ─────────────────────────────────────────────
  export function choisirAleatoire(liste) {
    return liste[Math.floor(Math.random() * liste.length)];
  }