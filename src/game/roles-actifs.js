// ═══════════════════════════════════════════════════════════
// 🎯 RÔLES ACTIFS PAR PHASE
// ═══════════════════════════════════════════════════════════
//
// Détermine :
//   - Quelles phases sont UTILES (= au moins 1 rôle vivant)
//   - Quelle est la prochaine phase active
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 📋 RÔLES QUI AGISSENT DANS CHAQUE PHASE
// ═══════════════════════════════════════════════════════════

export const ROLES_PAR_PHASE = {
    'avant-crepuscule': [
      'cupidon',
      'marionettiste',
      'ange-gardien',
      'ange-dechu',
    ],
    'crepuscule': [
      'voyante',
      'voyante-bavarde',
      'garde',
    ],
    'minuit': [
      'loup-garou',
      'loup-noir',
      'loup-blanc',
      'loup-bavard',
      'loup-infecte',
      'petite-fille-classique',
      'petite-fille-2-0',
      'nightmares-original',
      'rodeur',
      'marionettiste',
    ],
    'apres-minuit': [
      'sorciere',
      'loup-noir',
      'loup-blanc',
    ],
    // ─── aube, jour, vote, soir → TOUJOURS actifs (tout le monde) ───
  };
  
  // ═══════════════════════════════════════════════════════════
  // 📚 ORDRE DES PHASES
  // ═══════════════════════════════════════════════════════════
  
  export const ORDRE_PHASES = [
    'avant-crepuscule',
    'crepuscule',
    'minuit',
    'apres-minuit',
    'aube',
    'jour',
    'vote',
    'soir',
  ];
  
  // ═══════════════════════════════════════════════════════════
  // 🔍 PHASES UTILES ?
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Vérifie si une phase a au moins 1 rôle vivant qui peut y jouer.
   */
  export function estPhaseUtile(jeu, phase) {
    // Phases toujours utiles (discussion + résolutions)
    if (!ROLES_PAR_PHASE[phase]) return true;
  
    const rolesPossibles = ROLES_PAR_PHASE[phase];
    const vivants = jeu.joueurs.filter(j => j.vivant);
  
    // Check si au moins 1 vivant a un rôle qui joue dans cette phase
    return vivants.some(j => rolesPossibles.includes(j.role));
  }
  
  // ═══════════════════════════════════════════════════════════
  // ⏭️ PROCHAINE PHASE ACTIVE
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Retourne la prochaine phase utile (skip les phases vides).
   *
   * @param {Object} jeu  - L'état du jeu
   * @param {string} phaseActuelle
   * @param {number} tour
   * @returns {Object} { phase, tour }
   */
  export function prochainePhaseActive(jeu, phaseActuelle, tour) {
    const idx = ORDRE_PHASES.indexOf(phaseActuelle);
  
    // Parcourt les phases suivantes (boucle infinie)
    for (let i = 1; i <= ORDRE_PHASES.length; i++) {
      const nextIdx = (idx + i) % ORDRE_PHASES.length;
      const nextPhase = ORDRE_PHASES[nextIdx];
  
      if (estPhaseUtile(jeu, nextPhase)) {
        // Si on repasse par la 1ère phase → nouveau tour
        const nouveauTour = (idx + i) >= ORDRE_PHASES.length ? tour + 1 : tour;
        return { phase: nextPhase, tour: nouveauTour };
      }
    }
  
    // Fallback improbable
    return { phase: 'avant-crepuscule', tour: tour + 1 };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 📦 EXPORTS
  // ═══════════════════════════════════════════════════════════
  
  export default {
    ROLES_PAR_PHASE,
    ORDRE_PHASES,
    estPhaseUtile,
    prochainePhaseActive,
  };