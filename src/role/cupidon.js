// ═══════════════════════════════════════════════════════════
// 💘 CUPIDON
// ═══════════════════════════════════════════════════════════

export const Cupidon = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'cupidon',
    nom: 'Cupidon',
    emoji: '💘',
    camp: 'village',
    type: ['manipulation'],
    estUnique: true,
    estSecondaire: false,
    description: 'La première nuit, unit 2 joueurs par l\'amour. Si l\'un meurt, l\'autre le suit dans la mort.',
    pouvoir: 'La première nuit uniquement, désigne 2 joueurs qui tombent amoureux. Si l\'un des deux meurt, l\'autre meurt immédiatement de chagrin.',
    utilisation: '1 seule fois, la première nuit (obligatoire). Peut se choisir lui-même + un autre.',
    casSpecial: 'Si les 2 amoureux sont de camps opposés → ils deviennent un nouveau camp "couple" et doivent gagner ensemble.',
    reglesSpeciales: [
      'Peut se choisir lui-même + un autre joueur.',
      'Ne peut pas choisir 2 fois le même joueur.',
      'Les 2 amoureux savent qu\'ils sont en couple dès la nuit 1 (au crépuscule).',
      'Les 2 amoureux ont un chat privé (bulle ❤️).',
      'Si un amoureux meurt → l\'autre meurt de chagrin immédiatement.',
      'Si les 2 amoureux sont de camps OPPOSÉS → ils deviennent camp "couple".',
      'Si les 2 amoureux sont du MÊME camp → ils gardent leurs camps d\'origine.',
    ],
    victoire: 'Village (sauf si camp "couple" → victoire ensemble).',
  
    // ═══════════ PHASES ═══════════
    phases: ['avant-crepuscule'],
    priorite: 1,   // 1er à jouer la 1ère nuit
  
    // ═══════════ CHATS ═══════════
    chats: ['public'], // + chat privé ❤️ avec son amoureux (géré par le moteur)
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.amoureux) ctx.jeu.amoureux = null;
      return null;
    },
  
    onNightStart(ctx) {
      // Ne joue QUE la première nuit
      const tour = ctx.jeu.tour || 1;
      if (tour !== 1) return null;
  
      return {
        doitChoisir: true,
        nombreCibles: 2,
        visiblePar: 'soi',
        message: '💘 Choisis 2 joueurs qui tomberont amoureux (tu peux te choisir toi-même).',
      };
    },
  
    onNightAction(ctx) {
      const tour = ctx.jeu.tour || 1;
      if (tour !== 1) return null;
  
      // Vérifie qu'il y a bien 2 cibles
      if (!ctx.cible || !ctx.cible2) return null;
      if (ctx.cible === ctx.cible2) {
        ctx.envoyerMessage(ctx.moi.uid, `❌ Tu ne peux pas choisir 2 fois le même joueur.`);
        return { bloque: true };
      }
  
      const joueur1 = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      const joueur2 = ctx.jeu.joueurs.find(j => j.uid === ctx.cible2);
      if (!joueur1 || !joueur2) return null;
  
      // ✅ NOUVEAU : détecte si les camps sont opposés
      const campsOpposes = joueur1.camp !== joueur2.camp;
  
      if (campsOpposes) {
        // Les 2 deviennent un nouveau camp "couple"
        joueur1.camp = 'couple';
        joueur2.camp = 'couple';
      }
  
      // Enregistre les amoureux
      ctx.jeu.amoureux = [joueur1.uid, joueur2.uid];
  
      // Prévient les 2 amoureux (ils savent qui est leur partenaire)
      const msg1 = `💘 Tu es amoureux(se) de ${joueur2.pseudo} ! Si l'un de vous meurt, l'autre meurt aussi.`;
      const msg2 = `💘 Tu es amoureux(se) de ${joueur1.pseudo} ! Si l'un de vous meurt, l'autre meurt aussi.`;
  
      ctx.envoyerMessage(joueur1.uid, msg1);
      ctx.envoyerMessage(joueur2.uid, msg2);
  
      // Prévient Cupidon (s'il ne fait pas partie du couple)
      if (ctx.moi.uid !== joueur1.uid && ctx.moi.uid !== joueur2.uid) {
        ctx.envoyerMessage(
          ctx.moi.uid,
          `💘 Tu as uni ${joueur1.pseudo} et ${joueur2.pseudo}.`
        );
      }
  
      // Ouvre un chat privé entre les 2 amoureux (géré par le moteur)
      ctx.journaliser(
        `💘 Cupidon a uni ${joueur1.pseudo} et ${joueur2.pseudo}` +
        (campsOpposes ? ' (camps opposés → camp "couple")' : ' (même camp)') + '.'
      );
  
      return {
        type: 'cupidon',
        amoureux: [joueur1.uid, joueur2.uid],
        campsOpposes,
      };
    },
  
    // ─── Appelée quand un amoureux meurt ───
    onDeath(ctx) {
      const amoureux = ctx.jeu.amoureux;
      if (!amoureux || amoureux.length !== 2) return null;
  
      // Vérifie si le mort est un des 2 amoureux
      const mortUid = ctx.mort?.uid || ctx.moi.uid;
      if (!amoureux.includes(mortUid)) return null;
  
      // Trouve l'autre amoureux
      const autreUid = amoureux.find(uid => uid !== mortUid);
      if (!autreUid) return null;
  
      const autre = ctx.jeu.joueurs.find(j => j.uid === autreUid);
      if (!autre || !autre.vivant) return null;
  
      // L'autre meurt de chagrin
      ctx.tuer(autreUid);
  
      ctx.reveleAuVillage(
        `💔 ${autre.pseudo} n'a pas supporté la mort de son amour et s'est éteint(e).`
      );
  
      ctx.journaliser(`💔 ${autre.pseudo} meurt de chagrin (amoureux de ${ctx.mort?.pseudo || '?'}).`);
  
      return {
        type: 'mort-chagrin',
        cible: autreUid,
      };
    },
  
    checkWin(ctx) {
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
      const amoureux = ctx.jeu.amoureux;
  
      // ─── Cas spécial : les 2 amoureux sont TOUS les 2 vivants ET camp "couple" ───
      if (amoureux && amoureux.length === 2) {
        const j1 = ctx.jeu.joueurs.find(j => j.uid === amoureux[0]);
        const j2 = ctx.jeu.joueurs.find(j => j.uid === amoureux[1]);
  
        if (j1 && j2 && j1.vivant && j2.vivant && j1.camp === 'couple' && j2.camp === 'couple') {
          // Vérifie s'il ne reste QUE les 2 amoureux vivants
          if (vivants.length === 2) {
            return {
              gagnant: 'couple',
              amoureux: [j1.uid, j2.uid],
            };
          }
        }
      }
  
      // ─── Victoire normale du Village ───
      const ennemis = vivants.filter(j =>
        j.camp === 'loups' || j.camp === 'neutre' || j.camp === 'nightmares'
      );
      if (ennemis.length === 0) return { gagnant: 'village' };
  
      return null;
    },
  };