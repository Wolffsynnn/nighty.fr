// ═══════════════════════════════════════════════════════════
// 🎭 LA MARIONNETTISTE  —  CRÉATION ORIGINALE
// ═══════════════════════════════════════════════════════════
//
// Rôle NIGHTMARES unique.
// Contrôle 1 joueur par nuit et utilise son pouvoir à sa place.
//
// Mécanique :
//   - Détecte automatiquement les rôles à pouvoir nocturne
//     via les PHASES (crepuscule / minuit / apres-minuit / nuit).
//   - La Marionettiste voit l'interface EXACTE du rôle contrôlé.
//   - Les ressources (potions, etc.) sont VRAIMENT consommées.
//   - La cible voit tout en temps réel (boutons grisés).
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
    'Peut contrôler n\'importe qui, même un allié Nightmares.',
    'Si la cible n\'a pas de pouvoir nocturne → la nuit est gâchée.',
    'La cible voit tout ce que la Marionettiste fait avec son pouvoir (boutons grisés).',
    'La cible ne sait PAS qui la contrôle.',
    'Les ressources (potions, etc.) sont VRAIMENT consommées pour la cible.',
    'Peut utiliser un pouvoir à usage unique (Cupidon, Loup Noir, etc.) à la place de la cible.',
    'Si elle contrôle un Loup-Garou → elle vote à sa place au vote de la meute.',
    'Animation : des fils de marionnette descendent sur l\'écran du joueur contrôlé pendant toute la nuit.',
  ],
  victoire: 'Nightmares, quand tous les autres joueurs sont morts.',

  // ═══════════ PHASES ═══════════
  phases: ['avant-crepuscule'],
  priorite: 1,   // 1er à jouer la nuit (avant tous les autres rôles)

  // ═══════════ CHATS ═══════════
  chats: ['public', 'nightmares'],

  // ═══════════ CONSTANTES ═══════════

  // ✅ Phases qui indiquent qu'un rôle a un pouvoir nocturne UTILISABLE
  //    quand il est VIVANT.
  PHASES_NOCTURNES: ['crepuscule', 'minuit', 'apres-minuit', 'nuit'],

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
      ciblesInterdites: ['soi', 'morts'],
      message: '🎭 Choisis un joueur à contrôler cette nuit. Tu utiliseras son pouvoir à sa place.',
    };
  },

  onNightAction(ctx) {
    if (!ctx.cible) return null;

    const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
    if (!cible || !cible.vivant) return null;

    const data = ctx.jeu.marionettiste?.[ctx.moi.uid];
    if (!data) return null;

    // ─── Récupère la définition du rôle de la cible ───
    const roleCible = this._getRoleDefinition(cible.role);

    // ─── Détecte si le rôle a un pouvoir nocturne utilisable ───
    const aUnPouvoir = this._aPouvoirNocturne(roleCible);

    // Enregistre la cible
    data.cibleNuit = cible.uid;
    data.pouvoirVole = cible.role;
    data.aUnPouvoir = aUnPouvoir;

    // ─── Animation de fils sur l'écran de la victime ───
    ctx.envoyerMessage(
      cible.uid,
      `🎭 Des fils descendent sur ton écran... Tu ne peux plus agir cette nuit.`
    );

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
        // ✅ Le moteur devra afficher l'interface du rôle contrôlé à la Marionettiste
        interfaceRole: cible.role,
      };
    } else {
      // ─── CAS 2 : La cible n'a pas de pouvoir → nuit gâchée ───
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🎭 Tu contrôles ${cible.pseudo}, mais il/elle n'a aucun pouvoir utilisable cette nuit. Ta nuit est gâchée.`
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
    if (!ctx.actionControlee) return null;

    const ciblePseudo = ctx.jeu.joueurs.find(j => j.uid === data.cibleNuit)?.pseudo || '?';

    // Prévient la victime
    ctx.envoyerMessage(
      data.cibleNuit,
      `🎭 La Marionettiste utilise TON pouvoir cette nuit... Tu ne peux rien faire.`
    );

    ctx.journaliser(
      `🎭 La Marionettiste utilise le pouvoir de ${data.pouvoirVole} de ${ciblePseudo}`
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
      data.aUnPouvoir = null;
    }
    return null;
  },

  // ═══════════ UTILITAIRES ═══════════

  // ✅ Détecte si un rôle a un pouvoir nocturne UTILISABLE quand il est vivant.
  _aPouvoirNocturne(roleDef) {
    if (!roleDef || !roleDef.phases) return false;

    return this.PHASES_NOCTURNES.some(phase => roleDef.phases.includes(phase));
  },

  // ✅ Récupère la définition d'un rôle depuis l'index global (via ctx).
  _getRoleDefinition(roleId) {
    // Le moteur doit exposer TOUS_LES_ROLES dans ctx.jeu.roles
    if (typeof ctx !== 'undefined' && ctx.jeu?.roles) {
      return ctx.jeu.roles.find(r => r.id === roleId) || null;
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