// ═══════════════════════════════════════════════════════════
// 🛡️ GARDE
// ═══════════════════════════════════════════════════════════

export const Garde = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'garde',
    nom: 'Garde',
    emoji: '🛡️',
    camp: 'village',
    type: ['protection'],
    estUnique: true,
    estSecondaire: false,
    description: 'Veille sur le village. Chaque nuit, il protège un joueur ou lui-même des loups, mais jamais 2 fois de suite la même personne.',
    pouvoir: 'Chaque nuit, protège un joueur de son choix OU lui-même d\'une éventuelle attaque des Loups-Garous. Ne peut pas cibler le même joueur 2 nuits consécutives.',
    utilisation: 'Chaque nuit (facultatif).',
    reglesSpeciales: [
      'Protège UNIQUEMENT contre les Loups.',
      'Peut se protéger lui-même.',
      'Ne peut pas protéger 2 nuits de suite la même personne.',
      'Ne peut pas protéger un mort.',
      'Ne reçoit AUCUN feedback : il ne sait pas si sa protection a servi.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['crepuscule'],
    priorite: 2,
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.garde) ctx.jeu.garde = {};
      ctx.jeu.garde[ctx.moi.uid] = {
        derniereCible: null,   // UID du dernier joueur protégé
      };
  
      // ✅ NOUVEAU : tableau dédié au Garde
      if (!ctx.jeu.protectionsGarde) ctx.jeu.protectionsGarde = [];
  
      return null;
    },
  
    onNightStart(ctx) {
      const data = ctx.jeu.garde?.[ctx.moi.uid] || { derniereCible: null };
  
      // Cible interdite : le dernier protégé (pas 2 fois de suite)
      const ciblesInterdites = [];
      if (data.derniereCible) {
        ciblesInterdites.push(data.derniereCible);
      }
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: [...ciblesInterdites, 'morts'],
        facultatif: true,
        message: '🛡️ Choisis un joueur à protéger des Loups cette nuit (ou passe).',
      };
    },
  
    onNightAction(ctx) {
      if (!ctx.cible) return null;
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;
  
      const data = ctx.jeu.garde?.[ctx.moi.uid];
      if (!data) return null;
  
      // Vérifie qu'il ne protège pas 2 fois de suite la même personne
      if (data.derniereCible === cible.uid) {
        ctx.envoyerMessage(
          ctx.moi.uid,
          `❌ Tu ne peux pas protéger ${cible.pseudo} deux nuits de suite. Choisis quelqu'un d'autre.`
        );
        return { bloque: true };
      }
  
      // ✅ CORRIGÉ : tableau dédié au Garde
      if (!ctx.jeu.protectionsGarde) ctx.jeu.protectionsGarde = [];
  
      // Retire l'ancienne protection du Garde (s'il y en avait une)
      ctx.jeu.protectionsGarde = ctx.jeu.protectionsGarde.filter(
        uid => uid !== data.derniereCible
      );
  
      // Ajoute la nouvelle
      ctx.jeu.protectionsGarde.push(cible.uid);
  
      // Met à jour la dernière cible
      data.derniereCible = cible.uid;
  
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🛡️ Tu protèges ${cible.pseudo} cette nuit.`
      );
  
      ctx.journaliser(`🛡️ Le Garde ${ctx.moi.pseudo} protège ${cible.pseudo}.`);
  
      return {
        type: 'protection-gardien',
        cible: cible.uid,
      };
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