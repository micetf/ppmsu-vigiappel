/**
 * adultId.js
 * ──────────
 * Identifiant canonique d'un AdultRef.
 *
 * Règle unique : toute comparaison entre deux adultes dans l'application
 * doit passer par getAdultId() ou sameAdult(). Ne jamais comparer les
 * champs individuels inline dans les composants ou les hooks.
 *
 * Format des identifiants :
 *   teacher:<teacherClass>          ex. "teacher:CP"
 *   staff:<staffId>                 ex. "staff:s3"
 *   extra:<classe>:<nom>:<prenom>   ex. "extra:CE1:DUPONT:Ana"
 *   manual:<nom>:<prenom>           ex. "manual:GARCIA:Luis"
 *
 * Limites connues et assumées :
 * - "teacher" : un seul enseignant référencé par classe (invariant métier).
 * - "extra"   : identifié par (classe + nom + prenom) car pas d'id stable.
 *               Fragile si deux co-titulaires homonymes dans la même classe
 *               (cas rarissime, acceptable).
 * - "manual"  : non garanti unique si deux saisies libres identiques. À
 *               usage limité (validation uniquement, pas d'exclusion UI).
 */

/**
 * Retourne l'identifiant canonique d'un AdultRef, ou null si la référence
 * est invalide / incomplète.
 *
 * @param {object|null|undefined} ref  Un AdultRef (source, teacherClass, staffId…)
 * @returns {string|null}
 */
export function getAdultId(ref) {
    if (!ref || !ref.source) return null;

    switch (ref.source) {
        case "teacher":
            // teacherClass est obligatoire pour identifier un enseignant
            return ref.teacherClass ? `teacher:${ref.teacherClass}` : null;

        case "staff":
            return ref.staffId ? `staff:${ref.staffId}` : null;

        case "extra":
            // Identification par (classe + nom + prenom) — pas d'id positionnel
            if (!ref.classe) return null;
            return `extra:${ref.classe}:${(ref.nom ?? "").trim()}:${(ref.prenom ?? "").trim()}`;

        case "manual":
            // Accepté même si nom vide (adulte en cours de saisie)
            return `manual:${(ref.nom ?? "").trim()}:${(ref.prenom ?? "").trim()}`;

        default:
            return null;
    }
}

/**
 * Retourne true si deux AdultRef désignent le même adulte.
 * Deux références null/invalides ne sont PAS considérées égales.
 *
 * @param {object|null|undefined} a
 * @param {object|null|undefined} b
 * @returns {boolean}
 */
export function sameAdult(a, b) {
    const ia = getAdultId(a);
    if (ia === null) return false;
    return ia === getAdultId(b);
}

/**
 * Construit un Set des identifiants canoniques à partir d'une config.
 * Utilisé par useConfigForm pour exposer `assignedIds` aux composants.
 *
 * @param {object} config  La config PPMS (format Sprint 5 avec crisis)
 * @returns {Set<string>}
 */
export function buildAssignedIds(config) {
    const ids = new Set();

    const add = (ref) => {
        const id = getAdultId(ref);
        if (id) ids.add(id);
    };

    add(config.crisis?.responsible);
    config.crisis?.members?.forEach(add);
    Object.values(config.zoneResponsibles ?? {}).forEach(add);

    return ids;
}
