// ═══════════════════════════════════════════════════════════
// ⚰️ FOSSOYEUR
// ═══════════════════════════════════════════════════════════

export const Fossoyeur = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'fossoyeur',
    nom: 'Fossoyeur',
    emoji: '⚰️',
    camp: 'village',
    type: ['voyance', 'revelation'],
    estUnique: true,
    estSecondaire: false,
    description: 'À sa mort, révèle au village 2 joueurs (1 choisi + 1 aléatoire du camp opposé). Un des deux est un Loup, l\'autre un Villageois.',
    pouvoir: 'À sa mort, il choisit un joueur et le jeu révèle au village 2 joueurs : le choisi + un joueur aléatoire du camp opposé. Le village sait qu\'il y a forcément 1 loup parmi les 2.',
    utilisation: '1 seule fois, à sa mort.',
    precision: 'Si le joueur choisi est villageois → le random est un loup. Si le joueur choisi est loup → le random est un villageois.',
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['aube'],
    priorite: 2,       // Après le Chasseur (priorité 1)
  
    // ═══════════ CHATS ═══════════
    chats: ['public'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.fossoyeur) ctx.jeu.fossoyeur = {};
      ctx.jeu.fossoyeur[ctx.moi.uid] = {
        dejaRevele: false,
      };
      return null;
    },
  
    onAube(ctx) {
      const data = ctx.jeu.fossoyeur?.[ctx.moi.uid];
      if (!data || data.dejaRevele) return null;
  
      // Vérifie si le Fossoyeur est mort
      const estMort = !ctx.moi.vivant;
      if (!estMort) return null;
  
      // Le Fossoyeur doit choisir 1 joueur vivant
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
      if (vivants.length < 2) return null;
  
      return {
        doitChoisir: true,
        nombreCibles: 1,
        visiblePar: 'soi',
        ciblesInterdites: ['soi'],
        urgence: true,
        message: '⚰️ Tu es mort ! Choisis 1 joueur. Le village verra : lui + 1 autre du camp opposé.',
      };
    },
  
    // ─── Appelée quand le Fossoyeur a choisi sa cible ───
    onDeathAction(ctx) {
      const data = ctx.jeu.fossoyeur?.[ctx.moi.uid];
      if (!data || data.dejaRevele) return null;
      if (!ctx.cible) return null;
  
      const choisi = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!choisi) return null;
  
      // Détermine le camp du joueur choisi
      const choisiEstVillage = choisi.camp === 'village';
  
      // Récupère la liste des joueurs du camp opposé (vivants)
      const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
      const campOppose = choisiEstVillage
        ? vivants.filter(j => j.camp === 'loups')
        : vivants.filter(j => j.camp === 'village');
  
      if (campOppose.length === 0) {
        // Pas de camp opposé → ne peut rien révéler
        ctx.journaliser(`⚰️ Le Fossoyeur ne peut rien révéler (pas de camp opposé).`);
        return null;
      }
  
      // Choisit un joueur aléatoire du camp opposé
      const random = campOppose[Math.floor(Math.random() * campOppose.length)];
  
      data.dejaRevele = true;
  
      // Révèle au village les 2 joueurs (sans dire qui est le loup)
      const msg = `⚰️ Le Fossoyeur a parlé avant de mourir...\n\n` +
                  `Parmi ces 2 joueurs, UN est un Loup :\n` +
                  `🔸 ${choisi.pseudo}\n` +
                  `🔸 ${random.pseudo}`;
  
      ctx.reveleAuVillage(msg);
  
      ctx.journaliser(
        `⚰️ Le Fossoyeur ${ctx.moi.pseudo} révèle : ${choisi.pseudo} (${choisi.camp}) ` +
        `et ${random.pseudo} (${random.camp})`
      );
  
      return {
        type: 'fossoyeur',
        choisi: choisi.uid,
        random: random.uid,
        choisiCamp: choisi.camp,
        randomCamp: random.camp,
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