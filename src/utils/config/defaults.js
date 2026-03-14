/**
 * defaults.js
 * ───────────
 * Constantes métier et factories d'objets vierges.
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
 * @param {string[]} classes  Liste des noms de classes normalisés
 * @returns {Config}
 */
export const makeInitialConfig = (classes) => ({
    schoolName: "",
    configType: classes.length > 3 ? "B" : "A",
    zones: [{ id: "z1", name: "" }],
    classZoneMap: Object.fromEntries(classes.map((cl) => [cl, "z1"])),
    crisis: {
        responsible: emptyAdult("Directeur/trice"),
        members: [],
    },
    classSupervision: {},
    zoneResponsibles: { z1: emptyAdult("Responsable de zone") },
    classExtraTeachers: {},
    staff: [],
    blankIntervenantRows: 5,
});
