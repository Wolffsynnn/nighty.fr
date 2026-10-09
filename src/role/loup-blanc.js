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
    utilisation: 'Une nuit sur deux (obligatoire). Peut cibler n\'importe quel joueur (village, loup, neutre).',
    victoire: 'Lui seul, quand tous les autres joueurs sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['minuit', 'nuit'],
    priorite: 3,
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'loups'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.loupBlanc) ctx.jeu.loupBlanc = {};
      ctx.jeu.loupBlanc[ctx.moi.uid] = {
        derniereNuitTue: null,   // Numéro de la dernière nuit où il a tué
      };
      return null;
    },
  
    onNightStart(ctx) {
      const data = ctx.jeu.loupBlanc?.[ctx.moi.uid] || { derniereNuitTue: null };
      const tour = ctx.jeu.tour || 1;
  
      // Peut tuer une nuit sur deux
      const peutTuer = !data.derniereNuitTue || (tour - data.derniereNuitTue) >= 2;
  
      return {
        doitChoisir: true,
        nombreCibles: 1,             // Vote avec les loups à Minuit
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
  
      // ─── CAS 1 : Vote avec les loups à Minuit ───
      // (géré par le vote collectif des loups)
  
      // ─── CAS 2 : Dévorer une cible en secret à Nuit ───
      if (ctx.cibleLoupBlanc && ctx.jeu.phase === 'nuit') {
        const tour = ctx.jeu.tour || 1;
        const peutTuer = !data.derniereNuitTue || (tour - data.derniereNuitTue) >= 2;
        if (!peutTuer) return null;
  
        const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cibleLoupBlanc);
        if (!cible || !cible.vivant) return null;
  
        // Vérifie protection
        if (ctx.jeu.protections?.includes(cible.uid)) {
          ctx.journaliser(`🤍 Le Loup Blanc attaque ${cible.pseudo} → protégé(e).`);
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
      // Le Loup Blanc gagne SEUL
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
  
      // Victoire si seul survivant
      if (vivants.length === 1 && vivants[0].uid === ctx.moi.uid) {
        return { gagnant: 'loup-blanc', uid: ctx.moi.uid };
      }
  
      // Victoire si tous les autres sont morts
      if (vivants.length === 1 && vivants[0].camp === 'neutre' && vivants[0].id === 'loup-blanc') {
        return { gagnant: 'loup-blanc', uid: vivants[0].uid };
      }
  
      return null;
    },
  };