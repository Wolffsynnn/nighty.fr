// ═══════════════════════════════════════════════════════════
// 🎖️ ADJOINT
// ═══════════════════════════════════════════════════════════

export const Adjoint = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'adjoint',
    nom: 'Adjoint',
    emoji: '🎖️',
    camp: 'village',
    type: ['vote'],
    estUnique: true,
    estSecondaire: true,
    attribution: 'Nommé par le Maire 2.0 (1 fois par partie).',
    description: 'Adjoint du Maire 2.0. Son vote compte double tant que le Maire est vivant.',
    pouvoir: 'Son vote compte double tant que le Maire 2.0 est vivant.',
    utilisation: 'En permanence, tant que le Maire 2.0 est vivant.',
    reglesSpeciales: [
      'L\'Adjoint est nommé publiquement.',
      'Si le Maire meurt → l\'Adjoint perd son vote double.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['jour'],
    priorite: 3,
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.adjoint) ctx.jeu.adjoint = {};
      ctx.jeu.adjoint.actif = null;   // UID de l'Adjoint actuel
      return null;
    },
  
    // ─── Appelée quand il devient Adjoint ───
    onAttribution(ctx) {
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🎖️ Tu es nommé(e) Adjoint du Maire 2.0 ! Ton vote compte double tant que le Maire est vivant.`
      );
  
      ctx.journaliser(`🎖️ ${ctx.moi.pseudo} devient Adjoint du Maire 2.0.`);
      return null;
    },
  
    // ─── Vote : ×2 tant que le Maire 2.0 est vivant ───
    onVote(ctx) {
      const adjointActif = ctx.jeu.adjoint?.actif;
      if (adjointActif !== ctx.moi.uid) {
        return { poidsVote: 1 };
      }
  
      // Vérifie que le Maire 2.0 est encore vivant
      const maireUid = ctx.jeu.maire2?.actif;
      if (!maireUid) return { poidsVote: 1 };
  
      const maire = ctx.jeu.joueurs.find(j => j.uid === maireUid);
      if (!maire || !maire.vivant) return { poidsVote: 1 };
  
      // Le Maire est vivant → vote ×2
      return { poidsVote: 2 };
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