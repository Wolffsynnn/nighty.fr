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
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['minuit'],
    priorite: 99,       // Se réveille en dernier (elle écoute)
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],  // + accès en LECTURE au chat des loups (géré par le moteur)
  
    // ═══════════ LOGIQUE ═══════════
  
    onNightStart(ctx) {
      // Elle n'agit pas, elle OBSERVE
      return {
        mode: 'espionnage',
        chat: 'loups',
        lectureSeule: true,        // Ne peut pas écrire
        pseudosAnonymises: true,   // Voit Cerbère, Wouaf... au lieu des vrais pseudos
      };
    },
  
    onNightAction(ctx) {
      // Elle n'a pas d'action → juste un flag pour le moteur
      // Le moteur active l'affichage du chat des loups (lecture seule) sur son écran
      ctx.envoyerMessage(
        ctx.moi.uid,
        `👧 Tu espionnes les loups cette nuit. Regarde leur chat.`
      );
  
      return {
        type: 'espionnage',
        chat: 'loups',
        lectureSeule: true,
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