// ═══════════════════════════════════════════════════════════
// 🎭 LA MARIONNETTISTE
// ═══════════════════════════════════════════════════════════

import { TEXTES_MARIONNETTISTE } from '../data/mots.js';

export const Marionettiste = {
  // ═══════════ AFFICHAGE ═══════════
  id: 'marionettiste',
  nom: 'La Marionettiste',
  emoji: '🎭',
  camp: 'nightmares',
  type: ['manipulation'],
  estUnique: true,
  estSecondaire: false,
  description: 'Contrôle un joueur chaque nuit et utilise son pouvoir à sa place. La victime voit tout mais ne peut rien faire.',
  pouvoir: 'Chaque nuit, contrôle 1 joueur. Elle utilise son pouvoir nocturne à sa place. Le joueur contrôlé voit tout ce qu\'elle fait mais ne peut pas agir.',
  utilisation: 'Chaque nuit (obligatoire). 1 joueur contrôlé par nuit.',
  reglesSpeciales: [
    'Si la cible n\'a pas de pouvoir nocturne → la nuit est gâchée.',
    'La cible voit tout ce que la Marionettiste fait avec son pouvoir.',
    'La cible ne sait PAS qui la contrôle.',
    'Animation visuelle : des fils de marionnette descendent sur l\'écran du joueur contrôlé pendant toute la nuit.',
  ],
  victoire: 'Nightmares, quand tous les autres joueurs sont morts.',

  // ═══════════ PHASES ═══════════
  phases: ['avant-crepuscule'],
  priorite: 1,       // 1er à jouer la nuit (avant tous les autres rôles)

  // ═══════════ CHATS ═══════════
  chats: ['public', 'nightmares'],

  // ═══════════ LOGIQUE ═══════════

  onGameStart(ctx) {
    if (!ctx.jeu.marionettiste) ctx.jeu.marionettiste = {};
    ctx.jeu.marionettiste[ctx.moi.uid] = {
      cibleNuit: null,
      pouvoirVole: null,
    };
    return null;
  },

  onNightStart(ctx) {
    return {
      doitChoisir: true,
      nombreCibles: 1,
      visiblePar: 'soi',
      ciblesInterdites: ['soi'],
      message: '🎭 Choisis un joueur à contrôler cette nuit. Tu utiliseras son pouvoir à sa place.',
    };
  },

  onNightAction(ctx) {
    if (!ctx.cible) return null;

    const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
    if (!cible || !cible.vivant) return null;

    const data = ctx.jeu.marionettiste?.[ctx.moi.uid];
    if (!data) return null;

    // Enregistre la cible
    data.cibleNuit = cible.uid;
    data.pouvoirVole = cible.role;

    // ─── Vérifie si la cible a un pouvoir nocturne ───
    const ROLES_AVEC_POUVOIR = [
      'voyante', 'sorciere', 'garde', 'cupidon', 'loup-noir',
      'loup-blanc', 'petite-fille-classique', 'petite-fille-2-0',
      'mentaliste', 'necromancien', 'fossoyeur', 'voyante-bavarde',
      'nightmares-original', 'rodeur', 'ange-gardien', 'ange-dechu',
      'loup-garou', 'loup-bavard', 'loup-infecte',
    ];

    const aUnPouvoir = ROLES_AVEC_POUVOIR.includes(cible.role);

    // ─── Animation de fils sur l'écran de la victime ───
    ctx.envoyerMessage(
      cible.uid,
      `🎭 Des fils descendent sur ton écran... Tu ne peux plus agir cette nuit.`
    );

    // Envoie les textes d'ambiance à la victime (le moteur les affichera)
    if (aUnPouvoir) {
      // ─── CAS 1 : La cible a un pouvoir → la Marionettiste joue à sa place ───
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🎭 Tu contrôles ${cible.pseudo} (${cible.role}). Utilise son pouvoir à sa place.`
      );

      ctx.journaliser(
        `🎭 La Marionettiste ${ctx.moi.pseudo} contrôle ${cible.pseudo} (${cible.role})`
      );

      return {
        type: 'controle',
        cible: cible.uid,
        roleControle: cible.role,
        pouvoirUtilisable: true,
        animation: 'fils-marionnette',
        textesAmbiance: TEXTES_MARIONNETTISTE,
      };
    } else {
      // ─── CAS 2 : La cible n'a pas de pouvoir → nuit gâchée ───
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🎭 Tu contrôles ${cible.pseudo}, mais il/elle n'a aucun pouvoir. Ta nuit est gâchée.`
      );

      ctx.journaliser(
        `🎭 La Marionettiste ${ctx.moi.pseudo} contrôle ${cible.pseudo} (aucun pouvoir → nuit gâchée)`
      );

      return {
        type: 'controle-rate',
        cible: cible.uid,
        roleControle: cible.role,
        pouvoirUtilisable: false,
        animation: 'fils-marionnette',
      };
    }
  },

  // ─── Appelée quand la Marionettiste utilise le pouvoir volé ───
  onControlledAction(ctx) {
    const data = ctx.jeu.marionettiste?.[ctx.moi.uid];
    if (!data || !data.cibleNuit || !data.pouvoirVole) return null;

    // La cible a-t-elle un pouvoir utilisable ?
    if (!ctx.actionControlee) return null;

    // Envoie à la victime une notif qu'on utilise son pouvoir
    ctx.envoyerMessage(
      data.cibleNuit,
      `🎭 La Marionettiste utilise TON pouvoir cette nuit... Tu ne peux rien faire.`
    );

    ctx.journaliser(
      `🎭 La Marionettiste utilise le pouvoir de ${data.pouvoirVole} de ${ctx.jeu.joueurs.find(j => j.uid === data.cibleNuit)?.pseudo}`
    );

    return {
      type: 'action-controlee',
      pouvoirVole: data.pouvoirVole,
      cible: data.cibleNuit,
      action: ctx.actionControlee,
    };
  },

  // ─── Reset à la fin de la nuit ───
  onNightEnd(ctx) {
    const data = ctx.jeu.marionettiste?.[ctx.moi.uid];
    if (data) {
      data.cibleNuit = null;
      data.pouvoirVole = null;
    }
    return null;
  },

  checkWin(ctx) {
    const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
    const nightmares = vivants.filter(j => j.camp === 'nightmares');
    const autres = vivants.filter(j => j.camp !== 'nightmares');

    if (autres.length === 0) return { gagnant: 'nightmares' };
    if (nightmares.length >= autres.length) return { gagnant: 'nightmares' };
    return null;
  },
};