/**
 * substitutes.js
 * ──────────────
 * Deux responsabilités :
 *
 * 1. isAdultAssigned(ref, config)
 *    Détermine si un adulte est déjà affecté à un rôle PPMS (R1).
 *    Utilisé par AdultSelector (prop excludeIds) et par la validation.
 *
 * 2. buildAvailableSubstitutes(classe, config, assignedIds)
 *    Construit le pool d'adultes pouvant couvrir une vacance.
 *    Priorité : co-titulaires de la classe > staff non affecté.
 *
 * Règle R3 : substituts éligibles = co-titulaires/décharges de la classe
 *            OU adultes non-enseignants (staff) non encore affectés.
 */

import { getAdultId, sameAdult } from "./adultId";

// ─────────────────────────────────────────────────────────────────────────────
// Détection d'affectation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne true si l'adulte référencé par `ref` est déjà affecté à un
 * rôle PPMS dans la config (responsable cellule, membre cellule, ou
 * responsable de zone).
 *
 * Ne tient pas compte de classSupervision : un substitut peut être le
 * même adulte qu'un superviseur d'une autre classe (cas limite, accepté).
 *
 * @param {object|null} ref     AdultRef à tester
 * @param {object}      config  Config PPMS (format Sprint 5)
 * @returns {boolean}
 */
export function isAdultAssigned(ref, config) {
    if (!ref) return false;

    if (sameAdult(ref, config.crisis?.responsible)) return true;

    if (config.crisis?.members?.some((m) => sameAdult(m, ref))) return true;

    return Object.values(config.zoneResponsibles ?? {}).some((r) =>
        sameAdult(r, ref)
    );
}

/**
 * Version Set : retourne true si l'id canonique de `ref` est dans le Set
 * pré-calculé. Plus performant pour les boucles (évite de recalculer
 * assignedIds à chaque appel).
 *
 * @param {object|null} ref         AdultRef à tester
 * @param {Set<string>} assignedIds Set retourné par buildAssignedIds()
 * @returns {boolean}
 */
export function isIdAssigned(ref, assignedIds) {
    const id = getAdultId(ref);
    return id !== null && assignedIds.has(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pool des substituts disponibles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construit la liste des adultes pouvant superviser la classe `classe`
 * pendant la mission PPMS de son enseignant.
 *
 * Ordre de priorité (R3) :
 *   1. Co-titulaires / décharges de cette classe (classExtraTeachers)
 *   2. Staff non encore affecté à un rôle PPMS
 *
 * Les adultes déjà superviseurs d'une autre classe (classSupervision)
 * sont également exclus via `assignedIds`.
 *
 * @param {string}      classe      Classe dont on cherche un substitut
 * @param {object}      config      Config PPMS (format Sprint 5)
 * @param {Set<string>} assignedIds IDs déjà pris (rôles PPMS + supervisions)
 * @returns {AdultRef[]}            Tableau ordonné, label enrichi pour l'UI
 */
export function buildAvailableSubstitutes(
    classe,
    config,
    assignedIds = new Set()
) {
    const options = [];

    // ── 1. Co-titulaires / décharges de la classe ─────────────────
    // Identifiés par (classe + nom + prenom) — pas d'id positionnel (fragile).
    (config.classExtraTeachers?.[classe] ?? [])
        .filter((et) => et.nom?.trim())
        .forEach((et) => {
            const ref = {
                source: "extra",
                classe,
                nom: et.nom.trim(),
                prenom: (et.prenom ?? "").trim(),
            };
            if (!isIdAssigned(ref, assignedIds)) {
                options.push({
                    ...ref,
                    // label enrichi pour le <select> de ClassSupervisionSection
                    _label:
                        `${et.nom} ${et.prenom ?? ""}`.trim() +
                        ` (${et.fonction || "Décharge"} — ${classe})`,
                });
            }
        });

    // ── 2. Staff non affecté ──────────────────────────────────────
    (config.staff ?? [])
        .filter((s) => s.nom?.trim())
        .forEach((s) => {
            const ref = {
                source: "staff",
                staffId: s.id,
                nom: s.nom,
                prenom: s.prenom ?? "",
            };
            if (!isIdAssigned(ref, assignedIds)) {
                options.push({
                    ...ref,
                    _label:
                        `${s.nom} ${s.prenom ?? ""}`.trim() +
                        (s.fonction ? ` — ${s.fonction}` : ""),
                });
            }
        });

    return options;
}

/**
 * Construit un Set étendu incluant les assignedIds de rôles PPMS ET les
 * superviseurs déjà désignés pour d'autres classes.
 *
 * À appeler dans useConfigForm pour passer le bon `assignedIds` à
 * buildAvailableSubstitutes lors de la sélection d'un substitut pour
 * une classe donnée (pour qu'un même adulte ne supervise pas deux classes).
 *
 * @param {Set<string>} roleAssignedIds  IDs des rôles PPMS (buildAssignedIds)
 * @param {object}      classSupervision Record<classe, AdultRef|null>
 * @param {string}      excludeClasse    Classe en cours de saisie (à ignorer)
 * @returns {Set<string>}
 */
export function buildFullAssignedIds(
    roleAssignedIds,
    classSupervision,
    excludeClasse
) {
    const full = new Set(roleAssignedIds);

    Object.entries(classSupervision ?? {}).forEach(([classe, ref]) => {
        if (classe !== excludeClasse && ref) {
            const id = getAdultId(ref);
            if (id) full.add(id);
        }
    });

    return full;
}
