/**
 * defaults.js
 * ───────────
 * Constantes métier et factories d'objets vierges.
 *
 * Évolution Sprint 5 :
 * - emptyAdult() : suppression du champ `substitute` (désormais dans classSupervision)
 * - makeInitialConfig() : ajout de `crisis` + `classSupervision`
 *   Le champ `crisisCell` est conservé comme alias de compat jusqu'au Sprint D
 *   (ConfigForm le lit encore directement — supprimé lors du Sprint D).
 */

export const FONCTIONS_CRISE = [
    "Directeur/trice",
    "Directeur/trice adjoint(e)",
    "Enseignant(e) faisant fonction",
];

export const FONCTIONS_ZONE = [
    "Responsable de zone",
    "Enseignant(e)",
    "AESH",
    "ATSEM",
    "Personnel entretien/cantine",
    "Autre",
];

export const FONCTIONS_STAFF = [
    "AESH",
    "ATSEM",
    "Service civique",
    "Maître E (RASED)",
    "Psychologue EN (RASED)",
    "Personnel entretien/cantine",
    "Intervenant(e)",
    "Autre",
];

/**
 * Crée un AdultRef vide au format Sprint 5.
 * Le champ `substitute` a été supprimé — la substitution est désormais
 * gérée par config.classSupervision (voir ClassSupervisionSection).
 *
 * @param {string} defaultFonction
 * @returns {AdultRef}
 */
export const emptyAdult = (defaultFonction = "") => ({
    source: "manual",
    teacherClass: "",
    staffId: "",
    nom: "",
    prenom: "",
    fonction: defaultFonction,
    // `substitute` supprimé — voir classSupervision
});

// IDs stables via compteurs encapsulés
let _zoneCounter = 1;
let _staffCounter = 0;
export const newZoneId = () => `z${++_zoneCounter}`;
export const newStaff = () => ({
    id: `s${++_staffCounter}`,
    nom: "",
    prenom: "",
    fonction: "",
    rattachement: "",
});

/**
 * Config initiale vierge pour une école donnée.
 *
 * Format Sprint 5 : `crisis` + `classSupervision` sont les champs canoniques.
 * `crisisCell` est maintenu comme alias pointant sur `crisis.responsible`
 * pour la durée du Sprint C (ConfigForm le lit encore) — supprimé au Sprint D.
 *
 * @param {string[]} classes  Liste des noms de classes normalisés
 * @returns {Config}
 */
export const makeInitialConfig = (classes) => {
    const responsible = emptyAdult("Directeur/trice");

    return {
        schoolName: "",
        configType: classes.length > 3 ? "B" : "A",
        zones: [{ id: "z1", name: "" }],
        classZoneMap: Object.fromEntries(classes.map((cl) => [cl, "z1"])),

        // ── Format Sprint 5 ───────────────────────────────────────
        crisis: {
            responsible,
            members: [],
        },
        classSupervision: {},

        // COMPAT Sprint C — supprimé Sprint D
        // Alias synchronisé avec crisis.responsible par useConfigForm.setField
        crisisCell: responsible,
        // ─────────────────────────────────────────────────────────

        zoneResponsibles: { z1: emptyAdult("Responsable de zone") },
        classExtraTeachers: {},
        staff: [],
        blankIntervenantRows: 5,
    };
};
