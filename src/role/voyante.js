// ═══════════════════════════════════════════════════════════
// 🔮 VOYANTE
// ═══════════════════════════════════════════════════════════

export const Voyante = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'voyante',
    nom: 'Voyante',
    emoji: '🔮',
    camp: 'village',
    type: ['voyance'],
    estUnique: true,
    estSecondaire: false,
    description: 'Se réveille chaque nuit pour sonder un joueur et découvrir son véritable rôle.',
    pouvoir: 'Chaque nuit, découvre le rôle exact d\'un joueur de son choix.',
    utilisation: 'Chaque nuit (pas obligatoire → si elle ne clique rien, elle ne sonde pas).',
    reglesSpeciales: [
      'Elle voit QUI + le RÔLE de la cible.',
      'Info PRIVÉE (elle seule).',
      'PAS de bouton "Passer" → si elle ne clique sur rien, elle ne sonde pas.',
      'Peut re-sonder le même joueur plusieurs nuits de suite.',
      'Ne peut pas se sonder elle-même.',
      'Ne peut pas sonder un mort.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    phases: ['crepuscule'],
    priorite: 1,

    // ═══════════ CHATS ═══════════
    chats: ['public'],

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      // Rien à initialiser
      return null;
    },

    onNightStart(ctx) {
      return {
        doitChoisir: true,
        facultatif: true,        // ✅ Pas obligatoire
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi', 'morts'],
        message: '🔮 Choisis un joueur à sonder (ou ne fais rien pour passer).',
      };
    },

    onNightAction(ctx) {
      if (!ctx.cible) return null;

      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;

      // Révèle le rôle en privé
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🔮 Tu vois que ${cible.pseudo} est : ${cible.role}`
      );

      ctx.journaliser(`🔮 La Voyante ${ctx.moi.pseudo} a sondé ${cible.pseudo} → ${cible.role}`);

      return {
        type: 'voyance',
        cible: cible.uid,
        vu: cible.role,
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