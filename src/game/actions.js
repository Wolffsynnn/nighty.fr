// ═══════════════════════════════════════════════════════════
// 🛠️ ACTIONS DU JEU
// ═══════════════════════════════════════════════════════════
//
// Boîte à outils utilisée par le moteur et les rôles.
//
// Contient :
//   - Gestion des morts (tuer, appliquer les morts de la nuit)
//   - Gestion des protections (Garde, Ange Gardien)
//   - Gestion des votes (poids, dépouillement)
//   - Gestion des chats (public, loups, morts, nightmares)
//   - Utilitaires divers (vérifier si un joueur est protégé…)
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// 💀 GESTION DES MORTS
// ═══════════════════════════════════════════════════════════

/**
 * Ajoute une mort au tableau des morts de la nuit.
 * (La mort sera appliquée à l'aube)
 */
export function ajouterMortNuit(ctx, uid, cause) {
    if (!ctx.jeu.mortsNuit) ctx.jeu.mortsNuit = [];
  
    // Évite les doublons
    if (ctx.jeu.mortsNuit.some(m => m.uid === uid)) return;
  
    ctx.jeu.mortsNuit.push({
      uid,
      cause,
      tour: ctx.jeu.tour,
    });
  
    ctx.journaliser(`  ➕ Mort ajoutée : ${uid} (cause : ${cause})`);
  }
  
  /**
   * Tue immédiatement un joueur (utilisé dans certains cas spéciaux).
   * Retourne true si le joueur est mort, false sinon.
   */
  export function tuerImmediat(ctx, uid, cause = 'inconnu') {
    const joueur = ctx.jeu.joueurs.find(j => j.uid === uid);
    if (!joueur || !joueur.vivant) return false;
  
    joueur.vivant = false;
    joueur.mortTour = ctx.jeu.tour;
    joueur.mortCause = cause;
  
    ctx.journaliser(`💀 ${joueur.pseudo} meurt (cause : ${cause})`);
    return true;
  }
  
  /**
   * Applique toutes les morts en attente (mortsNuit).
   * Appelé à l'aube.
   */
  export function appliquerMortsNuit(ctx) {
    const morts = ctx.jeu.mortsNuit || [];
    const appliquees = [];
  
    morts.forEach(mort => {
      const joueur = ctx.jeu.joueurs.find(j => j.uid === mort.uid);
      if (joueur && joueur.vivant) {
        // Vérifie une dernière fois la protection
        if (estProtege(ctx, joueur.uid)) {
          ctx.journaliser(`  🛡️ ${joueur.pseudo} est protégé → survit.`);
          return;
        }
  
        tuerImmediat(ctx, joueur.uid, mort.cause);
        appliquees.push(joueur);
      }
    });
  
    return appliquees;
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🛡️ GESTION DES PROTECTIONS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Vérifie si un joueur est protégé cette nuit.
   * (Protection du Garde OU de l'Ange Gardien)
   */
  export function estProtege(ctx, uid) {
    const garde = ctx.jeu.protectionsGarde?.includes(uid);
    const ange  = ctx.jeu.protectionsAnge?.includes(uid);
    return garde || ange;
  }
  
  /**
   * Vérifie si un joueur est protégé spécifiquement par l'Ange Gardien.
   * (Utilisé par Nightmares : seul l'Ange peut contrer)
   */
  export function estProtegeParAnge(ctx, uid) {
    return ctx.jeu.protectionsAnge?.includes(uid);
  }
  
  /**
   * Vérifie si un joueur est protégé spécifiquement par le Garde.
   * (Utilisé par les Loups : le Garde bloque)
   */
  export function estProtegeParGarde(ctx, uid) {
    return ctx.jeu.protectionsGarde?.includes(uid);
  }
  
  /**
   * Ajoute une protection du Garde.
   */
  export function ajouterProtectionGarde(ctx, uid) {
    if (!ctx.jeu.protectionsGarde) ctx.jeu.protectionsGarde = [];
    if (ctx.jeu.protectionsGarde.includes(uid)) return;
    ctx.jeu.protectionsGarde.push(uid);
    ctx.journaliser(`  🛡️ Protection Garde : ${uid}`);
  }
  
  /**
   * Ajoute une protection de l'Ange Gardien.
   */
  export function ajouterProtectionAnge(ctx, uid) {
    if (!ctx.jeu.protectionsAnge) ctx.jeu.protectionsAnge = [];
    if (ctx.jeu.protectionsAnge.includes(uid)) return;
    ctx.jeu.protectionsAnge.push(uid);
    ctx.journaliser(`  👼 Protection Ange : ${uid}`);
  }
  
  /**
   * Reset toutes les protections (fin de nuit).
   */
  export function resetProtections(ctx) {
    ctx.jeu.protectionsGarde = [];
    ctx.jeu.protectionsAnge = [];
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🗳️ GESTION DES VOTES
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Calcule le poids du vote d'un joueur.
   *
   * Poids par défaut : 1
   * Maire : 2
   * Adjoint : 2 (tant que le Maire est vivant)
   * Maudit (Ange Déchu) : 0
   * Muet (Maire 2.0) : 1 (peut voter, juste muet dans le chat)
   */
  export function poidsVote(ctx, uid) {
    const joueur = ctx.jeu.joueurs.find(j => j.uid === uid);
    if (!joueur || !joueur.vivant) return 0;
  
    // ─── Maudit par Ange Déchu → vote annulé ───
    const maledictions = ctx.jeu.maledictions || [];
    const estMaudit = maledictions.some(m => m.cible === uid && m.tour === ctx.jeu.tour);
    if (estMaudit) return 0;
  
    // ─── Maire 1.0 ou 2.0 → ×2 ───
    const estMaire = ctx.jeu.maire?.actif === uid || ctx.jeu.maire2?.actif === uid;
    if (estMaire) return 2;
  
    // ─── Adjoint → ×2 si le Maire 2.0 est vivant ───
    const estAdjoint = ctx.jeu.maire2?.adjoint === uid;
    if (estAdjoint) {
      const maireUid = ctx.jeu.maire2?.actif;
      const maire = ctx.jeu.joueurs.find(j => j.uid === maireUid);
      if (maire && maire.vivant) return 2;
    }
  
    return 1;
  }
  
  /**
   * Dépouille les votes et retourne le résultat.
   *
   * @param {Object} ctx - Le contexte
   * @param {Object} votes - { [uidVotant]: uidCible }
   * @returns {Object} { elimine, egalite, detail }
   */
  export function depouillerVotes(ctx, votes) {
    const compteur = {};
  
    Object.entries(votes).forEach(([votantUid, cibleUid]) => {
      const poids = poidsVote(ctx, votantUid);
      if (poids === 0) return;   // Vote annulé
  
      if (!compteur[cibleUid]) compteur[cibleUid] = 0;
      compteur[cibleUid] += poids;
    });
  
    // ─── Trouve le max ───
    let maxVotes = 0;
    let gagnants = [];
  
    Object.entries(compteur).forEach(([uid, score]) => {
      if (score > maxVotes) {
        maxVotes = score;
        gagnants = [uid];
      } else if (score === maxVotes) {
        gagnants.push(uid);
      }
    });
  
    // ─── Égalité ? ───
    if (gagnants.length > 1) {
      return {
        elimine: null,
        egalite: true,
        gagnants,
        detail: compteur,
      };
    }
  
    return {
      elimine: gagnants[0] || null,
      egalite: false,
      detail: compteur,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // 💬 GESTION DES CHATS
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Ajoute un message dans un chat.
   *
   * @param {Object} ctx
   * @param {string} chatId - 'public' | 'loups' | 'morts' | 'nightmares'
   * @param {string} uid - Auteur
   * @param {string} texte
   * @param {Object} options - { anonyme, pseudoForce, couleur }
   */
  export function ajouterMessage(ctx, chatId, uid, texte, options = {}) {
    const joueur = ctx.jeu.joueurs.find(j => j.uid === uid);
    if (!joueur) return null;
  
    const message = {
      uid,
      pseudo: options.pseudoForce || joueur.pseudo,
      texte,
      at: Date.now(),
      anonyme: options.anonyme || false,
      couleur: options.couleur || null,
      tour: ctx.jeu.tour,
      phase: ctx.jeu.phase,
    };
  
    switch (chatId) {
      case 'public':
        ctx.jeu.messagesPublic.push(message);
        break;
      case 'loups':
        ctx.jeu.messagesLoups.push(message);
        break;
      case 'morts':
        ctx.jeu.messagesMorts.push(message);
        break;
      case 'nightmares':
        ctx.jeu.messagesNightmares.push(message);
        break;
    }
  
    return message;
  }
  
  /**
   * Récupère les messages d'un chat.
   */
  export function getMessages(ctx, chatId) {
    switch (chatId) {
      case 'public':      return ctx.jeu.messagesPublic;
      case 'loups':       return ctx.jeu.messagesLoups;
      case 'morts':       return ctx.jeu.messagesMorts;
      case 'nightmares':  return ctx.jeu.messagesNightmares;
      default:            return [];
    }
  }
  
  /**
   * Vérifie si un joueur peut écrire dans un chat.
   */
  export function peutEcrireDansChat(ctx, uid, chatId) {
    const joueur = ctx.jeu.joueurs.find(j => j.uid === uid);
    if (!joueur) return false;
  
    // ─── Muet (Maire 2.0) → bloqué dans le chat public ───
    if (chatId === 'public') {
      const muets = ctx.jeu.muets || [];
      const estMuet = muets.some(m => m.cible === uid && m.tour === ctx.jeu.tour);
      if (estMuet) return false;
    }
  
    // ─── Chat public : tout le monde (même les morts ? à définir) ───
    if (chatId === 'public') {
      return true;   // On laisse le joueur parler même mort ? À DISCUTER
    }
  
    // ─── Chat loups : loups vivants uniquement ───
    if (chatId === 'loups') {
      return joueur.vivant && joueur.camp === 'loups';
    }
  
    // ─── Chat morts : morts uniquement + Nécromancien la nuit ───
    if (chatId === 'morts') {
      if (!joueur.vivant) return true;   // Les morts parlent toujours entre eux
  
      // Vivant : seulement le Nécromancien, la nuit
      if (joueur.role === 'necromancien') {
        const phaseNuit = ['avant-crepuscule', 'crepuscule', 'minuit', 'apres-minuit'];
        return phaseNuit.includes(ctx.jeu.phase);
      }
      return false;
    }
  
    // ─── Chat nightmares : nightmares vivants ───
    if (chatId === 'nightmares') {
      return joueur.vivant && joueur.camp === 'nightmares';
    }
  
    return false;
  }
  
  // ═══════════════════════════════════════════════════════════
  // 🔍 UTILITAIRES
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Vérifie si un joueur est vivant.
   */
  export function estVivant(ctx, uid) {
    const j = ctx.jeu.joueurs.find(j => j.uid === uid);
    return j?.vivant === true;
  }
  
  /**
   * Compte les joueurs vivants par camp.
   */
  export function compterVivantsParCamp(ctx) {
    const vivants = ctx.jeu.joueurs.filter(j => j.vivant);
    const compte = {};
    vivants.forEach(j => {
      if (!compte[j.camp]) compte[j.camp] = 0;
      compte[j.camp]++;
    });
    return compte;
  }
  
  /**
   * Renvoie la liste des pseudos d'un tableau d'UIDs.
   */
  export function pseudosDe(ctx, uids) {
    return uids
      .map(uid => ctx.jeu.joueurs.find(j => j.uid === uid)?.pseudo)
      .filter(Boolean);
  }
  
  /**
   * Reset les effets temporaires d'un tour.
   */
  export function resetEffetsTour(ctx) {
    resetProtections(ctx);
    ctx.jeu.mortsNuit = [];
    ctx.jeu.cibleLoups = null;
    ctx.jeu.sauveParSorciere = null;
  }
  
  /**
   * Ajoute une entrée dans le journal.
   */
  export function log(ctx, message) {
    ctx.journaliser(message);
  }