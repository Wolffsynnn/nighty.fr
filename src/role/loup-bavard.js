// ═══════════════════════════════════════════════════════════
// 🗣️ LOUP BAVARD
// ═══════════════════════════════════════════════════════════

import { MOTS_LOUP_BAVARD, choisirAleatoire } from '../data/mots.js';

export const LoupBavard = {
  // ═══════════ AFFICHAGE ═══════════
  id: 'loup-bavard',
  nom: 'Loup Bavard',
  emoji: '🗣️',
  camp: 'loups',
  type: ['chaos'],
  estUnique: true,
  estSecondaire: false,
  description: 'Chaque matin, un mot lui est imposé. Il doit le cacher dans un autre mot dans le chat public avant la fin du jour, sinon il meurt.',
  pouvoir: 'Chaque matin, reçoit un mot imposé qu\'il doit cacher dans un autre mot dans le chat public avant la fin du jour.',
  utilisation: 'Chaque jour. Autant de tentatives qu\'il veut, mais doit avoir réussi avant la nuit.',
  exemple: 'Mot = "revoir" → il écrit "Aurevoir" ✅',
  victoire: 'Loups, quand tous les villageois et les neutres sont morts.',
  defaite: 'Meurt à la fin du jour s\'il n\'a pas placé son mot.',

  // ═══════════ PHASES ═══════════
  phases: ['aube', 'jour', 'soir'],
  priorite: 1,

  // ═══════════ CHATS ═══════════
  chats: ['public', 'loups'],

  // ═══════════ LOGIQUE ═══════════

  onGameStart(ctx) {
    if (!ctx.jeu.motsBavards) ctx.jeu.motsBavards = {};
    ctx.jeu.motsBavards[ctx.moi.uid] = {
      motActuel: null,
      reussiCeJour: false,
      jours: 0,
    };
    return null;
  },

  // ─── Envoie un message à tous les loups vivants (sauf soi-même) ───
  _prevenirLoups(ctx, message) {
    const loups = ctx.jeu.joueurs.filter(
      j => j.camp === 'loups' && j.vivant && j.uid !== ctx.moi.uid
    );
    loups.forEach(loup => {
      ctx.envoyerMessage(loup.uid, message);
    });
  },

  onAube(ctx) {
    const data = ctx.jeu.motsBavards?.[ctx.moi.uid];
    if (!data) return null;

    // Choisit un mot au hasard
    const mot = choisirAleatoire(MOTS_LOUP_BAVARD);

    data.motActuel = mot;
    data.reussiCeJour = false;
    data.jours += 1;

    // Message perso au Loup Bavard
    ctx.envoyerMessage(
      ctx.moi.uid,
      `🗣️ Ton mot du jour est : "${mot}". Cache-le dans un autre mot dans le chat public avant la fin du jour. Sinon, tu meurs ce soir.`
    );

    // ✅ NOUVEAU : prévient les autres loups
    this._prevenirLoups(
      ctx,
      `🗣️ Le Loup Bavard doit placer le mot "${mot}" aujourd'hui.`
    );

    ctx.journaliser(`🗣️ Le Loup Bavard ${ctx.moi.pseudo} doit placer : "${mot}"`);

    return { mot, jour: data.jours };
  },

  onJour(ctx) {
    if (!ctx.messageEnvoye || !ctx.messageTexte) return null;

    const data = ctx.jeu.motsBavards?.[ctx.moi.uid];
    if (!data || !data.motActuel || data.reussiCeJour) return null;

    const mot = data.motActuel.toLowerCase();
    const texte = ctx.messageTexte.toLowerCase();

    // ✅ CORRIGÉ : au moins 1 lettre AVANT ou APRÈS
    // "Aurevoir" → "a" avant "revoir" → match
    // "RevoirArbre" → "a" après "revoir" → match
    // "revoir" tout seul → pas de lettre avant/après → pas de match
    const lettre = '[a-zà-ÿ]';
    const regex = new RegExp(
      `(${lettre}${mot})|(${mot}${lettre})`,
      'i'
    );

    if (regex.test(texte)) {
      data.reussiCeJour = true;

      ctx.envoyerMessage(ctx.moi.uid, `✅ Mot "${mot}" placé avec succès ! Tu survis.`);

      // ✅ NOUVEAU : prévient les autres loups
      this._prevenirLoups(
        ctx,
        `✅ Le Loup Bavard a placé son mot et peut se rendormir tranquillement.`
      );

      ctx.journaliser(`✅ Le Loup Bavard a placé son mot "${mot}" : "${ctx.messageTexte}"`);
      return { reussi: true, mot, message: ctx.messageTexte };
    }

    return null;
  },

  onSoir(ctx) {
    const data = ctx.jeu.motsBavards?.[ctx.moi.uid];
    if (!data || !data.motActuel) return null;

    if (!data.reussiCeJour) {
      ctx.tuer(ctx.moi.uid);
      ctx.envoyerMessage(
        ctx.moi.uid,
        `💀 Tu n'as pas placé ton mot "${data.motActuel}". Tu meurs ce soir.`
      );
      ctx.journaliser(`💀 Le Loup Bavard ${ctx.moi.pseudo} est mort (mot "${data.motActuel}" non placé).`);
      return { mort: true, mot: data.motActuel };
    }

    return { survit: true };
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