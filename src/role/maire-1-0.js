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
    utilisation: 'En permanence (vote ×2). Désignation : 1 fois, à sa mort.',
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['jour'],
    priorite: 1,
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.maire) ctx.jeu.maire = {};
      ctx.jeu.maire.actif = null;         // UID du Maire actuel
      ctx.jeu.maire.successeur = null;    // UID désigné
      return null;
    },
  
    // ─── Premier jour : ÉLECTION ───
    onDayStart(ctx) {
      const tour = ctx.jeu.tour || 1;
      if (tour !== 1) return null;
      if (ctx.jeu.maire?.actif) return null;   // Déjà élu
  
      // Lance l'élection du Maire
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
      if (!ctx.maireElu) return null;
  
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
  
    // ─── Vote : ×2 si c'est lui le Maire ───
    onVote(ctx) {
      const maireActif = ctx.jeu.maire?.actif;
  
      if (maireActif === ctx.moi.uid) {
        return { poidsVote: 2 };
      }
  
      return { poidsVote: 1 };
    },
  
    // ─── Mort du Maire : il désigne son successeur ───
    onDeath(ctx) {
      const maireActif = ctx.jeu.maire?.actif;
  
      // Seulement si c'est le Maire actuel qui meurt
      if (maireActif !== ctx.moi.uid) return null;
  
      // Demande au Maire de désigner son successeur
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi'],
        urgence: true,
        message: '👔 Tu es mort ! Désigne ton successeur (qui deviendra Maire).',
      };
    },
  
    // ─── Appelée quand le Maire a désigné son successeur ───
    onSuccessorChosen(ctx) {
      if (!ctx.cible) return null;
  
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
  
    checkWin(ctx) {
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
      const ennemis = vivants.filter(j =>
        j.camp === 'loups' || j.camp === 'neutre' || j.camp === 'nightmares'
      );
      if (ennemis.length === 0) return { gagnant: 'village' };
      return null;
    },
  };