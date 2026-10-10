// ═══════════════════════════════════════════════════════════
// 👧 PETITE FILLE CLASSIQUE
// ═══════════════════════════════════════════════════════════

export const PetiteFilleClassique = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'petite-fille-classique',
    nom: 'Petite Fille Classique',
    emoji: '👧',
    camp: 'village',
    type: ['voyance'],
    estUnique: true,
    estSecondaire: false,
    description: 'Espionne les conversations des loups chaque nuit. Les pseudos sont anonymisés, elle doit deviner qui se cache derrière.',
    pouvoir: 'Chaque nuit, peut espionner le chat privé des Loups-Garous en temps réel. Elle voit les messages échangés, mais pas les vrais pseudos (les loups ont des pseudos anonymes : Louveteau, Cerbère, Wouaf...).',
    utilisation: 'Chaque nuit (facultatif).',
    reglesSpeciales: [
      'Les pseudos anonymes des loups sont FIXES toute la partie.',
      'Elle peut espionner chaque nuit, mais c\'est FACULTATIF (elle peut choisir de ne pas regarder).',
      'Elle est en LECTURE SEULE : elle ne peut PAS écrire dans le chat des loups.',
      'Les loups NE SAVENT PAS qu\'elle les espionne (sauf si le rôle est déduit).',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    phases: ['minuit'],
    priorite: 99,   // Se réveille en dernier (elle écoute)

    // ═══════════ CHATS ═══════════
    chats: ['public'],   // + accès en LECTURE au chat des loups (géré par le moteur)

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      // Rien à initialiser
      return null;
    },

    onNightStart(ctx) {
      return {
        doitChoisir: false,      // Elle n'a pas de cible à choisir
        facultatif: true,        // Peut choisir de ne pas espionner
        mode: 'espionnage',
        chat: 'loups',
        lectureSeule: true,
        pseudosAnonymises: true,
        message: '👧 Veux-tu espionner les loups cette nuit ?',
      };
    },

    onNightAction(ctx) {
      ctx.envoyerMessage(
        ctx.moi.uid,
        `👧 Tu espionnes les loups cette nuit. Regarde leur chat.`
      );

      return {
        type: 'espionnage',
        chat: 'loups',
        lectureSeule: true,
        pseudosAnonymises: true,
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