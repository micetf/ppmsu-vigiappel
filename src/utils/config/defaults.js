// src/utils/config/defaults.js
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

export const emptyAdult = (defaultFonction = "") => ({
    source: "manual",
    teacherClass: "",
    staffId: "",
    nom: "",
    prenom: "",
    fonction: defaultFonction,
    substitute: null,
});

// IDs stables via crypto.randomUUID ou compteur encapsulé
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

export const makeInitialConfig = (classes) => ({
    schoolName: "",
    configType: classes.length > 3 ? "B" : "A",
    zones: [{ id: "z1", name: "" }],
    classZoneMap: Object.fromEntries(classes.map((cl) => [cl, "z1"])),
    crisisCell: emptyAdult("Directeur/trice"),
    zoneResponsibles: { z1: emptyAdult("Responsable de zone") },
    classExtraTeachers: {},
    staff: [],
    blankIntervenantRows: 5,
});
