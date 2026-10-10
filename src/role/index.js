// ═══════════════════════════════════════════════════════════
// 📚 INDEX DE TOUS LES RÔLES
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 🎭 RÔLES DE BASE (classiques Loup-Garou)
// ─────────────────────────────────────────────
import { SimpleVillageois } from './simple-villageois.js';
import { LoupGarou } from './loup-garou.js';
import { Voyante } from './voyante.js';
import { Sorciere } from './sorciere.js';
import { LoupNoir } from './loup-noir.js';
import { LoupBavard } from './loup-bavard.js';
import { LoupBlanc } from './loup-blanc.js';
import { PetiteFilleClassique } from './petite-fille-classique.js';
import { Chasseur } from './chasseur.js';
import { Garde } from './garde.js';
import { Cupidon } from './cupidon.js';
import { Mentaliste } from './mentaliste.js';
import { Necromancien } from './necromancien.js';
import { Fossoyeur } from './fossoyeur.js';

// ─────────────────────────────────────────────
// 🎭 VARIANTES
// ─────────────────────────────────────────────
import { LoupInfecte } from './loup-infecte.js';
import { PetiteFille20 } from './petite-fille-2-0.js';
import { VoyanteBavarde } from './voyante-bavarde.js';

// ─────────────────────────────────────────────
// 🌑 NIGHTMARES
// ─────────────────────────────────────────────
import { NightmaresOriginal } from './nightmares-original.js';
import { Rodeur } from './rodeur.js';
import { Marionettiste } from './marionettiste.js';

// ─────────────────────────────────────────────
// 💀 RÔLES POST-MORT (attribués au 1er mort)
// ─────────────────────────────────────────────
import { AngeGardien } from './ange-gardien.js';
import { AngeDechu } from './ange-dechu.js';

// ─────────────────────────────────────────────
// 🎖️ RÔLES ÉLUS (élus ou nommés par le village)
// ─────────────────────────────────────────────
import { Maire10 } from './maire-1-0.js';
import { Maire20 } from './maire-2-0.js';
import { Adjoint } from './adjoint.js';

// ═══════════════════════════════════════════════════════════
// 📦 GROUPES DE RÔLES
// ═══════════════════════════════════════════════════════════

/**
 * Rôles de base (affichés dans la section "Rôles de base" de la compo)
 */
export const ROLES_BASE = [
  SimpleVillageois,
  LoupGarou,
  Voyante,
  Sorciere,
  LoupNoir,
  LoupBavard,
  LoupBlanc,
  PetiteFilleClassique,
  Chasseur,
  Garde,
  Cupidon,
  Mentaliste,
  Necromancien,
  Fossoyeur,
];

/**
 * Variantes (affichées dans la section "Variantes de rôles")
 */
export const ROLES_VARIANTES = [
  LoupInfecte,
  PetiteFille20,
  VoyanteBavarde,
];

/**
 * Nightmares (affichés dans la section "Nightmares")
 */
export const ROLES_NIGHTMARES = [
  NightmaresOriginal,
  Rodeur,
  Marionettiste,
];

/**
 * Rôles post-mort (attribués automatiquement au 1er mort de la partie)
 * — Ange Gardien
 * — Ange Déchu
 */
export const ROLES_POST_MORT = [
  AngeGardien,
  AngeDechu,
];

/**
 * Rôles élus/nommés (le village vote pour eux, ou ils sont nommés)
 * — Maire 1.0
 * — Maire 2.0
 * — Adjoint (nommé par le Maire 2.0)
 */
export const ROLES_ELUS = [
  Maire10,
  Maire20,
  Adjoint,
];

/**
 * Tous les rôles confondus
 */
export const TOUS_LES_ROLES = [
  ...ROLES_BASE,
  ...ROLES_VARIANTES,
  ...ROLES_NIGHTMARES,
  ...ROLES_POST_MORT,
  ...ROLES_ELUS,
];

// ═══════════════════════════════════════════════════════════
// 🔧 FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════

/**
 * Récupère un rôle par son ID
 */
export function getRoleById(id) {
  return TOUS_LES_ROLES.find(r => r.id === id) || null;
}

/**
 * Récupère les rôles d'un camp
 */
export function getRolesByCamp(camp) {
  return TOUS_LES_ROLES.filter(r => r.camp === camp);
}

/**
 * Récupère les rôles d'une phase
 */
export function getRolesByPhase(phase) {
  return TOUS_LES_ROLES.filter(r => r.phases?.includes(phase));
}

/**
 * Récupère les rôles uniques (1 seul exemplaire possible)
 */
export function getRolesUniques() {
  return TOUS_LES_ROLES.filter(r => r.estUnique === true);
}

/**
 * Récupère les rôles multiples (plusieurs exemplaires possibles)
 */
export function getRolesMultiples() {
  return TOUS_LES_ROLES.filter(r => r.estUnique === false);
}

/**
 * Récupère les rôles post-mort (Anges)
 */
export function getRolesPostMort() {
  return ROLES_POST_MORT;
}

/**
 * Récupère les rôles élus (Maire, Adjoint)
 */
export function getRolesElus() {
  return ROLES_ELUS;
}

/**
 * Récupère les rôles secondaires (post-mort + élus)
 */
export function getRolesSecondaires() {
  return [...ROLES_POST_MORT, ...ROLES_ELUS];
}

/**
 * Vérifie si un rôle existe
 */
export function roleExiste(id) {
  return TOUS_LES_ROLES.some(r => r.id === id);
}

// ═══════════════════════════════════════════════════════════
// 🎯 EXPORTS INDIVIDUELS (au cas où)
// ═══════════════════════════════════════════════════════════
export {
  // Rôles de base
  SimpleVillageois,
  LoupGarou,
  Voyante,
  Sorciere,
  LoupNoir,
  LoupBavard,
  LoupBlanc,
  PetiteFilleClassique,
  Chasseur,
  Garde,
  Cupidon,
  Mentaliste,
  Necromancien,
  Fossoyeur,

  // Variantes
  LoupInfecte,
  PetiteFille20,
  VoyanteBavarde,

  // Nightmares
  NightmaresOriginal,
  Rodeur,
  Marionettiste,

  // Rôles post-mort
  AngeGardien,
  AngeDechu,

  // Rôles élus
  Maire10,
  Maire20,
  Adjoint,
};