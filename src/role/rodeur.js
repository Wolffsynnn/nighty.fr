// ═══════════════════════════════════════════════════════════
// 🌫️ LE RODEUR
// ═══════════════════════════════════════════════════════════

import { TEXTE_RODEUR } from '../data/mots.js';

export const Rodeur = {
  // ═══════════ AFFICHAGE ═══════════
  id: 'rodeur',
  nom: 'Le Rodeur',
  emoji: '🌫️',
  camp: 'nightmares',
  type: ['chaos', 'elimination'],
  estUnique: true,
  estSecondaire: false,
  description: 'Rode autour d\'un joueur pendant 2 nuits. Sa cible doit le démasquer et le tuer avant la fin des 2 tours, sinon elle meurt.',
  pouvoir: 'Chaque nuit, choisit 1 joueur autour duquel il rode. Il doit rester sur cette cible pendant 2 nuits consécutives (impossible de changer en cours de route).',
  utilisation: 'Chaque nuit. Cible bloquée pour 2 nuits complètes.',
  carteCible: TEXTE_RODEUR,
  reglesSpeciales: [
    'La cible ignore qui est le Rodeur.',
    'La cible peut le tuer par n\'importe quel moyen.',
    'N\'importe quelle mort du Rodeur pendant les 2 tours sauve la cible.',
    'Si la cible n\'a rien fait à la fin des 2 tours → elle meurt.',
    'Le Rodeur sait qu\'il risque de se faire tuer par sa cible.',
  ],
  victoire: 'Nightmares, quand tous les autres joueurs sont morts.',

  // ═══════════ PHASES ═══════════
  phases: ['minuit'],
  priorite: 6,       // Après Nightmares (priorité 5)

  // ═══════════ CHATS ═══════════
  chats: ['public', 'nightmares'],

  // ═══════════ LOGIQUE ═══════════

  onGameStart(ctx) {
    if (!ctx.jeu.rodeur) ctx.jeu.rodeur = {};
    ctx.jeu.rodeur[ctx.moi.uid] = {
      cibleActuelle: null,       // UID de la cible en cours
      nuitDebut: null,           // Nuit où il a commencé à roder
      nuitsRestantes: 0,         // Nuits restantes sur la cible
    };
    return null;
  },

  onNightStart(ctx) {
    const data = ctx.jeu.rodeur?.[ctx.moi.uid];
    if (!data) return null;

    // ─── CAS 1 : Il rode déjà sur une cible ───
    if (data.cibleActuelle && data.nuitsRestantes > 0) {
      const cible = ctx.jeu.joueurs.find(j => j.uid === data.cibleActuelle);
      return {
        doitChoisir: false,       // Pas de nouveau choix
        cibleActuelle: data.cibleActuelle,
        nuitsRestantes: data.nuitsRestantes,
        message: `🌫️ Tu continues de roder autour de ${cible?.pseudo || '?'}. (${data.nuitsRestantes} nuit${data.nuitsRestantes > 1 ? 's' : ''} restante${data.nuitsRestantes > 1 ? 's' : ''})`,
      };
    }

    // ─── CAS 2 : Il doit choisir une nouvelle cible ───
    return {
      doitChoisir: true,
      nombreCibles: 1,
      visiblePar: 'soi',
      ciblesInterdites: ['soi'],
      message: '🌫️ Choisis un joueur autour duquel roder pendant 2 nuits. Il devra te tuer avant la fin, sinon il mourra.',
    };
  },

  onNightAction(ctx) {
    const data = ctx.jeu.rodeur?.[ctx.moi.uid];
    if (!data) return null;

    // ─── CAS 1 : Il rode déjà → continue ───
    if (data.cibleActuelle && data.nuitsRestantes > 0) {
      // Décrémente le compteur
      data.nuitsRestantes -= 1;

      // Envoie un message privé à la cible (rappel)
      ctx.envoyerMessage(
        data.cibleActuelle,
        `🌫️ Tu sens toujours la présence du Rodeur... Tu as encore ${data.nuitsRestantes} tour${data.nuitsRestantes > 1 ? 's' : ''} pour le tuer.`
      );

      ctx.journaliser(
        `🌫️ Le Rodeur ${ctx.moi.pseudo} continue de roder autour de ${ctx.jeu.joueurs.find(j => j.uid === data.cibleActuelle)?.pseudo} (${data.nuitsRestantes} tour${data.nuitsRestantes > 1 ? 's' : ''} restant${data.nuitsRestantes > 1 ? 's' : ''})`
      );

      // Si c'est la fin des 2 tours → la cible meurt
      if (data.nuitsRestantes <= 0) {
        const cible = ctx.jeu.joueurs.find(j => j.uid === data.cibleActuelle);
        if (cible && cible.vivant) {
          // Vérifie protection
          if (ctx.jeu.protections?.includes(cible.uid)) {
            ctx.journaliser(`🌫️ Le Rodeur : ${cible.pseudo} protégé(e), il survit !`);
          } else {
            // ─── Mort de la cible ───
            ctx.tuer(cible.uid);
            ctx.reveleAuVillage(
              `🌫️ ${cible.pseudo} n'a pas réussi à démasquer le Rodeur... et il est mort.`
            );
            ctx.journaliser(`💀 ${cible.pseudo} est mort du Rodeur (n'a pas réussi à le tuer).`);
          }
        }
        // Reset
        data.cibleActuelle = null;
        data.nuitDebut = null;
      }

      return {
        type: 'rode-continue',
        cible: data.cibleActuelle,
        nuitsRestantes: data.nuitsRestantes,
      };
    }

    // ─── CAS 2 : Nouvelle cible choisie ───
    if (ctx.cible) {
      const cible = ctx.jeu.joueurs.find(j => j.uid === ctx.cible);
      if (!cible || !cible.vivant) return null;

      // Enregistre la nouvelle cible
      data.cibleActuelle = cible.uid;
      data.nuitDebut = ctx.jeu.tour || 1;
      data.nuitsRestantes = 1;   // Il reste 1 nuit après celle-ci (2 nuits au total)

      // Envoie la carte à la cible (affichée pendant 2 nuits)
      ctx.envoyerMessage(
        cible.uid,
        `🌫️ **Vous êtes la cible du Rodeur.**\n` +
        `Vous avez 2 tours pour tuer celui qui rode.\n` +
        `Il vous reste 2 tours.`
      );

      // Message au Rodeur
      ctx.envoyerMessage(
        ctx.moi.uid,
        `🌫️ Tu commences à roder autour de ${cible.pseudo}. Tu dois rester 2 nuits sur cette cible.`
      );

      ctx.journaliser(
        `🌫️ Le Rodeur ${ctx.moi.pseudo} commence à roder autour de ${cible.pseudo}.`
      );

      return {
        type: 'rode-debut',
        cible: cible.uid,
        nuitsTotal: 2,
        carte: TEXTE_RODEUR,
      };
    }

    return null;
  },

  // ─── Appelée quand le Rodeur meurt ───
  onDeath(ctx) {
    const data = ctx.jeu.rodeur?.[ctx.moi.uid];
    if (!data || !data.cibleActuelle) return null;

    // La cible est sauvée
    const cible = ctx.jeu.joueurs.find(j => j.uid === data.cibleActuelle);
    if (cible && cible.vivant) {
      ctx.envoyerMessage(
        cible.uid,
        `✅ Le Rodeur est mort ! Tu es sauvé(e).`
      );

      ctx.journaliser(
        `✅ Le Rodeur ${ctx.moi.pseudo} est mort → ${cible.pseudo} est sauvé(e).`
      );
    }

    // Reset
    data.cibleActuelle = null;
    data.nuitsRestantes = 0;

    return {
      type: 'rodeur-mort',
      cibleSauvee: cible?.uid || null,
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