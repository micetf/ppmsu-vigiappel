/**
 * vacancies.js
 * ────────────
 * Calcul des vacances de classes : toute classe dont l'enseignant principal
 * est affecté à un rôle PPMS (cellule de crise ou responsable de zone)
 * crée une vacance qui doit être couverte.
 *
 * Règle R2 : tout enseignant affecté à un rôle PPMS génère une vacance.
 * Règle R4 : une vacance non couverte bloque la validation.
 *
 * Cette fonction est PURE : elle ne modifie rien, peut être appelée
 * autant de fois que nécessaire (rendu React, validation, docxGenerator).
 */

/**
 * @typedef {object} Vacancy
 * @property {string} classe   Nom de la classe concernée (ex. "CP")
 * @property {string} reason   Libellé du rôle PPMS de l'enseignant
 */

/**
 * Calcule la liste des vacances à partir de la config.
 *
 * En cas de violation de R1 (même enseignant affecté à deux rôles —
 * état impossible via l'UI normale mais possible depuis localStorage
 * corrompu ou migration), la classe n'est listée qu'une seule fois
 * avec le premier rôle trouvé.
 *
 * @param {object} config          Config PPMS (format Sprint 5)
 * @param {Record<string,string>}  teacherByClass  Non utilisé ici mais
 *        conservé en signature pour symétrie avec buildAvailableSubstitutes
 *        et faciliter les appels groupés dans useConfigForm.
 * @returns {Vacancy[]}
 */
// eslint-disable-next-line no-unused-vars
export function computeVacancies(config, teacherByClass = {}) {
    // Accumulateur intermédiaire : Map<classe, reason> pour déduplication
    const vacancyMap = new Map();

    const add = (classe, reason) => {
        if (classe && !vacancyMap.has(classe)) {
            vacancyMap.set(classe, reason);
        }
    };

    // ── Responsable de la cellule de crise ────────────────────────
    const responsible = config.crisis?.responsible;
    if (responsible?.source === "teacher" && responsible.teacherClass) {
        add(responsible.teacherClass, "Responsable cellule de crise");
    }

    // ── Membres supplémentaires de la cellule ─────────────────────
    (config.crisis?.members ?? []).forEach((member) => {
        if (member?.source === "teacher" && member.teacherClass) {
            add(member.teacherClass, "Membre cellule de crise");
        }
    });

    // ── Responsables de zone ──────────────────────────────────────
    Object.entries(config.zoneResponsibles ?? {}).forEach(([zoneId, adult]) => {
        if (adult?.source === "teacher" && adult.teacherClass) {
            const zone = config.zones?.find((z) => z.id === zoneId);
            const zoneName = zone?.name?.trim()
                ? `Zone — ${zone.name}`
                : `Zone (${zoneId})`;
            add(adult.teacherClass, `Responsable ${zoneName}`);
        }
    });

    // Retourner comme tableau ordonné (ordre de saisie)
    return Array.from(vacancyMap.entries()).map(([classe, reason]) => ({
        classe,
        reason,
    }));
}

/**
 * Retourne true si la classe donnée a une vacance dans la config.
 * Raccourci utile pour les badges d'alerte dans les composants.
 *
 * @param {string} classe
 * @param {object} config
 * @returns {boolean}
 */
export function hasVacancy(classe, config) {
    return computeVacancies(config).some((v) => v.classe === classe);
}

/**
 * Retourne le libellé de la vacance pour une classe, ou null.
 * Utilisé par les badges ⚠️ dans AdultSelector et CrisisCellSection.
 *
 * @param {string} classe
 * @param {object} config
 * @returns {string|null}
 */
export function getVacancyReason(classe, config) {
    return (
        computeVacancies(config).find((v) => v.classe === classe)?.reason ??
        null
    );
}
