// ═══════════════════════════════════════════════════════════
// 🌑 NIGHTMARES (ORIGINAL)
// ═══════════════════════════════════════════════════════════

import { TEXTES_NIGHTMARES, TEXTE_MORT_NIGHTMARES, choisirAleatoire } from '../data/mots.js';

export const NightmaresOriginal = {
  // ═══════════ AFFICHAGE ═══════════
  id: 'nightmares-original',
  nom: 'Nightmares (Original)',
  emoji: '🌑',
  camp: 'nightmares',
  type: ['chaos', 'elimination'],
  estUnique: true,
  estSecondaire: false,
  description: 'Marque un joueur chaque nuit. La victime subit des messages corrompus à l\'écran jusqu\'à sa mort au tour suivant.',
  pouvoir: 'Chaque nuit, marque 1 joueur. Le joueur marqué subit des textes corrompus en plein écran toutes les 13 secondes. Il meurt à la fin du tour suivant son marquage.',
  utilisation: 'Chaque nuit (obligatoire). 1 joueur marqué par nuit.',
  victoire: 'Nightmares, quand tous les autres joueurs sont morts.',

  // ═══════════ PHASES ═══════════
  phases: ['minuit'],
  priorite: 3,

  // ═══════════ CHATS ═══════════
  chats: ['public', 'nightmares'],

  // ═══════════ LOGIQUE ═══════════

  onNightStart(ctx) {
    return {
      doitChoisir: true,
      nombreCibles: 1,
      visiblePar: 'soi',
      ciblesInterdites: ['soi'],
    };
  },

  onNightAction(ctx) {
    if (!ctx.cible) return null;

    const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
    if (!cible || !cible.vivant) return null;

    // Marque la cible
    if (!ctx.jeu.marques) ctx.jeu.marques = [];
    ctx.jeu.marques.push({
      cible: cible.uid,
      par: ctx.moi.uid,
      tourMarque: ctx.jeu.tour,
    });

    ctx.envoyerMessage(
      ctx.moi.uid,
      `🌑 Tu as marqué ${cible.pseudo}. Il/elle mourra à la fin du tour suivant.`
    );

    // Affiche les textes corrompus à la victime (via event)
    ctx.envoyerMessage(
      cible.uid,
      `⚠️ Tu ressens une présence sombre...`
    );

    // Le moteur va afficher les TEXTES_NIGHTMARES en plein écran sur l'écran de la cible
    // (géré côté client via un listener Firestore)

    ctx.journaliser(`🌑 Nightmares a marqué ${cible.pseudo}`);

    return {
      type: 'marque',
      cible: cible.uid,
      textes: TEXTES_NIGHTMARES,
      mortAuTour: ctx.jeu.tour + 1,
    };
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