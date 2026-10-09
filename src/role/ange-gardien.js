// ═══════════════════════════════════════════════════════════
// 👼 ANGE GARDIEN
// ═══════════════════════════════════════════════════════════

export const AngeGardien = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'ange-gardien',
    nom: 'Ange Gardien',
    emoji: '👼',
    camp: 'village',
    type: ['protection'],
    estUnique: true,
    estSecondaire: true,       // Rôle secondaire (donné au 1er mort)
    attribution: 'Attribué automatiquement au premier joueur mort de la partie.',
    description: 'Le premier mort devient Ange Gardien. Une nuit sur deux, il protège un joueur vivant de toutes les attaques.',
    pouvoir: 'Toutes les 2 nuits, peut protéger 1 joueur vivant de son choix contre toutes les attaques possibles (loups, Nightmares, pouvoirs d\'élimination, etc.). Peut protéger n\'importe qui, même un ennemi.',
    utilisation: 'Une nuit sur deux (facultatif). 1 joueur protégé par utilisation.',
    reglesSpeciales: [
      'Ne remplace pas son ancien rôle → il est mort, son ancien rôle n\'a plus d\'effet.',
      'Peut protéger n\'importe quel camp (Village, Loups, Neutres, Nightmares...).',
      'Protection totale : annule toutes les attaques de la nuit.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['avant-crepuscule'],
    priorite: 2,
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'morts'],   // Les morts ont accès au chat des morts
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.angeGardien) ctx.jeu.angeGardien = {};
      ctx.jeu.angeGardien[ctx.moi.uid] = {
        derniereNuitProtection: null,
      };
      return null;
    },
  
    // ─── Appelée quand le joueur devient Ange Gardien (1er mort) ───
    onAttribution(ctx) {
      ctx.envoyerMessage(
        ctx.moi.uid,
        `👼 Tu es le premier mort de la partie ! Tu deviens Ange Gardien. Une nuit sur deux, tu pourras protéger un joueur vivant.`
      );
      ctx.journaliser(`👼 ${ctx.moi.pseudo} devient Ange Gardien (premier mort).`);
      return null;
    },
  
    onNightStart(ctx) {
      const data = ctx.jeu.angeGardien?.[ctx.moi.uid];
      if (!data) return null;
  
      const tour = ctx.jeu.tour || 1;
  
      // Peut protéger une nuit sur deux
      const peutProteger =
        !data.derniereNuitProtection ||
        (tour - data.derniereNuitProtection) >= 2;
  
      if (!peutProteger) {
        return {
          doitChoisir: false,
          message: `👼 Tu as déjà protégé quelqu'un récemment. Attends encore 1 nuit.`,
        };
      }
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        message: '👼 Choisis un joueur vivant à protéger cette nuit (toutes les attaques).',
      };
    },
  
    onNightAction(ctx) {
      if (!ctx.cible) return null;
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;
  
      const data = ctx.jeu.angeGardien?.[ctx.moi.uid];
      if (!data) return null;
  
      const tour = ctx.jeu.tour || 1;
  
      // Vérifie le cooldown
      const peutProteger =
        !data.derniereNuitProtection ||
        (tour - data.derniereNuitProtection) >= 2;
  
      if (!peutProteger) return null;
  
      // Enregistre la protection
      if (!ctx.jeu.protections) ctx.jeu.protections = [];
      ctx.jeu.protections.push(cible.uid);
  
      data.derniereNuitProtection = tour;
  
      ctx.envoyerMessage(
        ctx.moi.uid,
        `👼 Tu protèges ${cible.pseudo} cette nuit (toutes attaques).`
      );
  
      ctx.journaliser(`👼 L'Ange Gardien protège ${cible.pseudo} (nuit ${tour})`);
  
      return {
        type: 'protection-ange',
        cible: cible.uid,
        tour,
      };
    },
  
    checkWin(ctx) {
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
      const ennemis = vivants.filter(j =>
        j.camp === 'loups' || j.camp === 'neutre' || j.camp === 'nightmares'
      );
      if (ennemis.length === 0) return { gagnant: 'village' };
      return null;
    },
  };