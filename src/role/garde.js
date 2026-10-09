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
    pouvoir: 'Chaque nuit, protège un joueur de son choix OU lui-même d\'une éventuelle attaque des Loups-Garous.',
    utilisation: 'Chaque nuit (facultatif). Ne peut pas cibler le même joueur 2 nuits consécutives.',
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
        derniereCible: null,    // UID du dernier joueur protégé
      };
      return null;
    },
  
    onNightStart(ctx) {
      const data = ctx.jeu.garde?.[ctx.moi.uid] || { derniereCible: null };
  
      // Récupère la liste des joueurs vivants (sauf la dernière cible)
      const ciblesInterdites = [];
      if (data.derniereCible) {
        ciblesInterdites.push(data.derniereCible);
      }
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites,           // Ne peut pas protéger 2 fois de suite
        // Il peut se choisir lui-même
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
  
      // Enregistre la protection
      if (!ctx.jeu.protections) ctx.jeu.protections = [];
      // Retire la protection précédente du Garde (s'il y en avait une)
      ctx.jeu.protections = ctx.jeu.protections.filter(uid => uid !== data.derniereCible);
      // Ajoute la nouvelle
      ctx.jeu.protections.push(cible.uid);
  
      // Met à jour la dernière cible
      data.derniereCible = cible.uid;
  
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🛡️ Tu protèges ${cible.pseudo} cette nuit.`
      );
  
      ctx.journaliser(`🛡️ Le Garde ${ctx.moi.pseudo} protège ${cible.pseudo}.`);
  
      return {
        type: 'protection',
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