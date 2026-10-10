// ═══════════════════════════════════════════════════════════
// 🗳️ VOTE DU VILLAGE
// ═══════════════════════════════════════════════════════════

import { depouillerVotes, poidsVote } from './actions.js';

// ═══════════════════════════════════════════════════════════
// ⏱️ CONSTANTES
// ═══════════════════════════════════════════════════════════

export const DUREE_VOTE_INITIALE = 3 * 60 * 1000;   // 3 minutes
export const DUREE_VOTE_REDUITE = 30 * 1000;        // 30 secondes

// ═══════════════════════════════════════════════════════════
// 🎬 DÉMARRAGE DU VOTE
// ═══════════════════════════════════════════════════════════

export function demarrerVote(ctx, onChange) {
  ctx.jeu.vote = {
    enCours: true,
    debutAt: Date.now(),
    finAt: Date.now() + DUREE_VOTE_INITIALE,
    duree: DUREE_VOTE_INITIALE,
    reduit: false,
    votes: {},
    resultat: null,
    timerId: null,
  };

  ctx.journaliser(`🗳️ Vote démarré (${DUREE_VOTE_INITIALE / 1000} sec)`);

  const timerId = setInterval(() => {
    const vote = ctx.jeu.vote;
    if (!vote.enCours) return;

    const restant = vote.finAt - Date.now();

    if (restant <= 0) {
      clearInterval(timerId);
      terminerVote(ctx);
      if (typeof onChange === 'function') onChange(null);
      return;
    }

    if (typeof onChange === 'function') {
      onChange({ restant, duree: vote.duree, reduit: vote.reduit });
    }
  }, 250);

  ctx.jeu.vote.timerId = timerId;

  return { timerId, finAt: ctx.jeu.vote.finAt };
}

// ═══════════════════════════════════════════════════════════
// ✍️ ENREGISTRER UN VOTE
// ═══════════════════════════════════════════════════════════

export function enregistrerVote(ctx, votantUid, cibleUid) {
  const vote = ctx.jeu.vote;
  if (!vote || !vote.enCours) return false;

  const votant = ctx.jeu.joueurs.find(j => j.uid === votantUid);
  if (!votant || !votant.vivant) return false;

  const cible = ctx.jeu.joueurs.find(j => j.uid === cibleUid);
  if (!cible || !cible.vivant) return false;

  // ✅ Q2 = B : voter pour soi-même est AUTORISÉ (plus de blocage)

  vote.votes[votantUid] = cibleUid;
  ctx.journaliser(`🗳️ ${votant.pseudo} vote pour ${cible.pseudo}`);

  verifierMajorite(ctx);
  return true;
}

// ═══════════════════════════════════════════════════════════
// ⏱️ RÉDUCTION DU TIMER
// ═══════════════════════════════════════════════════════════

function verifierMajorite(ctx) {
  const vote = ctx.jeu.vote;
  if (!vote || !vote.enCours) return;
  if (vote.reduit) return;

  const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
  const nbVotes = Object.keys(vote.votes).length;

  const moitie = vivants.length / 2;
  const majoriteAtteinte = nbVotes > moitie;

  if (majoriteAtteinte) {
    vote.reduit = true;
    vote.duree = DUREE_VOTE_REDUITE;
    vote.finAt = Date.now() + DUREE_VOTE_REDUITE;

    ctx.reveleAuVillage(`⏱️ La majorité a voté ! Il reste 30 secondes.`);
    ctx.journaliser(`⏱️ Majorité atteinte (${nbVotes}/${vivants.length}) → timer réduit à 30 sec.`);
  }
}

// ═══════════════════════════════════════════════════════════
// 🏁 FIN DU VOTE + DÉPOUILLEMENT
// ═══════════════════════════════════════════════════════════

export function terminerVote(ctx) {
  const vote = ctx.jeu.vote;
  if (!vote) return null;

  vote.enCours = false;
  if (vote.timerId) clearInterval(vote.timerId);

  const resultat = depouillerVotes(ctx, vote.votes);
  vote.resultat = resultat;

  // ─── Égalité → personne n'est éliminé ───
  if (resultat.egalite) {
    const pseudos = resultat.gagnants
      .map(uid => ctx.jeu.joueurs.find(j => j.uid === uid)?.pseudo)
      .filter(Boolean)
      .join(', ');

    ctx.reveleAuVillage(
      `🗳️ Égalité entre ${pseudos} ! Personne n'est éliminé ce tour.`
    );
    ctx.journaliser(`🗳️ Égalité → personne n'est éliminé.`);

    return { type: 'vote-egalite', exAequo: resultat.gagnants };
  }

  const elimineUid = resultat.elimine;
  if (!elimineUid) {
    ctx.reveleAuVillage(`🗳️ Aucun vote valide. Personne n'est éliminé.`);
    ctx.journaliser(`🗳️ Aucun vote valide.`);
    return { type: 'vote-vide' };
  }

  const elimine = ctx.jeu.joueurs.find(j => j.uid === elimineUid);
  if (!elimine) return null;

  elimine.vivant = false;
  elimine.mortTour = ctx.jeu.tour;
  elimine.mortCause = 'vote';

  ctx.reveleAuVillage(`🗳️ Le village a voté : ${elimine.pseudo} est éliminé(e) !`);
  ctx.journaliser(`🗳️ ${elimine.pseudo} est éliminé par le vote.`);

  return {
    type: 'vote-elimination',
    elimine: elimineUid,
    detail: resultat.detail,
  };
}

// ═══════════════════════════════════════════════════════════
// 📊 AFFICHAGE EN TEMPS RÉEL
// ═══════════════════════════════════════════════════════════

/**
 * Récupère le nombre de votes par cible (pour les bulles au-dessus des persos).
 * ✅ CORRIGÉ : utilise le VRAI poids du votant (Maire ×2, Maudit ×0, etc.)
 */
export function getCompteurVotes(ctx) {
  const vote = ctx.jeu.vote;
  if (!vote || !vote.votes) return {};

  const compteur = {};

  Object.entries(vote.votes).forEach(([votantUid, cibleUid]) => {
    // ✅ Branchement du poids réel du votant
    const poids = poidsVote(ctx, votantUid);

    if (!compteur[cibleUid]) compteur[cibleUid] = 0;
    compteur[cibleUid] += poids;
  });

  return compteur;
}

// ═══════════════════════════════════════════════════════════
// 🚫 ANNULATION
// ═══════════════════════════════════════════════════════════

export function annulerVote(ctx) {
  const vote = ctx.jeu.vote;
  if (!vote) return;

  vote.enCours = false;
  if (vote.timerId) clearInterval(vote.timerId);
  ctx.jeu.vote = null;
}

// ═══════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════

export default {
  DUREE_VOTE_INITIALE,
  DUREE_VOTE_REDUITE,
  demarrerVote,
  enregistrerVote,
  terminerVote,
  getCompteurVotes,
  annulerVote,
};