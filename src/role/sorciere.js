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
    utilisation: 'Chaque potion utilisable 1 seule fois dans la partie. Peut utiliser les deux la même nuit.',
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
      const victimeLoups = ctx.jeu.victimeNuit || null;
  
      // Empêche de se sauver soi-même
      const peutSauver = potions.vie && victimeLoups && victimeLoups !== ctx.moi.uid;
  
      return {
        doitChoisir: peutSauver || potions.mort,
        nombreCibles: (peutSauver && potions.mort) ? 2 : 1,
        visiblePar: 'soi',
        options: {
          potionVie: peutSauver,
          potionMort: potions.mort,
          victimeLoups: peutSauver ? victimeLoups : null,
        },
      };
    },
  
    onNightAction(ctx) {
      const potions = ctx.jeu.potions?.[ctx.moi.uid] || { vie: true, mort: true };
      const actions = [];
  
      // ─── POTION DE VIE ───
      if (ctx.cibleVie && potions.vie) {
        const victime = ctx.jeu.joueurs.find(j => j.uid === ctx.cibleVie);
        if (victime && victime.uid !== ctx.moi.uid) {
          ctx.jeu.sauveParSorciere = victime.uid;
          potions.vie = false;
  
          ctx.envoyerMessage(ctx.moi.uid, `🧪 Tu utilises ta potion de vie sur ${victime.pseudo}.`);
          ctx.journaliser(`🧪 La Sorcière sauve ${victime.pseudo} avec sa potion de vie.`);
  
          actions.push({ type: 'sauve', cible: victime.uid });
        }
      }
  
      // ─── POTION DE MORT ───
      if (ctx.cibleMort && potions.mort) {
        const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cibleMort);
        if (cible && cible.vivant) {
          potions.mort = false;
  
          ctx.envoyerMessage(ctx.moi.uid, `🧪 Tu empoisonnes ${cible.pseudo} avec ta potion de mort.`);
          ctx.journaliser(`🧪 La Sorcière empoisonne ${cible.pseudo} avec sa potion de mort.`);
  
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