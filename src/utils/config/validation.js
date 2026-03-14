/**
 * validation.js
 * ─────────────
 * Seule source de vérité pour les règles de validation de la config PPMS.
 * Aucun composant ne doit dupliquer ces règles.
 *
 * Évolution Sprint 5 :
 * - R5 : responsable cellule → config.crisis.responsible (+ fallback crisisCell compat)
 * - R4 : validation bloquante des vacances non couvertes
 * - R1 : détection des adultes affectés à plusieurs rôles simultanément
 */

import { computeVacancies } from "./vacancies";
import { getAdultId } from "./adultId";

// ── Validation d'un AdultRef individuel ───────────────────────────────────────

/**
 * Valide qu'un AdultRef est suffisamment renseigné pour être utilisé.
 * Règle commune à tous les rôles (responsable cellule, zone, supervision).
 *
 * @param {object|null|undefined} adult
 * @returns {string|null}  Message d'erreur ou null si valide
 */
export const validateAdult = (adult) => {
    if (!adult) return "Champ obligatoire";
    if (adult.source === "manual" && !adult.nom?.trim())
        return "Champ obligatoire";
    if (adult.source === "teacher" && !adult.teacherClass)
        return "Champ obligatoire";
    if (adult.source === "staff" && !adult.staffId) return "Champ obligatoire";
    return null;
};

// ── Validation complète ───────────────────────────────────────────────────────

/**
 * Valide la config complète et retourne un objet d'erreurs.
 * Objet vide = config valide, bouton "Générer" actif.
 *
 * Règles vérifiées :
 *   R1 — un adulte ne peut occuper qu'un seul rôle PPMS
 *   R4 — toute vacance doit être couverte (bloquant)
 *   R5 — le responsable de cellule est obligatoire
 *   + nom de l'école, zones, staff
 *
 * @param {object} config  Config PPMS (format Sprint 5, avec compat crisisCell)
 * @returns {Record<string, string>}
 */
export const validateConfig = (config) => {
    const errors = {};

    // ── École ─────────────────────────────────────────────────────
    if (!config.schoolName?.trim()) errors.schoolName = "Champ obligatoire";

    // ── R5 — Responsable cellule de crise (obligatoire) ───────────
    // Lit crisis.responsible en priorité ; fallback sur crisisCell
    // pendant la coexistence Sprint C (supprimé Sprint D).
    const crisisResponsible = config.crisis?.responsible ?? config.crisisCell;
    const ccErr = validateAdult(crisisResponsible);
    if (ccErr) errors.crisisResponsible = ccErr;

    // ── Zones ─────────────────────────────────────────────────────
    (config.zones ?? []).forEach((z) => {
        if (!z.name?.trim()) errors[`zone_${z.id}_name`] = "Champ obligatoire";
        const respErr = validateAdult(config.zoneResponsibles?.[z.id]);
        if (respErr) errors[`zone_${z.id}_responsible`] = respErr;
    });

    // ── Staff ─────────────────────────────────────────────────────
    (config.staff ?? []).forEach((s) => {
        if (!s.nom?.trim()) errors[`staff_${s.id}_nom`] = "Obligatoire";
        if (!s.rattachement)
            errors[`staff_${s.id}_rattachement`] = "Obligatoire";
    });

    // ── R4 — Vacances non couvertes (bloquant) ────────────────────
    const vacancies = computeVacancies(config);
    vacancies.forEach(({ classe }) => {
        if (!config.classSupervision?.[classe]) {
            errors[`supervision_${classe}`] =
                `Classe ${classe} non couverte — désigner un superviseur`;
        }
    });

    // ── R1 — Unicité des rôles ────────────────────────────────────
    // Un même adulte ne peut tenir deux rôles PPMS simultanément.
    // Détecté ici pour catcher les états invalides venant du localStorage.
    const seen = new Map(); // id → premier rôle rencontré

    const checkUnique = (ref, roleLabel) => {
        if (!ref) return;
        const id = getAdultId(ref);
        if (!id) return;
        if (seen.has(id)) {
            errors[`duplicate_${id}`] =
                `${ref.nom || "Cet adulte"} est affecté à plusieurs rôles (${seen.get(id)} et ${roleLabel})`;
        } else {
            seen.set(id, roleLabel);
        }
    };

    checkUnique(crisisResponsible, "Responsable cellule");
    (config.crisis?.members ?? []).forEach((m) =>
        checkUnique(m, "Membre cellule")
    );
    Object.entries(config.zoneResponsibles ?? {}).forEach(([zoneId, ref]) => {
        const zone = config.zones?.find((z) => z.id === zoneId);
        checkUnique(ref, `Responsable ${zone?.name || zoneId}`);
    });

    return errors;
};

// ── Helper : IDs du staff en erreur ───────────────────────────────────────────

/**
 * Retourne les IDs des lignes staff ayant une erreur de validation.
 * Utilisé par ConfigForm pour ouvrir automatiquement les cartes en erreur.
 *
 * @param {Array}  staff
 * @param {object} errors
 * @returns {string[]}
 */
export const getStaffInError = (staff, errors) =>
    staff
        .filter(
            (s) =>
                errors[`staff_${s.id}_nom`] ||
                errors[`staff_${s.id}_rattachement`]
        )
        .map((s) => s.id);
