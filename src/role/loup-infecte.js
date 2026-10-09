// ═══════════════════════════════════════════════════════════
// 🦠 LOUP INFECTÉ
// ═══════════════════════════════════════════════════════════

export const LoupInfecte = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'loup-infecte',
    nom: 'Loup Infecté',
    emoji: '🦠',
    camp: 'loups',
    type: ['elimination'],
    estUnique: false,
    estSecondaire: true,      // Rôle secondaire (issu d'une infection)
    description: 'Ancien villageois (ou autre rôle) infecté par le Loup Noir. Gagne désormais avec les Loups.',
    pouvoir: 'Conserve son pouvoir de base ET vote avec les loups chaque nuit.',
    utilisation: 'Chaque nuit (vote des loups) + son ancien pouvoir.',
    victoire: 'Loups, quand tous les villageois et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    // Ce rôle hérite des phases de son ancien rôle + minuit (vote loups)
    // Le moteur du jeu gère ça dynamiquement via `roleOrigine`
    phases: ['minuit'],       // Phase de base : vote avec les loups
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'loups'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onNightStart(ctx) {
      // Récupère le rôle d'origine pour savoir quelles phases ajouter
      const roleOrigine = ctx.moi.roleOrigine || null;
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        voteCollectif: true,
        visiblePar: 'loups',
        // Le moteur ajoutera automatiquement les phases de roleOrigine
        roleOrigine,
      };
    },
  
    onNightAction(ctx) {
      // Le vote avec les loups est géré par le moteur (vote collectif)
      // Les actions du rôle d'origine sont gérées par le moteur
      // → Ce fichier ne fait rien de spécial, c'est le moteur qui assemble
  
      return null;
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