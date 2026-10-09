// ═══════════════════════════════════════════════════════════
// 🗣️🔮 VOYANTE BAVARDE
// ═══════════════════════════════════════════════════════════

export const VoyanteBavarde = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'voyante-bavarde',
    nom: 'Voyante Bavarde',
    emoji: '🗣️🔮',
    camp: 'village',
    type: ['voyance'],
    estUnique: true,
    estSecondaire: false,
    description: 'Voyante qui voit qui a quel rôle, mais le village ne reçoit que le rôle (sans le pseudo).',
    pouvoir: 'Chaque nuit, découvre le rôle exact d\'un joueur (elle voit qui + son rôle). Au lever du jour, le jeu révèle automatiquement au village le rôle découvert — mais pas à qui il appartient.',
    utilisation: 'Chaque nuit (obligatoire). Révélation automatique au lever du jour (rôle uniquement).',
    exemple: 'Elle sonde Alice → voit "Alice = Loup-Garou". Le village voit au matin : "🔮 Le rôle découvert cette nuit : Loup-Garou".',
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['crepuscule', 'aube'],
    priorite: 3,       // Après la Voyante normale (priorité 1) et le Garde (priorité 2)
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.voyanteBavarde) ctx.jeu.voyanteBavarde = {};
      ctx.jeu.voyanteBavarde[ctx.moi.uid] = {
        derniereVision: null,   // { pseudo, role }
      };
      return null;
    },
  
    // ─── 🌆 CRÉPUSCULE : elle sonde ───
    onNightStart(ctx) {
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi'],
        message: '🔮 Choisis un joueur à sonder. Le village apprendra son rôle au matin (sans savoir qui c\'est).',
      };
    },
  
    onNightAction(ctx) {
      if (!ctx.cible) return null;
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;
  
      const data = ctx.jeu.voyanteBavarde?.[ctx.moi.uid];
      if (!data) return null;
  
      // Enregistre la vision
      data.derniereVision = {
        pseudo: cible.pseudo,
        role: cible.role,
      };
  
      // Prévient la Voyante Bavarde en privé (elle voit QUI + le rôle)
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🔮 Tu vois que ${cible.pseudo} est : ${cible.role}`
      );
  
      ctx.journaliser(
        `🔮 La Voyante Bavarde ${ctx.moi.pseudo} a sondé ${cible.pseudo} → ${cible.role}`
      );
  
      return {
        type: 'voyance',
        cible: cible.uid,
        vu: cible.role,
        pseudoVu: cible.pseudo,
      };
    },
  
    // ─── 🌅 AUBE : le village découvre le rôle (sans savoir qui) ───
    onAube(ctx) {
      const data = ctx.jeu.voyanteBavarde?.[ctx.moi.uid];
      if (!data || !data.derniereVision) return null;
  
      const vision = data.derniereVision;
  
      // Révèle le rôle au village (sans le pseudo)
      ctx.reveleAuVillage(
        `🔮 La Voyante Bavarde a eu une vision cette nuit...\n\n` +
        `Le rôle découvert est : **${vision.role}**`
      );
  
      ctx.journaliser(
        `🗣️ La Voyante Bavarde révèle au village : "${vision.role}" (c'était ${vision.pseudo})`
      );
  
      // Reset pour la nuit suivante
      data.derniereVision = null;
  
      return {
        type: 'voyante-bavarde-revelation',
        roleRevele: vision.role,
        pseudoCache: vision.pseudo,
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