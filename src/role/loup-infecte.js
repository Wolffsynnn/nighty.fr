// ═══════════════════════════════════════════════════════════
// 🦠 LOUP INFECTÉ
// ═══════════════════════════════════════════════════════════
//
// Rôle CUMULABLE SECONDAIRE.
// Attribué par le Loup Noir quand il infecte un joueur.
//
// Le joueur infecté :
//   - Garde TOUTES les capacités de son rôle d'origine
//   - Vote AVEC les loups chaque nuit (vote collectif)
//   - Change de camp → 'loups'
//   - Gagne avec les loups
//
// Ce fichier sert de "marqueur" : c'est le moteur qui assemble
// dynamiquement le rôle d'origine + le vote des loups.
// ═══════════════════════════════════════════════════════════

export const LoupInfecte = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'loup-infecte',
    nom: 'Loup Infecté',
    emoji: '🦠',
    camp: 'loups',
    type: ['elimination'],
    estUnique: false,
    estSecondaire: true,
    cumulable: true,
    description: 'Ancien villageois (ou autre rôle) infecté par le Loup Noir. Gagne désormais avec les Loups.',
    pouvoir: 'Conserve son pouvoir de base ET vote avec les loups chaque nuit.',
    utilisation: 'Chaque nuit (vote des loups) + son ancien pouvoir.',
    reglesSpeciales: [
      'Le joueur garde TOUTES les capacités de son ancien rôle.',
      'Son camp devient "loups".',
      'Il gagne avec les loups.',
      'Les autres loups sont prévenus (message privé) et voient un badge jaune 🐺 à côté de son pseudo.',
      'Le badge jaune (CSS .infected) le distingue du badge rouge des vrais loups.',
    ],
    victoire: 'Loups, quand tous les villageois et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    // ⚠️ Le moteur fusionne automatiquement :
    //   - les phases du rôle d'origine (ex: Voyante → 'nuit')
    //   - + cette phase de base (vote des loups)
    phases: ['minuit'],
    priorite: 3,   // Même priorité que les Loups-Garous

    // ═══════════ CHATS ═══════════
    chats: ['public', 'loups'],

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      // Rien à initialiser : le moteur gère tout via `roleOrigine`.
      return null;
    },

    // ─── Vote avec les loups ───
    // Le moteur fusionne cette action avec les actions du rôle d'origine.
    onNightStart(ctx) {
      const roleOrigine = ctx.moi.roleOrigine || null;

      return {
        doitChoisir: true,
        nombreCibles: 1,
        voteCollectif: true,
        visiblePar: 'loups',
        roleOrigine,   // Le moteur s'en sert pour ajouter les phases d'origine
      };
    },

    // ─── Action de nuit ───
    // Le vote est géré par le moteur (vote collectif des loups).
    // Les actions du rôle d'origine sont gérées par le moteur.
    // → Ce fichier ne fait rien de spécial, c'est le moteur qui assemble.
    onNightAction(ctx) {
      return null;
    },

    // ─── Badge visuel (optionnel) ───
    // Le moteur peut appeler ça pour savoir quelle classe CSS mettre sur le pseudo.
    getBadgeClass() {
      return 'infected';   // → badge jaune 🐺
    },

    // ─── Victoire ───
    checkWin(ctx) {
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
      const loups = vivants.filter(j => j.camp === 'loups');
      const ennemis = vivants.filter(j => j.camp !== 'loups');

      if (ennemis.length === 0) return { gagnant: 'loups' };
      if (loups.length >= ennemis.length) return { gagnant: 'loups' };
      return null;
    },
  };