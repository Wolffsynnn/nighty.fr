// ═══════════════════════════════════════════════════════════
// 🖤 LOUP NOIR
// ═══════════════════════════════════════════════════════════

export const LoupNoir = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'loup-noir',
    nom: 'Loup Noir',
    emoji: '🖤',
    camp: 'loups',
    type: ['manipulation'],
    estUnique: true,
    estSecondaire: false,
    description: 'Loup-Garou qui, une fois par partie, infecte la victime des loups au lieu de la tuer. Elle rejoint la meute.',
    pouvoir: 'La nuit, se réveille avec les autres Loups-Garous. Une seule fois dans la partie, peut infecter la victime des loups au lieu de la dévorer → elle devient un Loup Infecté.',
    utilisation: 'Pouvoir utilisable 1 seule fois dans la partie. Se combine avec le vote des loups.',
    reglesSpeciales: [
      'Peut infecter UNIQUEMENT la cible désignée par le vote des loups.',
      'Ne peut pas infecter un autre loup.',
      'Si la cible est protégée (Garde ou Ange Gardien) → infection annulée, mais il GARDE son pouvoir pour une autre nuit.',
      'Le joueur infecté garde son rôle d\'origine + rejoint la meute.',
      'Les autres loups ne reçoivent AUCUN message : ils découvrent l\'infection via le badge jaune 🐺 du nouveau loup.',
    ],
    victoire: 'Loups, quand tous les villageois et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    phases: ['minuit', 'nuit'],
    priorite: 3,   // Vote avec les loups

    // ═══════════ CHATS ═══════════
    chats: ['public', 'loups'],

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      if (!ctx.jeu.infections) ctx.jeu.infections = {};
      ctx.jeu.infections[ctx.moi.uid] = {
        disponible: true,
        utilise: false,
      };
      return { infectionDisponible: true };
    },

    onNightStart(ctx) {
      const infection = ctx.jeu.infections?.[ctx.moi.uid] || { disponible: true };
      const cibleLoups = ctx.jeu.cibleLoups;   // Cible désignée par le vote des loups

      return {
        doitChoisir: true,
        nombreCibles: 1,
        voteCollectif: true,
        visiblePar: 'loups',
        optionSpeciale: infection.disponible && cibleLoups
          ? {
              type: 'infection',
              cible: cibleLoups,
              description: 'Infecter la victime au lieu de la dévorer (1 fois par partie)',
            }
          : null,
      };
    },

    // ─── Infection (jouée APRÈS le vote des loups, avant la phase 'nuit') ───
    onNightAction(ctx) {
      // ─── CAS 1 : Le Loup Noir choisit d'infecter ───
      if (ctx.infecter && ctx.cible) {
        const infection = ctx.jeu.infections?.[ctx.moi.uid];
        if (!infection || !infection.disponible) return null;

        const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
        if (!cible || !cible.vivant) return null;

        // Vérifie protection → si protégé, on annule MAIS il garde son pouvoir
        const protegeParGarde = ctx.jeu.protectionsGarde?.includes(cible.uid);
        const protegeParAnge  = ctx.jeu.protectionsAnge?.includes(cible.uid);

        if (protegeParGarde || protegeParAnge) {
          const qui = protegeParGarde ? 'Garde' : 'Ange Gardien';
          ctx.journaliser(`🖤 Le Loup Noir tente d'infecter ${cible.pseudo}, mais il/elle est protégé(e) par le ${qui}. Pouvoir conservé.`);
          return null;   // Pouvoir conservé (on ne touche pas à `infection`)
        }

        // ─── INFECTION ───
        const ancienRole = cible.role;
        cible.role = 'loup-infecte';
        cible.camp = 'loups';
        cible.roleOrigine = ancienRole;
        cible.infectePar = ctx.moi.uid;
        cible.badgeLoupInfecte = true;   // Pour l'affichage du badge jaune

        infection.disponible = false;
        infection.utilise = true;
        infection.cible = cible.uid;

        // Empêche la mort cette nuit (on retire la cible des morts potentiels)
        if (ctx.jeu.mortsNuit) {
          ctx.jeu.mortsNuit = ctx.jeu.mortsNuit.filter(m => m.uid !== cible.uid);
        }

        ctx.envoyerMessage(
          ctx.moi.uid,
          `🖤 Tu as infecté ${cible.pseudo} ! Il/elle rejoint la meute.`
        );

        ctx.envoyerMessage(
          cible.uid,
          `🖤 Tu as été infecté(e) par le Loup Noir ! Tu rejoins désormais la meute. Ton ancien rôle (${ancienRole}) est conservé.`
        );

        ctx.journaliser(`🖤 Le Loup Noir a infecté ${cible.pseudo} (ancien rôle : ${ancienRole})`);

        return {
          type: 'infection',
          cible: cible.uid,
          ancienRole,
        };
      }

      // ─── CAS 2 : Le Loup Noir n'infecte pas → vote normal ───
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