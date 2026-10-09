// ═══════════════════════════════════════════════════════════
// 👿 ANGE DÉCHU
// ═══════════════════════════════════════════════════════════

export const AngeDechu = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'ange-dechu',
    nom: 'Ange Déchu',
    emoji: '👿',
    camp: 'loups',
    type: ['manipulation'],
    estUnique: true,
    estSecondaire: true,
    attribution: 'Attribué automatiquement au premier joueur mort de la partie (si activé par l\'hôte).',
    description: 'Le premier mort devient Ange Déchu. Une nuit sur deux, il maudit un joueur qui ne pourra pas voter le lendemain.',
    pouvoir: 'Toutes les 2 nuits, peut maudire 1 joueur vivant → ce joueur ne peut pas voter le lendemain.',
    utilisation: 'Une nuit sur deux (facultatif). 1 joueur maudit par utilisation.',
    reglesSpeciales: [
      'Ne remplace pas son ancien rôle → il est mort, son ancien rôle n\'a plus d\'effet.',
      'Gagne avec les Loups.',
    ],
    victoire: 'Loups, quand tous les villageois et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['avant-crepuscule'],
    priorite: 3,
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'morts', 'loups'],   // Il gagne avec les loups
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.angeDechu) ctx.jeu.angeDechu = {};
      ctx.jeu.angeDechu[ctx.moi.uid] = {
        derniereNuitMalediction: null,
      };
      return null;
    },
  
    // ─── Appelée quand le joueur devient Ange Déchu (1er mort) ───
    onAttribution(ctx) {
      ctx.envoyerMessage(
        ctx.moi.uid,
        `👿 Tu es le premier mort de la partie ! Tu deviens Ange Déchu. Une nuit sur deux, tu pourras maudire un joueur vivant.`
      );
  
      // Prévient les loups qu'un allié les a rejoints
      const loups = ctx.jeu.joueurs.filter(j => j.camp === 'loups' && j.vivant);
      loups.forEach(loup => {
        ctx.envoyerMessage(
          loup.uid,
          `👿 L'Ange Déchu (${ctx.moi.pseudo}) a rejoint votre camp !`
        );
      });
  
      ctx.journaliser(`👿 ${ctx.moi.pseudo} devient Ange Déchu (premier mort).`);
      return null;
    },
  
    onNightStart(ctx) {
      const data = ctx.jeu.angeDechu?.[ctx.moi.uid];
      if (!data) return null;
  
      const tour = ctx.jeu.tour || 1;
  
      // Peut maudire une nuit sur deux
      const peutMaudire =
        !data.derniereNuitMalediction ||
        (tour - data.derniereNuitMalediction) >= 2;
  
      if (!peutMaudire) {
        return {
          doitChoisir: false,
          message: `👿 Tu as déjà maudit quelqu'un récemment. Attends encore 1 nuit.`,
        };
      }
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi'],
        message: '👿 Choisis un joueur à maudire. Il ne pourra pas voter demain.',
      };
    },
  
    onNightAction(ctx) {
      if (!ctx.cible) return null;
  
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;
  
      const data = ctx.jeu.angeDechu?.[ctx.moi.uid];
      if (!data) return null;
  
      const tour = ctx.jeu.tour || 1;
  
      // Vérifie le cooldown
      const peutMaudire =
        !data.derniereNuitMalediction ||
        (tour - data.derniereNuitMalediction) >= 2;
  
      if (!peutMaudire) return null;
  
      // Enregistre la malédiction
      if (!ctx.jeu.maledictions) ctx.jeu.maledictions = [];
      ctx.jeu.maledictions.push({
        cible: cible.uid,
        par: ctx.moi.uid,
        tour: tour,
      });
  
      data.derniereNuitMalediction = tour;
  
      // Prévient la cible (elle sait qu'elle ne peut pas voter)
      ctx.envoyerMessage(
        cible.uid,
        `👿 Tu as été maudit(e) ! Tu ne pourras PAS voter demain.`
      );
  
      // Prévient l'Ange Déchu
      ctx.envoyerMessage(
        ctx.moi.uid,
        `👿 Tu as maudit ${cible.pseudo}. Il/elle ne pourra pas voter demain.`
      );
  
      ctx.journaliser(`👿 L'Ange Déchu maudit ${cible.pseudo} (nuit ${tour})`);
  
      return {
        type: 'malediction',
        cible: cible.uid,
        tour,
      };
    },
  
    // ─── Vérifie si un joueur peut voter ───
    onVote(ctx) {
      const maledictions = ctx.jeu.maledictions || [];
  
      // Vérifie si le joueur actuel est maudit ce tour
      const estMaudit = maledictions.some(m => m.cible === ctx.moi.uid);
  
      if (estMaudit) {
        ctx.envoyerMessage(ctx.moi.uid, `👿 Tu es maudit(e) : ton vote est annulé.`);
        return { poidsVote: 0 };
      }
  
      return { poidsVote: 1 };
    },
  
    // ─── Reset des malédictions à la fin du jour ───
    onDayEnd(ctx) {
      // Retire les malédictions utilisées (elles ne durent qu'un jour)
      if (ctx.jeu.maledictions) {
        ctx.jeu.maledictions = ctx.jeu.maledictions.filter(
          m => m.tour !== ctx.jeu.tour
        );
      }
      return null;
    },
  
    checkWin(ctx) {
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
      const loups = vivants.filter(j => j.camp === 'loups');
      const ennemis = vivants.filter(j => j.camp !== 'loups');
  
      if (ennemis.length === 0) return { gagnant: 'loups' };
      if (loups.length >= ennemis.length) return { gagnant: 'loups' };
      return null;
    },
  };