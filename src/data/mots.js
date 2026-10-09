// ═══════════════════════════════════════════════════════════
// 📚 TOUS LES MOTS ET TEXTES DU JEU
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 🗣️ LOUP BAVARD — Mots à cacher dans le chat public
// ─────────────────────────────────────────────
export const MOTS_LOUP_BAVARD = [
    'revoir', 'loup', 'chat', 'nuit', 'village', 'mort',
    'sang', 'ombre', 'lune', 'forêt', 'peur', 'traître',
    'ami', 'secret', 'mensonge', 'chasse', 'cri', 'proie',
    'garde', 'cible', 'vote', 'ruse', 'sombre', 'hurle',
    'rage', 'crocs', 'griffe', 'meute', 'silence',
    'hurlement', 'traque', 'bête', 'féroce', 'morsure',
    'dévore', 'sanglant', 'sauvage', 'nocturne',
    'château', 'épée', 'flèche', 'bouclier', 'armure',
    'pierre', 'bois', 'feu', 'eau', 'terre', 'vent',
    'neige', 'pluie', 'orage', 'éclair', 'tonnerre',
    'aurore', 'crépuscule', 'minuit', 'aube', 'soir',
    'couleuvre', 'renard', 'corbeau', 'hibou', 'chouette',
    'arbre', 'feuille', 'branche', 'racine', 'fleur',
  ];
  
  // ─────────────────────────────────────────────
  // 🌑 NIGHTMARES — Textes corrompus affichés à la victime
  // (13 secondes entre chaque)
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
    'Tu ne verras pas le prochain jour.',
    'Ta place est déjà creusée.',
    'Ferme les yeux. Pour toujours.',
    'Ils t\'attendent dans le noir.',
    'Le silence t\'engloutit.',
    'Ta voix ne portera plus.',
    'Tu ne mérites pas de vivre.',
    'Le cauchemar ne fait que commencer.',
  ];
  
  // ─────────────────────────────────────────────
  // 🌑 NIGHTMARES — Message de mort spécial
  // {PSEUDO} sera remplacé par le pseudo du mort
  // ─────────────────────────────────────────────
  export const TEXTE_MORT_NIGHTMARES = '{PSEUDO} n\'a pas survécu à ses cauchemars...';
  
  // ─────────────────────────────────────────────
  // 🎭 MARIONNETTISTE — Textes d'ambiance (fils de marionnette)
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
    'Tu n\'es que poussière.',
    'Tes jambes ne répondent plus.',
    'Tu danses, tu danses, tu danses.',
    'Fais-moi confiance, tu vas tomber.',
    'Je te tiens par les fils.',
  ];
  
  // ─────────────────────────────────────────────
  // 💀 NÉCROMANCIEN — Messages d'ouverture du chat des morts
  // ─────────────────────────────────────────────
  export const TEXTES_NECROMANCIEN = [
    '🌫️ Le voile se lève...',
    '💀 Les esprits s\'éveillent.',
    '👻 Tu entends leurs murmures.',
    '🕯️ Le chat des morts s\'ouvre.',
    '🌑 Les âmes s\'agitent dans l\'ombre.',
    '⚰️ La terre s\'ouvre sous tes pieds.',
    '🦴 Les os craquent dans la nuit.',
  ];
  
  // ─────────────────────────────────────────────
  // 🌫️ RODEUR — Carte affichée à la cible
  // ─────────────────────────────────────────────
  export const TEXTE_RODEUR = {
    titre: 'Vous êtes la cible du Rodeur.',
    texte: 'Vous avez 2 tours pour tuer celui qui rode.',
  };
  
  // ─────────────────────────────────────────────
  // ⚰️ FOSSOYEUR — Message de révélation
  // ─────────────────────────────────────────────
  export const TEXTE_FOSSOYEUR = {
    titre: '⚰️ Le Fossoyeur a parlé avant de mourir...',
    sousTitre: 'Parmi ces 2 joueurs, UN est un Loup :',
  };
  
  // ─────────────────────────────────────────────
  // 🐺 PSEUDOS ANONYMES DES LOUPS
  // (utilisés pour la Petite Fille Classique / 2.0)
  // ─────────────────────────────────────────────
  export const PSEUDOS_LOUPS_ANONYMES = [
    'Cerbère',
    'Wouaf',
    'Louveteau',
    'Crocs',
    'Griffe',
    'Noiraud',
    'Fenrir',
    'Lycan',
    'Hurleur',
    'Alpha',
    'Ombre',
    'Sauvage',
    'Féroce',
    'Traqueur',
    'Chasseur',
    'Museau',
    'Poil-de-sang',
    'Vieux-Loup',
    'Braise',
    'Cendre',
  ];
  
  // ─────────────────────────────────────────────
  // 📝 UTILITAIRES
  // ─────────────────────────────────────────────
  
  /**
   * Choisit un élément aléatoire dans une liste
   */
  export function choisirAleatoire(liste) {
    if (!liste || liste.length === 0) return null;
    return liste[Math.floor(Math.random() * liste.length)];
  }
  
  /**
   * Mélange une liste (algorithme Fisher-Yates)
   */
  export function melangerListe(liste) {
    const copie = [...liste];
    for (let i = copie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }
  
  /**
   * Vérifie si un mot est caché dans un autre (pour le Loup Bavard)
   * Ex : mot = "revoir" → texte "Aurevoir" → ✅ true
   *      mot = "revoir" → texte "revoir" tout seul → ❌ false
   */
  export function contientMotCache(texte, mot) {
    if (!texte || !mot) return false;
    const regex = new RegExp(`[a-zà-ÿ]${mot.toLowerCase()}[a-zà-ÿ]`, 'i');
    return regex.test(texte.toLowerCase());
  }
  
  /**
   * Remplace {PSEUDO} dans un texte par le pseudo réel
   */
  export function formaterTexte(texte, valeurs) {
    if (!texte) return '';
    let resultat = texte;
    for (const [cle, val] of Object.entries(valeurs)) {
      resultat = resultat.replace(new RegExp(`{${cle}}`, 'g'), val);
    }
    return resultat;
  }
  
  /**
   * Génère un mapping pseudo réel → pseudo anonyme (pour les loups)
   * @param {Array} joueursLoups - Liste des joueurs loups
   * @returns {Object} - { uidReel: 'Cerbère', ... }
   */
  export function assignerPseudosAnonymes(joueursLoups) {
    const melanges = melangerListe(PSEUDOS_LOUPS_ANONYMES);
    const mapping = {};
    joueursLoups.forEach((loup, index) => {
      mapping[loup.uid] = melanges[index] || `Loup-${index + 1}`;
    });
    return mapping;
  }