// ═══════════════════════════════════════════════════════════
// 🗣️🔮 VOYANTE BAVARDE  —  VARIANTE
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
    utilisation: 'Chaque nuit (elle peut ne pas sonder en ne faisant rien). Révélation automatique au lever du jour si elle a sondé.',
    exemple: 'Elle sonde Alice → voit "Alice = Loup-Garou". Le village voit au matin : "🔮 Le rôle découvert cette nuit : Loup-Garou".',
    reglesSpeciales: [
      'Elle voit QUI + le RÔLE de la cible (info complète pour elle).',
      'Le village apprend SEULEMENT le rôle au matin (sans le pseudo).',
      'PAS de bouton "Passer" → si elle ne clique sur rien, elle ne sonde pas.',
      'Si elle ne sonde pas → aucune révélation au village le matin.',
      'Ne peut pas se sonder elle-même.',
      'Ne peut pas sonder un mort.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    phases: ['crepuscule', 'aube'],
    priorite: 3,   // Après Voyante normale (1) et Garde (2)

    // ═══════════ CHATS ═══════════
    chats: ['public'],

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      if (!ctx.jeu.voyanteBavarde) ctx.jeu.voyanteBavarde = {};
      ctx.jeu.voyanteBavarde[ctx.moi.uid] = {
        derniereVision: null,
      };
      return null;
    },

    // ─── 🌆 CRÉPUSCULE : elle sonde ───
    onNightStart(ctx) {
      return {
        doitChoisir: true,
        facultatif: true,        // ✅ Pas obligatoire (pas de bouton Passer, mais rien = rien)
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi', 'morts'],
        message: '🔮 Choisis un joueur à sonder. Le village apprendra son rôle au matin (sans savoir qui c\'est). Tu peux aussi ne rien faire.',
      };
    },

    onNightAction(ctx) {
      if (!ctx.cible) return null;

      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;

      const data = ctx.jeu.voyanteBavarde?.[ctx.moi.uid];
      if (!data) return null;

      data.derniereVision = {
        pseudo: cible.pseudo,
        role: cible.role,
      };

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

      ctx.reveleAuVillage(
        `🔮 La Voyante Bavarde a eu une vision cette nuit...\n\n` +
        `Le rôle découvert est : **${vision.role}**`
      );

      ctx.journaliser(
        `🗣️ La Voyante Bavarde révèle au village : "${vision.role}" (c'était ${vision.pseudo})`
      );

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