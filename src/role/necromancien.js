// ═══════════════════════════════════════════════════════════
// 💀 NÉCROMANCIEN
// ═══════════════════════════════════════════════════════════

export const Necromancien = {
    // ═══════════ AFFICHAGE ═══════════
    id: 'necromancien',
    nom: 'Nécromancien',
    emoji: '💀',
    camp: 'village',
    type: ['voyance', 'communication'],
    estUnique: true,
    estSecondaire: false,
    description: 'Chaque nuit, discute avec les morts dans un chat spécial. Les morts peuvent tout lui raconter.',
    pouvoir: 'Chaque nuit, ouvre un chat privé avec tous les joueurs morts. Il peut leur parler et ils peuvent répondre, autant qu\'ils veulent, toute la nuit.',
    utilisation: 'Chaque nuit. Chat illimité avec les morts, tant que la nuit dure.',
    victoire: 'Village, quand tous les loups et les neutres sont morts.',
  
    // ═══════════ PHASES ═══════════
    phases: ['avant-crepuscule', 'crepuscule', 'minuit', 'nuit'],
    priorite: 99,       // Pas d'action active, juste un chat ouvert
  
    // ═══════════ CHATS ═══════════
    chats: ['public', 'morts'],
  
    // ═══════════ LOGIQUE ═══════════
  
    onGameStart(ctx) {
      if (!ctx.jeu.necromancien) ctx.jeu.necromancien = {};
      ctx.jeu.necromancien[ctx.moi.uid] = {
        chatOuvert: false,
      };
      return null;
    },
  
    // ─── Ouverture du chat des morts au début de la nuit ───
    onNightStart(ctx) {
      const data = ctx.jeu.necromancien?.[ctx.moi.uid];
      if (!data) return null;
  
      // Vérifie qu'il y a au moins 1 mort
      const morts = ctx.jeu.joueurs.filter(j => !j.vivant);
      if (morts.length === 0) {
        // Pas de morts → chat inutile
        return {
          chatDisponible: false,
          message: '💀 Aucun mort à contacter cette nuit.',
        };
      }
  
      data.chatOuvert = true;
  
      // Prévient le Nécromancien
      ctx.envoyerMessage(
        ctx.moi.uid,
        `💀 Le chat des morts est ouvert (${morts.length} mort${morts.length > 1 ? 's' : ''}). Tu peux leur parler toute la nuit.`
      );
  
      // Prévient les morts qu'ils peuvent parler au Nécromancien
      morts.forEach(mort => {
        ctx.envoyerMessage(
          mort.uid,
          `💀 Le Nécromancien ouvre le chat des morts. Tu peux lui parler toute la nuit.`
        );
      });
  
      ctx.journaliser(`💀 Le Nécromancien ${ctx.moi.pseudo} ouvre le chat des morts.`);
  
      return {
        type: 'necromancien',
        chat: 'morts',
        participants: morts.map(m => m.uid),
      };
    },
  
    // ─── Appelée quand un message est envoyé dans le chat des morts ───
    onChatMessage(ctx) {
      if (ctx.chatId !== 'morts') return null;
  
      // Vérifie qu'on est bien la nuit
      const phaseNuit = ['avant-crepuscule', 'crepuscule', 'minuit', 'nuit'];
      if (!phaseNuit.includes(ctx.jeu.phase)) {
        ctx.envoyerMessage(ctx.moi.uid, `❌ Le chat des morts n'est disponible que la nuit.`);
        return { bloque: true };
      }
  
      // Le message passe normalement
      return {
        type: 'message-morts',
        chat: 'morts',
        auteur: ctx.moi.pseudo,
        auteurUid: ctx.moi.uid,
        texte: ctx.messageTexte,
        vivant: ctx.moi.vivant,
      };
    },
  
    // ─── Fermeture du chat à la fin de la nuit ───
    onNightEnd(ctx) {
      const data = ctx.jeu.necromancien?.[ctx.moi.uid];
      if (data) data.chatOuvert = false;
  
      ctx.envoyerMessage(ctx.moi.uid, `💀 Le chat des morts se referme...`);
      return { type: 'fermeture-chat-morts' };
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