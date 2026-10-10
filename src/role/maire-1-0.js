// ═══════════════════════════════════════════════════════════
// 👔 MAIRE 1.0
// ═══════════════════════════════════════════════════════════

export const Maire10 = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'maire-1-0',
    nom: 'Maire 1.0',
    emoji: '👔',
    camp: 'village',
    type: ['vote'],
    estUnique: true,
    estSecondaire: true,
    attribution: 'Élection au premier jour (activé par l\'hôte dans la composition).',
    description: 'Maire du village. Son vote compte double. À sa mort, il lègue son titre à un joueur de son choix.',
    pouvoir: 'Son vote compte double lors du vote du village. Quand il meurt, il peut désigner son successeur.',
    utilisation: 'En permanence (vote ×2). Désignation : 1 fois par Maire, à sa mort.',
    reglesSpeciales: [
      'Élection au premier jour : un seul tour de vote.',
      'En cas d\'égalité à l\'élection → reportée au lendemain.',
      'Vote ×2 en permanence.',
      'À sa mort (nuit OU jour) → il désigne un successeur.',
      'Si mort la nuit → désignation à l\'aube.',
      'Si mort le jour (vote) → désignation le soir.',
      'Succession en chaîne : chaque nouveau Maire peut à son tour désigner un successeur à sa mort.',
      'Badge visuel spécial (shader) à côté du pseudo du Maire.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    phases: ['jour', 'aube', 'soir'],
    priorite: 1,

    // ═══════════ CHATS ═══════════
    chats: ['public'],

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      if (!ctx.jeu.maire) ctx.jeu.maire = {};
      ctx.jeu.maire.actif = null;
      ctx.jeu.maire.successeur = null;
      ctx.jeu.maire.electionReportee = false;   // ✅ NOUVEAU : pour le report d'égalité
      return null;
    },

    // ─── Premier jour : ÉLECTION ───
    onDayStart(ctx) {
      const tour = ctx.jeu.tour || 1;
      if (ctx.jeu.maire?.actif) return null;   // Déjà élu
      if (tour !== 1 && !ctx.jeu.maire?.electionReportee) return null;

      ctx.jeu.maire.electionReportee = false;

      ctx.reveleAuVillage(
        `👔 Le village doit élire un Maire ! Votez pour celui que vous voulez voir diriger.`
      );

      ctx.journaliser(`👔 Élection du Maire lancée.`);

      return {
        type: 'election-maire',
        version: '1.0',
        message: 'Votez pour le Maire du village.',
      };
    },

    // ─── Appelée quand l'élection est terminée ───
    onElectionEnd(ctx) {
      if (!ctx.maireElu) {
        // ✅ Cas égalité → reporté au lendemain
        ctx.jeu.maire.electionReportee = true;
        ctx.reveleAuVillage(
          `👔 Égalité dans le vote ! L'élection du Maire est reportée à demain.`
        );
        ctx.journaliser(`👔 Élection du Maire reportée (égalité).`);
        return { type: 'election-reportee' };
      }

      const maire = ctx.jeu.joueurs.find(j => j.uid === ctx.maireElu);
      if (!maire) return null;

      ctx.jeu.maire.actif = maire.uid;

      ctx.reveleAuVillage(
        `👔 ${maire.pseudo} a été élu(e) Maire du village ! Son vote compte désormais double.`
      );

      ctx.envoyerMessage(
        maire.uid,
        `👔 Tu es le nouveau Maire ! Ton vote compte double. À ta mort, tu pourras désigner ton successeur.`
      );

      ctx.journaliser(`👔 ${maire.pseudo} devient Maire.`);

      return {
        type: 'maire-elu',
        uid: maire.uid,
      };
    },

    // ─── Vote ×2 si c'est lui le Maire ───
    onVote(ctx) {
      const maireActif = ctx.jeu.maire?.actif;
      if (maireActif === ctx.moi.uid) {
        return { poidsVote: 2 };
      }
      return { poidsVote: 1 };
    },

    // ─── Mort la nuit → désigne à l'aube ───
    onAube(ctx) {
      const maireActif = ctx.jeu.maire?.actif;
      if (maireActif !== ctx.moi.uid) return null;
      if (ctx.moi.vivant) return null;
      if (ctx.jeu.maire.successeur) return null;   // Déjà désigné

      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi', 'morts'],
        urgence: true,
        facultatif: true,
        message: '👔 Tu es mort cette nuit ! Désigne ton successeur (ou passe si tu préfères).',
      };
    },

    // ─── Mort le jour → désigne le soir ───
    onSoir(ctx) {
      const maireActif = ctx.jeu.maire?.actif;
      if (maireActif !== ctx.moi.uid) return null;
      if (ctx.moi.vivant) return null;
      if (ctx.jeu.maire.successeur) return null;

      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi', 'morts'],
        urgence: true,
        facultatif: true,
        message: '👔 Tu as été éliminé par le village ! Désigne ton successeur (ou passe).',
      };
    },

    // ─── Appelée quand le Maire a désigné (ou pas) son successeur ───
    onSuccessorChosen(ctx) {
      if (!ctx.cible) {
        ctx.journaliser(`👔 Le Maire ${ctx.moi.pseudo} n'a pas désigné de successeur.`);
        return { type: 'succession-passee' };
      }

      const successeur = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!successeur || !successeur.vivant) return null;

      // Transmet le titre
      ctx.jeu.maire.actif = successeur.uid;
      ctx.jeu.maire.successeur = successeur.uid;

      ctx.reveleAuVillage(
        `👔 Avant de mourir, le Maire a désigné ${successeur.pseudo} comme nouveau Maire.`
      );

      ctx.envoyerMessage(
        successeur.uid,
        `👔 Tu deviens le nouveau Maire ! Ton vote compte double.`
      );

      ctx.journaliser(`👔 ${successeur.pseudo} devient le nouveau Maire (succession).`);

      return {
        type: 'succession-maire',
        uid: successeur.uid,
      };
    },

    // ─── Badge visuel (shader) ───
    getBadgeClass() {
      return 'maire-shader';   // → badge shader à côté du pseudo
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