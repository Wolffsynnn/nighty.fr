// ═══════════════════════════════════════════════════════════
// 👑 MAIRE 2.0
// ═══════════════════════════════════════════════════════════

export const Maire20 = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'maire-2-0',
    nom: 'Maire 2.0',
    emoji: '👑',
    camp: 'village',
    type: ['vote', 'autorite'],
    estUnique: true,
    estSecondaire: true,
    attribution: 'Élection au premier jour (activé par l\'hôte dans la composition).',
    description: 'Maire amélioré. Vote double, peut rendre muet un joueur, et peut nommer un Adjoint qui vote double aussi.',
    pouvoir: [
      'Son vote compte double lors du vote du village.',
      '1 fois / 2 jours : peut rendre un joueur muet → ce joueur ne peut pas parler dans le chat public pendant toute la journée.',
      '1 fois par Maire : peut nommer un Adjoint → l\'Adjoint vote aussi ×2 tant que le Maire est vivant.',
    ],
    utilisation: [
      'Vote ×2 : en permanence.',
      'Muet : 1 fois / 2 jours (Jour 1 → Jour 3 → Jour 5...).',
      'Adjoint : 1 fois par Maire (chaque nouveau Maire peut nommer le sien).',
    ],
    reglesSpeciales: [
      'Élection au premier jour : un seul tour de vote.',
      'En cas d\'égalité à l\'élection → reportée au lendemain.',
      'Muet : ne peut cibler personne d\'autre que lui-même — pas d\'auto-ciblage.',
      'Muet : peut toujours VOTER (il est juste bloqué dans le chat public).',
      'Muet : dure toute la journée, reset à la fin du jour.',
      'Adjoint : nommé publiquement.',
      'Adjoint : perd son vote double si le Maire meurt (sauf s\'il devient Maire).',
      'Adjoint : si l\'Adjoint meurt → le Maire actuel ne peut PAS renommer.',
      'Nouveau Maire (après succession) → peut nommer son propre Adjoint (1 nomination par Maire).',
      'Si mort la nuit → désignation du successeur à l\'aube.',
      'Si mort le jour → désignation du successeur le soir.',
      'Badge visuel spécial (shader) à côté du pseudo du Maire 2.0.',
    ],
    victoire: 'Village, quand tous les loups et les neutres sont morts.',

    // ═══════════ PHASES ═══════════
    phases: ['jour', 'aube', 'soir'],
    priorite: 2,

    // ═══════════ CHATS ═══════════
    chats: ['public'],

    // ═══════════ LOGIQUE ═══════════

    onGameStart(ctx) {
      if (!ctx.jeu.maire2) ctx.jeu.maire2 = {};
      ctx.jeu.maire2.actif = null;
      ctx.jeu.maire2.adjoint = null;
      ctx.jeu.maire2.adjointNomme = false;
      ctx.jeu.maire2.dernierMuet = null;
      ctx.jeu.maire2.electionReportee = false;   // ✅ NOUVEAU : gestion report
      return null;
    },

    // ─── Premier jour : ÉLECTION ───
    onDayStart(ctx) {
      const tour = ctx.jeu.tour || 1;
      if (ctx.jeu.maire2?.actif) return null;
      if (tour !== 1 && !ctx.jeu.maire2?.electionReportee) return null;

      ctx.jeu.maire2.electionReportee = false;

      ctx.reveleAuVillage(
        `👑 Le village doit élire un Maire 2.0 ! Votez pour celui que vous voulez voir diriger.`
      );

      ctx.journaliser(`👑 Élection du Maire 2.0 lancée.`);

      return {
        type: 'election-maire',
        version: '2.0',
        message: 'Votez pour le Maire 2.0 du village.',
      };
    },

    onElectionEnd(ctx) {
      if (!ctx.maireElu) {
        // ✅ Cas égalité → reporté au lendemain
        ctx.jeu.maire2.electionReportee = true;
        ctx.reveleAuVillage(
          `👑 Égalité dans le vote ! L'élection du Maire 2.0 est reportée à demain.`
        );
        ctx.journaliser(`👑 Élection du Maire 2.0 reportée (égalité).`);
        return { type: 'election-reportee' };
      }

      const maire = ctx.jeu.joueurs.find(j => j.uid === ctx.maireElu);
      if (!maire) return null;

      ctx.jeu.maire2.actif = maire.uid;
      // ✅ Reset du flag de nomination pour ce nouveau Maire
      ctx.jeu.maire2.adjointNomme = false;

      ctx.reveleAuVillage(
        `👑 ${maire.pseudo} a été élu(e) Maire 2.0 ! Son vote compte double.`
      );

      ctx.envoyerMessage(
        maire.uid,
        `👑 Tu es le nouveau Maire 2.0 !\n` +
        `• Ton vote compte double.\n` +
        `• Tu peux rendre muet 1 joueur (1 fois / 2 jours).\n` +
        `• Tu peux nommer un Adjoint (1 fois par Maire).`
      );

      ctx.journaliser(`👑 ${maire.pseudo} devient Maire 2.0.`);

      return { type: 'maire-elu', uid: maire.uid };
    },

    // ─── Vote : ×2 si c'est lui le Maire ───
    onVote(ctx) {
      const maireActif = ctx.jeu.maire2?.actif;
      if (maireActif === ctx.moi.uid) {
        return { poidsVote: 2 };
      }
      return { poidsVote: 1 };
    },

    // ─── Pouvoir MUET + Nomination Adjoint (n'importe quel jour) ───
    onDayAction(ctx) {
      if (ctx.jeu.maire2?.actif !== ctx.moi.uid) return null;

      const tour = ctx.jeu.tour || 1;
      const data = ctx.jeu.maire2;

      // ─── MUET ───
      if (ctx.muetCible) {
        const peutMuet = !data.dernierMuet || (tour - data.dernierMuet) >= 2;

        if (!peutMuet) {
          ctx.envoyerMessage(
            ctx.moi.uid,
            `❌ Tu as déjà rendu muet récemment. Attends 1 jour.`
          );
          return null;
        }

        const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.muetCible);
        if (!cible || !cible.vivant) return null;
        if (cible.uid === ctx.moi.uid) return null;   // Pas soi-même

        if (!ctx.jeu.muets) ctx.jeu.muets = [];
        ctx.jeu.muets.push({
          cible: cible.uid,
          tour: tour,
          par: ctx.moi.uid,
        });

        data.dernierMuet = tour;

        ctx.envoyerMessage(
          cible.uid,
          `🤐 Le Maire 2.0 t'a rendu muet ! Tu ne peux pas parler dans le chat public pendant toute cette journée.`
        );

        ctx.reveleAuVillage(
          `🤐 Le Maire 2.0 a rendu ${cible.pseudo} muet pour ce tour.`
        );

        ctx.journaliser(`🤐 Le Maire 2.0 rend ${cible.pseudo} muet (tour ${tour})`);

        return { type: 'muet', cible: cible.uid, tour };
      }

      // ─── NOMINATION ADJOINT ───
      if (ctx.adjointCible && !data.adjointNomme) {
        const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.adjointCible);
        if (!cible || !cible.vivant) return null;
        if (cible.uid === ctx.moi.uid) return null;

        data.adjoint = cible.uid;
        data.adjointNomme = true;

        ctx.reveleAuVillage(
          `🎖️ Le Maire 2.0 a nommé ${cible.pseudo} comme Adjoint ! Son vote compte double tant que le Maire est vivant.`
        );

        ctx.envoyerMessage(
          cible.uid,
          `🎖️ Tu es nommé(e) Adjoint du Maire 2.0 ! Ton vote compte double tant qu'il est vivant.`
        );

        ctx.journaliser(`🎖️ ${cible.pseudo} devient Adjoint du Maire 2.0.`);

        return { type: 'nomination-adjoint', cible: cible.uid };
      }

      return null;
    },

    // ─── Blocage chat public si muet ───
    onChatMessage(ctx) {
      const muets = ctx.jeu.muets || [];
      const estMuet = muets.some(
        m => m.cible === ctx.moi.uid && m.tour === ctx.jeu.tour
      );

      if (estMuet && ctx.chatId === 'public') {
        ctx.envoyerMessage(ctx.moi.uid, `🤐 Tu es muet ce tour, tu ne peux pas parler.`);
        return { bloque: true };
      }

      return null;
    },

    // ─── Reset des muets à la fin du jour ───
    onDayEnd(ctx) {
      if (ctx.jeu.muets) {
        ctx.jeu.muets = ctx.jeu.muets.filter(m => m.tour !== ctx.jeu.tour);
      }
      return null;
    },

    // ─── Mort la nuit → désigne à l'aube ───
    onAube(ctx) {
      const maireActif = ctx.jeu.maire2?.actif;
      if (maireActif !== ctx.moi.uid) return null;
      if (ctx.moi.vivant) return null;

      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi', 'morts'],
        urgence: true,
        facultatif: true,
        message: '👑 Tu es mort cette nuit ! Désigne ton successeur (ou passe).',
      };
    },

    // ─── Mort le jour → désigne le soir ───
    onSoir(ctx) {
      const maireActif = ctx.jeu.maire2?.actif;
      if (maireActif !== ctx.moi.uid) return null;
      if (ctx.moi.vivant) return null;

      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi', 'morts'],
        urgence: true,
        facultatif: true,
        message: '👑 Tu as été éliminé par le village ! Désigne ton successeur (ou passe).',
      };
    },

    // ─── Succession ───
    onSuccessorChosen(ctx) {
      if (!ctx.cible) {
        ctx.journaliser(`👑 Le Maire 2.0 ${ctx.moi.pseudo} n'a pas désigné de successeur.`);
        return { type: 'succession-passee' };
      }

      const successeur = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!successeur || !successeur.vivant) return null;

      ctx.jeu.maire2.actif = successeur.uid;
      // ✅ Nouveau Maire → il peut nommer son propre Adjoint
      ctx.jeu.maire2.adjoint = null;
      ctx.jeu.maire2.adjointNomme = false;

      ctx.reveleAuVillage(
        `👑 Avant de mourir, le Maire 2.0 a désigné ${successeur.pseudo} comme nouveau Maire.`
      );

      ctx.envoyerMessage(
        successeur.uid,
        `👑 Tu deviens le nouveau Maire 2.0 ! Tu peux nommer ton propre Adjoint (1 fois).`
      );

      ctx.journaliser(`👑 ${successeur.pseudo} devient le nouveau Maire 2.0.`);

      return { type: 'succession-maire', uid: successeur.uid };
    },

    // ─── Badge visuel (shader) ───
    getBadgeClass() {
      return 'maire2-shader';   // → badge shader différent du Maire 1.0
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