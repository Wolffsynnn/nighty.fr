// ═══════════════════════════════════════════════════════════
// 🌫️ LE RODEUR  —  CRÉATION ORIGINALE
// ═══════════════════════════════════════════════════════════
//
// Rôle NIGHTMARES unique.
// Rode autour d'un joueur pendant 2 nuits.
// Sa cible doit le démasquer et le tuer avant la fin des 2 tours,
// sinon elle meurt.
//
// Mécanique :
//   - Nuit N   : il choisit sa cible → la cible est prévenue (carte + shaders).
//   - Nuit N+1 : il continue de roder → la cible a un dernier tour.
//   - Fin N+1  : si la cible n'a pas tué le Rodeur → elle meurt.
//   - Si le Rodeur meurt (peu importe qui le tue) → la cible est sauvée.
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
    'N\'importe quelle mort du Rodeur pendant les 2 tours sauve la cible (peu importe qui l\'a tué).',
    'Si la cible n\'a rien fait à la fin des 2 tours → elle meurt.',
    'Le Rodeur sait qu\'il risque de se faire tuer par sa cible.',
    'Ne peut jamais cibler 2 fois la même personne.',
    'Peut roder autour d\'un allié Nightmares (mais c\'est inutile).',
    'Effet visuel en SHADERS sur l\'écran de la cible (à faire plus tard).',
  ],
  victoire: 'Nightmares, quand tous les autres joueurs sont morts.',

  // ═══════════ PHASES ═══════════
  phases: ['minuit'],
  priorite: 6,   // Après Nightmares (priorité 5)

  // ═══════════ CHATS ═══════════
  chats: ['public', 'nightmares'],

  // ═══════════ LOGIQUE ═══════════

  onGameStart(ctx) {
    if (!ctx.jeu.rodeur) ctx.jeu.rodeur = {};
    ctx.jeu.rodeur[ctx.moi.uid] = {
      cibleActuelle: null,
      nuitDebut: null,
      nuitsRestantes: 0,
      anciennesCibles: [],   // ✅ NOUVEAU : historique pour ne jamais re-cibler
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
        doitChoisir: false,
        cibleActuelle: data.cibleActuelle,
        nuitsRestantes: data.nuitsRestantes,
        message: `🌫️ Tu continues de roder autour de ${cible?.pseudo || '?'}. (${data.nuitsRestantes} nuit${data.nuitsRestantes > 1 ? 's' : ''} restante${data.nuitsRestantes > 1 ? 's' : ''})`,
      };
    }

    // ─── CAS 2 : Il doit choisir une nouvelle cible ───
    // ✅ Cibles interdites : soi + anciennes cibles
    const ciblesInterdites = ['soi', 'morts', ...(data.anciennesCibles || [])];

    return {
      doitChoisir: true,
      nombreCibles: 1,
      visiblePar: 'soi',
      ciblesInterdites,
      message: '🌫️ Choisis un joueur autour duquel roder pendant 2 nuits. Il devra te tuer avant la fin, sinon il mourra.',
    };
  },

  onNightAction(ctx) {
    const data = ctx.jeu.rodeur?.[ctx.moi.uid];
    if (!data) return null;

    // ─── CAS 1 : Il rode déjà → continue ───
    if (data.cibleActuelle && data.nuitsRestantes > 0) {
      data.nuitsRestantes -= 1;

      const cible = ctx.jeu.joueurs.find(j => j.uid === data.cibleActuelle);

      // Message privé à la cible (rappel)
      if (cible) {
        ctx.envoyerMessage(
          cible.uid,
          `🌫️ Tu sens toujours la présence du Rodeur... Tu as encore ${data.nuitsRestantes} tour${data.nuitsRestantes > 1 ? 's' : ''} pour le tuer.`
        );
      }

      ctx.journaliser(
        `🌫️ Le Rodeur ${ctx.moi.pseudo} continue de roder autour de ${cible?.pseudo} (${data.nuitsRestantes} tour${data.nuitsRestantes > 1 ? 's' : ''} restant${data.nuitsRestantes > 1 ? 's' : ''})`
      );

      // ─── Fin des 2 tours → la cible meurt ───
      if (data.nuitsRestantes <= 0) {
        if (cible && cible.vivant) {
          // Vérifie protection
          const protegeParGarde = ctx.jeu.protectionsGarde?.includes(cible.uid);
          const protegeParAnge  = ctx.jeu.protectionsAnge?.includes(cible.uid);

          if (protegeParGarde || protegeParAnge) {
            ctx.journaliser(`🌫️ Le Rodeur : ${cible.pseudo} protégé(e), il/elle survit !`);
          } else {
            ctx.tuer(cible.uid);
            ctx.reveleAuVillage(
              `🌫️ ${cible.pseudo} n'a pas réussi à démasquer le Rodeur... et il est mort.`
            );
            ctx.journaliser(`💀 ${cible.pseudo} est mort du Rodeur (n'a pas réussi à le tuer).`);
          }
        }

        // ✅ Reset + mémorise la cible comme ancienne
        if (data.cibleActuelle) {
          data.anciennesCibles.push(data.cibleActuelle);
        }
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

      // ✅ Vérifie qu'il ne re-cible pas une ancienne
      if (data.anciennesCibles.includes(cible.uid)) {
        ctx.envoyerMessage(ctx.moi.uid, `❌ Tu ne peux pas roder à nouveau autour de ${cible.pseudo}.`);
        return { bloque: true };
      }

      // Enregistre la nouvelle cible
      data.cibleActuelle = cible.uid;
      data.nuitDebut = ctx.jeu.tour || 1;
      data.nuitsRestantes = 1;   // Il reste 1 nuit après celle-ci

      // Envoie la carte à la cible
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
        effetVisuel: 'rodeur-shader',   // ✅ Effet shader à faire plus tard
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