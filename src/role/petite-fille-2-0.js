// ═══════════════════════════════════════════════════════════
// 👧 PETITE FILLE 2.0
// ═══════════════════════════════════════════════════════════

export const PetiteFille20 = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'petite-fille-2-0',
    nom: 'Petite Fille 2.0',
    emoji: '👧',
    camp: 'village',
    type: ['voyance', 'manipulation'],
    estUnique: true,
    estSecondaire: false,
    description: 'Espionne le chat des loups chaque nuit, et peut leur parler anonymement pendant qu\'ils attaquent, sous le pseudo [@petitefille].',
    pouvoir: 'Chaque nuit, peut espionner le chat des Loups-Garous (pseudos anonymisés). Pendant la phase d\'attaque des loups uniquement, peut aussi écrire anonymement dans leur chat sous le pseudo [@petitefille]. Les loups voient ses messages mais ne savent pas qui elle est.',
    utilisation: 'Espionnage chaque nuit (facultatif). Écriture uniquement pendant l\'attaque des loups, autant de messages qu\'elle veut.',
    reglesSpeciales: [
      'Voit les pseudos des loups ANONYMISÉS (Loup 1, Loup 2…).',
      'Voit chaque vote individuellement (qui vote quoi).',
      'Les loups peuvent lui répondre (mais elle reste anonyme pour eux).',
      'Invisible tant qu\'elle n\'écrit pas.',
      'Ses messages sont en BLEU et mis en valeur dans le chat des loups.',
      'Peut écrire UNIQUEMENT pendant la phase d\'attaque des loups.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    phases: ['minuit'],
    priorite: 99,   // Se réveille en même temps que les loups

    // ═══════════ CHATS ═══════════
    chats: ['public'],

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      // Rien à initialiser
      return null;
    },

    onNightStart(ctx) {
      return {
        mode: 'espionnage-actif',
        chat: 'loups',
        lectureSeule: false,
        pseudosAnonymises: true,
        pseudoEcriture: '[@petitefille]',
        peutEcrireApres: 'attaque-loups',
        // ✅ Pour le rendu CSS
        couleurMessage: 'bleu',
        styleMessage: 'petite-fille-20-msg',
      };
    },

    onNightAction(ctx) {
      ctx.envoyerMessage(
        ctx.moi.uid,
        `👧 Tu espionnes les loups cette nuit. Tu peux leur écrire sous le pseudo [@petitefille].`
      );

      return {
        type: 'espionnage-actif',
        chat: 'loups',
        lectureSeule: false,
        pseudoEcriture: '[@petitefille]',
        couleurMessage: 'bleu',
        styleMessage: 'petite-fille-20-msg',
      };
    },

    // ─── Appelée quand elle envoie un message dans le chat des loups ───
    onChatMessage(ctx) {
      if (ctx.chatId !== 'loups') return null;

      // Vérifie qu'on est bien pendant l'attaque des loups
      const phaseActuelle = ctx.jeu.phase;
      const estPendantAttaque =
        phaseActuelle === 'minuit' ||
        phaseActuelle === 'attaque-loups';

      if (!estPendantAttaque) {
        ctx.envoyerMessage(ctx.moi.uid, `❌ Tu ne peux écrire aux loups que pendant leur attaque.`);
        return { bloque: true };
      }

      // ✅ Message anonyme + style spécial
      return {
        type: 'message-anonyme',
        chat: 'loups',
        auteur: '[@petitefille]',
        auteurUid: ctx.moi.uid,   // interne (pour le moteur)
        texte: ctx.messageTexte,
        couleur: 'bleu',
        className: 'petite-fille-20-msg',   // → CSS pour la mise en valeur
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