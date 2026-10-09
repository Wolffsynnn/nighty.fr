// ═══════════════════════════════════════════════════════════
// 🐺 LOUP-GAROU
// ═══════════════════════════════════════════════════════════

export const LoupGarou = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'loup-garou',
    nom: 'Loup-Garou',
    emoji: '🐺',
    camp: 'loups',
    type: ['elimination'],
    estUnique: false,
    estSecondaire: false,
    description: 'Se réveille chaque nuit avec sa meute pour éliminer un joueur. Se fait passer pour un innocent le jour.',
    pouvoir: 'Chaque nuit, se réveille avec sa meute pour dévorer 1 joueur.',
    utilisation: 'Chaque nuit (obligatoire). Vote collectif entre tous les loups.',
    victoire: 'Loups, quand tous les villageois et les neutres/traîtres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['minuit'],
    priorite: 1,      // Les loups votent en premier à Minuit
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'loups'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onNightStart(ctx) {
      return {
        doitChoisir: true,
        nombreCibles: 1,
        voteCollectif: true,
        visiblePar: 'loups',
      };
    },
  
    onNightAction(ctx) {
      if (!ctx.cible) return null;
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;
  
      // Protection ?
      if (ctx.jeu.protections?.includes(cible.uid)) {
        ctx.journaliser(`🐺 Les loups attaquent ${cible.pseudo} → protégé(e).`);
        ctx.jeu.victimeNuit = null;   // Pas de victime cette nuit
        return { attaque: cible.uid, bloque: true };
      }
  
      // La cible est-elle infectée par le Loup Noir ?
      if (ctx.jeu.cibleInfectee === cible.uid) {
        ctx.journaliser(`🐺 Les loups attaquent ${cible.pseudo} → infecté(e) par le Loup Noir.`);
        ctx.jeu.victimeNuit = null;
        return { attaque: cible.uid, infecte: true };
      }
  
      // La cible est-elle sauvée par la Sorcière ?
      // (la Sorcière agit APRÈS les loups, on note la victime pour elle)
      ctx.jeu.victimeNuit = cible.uid;
      ctx.journaliser(`🐺 Les loups ont choisi ${cible.pseudo}.`);
  
      return { attaque: cible.uid, choisi: true };
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