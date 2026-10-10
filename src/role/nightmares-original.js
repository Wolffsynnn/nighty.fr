// ═══════════════════════════════════════════════════════════
// 🌑 NIGHTMARES (ORIGINAL)  —  CRÉATION ORIGINALE
// ═══════════════════════════════════════════════════════════
//
// Rôle NIGHTMARES unique.
// Marque 1 joueur par nuit → la victime meurt au tour suivant.
//
// Mécanique :
//   - Marquage : nuit N → la cible meurt à la fin de la nuit N+1
//     (= Nuit + Jour complets entre le marquage et la mort).
//   - Textes corrompus à l'écran de la victime toutes les 13 sec
//     pendant toute la durée (nuit + jour).
//   - Seul l'Ange Gardien peut contrer la marque.
//   - Croix horrifique visible par la victime + Nightmares uniquement.
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
  reglesSpeciales: [
    'Le marquage dure Nuit + Jour (la victime meurt à la fin de la nuit suivante).',
    'Les textes corrompus s\'affichent toutes les 13 sec pendant toute la durée.',
    'Si la victime meurt avant la fin du tour → la marque est annulée.',
    'Ne peut pas marquer 2 fois de suite la même cible SAUF si la marque a été contrée par l\'Ange Gardien.',
    'Seul l\'Ange Gardien peut contrer la marque.',
    'Une croix horrifique s\'affiche à côté du pseudo de la victime (visible uniquement par elle + Nightmares).',
  ],
  victoire: 'Nightmares, quand tous les autres joueurs sont morts.',

  // ═══════════ PHASES ═══════════
  phases: ['minuit'],
  priorite: 5,   // Après les loups et le Loup Noir

  // ═══════════ CHATS ═══════════
  chats: ['public', 'nightmares'],

  // ═══════════ LOGIQUE ═══════════

  onGameStart(ctx) {
    if (!ctx.jeu.marques) ctx.jeu.marques = [];
    if (!ctx.jeu.marquesContrees) ctx.jeu.marquesContrees = [];   // ✅ NOUVEAU
    return null;
  },

  onNightStart(ctx) {
    // ✅ Cibles interdites : soi + les cibles marquées la nuit précédente
    //    SAUF si la marque a été contrée par l'Ange Gardien.
    const ciblesInterdites = ['soi'];

    const marquesActives = (ctx.jeu.marques || []).filter(
      m => m.par === ctx.moi.uid
    );

    marquesActives.forEach(m => {
      const aEteContree = (ctx.jeu.marquesContrees || []).includes(m.cible);
      if (!aEteContree) {
        ciblesInterdites.push(m.cible);
      }
    });

    return {
      doitChoisir: true,
      nombreCibles: 1,
      visiblePar: 'soi',
      ciblesInterdites,
      message: '🌑 Choisis un joueur à marquer. Il mourra à la fin du tour suivant.',
    };
  },

  onNightAction(ctx) {
    if (!ctx.cible) return null;

    const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
    if (!cible || !cible.vivant) return null;

    const tour = ctx.jeu.tour || 1;

    // ─── Vérifie la protection de l'Ange Gardien uniquement ───
    // (le Garde ne peut PAS contrer Nightmares)
    const protegeParAnge = ctx.jeu.protectionsAnge?.includes(cible.uid);

    if (protegeParAnge) {
      ctx.journaliser(`🌑 Nightmares tente de marquer ${cible.pseudo} → contré par l'Ange Gardien.`);

      // ✅ La marque est contrée → mémorise pour permettre de re-marquer
      if (!ctx.jeu.marquesContrees) ctx.jeu.marquesContrees = [];
      ctx.jeu.marquesContrees.push(cible.uid);

      ctx.envoyerMessage(
        ctx.moi.uid,
        `🌑 Ta marque sur ${cible.pseudo} a été contrée par l'Ange Gardien. Tu pourras retenter une autre nuit.`
      );

      return { type: 'marque-contree', cible: cible.uid };
    }

    // ─── Marque la cible ───
    ctx.jeu.marques.push({
      cible: cible.uid,
      par: ctx.moi.uid,
      tourMarque: tour,
      tourMort: tour + 1,
    });

    // Message privé à la victime (ambiance)
    ctx.envoyerMessage(
      cible.uid,
      `⚠️ Tu ressens une présence sombre t'envahir...`
    );

    // Message privé à Nightmares
    ctx.envoyerMessage(
      ctx.moi.uid,
      `🌑 Tu as marqué ${cible.pseudo}. Il/elle mourra à la fin du tour suivant.`
    );

    ctx.journaliser(`🌑 Nightmares a marqué ${cible.pseudo} (mort au tour ${tour + 1})`);

    return {
      type: 'marque',
      cible: cible.uid,
      textes: TEXTES_NIGHTMARES,
      tourMort: tour + 1,
      intervalle: 13000,
      croixVisiblePar: [ctx.moi.uid, cible.uid],   // ✅ Croix privée
    };
  },

  // ─── Appelée à la fin de chaque tour pour appliquer les morts ───
  onTurnEnd(ctx) {
    const tour = ctx.jeu.tour || 1;
    const morts = [];

    ctx.jeu.marques = (ctx.jeu.marques || []).filter(marque => {
      if (marque.tourMort === tour) {
        const cible = ctx.jeu.joueurs.find(j => j.uid === marque.cible);

        // Si la cible est déjà morte → marque annulée
        if (!cible || !cible.vivant) {
          return false;
        }

        // ✅ Seul l'Ange Gardien peut contrer à ce moment aussi
        if (ctx.jeu.protectionsAnge?.includes(cible.uid)) {
          ctx.journaliser(`🌑 Nightmares : ${cible.pseudo} protégé(e) par l'Ange Gardien, la marque échoue.`);
          if (!ctx.jeu.marquesContrees) ctx.jeu.marquesContrees = [];
          ctx.jeu.marquesContrees.push(cible.uid);
          return false;
        }

        ctx.tuer(cible.uid);

        // Annonce spéciale
        const msg = TEXTE_MORT_NIGHTMARES.replace('{PSEUDO}', cible.pseudo);
        ctx.reveleAuVillage(`💀 ${msg}`);

        ctx.journaliser(`💀 ${cible.pseudo} est mort des suites de ses cauchemars.`);
        morts.push(cible.uid);

        return false;   // Marque utilisée
      }
      return true;
    });

    // ✅ Nettoie les marques contrées qui ne sont plus d'actualité
    if (ctx.jeu.marquesContrees) {
      ctx.jeu.marquesContrees = ctx.jeu.marquesContrees.filter(uid => {
        return (ctx.jeu.marques || []).some(m => m.cible === uid);
      });
    }

    return morts.length > 0 ? { type: 'mort-cauchemars', morts } : null;
  },

  // ─── Croix horrifique (classe CSS) ───
  getBadgeClass() {
    return 'nightmares-cross';   // → croix horrifique (CSS/SVG)
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