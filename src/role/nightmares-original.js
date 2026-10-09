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
  priorite: 5,       // Après les loups et le Loup Noir

  // ═══════════ CHATS ═══════════
  chats: ['public', 'nightmares'],

  // ═══════════ LOGIQUE ═══════════

  onGameStart(ctx) {
    if (!ctx.jeu.marques) ctx.jeu.marques = [];
    return null;
  },

  onNightStart(ctx) {
    return {
      doitChoisir: true,
      nombreCibles: 1,
      visiblePar: 'soi',
      ciblesInterdites: ['soi'],
      message: '🌑 Choisis un joueur à marquer. Il mourra au tour suivant.',
    };
  },

  onNightAction(ctx) {
    if (!ctx.cible) return null;

    const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
    if (!cible || !cible.vivant) return null;

    // ─── Vérifie la protection ───
    if (ctx.jeu.protections?.includes(cible.uid)) {
      ctx.journaliser(`🌑 Nightmares tente de marquer ${cible.pseudo} → protégé(e).`);
      return null;
    }

    // ─── Sauvé par la Sorcière ? ───
    if (ctx.jeu.sauveParSorciere === cible.uid) {
      ctx.journaliser(`🌑 Nightmares tente de marquer ${cible.pseudo} → sauvé(e) par la Sorcière.`);
      return null;
    }

    // ─── Marque la cible ───
    const tour = ctx.jeu.tour || 1;
    ctx.jeu.marques.push({
      cible: cible.uid,
      par: ctx.moi.uid,
      tourMarque: tour,
      tourMort: tour + 1,
    });

    // Envoie un message privé à la victime (ambiance)
    ctx.envoyerMessage(
      cible.uid,
      `⚠️ Tu ressens une présence sombre t'envahir...`
    );

    // Envoie un message privé à Nightmares
    ctx.envoyerMessage(
      ctx.moi.uid,
      `🌑 Tu as marqué ${cible.pseudo}. Il/elle mourra à la fin du tour suivant.`
    );

    ctx.journaliser(`🌑 Nightmares a marqué ${cible.pseudo} (mort au tour ${tour + 1})`);

    // Le moteur enverra les TEXTES_NIGHTMARES au client de la victime
    // (affichage plein écran toutes les 13 secondes)
    return {
      type: 'marque',
      cible: cible.uid,
      textes: TEXTES_NIGHTMARES,
      tourMort: tour + 1,
      intervalle: 13000,   // 13 secondes
    };
  },

  // ─── Appelée à la fin de chaque tour pour appliquer les morts ───
  onTurnEnd(ctx) {
    const tour = ctx.jeu.tour || 1;
    const morts = [];

    ctx.jeu.marques = ctx.jeu.marques.filter(marque => {
      if (marque.tourMort === tour) {
        const cible = ctx.jeu.joueurs.find(j => j.uid === marque.cible);
        if (cible && cible.vivant) {
          // Vérifie la protection
          if (ctx.jeu.protections?.includes(cible.uid)) {
            ctx.journaliser(`🌑 Nightmares : ${cible.pseudo} protégé(e), la marque échoue.`);
            return false;
          }

          ctx.tuer(cible.uid);

          // Annonce spéciale
          const msg = TEXTE_MORT_NIGHTMARES.replace('{PSEUDO}', cible.pseudo);
          ctx.reveleAuVillage(`💀 ${msg}`);

          ctx.journaliser(`💀 ${cible.pseudo} est mort des suites de ses cauchemars.`);
          morts.push(cible.uid);
        }
        return false;   // Marque utilisée → on la retire
      }
      return true;   // On garde les marques futures
    });

    return morts.length > 0 ? { type: 'mort-cauchemars', morts } : null;
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