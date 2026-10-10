// ═══════════════════════════════════════════════════════════
// 🏹 CHASSEUR
// ═══════════════════════════════════════════════════════════

export const Chasseur = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'chasseur',
    nom: 'Chasseur',
    emoji: '🏹',
    camp: 'village',
    type: ['elimination'],
    estUnique: true,
    estSecondaire: false,
    description: 'À sa mort, tue un joueur de son choix en partant.',
    pouvoir: 'Quand il meurt (la nuit par les loups, le jour par le vote, ou par un autre pouvoir), il peut tirer une dernière balle et emporter un joueur de son choix avec lui.',
    utilisation: 'Une seule fois, à sa mort. Facultatif.',
    reglesSpeciales: [
      'Peut viser n\'importe qui SAUF lui-même.',
      'Ne peut viser qu\'un joueur VIVANT.',
      'Peut décider de ne tirer sur personne (facultatif).',
      'Mort la nuit → tire à l\'aube.',
      'Mort le jour (vote) → tire le soir, après le vote.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['aube', 'soir'],
    priorite: 1,
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.chasseur) ctx.jeu.chasseur = {};
      ctx.jeu.chasseur[ctx.moi.uid] = {
        dejaTire: false,
        mortNuit: false,   // true si mort cette nuit
        mortJour: false,   // true si mort ce jour
      };
      return null;
    },
  
    // ─── MORT LA NUIT → tire à l'aube ───
    onAube(ctx) {
      const data = ctx.jeu.chasseur?.[ctx.moi.uid];
      if (!data || data.dejaTire) return null;
  
      // Vérifie si le Chasseur est mort cette nuit
      const estMort = !ctx.moi.vivant;
      if (!estMort) return null;
  
      data.mortNuit = true;
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi', 'morts'],
        urgence: true,
        facultatif: true,
        message: '🏹 Tu es mort cette nuit ! Choisis un joueur à emporter avec toi (ou passe).',
      };
    },
  
    // ─── MORT LE JOUR (vote) → tire le soir ───
    onSoir(ctx) {
      const data = ctx.jeu.chasseur?.[ctx.moi.uid];
      if (!data || data.dejaTire) return null;
      if (data.mortNuit) return null; // Déjà géré à l'aube
  
      // Vérifie si le Chasseur est mort ce jour
      const estMort = !ctx.moi.vivant;
      if (!estMort) return null;
  
      data.mortJour = true;
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi', 'morts'],
        urgence: true,
        facultatif: true,
        message: '🏹 Tu as été éliminé par le village ! Choisis un joueur à emporter avec toi (ou passe).',
      };
    },
  
    // ─── Appelée quand le Chasseur a choisi sa cible (ou passé) ───
    onDeathAction(ctx) {
      const data = ctx.jeu.chasseur?.[ctx.moi.uid];
      if (!data || data.dejaTire) return null;
  
      // Si pas de cible → le Chasseur a choisi de ne pas tirer
      if (!ctx.cible) {
        data.dejaTire = true;
        ctx.journaliser(`🏹 Le Chasseur ${ctx.moi.pseudo} n'a emporté personne.`);
        return { type: 'chasseur-passe' };
      }
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;
  
      // Tire sur la cible
      ctx.tuer(cible.uid);
      data.dejaTire = true;
  
      ctx.journaliser(`🏹 Le Chasseur ${ctx.moi.pseudo} a emporté ${cible.pseudo} dans la mort.`);
  
      // Annonce publique
      ctx.reveleAuVillage(
        `🏹 Avant de mourir, le Chasseur a tiré sur ${cible.pseudo} et l'a emporté avec lui.`
      );
  
      return {
        type: 'chasseur-tir',
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