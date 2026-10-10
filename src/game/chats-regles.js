// ═══════════════════════════════════════════════════════════
// 💬 RÈGLES DES CHATS
// ═══════════════════════════════════════════════════════════
//
// Détermine qui peut parler où, selon la phase.
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 📋 PHASES OÙ CHAQUE CHAT EST OUVERT
// ═══════════════════════════════════════════════════════════

export const PHASES_CHAT = {
    'public':     ['jour', 'vote', 'soir'],       // Discussion seulement le jour
    'loups':      ['minuit', 'apres-minuit'],     // Loups parlent la nuit
    'morts':      ['__TOUJOURS__'],               // Les morts parlent H24
    'nightmares': ['avant-crepuscule', 'crepuscule', 'minuit', 'apres-minuit'],
  };
  
  // ═══════════════════════════════════════════════════════════
  // 🔍 VÉRIFICATIONS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Est-ce que le chat est ouvert (temporellement) ?
   */
  export function chatOuvert(chatId, phase) {
    const phases = PHASES_CHAT[chatId];
    if (!phases) return false;
    if (phases.includes('__TOUJOURS__')) return true;
    return phases.includes(phase);
  }
  
  /**
   * Est-ce que ce joueur a accès à ce chat ?
   */
  export function aAccesChat(jeu, joueur, chatId) {
    if (!joueur) return false;
  
    // ─── Chat public : tout le monde (sauf si mort) ───
    if (chatId === 'public') {
      if (!joueur.vivant) return false;   // Les morts ne parlent pas au village
      return true;
    }
  
    // ─── Chat loups : vivants du camp loups ───
    if (chatId === 'loups') {
      return joueur.vivant && joueur.camp === 'loups';
    }
  
    // ─── Chat morts : morts + Nécromancien la nuit ───
    if (chatId === 'morts') {
      if (!joueur.vivant) return true;   // Les morts parlent entre eux
      // Nécro vivant : seulement la nuit
      if (joueur.role === 'necromancien') {
        const phaseNuit = ['avant-crepuscule', 'crepuscule', 'minuit', 'apres-minuit'];
        return phaseNuit.includes(jeu.phase);
      }
      return false;
    }
  
    // ─── Chat nightmares : vivants nightmares ───
    if (chatId === 'nightmares') {
      return joueur.vivant && joueur.camp === 'nightmares';
    }
  
    return false;
  }
  
  /**
   * Vérifie tout : le chat est-il ouvert ET le joueur y a-t-il accès ?
   */
  export function peutEnvoyerMessage(jeu, joueur, chatId) {
    if (!aAccesChat(jeu, joueur, chatId)) return { ok: false, raison: 'pas-acces' };
    if (!chatOuvert(chatId, jeu.phase)) {
      return { ok: false, raison: 'chat-ferme', phaseActuelle: jeu.phase, chatId };
    }
    return { ok: true };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📦 EXPORTS
  // ═══════════════════════════════════════════════════════════
  
  export default {
    PHASES_CHAT,
    chatOuvert,
    aAccesChat,
    peutEnvoyerMessage,
  };