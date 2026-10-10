// ═══════════════════════════════════════════════════════════
// 🤍 LOUP BLANC
// ═══════════════════════════════════════════════════════════

export const LoupBlanc = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'loup-blanc',
    nom: 'Loup Blanc',
    emoji: '🤍',
    camp: 'neutre',
    type: ['elimination'],
    estUnique: true,
    estSecondaire: false,
    description: 'Faux allié des loups. Une nuit sur deux, dévore n\'importe quel joueur en secret. Gagne seul.',
    pouvoir: 'Se réveille la nuit avec les autres Loups-Garous (qui le croient allié). Une nuit sur deux, peut dévorer n\'importe quel joueur de son choix.',
    utilisation: 'Vote avec les loups TOUTES les nuits. Tue en secret UNE nuit sur deux (à partir de la 2ème nuit).',
    reglesSpeciales: [
      'Vote avec les loups toutes les nuits (comme un loup normal).',
      'Peut tuer en secret 1 nuit sur 2 (cooldown dynamique).',
      'Peut tuer n\'importe qui (village, loup, neutre, nightmares).',
      'Les loups ne savent PAS qu\'il les trahit.',
      'La mort causée par le Loup Blanc est ANONYME : personne ne sait qui l\'a tué.',
      'Gagne SEUL : doit être le dernier survivant.',
    ],
    victoire: 'Lui seul, quand il est le dernier survivant.',
  
    // ═══════════ PHASES ═══════════
    phases: ['minuit', 'nuit'],
    priorite: 3,
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'loups'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.loupBlanc) ctx.jeu.loupBlanc = {};
      ctx.jeu.loupBlanc[ctx.moi.uid] = {
        derniereNuitTue: null,
      };
      return null;
    },
  
    onNightStart(ctx) {
      const data = ctx.jeu.loupBlanc?.[ctx.moi.uid] || { derniereNuitTue: null };
      const tour = ctx.jeu.tour || 1;
  
      const peutTuer = !data.derniereNuitTue || (tour - data.derniereNuitTue) >= 2;
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        voteCollectif: true,
        visiblePar: 'loups',
        optionSpeciale: peutTuer
          ? {
              type: 'loup-blanc-kill',
              description: 'Dévorer un joueur en secret (1 nuit sur 2)',
              ciblesInterdites: ['soi'],
            }
          : null,
      };
    },
  
    onNightAction(ctx) {
      const data = ctx.jeu.loupBlanc?.[ctx.moi.uid];
      if (!data) return null;
  
      // ─── Vote avec les loups (géré par le vote collectif) ───
  
      // ─── Kill secret ───
      if (ctx.cibleLoupBlanc && ctx.jeu.phase === 'nuit') {
        const tour = ctx.jeu.tour || 1;
        const peutTuer = !data.derniereNuitTue || (tour - data.derniereNuitTue) >= 2;
        if (!peutTuer) return null;
  
        const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cibleLoupBlanc);
        if (!cible || !cible.vivant) return null;
  
        // Vérifie protection (Garde)
        if (ctx.jeu.protectionsGarde?.includes(cible.uid)) {
          ctx.journaliser(`🤍 Le Loup Blanc attaque ${cible.pseudo} → protégé(e) par le Garde.`);
          return null;
        }
  
        // Vérifie protection (Ange Gardien)
        if (ctx.jeu.protectionsAnge?.includes(cible.uid)) {
          ctx.journaliser(`🤍 Le Loup Blanc attaque ${cible.pseudo} → protégé(e) par l'Ange Gardien.`);
          return null;
        }
  
        // Sauvé par la Sorcière ?
        if (ctx.jeu.sauveParSorciere === cible.uid) {
          ctx.journaliser(`🤍 Le Loup Blanc attaque ${cible.pseudo} → sauvé(e) par la Sorcière.`);
          return null;
        }
  
        // Tue la cible
        ctx.tuer(cible.uid);
        data.derniereNuitTue = tour;
  
        ctx.envoyerMessage(
          ctx.moi.uid,
          `🤍 Tu as dévoré ${cible.pseudo} en secret.`
        );
  
        ctx.journaliser(`🤍 Le Loup Blanc a dévoré ${cible.pseudo} (nuit ${tour})`);
  
        return {
          type: 'loup-blanc-kill',
          cible: cible.uid,
          tour,
        };
      }
  
      return null;
    },
  
    checkWin(ctx) {
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
  
      // ✅ Victoire UNIQUEMENT s'il est le seul survivant
      if (vivants.length === 1 && vivants[0].uid === ctx.moi.uid) {
        return { gagnant: 'loup-blanc', uid: ctx.moi.uid };
      }
  
      return null;
    },
  };