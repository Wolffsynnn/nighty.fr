// ═══════════════════════════════════════════════════════════
// 🐺 LOUP-GAROU
// ═══════════════════════════════════════════════════════════

export const LoupGarou = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'loup-garou',
    nom: 'Loup-Garou',
    emoji: '🐺',
    camp: 'loups',
    type: ['elimination'],
    estUnique: false,
    estSecondaire: false,
    description: 'Se réveille chaque nuit avec sa meute pour éliminer un joueur. Se fait passer pour un innocent le jour.',
    pouvoir: 'Chaque nuit, se réveille avec sa meute pour dévorer 1 joueur.',
    utilisation: 'Chaque nuit (obligatoire). Vote collectif entre tous les loups.',
    reglesSpeciales: [
      'Vote collectif : la majorité l\'emporte.',
      'En cas d\'égalité → personne ne meurt cette nuit.',
      'Si la cible est protégée (Garde ou Ange Gardien) → elle survit.',
      'Si la cible est infectée par le Loup Noir → elle devient loup au lieu de mourir.',
    ],
    victoire: 'Loups, quand tous les villageois et les neutres/traîtres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['minuit'],
    priorite: 3,   // ✅ CORRIGÉ : Ange (1) → Garde (2) → Loups (3)
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'loups'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      // ✅ NOUVEAU : tableau des morts de la nuit (partagé par tous les rôles)
      if (!ctx.jeu.mortsNuit) ctx.jeu.mortsNuit = [];
      return null;
    },
  
    onNightStart(ctx) {
      return {
        doitChoisir: true,
        nombreCibles: 1,
        voteCollectif: true,
        visiblePar: 'loups',
        egaliteAutorisee: true,   // ✅ Si égalité → personne ne meurt
      };
    },
  
    onNightAction(ctx) {
      if (!ctx.cible) return null;
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;
  
      // ✅ CORRIGÉ : vérifie les 2 protections
      const protegeParGarde = ctx.jeu.protectionsGarde?.includes(cible.uid);
      const protegeParAnge  = ctx.jeu.protectionsAnge?.includes(cible.uid);
  
      if (protegeParGarde || protegeParAnge) {
        const qui = protegeParGarde ? 'Garde' : 'Ange Gardien';
        ctx.journaliser(`🐺 Les loups attaquent ${cible.pseudo} → protégé(e) par le ${qui}.`);
        return { attaque: cible.uid, bloque: true };
      }
  
      // La cible est-elle infectée par le Loup Noir ?
      if (ctx.jeu.cibleInfectee === cible.uid) {
        ctx.journaliser(`🐺 Les loups attaquent ${cible.pseudo} → infecté(e) par le Loup Noir.`);
        return { attaque: cible.uid, infecte: true };
      }
  
      // ✅ CORRIGÉ : ajoute au tableau des morts
      if (!ctx.jeu.mortsNuit) ctx.jeu.mortsNuit = [];
      ctx.jeu.mortsNuit.push({
        uid: cible.uid,
        cause: 'loups',
        tour: ctx.jeu.tour || 1,
      });
  
      ctx.journaliser(`🐺 Les loups ont choisi ${cible.pseudo}.`);
  
      return { attaque: cible.uid, choisi: true };
    },
  
    checkWin(ctx) {
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
      const loups = vivants.filter(j => j.camp === 'loups');
      const ennemis = vivants.filter(j => j.camp !== 'loups');
  
      if (ennemis.length === 0) return { gagnant: 'loups' };
      if (loups.length >= ennemis.length) return { gagnant: 'loups' };
      return null;
    },
  };