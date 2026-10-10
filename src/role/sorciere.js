// ═══════════════════════════════════════════════════════════
// 🧪 SORCIÈRE
// ═══════════════════════════════════════════════════════════

export const Sorciere = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'sorciere',
    nom: 'Sorcière',
    emoji: '🧪',
    camp: 'village',
    type: ['elimination', 'soin'],
    estUnique: true,
    estSecondaire: false,
    description: 'Dispose de deux potions uniques : une pour sauver une victime, une pour empoisonner un joueur.',
    pouvoir: 'Possède 2 potions : une potion de vie (ressuscite la victime des loups) et une potion de mort (tue un joueur de son choix).',
    utilisation: 'Chaque potion utilisable 1 seule fois dans la partie. UNE SEULE potion par nuit.',
    reglesSpeciales: [
      'Le jeu lui montre qui est la victime des loups cette nuit.',
      'Peut utiliser UNE SEULE potion par nuit (pas les deux).',
      'Peut se sauver elle-même avec la potion de vie.',
      'Ne peut PAS empoisonner un mort.',
      'Peut empoisonner n\'importe quel joueur vivant (même un allié).',
      '2 morts possibles la même nuit : loups + empoisonnement.',
      'Chaque potion = 1 seule utilisation par partie.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    phases: ['nuit'],
    priorite: 1,

    // ═══════════ CHATS ═══════════
    chats: ['public'],

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      if (!ctx.jeu.potions) ctx.jeu.potions = {};
      ctx.jeu.potions[ctx.moi.uid] = {
        vie: true,
        mort: true,
      };
      return { potions: { vie: true, mort: true } };
    },

    onNightStart(ctx) {
      const potions = ctx.jeu.potions?.[ctx.moi.uid] || { vie: true, mort: true };
      const victimeLoups = ctx.jeu.cibleLoups || null;

      // Peut sauver si : potion vie dispo + victime des loups existe
      const peutSauver = potions.vie && victimeLoups;

      // Peut empoisonner si : potion mort dispo
      const peutEmpoisonner = potions.mort;

      // ✅ UNE SEULE potion par nuit → choix exclusif
      const peutAgir = peutSauver || peutEmpoisonner;

      return {
        doitChoisir: peutAgir,
        modeChoix: 'exclusif',    // Le moteur doit faire choisir UNE option
        visiblePar: 'soi',
        options: {
          potionVie: peutSauver,
          potionMort: peutEmpoisonner,
          victimeLoups: peutSauver ? victimeLoups : null,
        },
        message: peutSauver
          ? `🧪 La victime des loups est ${ctx.jeu.joueurs.find(j => j.uid === victimeLoups)?.pseudo}. Que veux-tu faire ?`
          : `🧪 Tu peux empoisonner quelqu'un cette nuit.`,
      };
    },

    onNightAction(ctx) {
      const potions = ctx.jeu.potions?.[ctx.moi.uid] || { vie: true, mort: true };
      const actions = [];

      // ✅ UNE SEULE potion par nuit : priorité à la potion de vie si les 2 sont envoyées
      // (le moteur devrait empêcher l'envoi des 2 de toute façon, mais on sécurise)

      // ─── POTION DE VIE ───
      if (ctx.cibleVie && potions.vie) {
        const victime = ctx.jeu.joueurs.find(j => j.uid === ctx.cibleVie);
        if (victime) {
          // ✅ Peut se sauver elle-même (plus de check "!== ctx.moi.uid")
          ctx.jeu.sauveParSorciere = victime.uid;
          potions.vie = false;

          ctx.envoyerMessage(ctx.moi.uid, `🧪 Tu utilises ta potion de vie sur ${victime.pseudo}.`);
          ctx.journaliser(`🧪 La Sorcière sauve ${victime.pseudo} avec sa potion de vie.`);

          actions.push({ type: 'sauve', cible: victime.uid });

          // ✅ Une seule potion → on stoppe là
          return actions;
        }
      }

      // ─── POTION DE MORT ───
      if (ctx.cibleMort && potions.mort) {
        const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cibleMort);
        if (cible && cible.vivant) {
          potions.mort = false;

          ctx.envoyerMessage(ctx.moi.uid, `🧪 Tu empoisonnes ${cible.pseudo} avec ta potion de mort.`);
          ctx.journaliser(`🧪 La Sorcière empoisonne ${cible.pseudo} avec sa potion de mort.`);

          // ✅ Ajoute au tableau des morts de la nuit
          if (!ctx.jeu.mortsNuit) ctx.jeu.mortsNuit = [];
          ctx.jeu.mortsNuit.push({
            uid: cible.uid,
            cause: 'sorciere',
            tour: ctx.jeu.tour || 1,
          });

          actions.push({ type: 'empoisonne', cible: cible.uid });
        }
      }

      return actions.length > 0 ? actions : null;
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