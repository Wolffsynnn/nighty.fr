// ═══════════════════════════════════════════════════════════
// 🏹 CHASSEUR
// ═══════════════════════════════════════════════════════════

export const Chasseur = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'chasseur',
    nom: 'Chasseur',
    emoji: '🏹',
    camp: 'village',
    type: ['elimination'],
    estUnique: true,
    estSecondaire: false,
    description: 'À sa mort, tue un joueur de son choix en partant.',
    pouvoir: 'Quand il meurt (la nuit par les loups, le jour par le vote, ou par un autre pouvoir), il peut tirer une dernière balle et emporter un joueur de son choix avec lui.',
    utilisation: 'Une seule fois, à sa mort. Obligatoire.',
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['aube'],
    priorite: 1,       // Tire avant les autres résolutions
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.chasseur) ctx.jeu.chasseur = {};
      ctx.jeu.chasseur[ctx.moi.uid] = {
        dejaTire: false,
      };
      return null;
    },
  
    onAube(ctx) {
      const data = ctx.jeu.chasseur?.[ctx.moi.uid];
      if (!data || data.dejaTire) return null;
  
      // Vérifie si le Chasseur est mort cette nuit
      const estMort = !ctx.moi.vivant;
      if (!estMort) return null;
  
      // Le Chasseur doit choisir une cible à emporter
      // Le moteur va lui envoyer un prompt pour choisir
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi'],
        urgence: true,      // Il doit répondre vite
        message: '🏹 Tu es mort ! Choisis un joueur à emporter avec toi.',
      };
    },
  
    // ─── Appelée quand le Chasseur a choisi sa cible ───
    onDeathAction(ctx) {
      const data = ctx.jeu.chasseur?.[ctx.moi.uid];
      if (!data || data.dejaTire) return null;
      if (!ctx.cible) return null;
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;
  
      // Tire sur la cible
      ctx.tuer(cible.uid);
      data.dejaTire = true;
  
      ctx.journaliser(`🏹 Le Chasseur ${ctx.moi.pseudo} a emporté ${cible.pseudo} dans la mort.`);
  
      // Annonce publique
      ctx.reveleAuVillage(
        `🏹 Avant de mourir, le Chasseur a tiré sur ${cible.pseudo} et l'a emporté avec lui.`
      );
  
      return {
        type: 'chasseur-tir',
        cible: cible.uid,
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