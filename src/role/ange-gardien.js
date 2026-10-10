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
    estSecondaire: true,
    attribution: 'Attribué automatiquement au premier joueur mort de la partie.',
    description: 'Le premier mort devient Ange Gardien. Une nuit sur deux, il protège un joueur vivant de toutes les attaques.',
    pouvoir: 'Toutes les 2 nuits, peut protéger 1 joueur vivant de son choix contre toutes les attaques possibles (loups, Nightmares, pouvoirs d\'élimination, etc.). Peut protéger n\'importe qui, même un ennemi.',
    utilisation: 'Une nuit sur deux (facultatif). 1 joueur protégé par utilisation.',
    reglesSpeciales: [
      'Ne remplace pas son ancien rôle → il est mort, son ancien rôle n\'a plus d\'effet.',
      'Peut protéger n\'importe quel camp (Village, Loups, Neutres, Nightmares...).',
      'Protection totale : annule toutes les attaques de la nuit.',
      'Un message PUBLIC est envoyé à la fin de la nuit pour dire si la protection a marché ou pas (sans révéler qui a été protégé).',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['avant-crepuscule'],
    priorite: 1,   // ✅ CORRIGÉ : agit AVANT les loups (petit = prioritaire)
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'morts'],
  
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
  
      const peutProteger =
        !data.derniereNuitProtection ||
        (tour - data.derniereNuitProtection) >= 2;
  
      if (!peutProteger) return null;
  
      // Enregistre la protection
      if (!ctx.jeu.protections) ctx.jeu.protections = [];
      ctx.jeu.protections.push(cible.uid);
  
      // ✅ NOUVEAU : trace pour savoir à la fin si ça a servi
      if (!ctx.jeu.protectionAngeEnCours) ctx.jeu.protectionAngeEnCours = [];
      ctx.jeu.protectionAngeEnCours.push({
        ange: ctx.moi.uid,
        cible: cible.uid,
        tour: tour,
      });
  
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
  
    // ─── Appelée à la FIN de la nuit ───
    // Vérifie si la protection a servi, envoie un message public.
    onNightEnd(ctx) {
      const protections = ctx.jeu.protectionAngeEnCours || [];
      if (protections.length === 0) return null;
  
      const tour = ctx.jeu.tour || 1;
      const mortsCetteNuit = ctx.jeu.mortsNuit || [];
  
      protections.forEach((p) => {
        const aMarche = mortsCetteNuit.some((m) => m.uid === p.cible);
  
        // Message public
        ctx.envoyerMessagePublic(
          aMarche
            ? `👼 L'Ange Gardien a protégé cette nuit, sa protection a MARCHÉ !`
            : `👼 L'Ange Gardien a protégé cette nuit, sa protection n'a PAS marché.`
        );
  
        ctx.journaliser(
          `👼 Protection de l'Ange Gardien sur ${p.cible} → ${aMarche ? 'a marché' : 'pas marché'}`
        );
      });
  
      // Reset
      ctx.jeu.protectionAngeEnCours = [];
      return null;
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