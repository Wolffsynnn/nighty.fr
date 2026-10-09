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
    utilisation: 'Pouvoir utilisable 1 seule fois dans la partie. Se combine avec le vote des loups la nuit.',
    victoire: 'Loups, quand tous les villageois et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['minuit'],
    priorite: 2,       // Agit APRÈS le vote des loups (priorite 1)
  
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
      const cibleLoups = ctx.jeu.victimeNuit;
  
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
  
    onNightAction(ctx) {
      // ─── CAS 1 : Le Loup Noir choisit d'infecter ───
      if (ctx.infecter && ctx.cible) {
        const infection = ctx.jeu.infections?.[ctx.moi.uid];
        if (!infection || !infection.disponible) return null;
  
        const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
        if (!cible || !cible.vivant) return null;
  
        // Vérifie protection
        if (ctx.jeu.protections?.includes(cible.uid)) {
          ctx.journaliser(`🖤 Le Loup Noir tente d'infecter ${cible.pseudo}, mais il/elle est protégé(e).`);
          return null;
        }
  
        // ─── INFECTION ───
        const ancienRole = cible.role;
        cible.role = 'loup-infecte';
        cible.camp = 'loups';
        cible.roleOrigine = ancienRole;
        cible.infectePar = ctx.moi.uid;
  
        infection.disponible = false;
        infection.utilise = true;
        infection.cible = cible.uid;
  
        // Empêche la mort cette nuit
        ctx.jeu.cibleInfectee = cible.uid;
  
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