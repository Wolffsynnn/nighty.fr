// ═══════════════════════════════════════════════════════════
// 🧑‍🌾 SIMPLE VILLAGEOIS
// ═══════════════════════════════════════════════════════════

export const SimpleVillageois = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'simple-villageois',
    nom: 'Simple Villageois',
    emoji: '🧑‍🌾',
    camp: 'village',
    type: ['aucun'],
    estUnique: false,
    estSecondaire: false,
    description: 'Habitant sans pouvoir. Vote le jour pour démasquer les loups.',
    pouvoir: 'Aucun',
    utilisation: '—',
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['jour'],       // N'agit qu'au vote du jour
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],      // Accès uniquement au chat public
  
    // ═══════════ LOGIQUE ═══════════
  
    onVote(ctx) {
      return { poidsVote: 1 };
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