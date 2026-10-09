// ═══════════════════════════════════════════════════════════
// 🧠 MENTALISTE
// ═══════════════════════════════════════════════════════════

export const Mentaliste = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'mentaliste',
    nom: 'Mentaliste',
    emoji: '🧠',
    camp: 'village',
    type: ['voyance'],
    estUnique: true,
    estSecondaire: false,
    description: 'Perçoit l\'issue du vote 30 secondes avant la fin. Reçoit l\'info en privé et décide de la partager ou non.',
    pouvoir: 'Pendant le vote du village, perçoit 30 secondes avant la fin si l\'issue du vote est favorable (un ennemi va mourir) ou défavorable (un villageois va mourir).',
    utilisation: 'À chaque vote du village. Info reçue automatiquement 30 secondes avant la fin.',
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['jour'],
    priorite: 99,       // Se déclenche en fin de vote
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.mentaliste) ctx.jeu.mentaliste = {};
      ctx.jeu.mentaliste[ctx.moi.uid] = {
        infoEnvoyeeCeTour: false,
      };
      return null;
    },
  
    // ─── Appelée 30 secondes avant la fin du vote ───
    onVotePresqueFini(ctx) {
      const data = ctx.jeu.mentaliste?.[ctx.moi.uid];
      if (!data) return null;
  
      // Ne pas envoyer 2 fois par tour
      if (data.infoEnvoyeeCeTour) return null;
  
      // Récupère la cible qui va être éliminée (celle avec le plus de votes)
      const cibleEliminee = ctx.cibleEliminee;
      if (!cibleEliminee) return null;
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === cibleEliminee);
      if (!cible) return null;
  
      // Détermine si l'issue est favorable ou pas
      const estEnnemi =
        cible.camp === 'loups' ||
        cible.camp === 'neutre' ||
        cible.camp === 'nightmares';
  
      const resultat = estEnnemi ? 'favorable' : 'defavorable';
  
      // Envoie l'info en privé au Mentaliste
      const emoji = estEnnemi ? '✅' : '❌';
      const texte = estEnnemi ? 'FAVORABLE' : 'DÉFAVORABLE';
  
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🧠 Le vote actuel est ${emoji} ${texte} (un ${estEnnemi ? 'ennemi' : 'villageois'} va mourir).`
      );
  
      data.infoEnvoyeeCeTour = true;
  
      ctx.journaliser(
        `🧠 Le Mentaliste perçoit un vote ${resultat} (${cible.pseudo})`
      );
  
      return {
        type: 'mentaliste',
        resultat,
        cible: cible.uid,
      };
    },
  
    // ─── Reset au début de chaque journée ───
    onDayStart(ctx) {
      const data = ctx.jeu.mentaliste?.[ctx.moi.uid];
      if (data) data.infoEnvoyeeCeTour = false;
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