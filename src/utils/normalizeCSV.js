import { toNom, toPrenom } from "./formatName";

// ── Types d'adultes ────────────────────────────────────────────────
export const ADULT_TYPES = [
    { value: "teacher", label: "Enseignant(e)" },
    { value: "coteacher", label: "Co-titulaire / décharge" },
    { value: "aesh", label: "AESH" },
    { value: "atsem", label: "ATSEM" },
    { value: "rased", label: "RASED (Maître E / Psy EN)" },
    { value: "service", label: "Service civique" },
    { value: "staff", label: "Personnel entretien/cantine" },
    { value: "other", label: "Autre" },
];

export const ADULT_TYPE_LABELS = Object.fromEntries(
    ADULT_TYPES.map(({ value, label }) => [value, label])
);

// ── Générateurs d'id ───────────────────────────────────────────────
let _adultSeq = 0;
export const newAdultId = () => `a${++_adultSeq}`;

let _classSeq = 0;
export const newClassId = () => `cl${++_classSeq}`;

// ── Nettoyage du nom enseignant lu dans le CSV ─────────────────────
// Ex : "DUPONT Marie / DURAND Paul" → "DUPONT Marie"  (on garde le 1er)
// Ex : "M. DUPONT"                  → "DUPONT"
function cleanTeacherName(raw) {
    if (!raw) return { nom: "", prenom: "" };

    // Prendre uniquement la partie avant "/" ou ";"
    const first = raw.split(/[/;]/)[0].trim();

    // Supprimer les civilités
    const cleaned = first.replace(/^(M\.|Mme\.?|M\.me|Mme|M\b)/i, "").trim();

    // Heuristique : le nom est en MAJUSCULES, le prénom en Titre
    const parts = cleaned.split(/\s+/);
    const nomParts = parts.filter((p) => p === p.toUpperCase() && p.length > 1);
    const prenomParts = parts.filter(
        (p) => p !== p.toUpperCase() || p.length <= 1
    );

    return {
        nom: toNom(nomParts.join(" ") || cleaned),
        prenom: toPrenom(prenomParts.join(" ")),
    };
}

// ── Extraction des classes depuis csvData ──────────────────────────
// csvData = { byClass: { "CP A": [...élèves], ... }, teacherByClass: { "CP A": "DUPONT Marie", ... } }
export function buildClassesFromCSV(csvData) {
    const { byClass = {}, teacherByClass = {} } = csvData;

    return Object.keys(byClass).map((csvKey) => ({
        id: newClassId(),
        csvKey, // clé originale du CSV — immuable
        displayName: csvKey, // éditable par l'utilisateur
        teacherRaw: teacherByClass[csvKey] || "", // valeur brute CSV
        teacherId: null, // sera résolu après buildAdultsFromCSV
    }));
}

// ── Construction de la liste adults[] depuis csvData ──────────────
export function buildAdultsFromCSV(csvData) {
    const { teacherByClass = {} } = csvData;
    const adults = [];

    // Un adulte "teacher" par classe où un enseignant est identifié
    const seen = new Map(); // nom+prénom → id (pour éviter les doublons si même personne sur 2 classes)

    for (const [csvKey, rawName] of Object.entries(teacherByClass)) {
        if (!rawName?.trim()) continue;

        const { nom, prenom } = cleanTeacherName(rawName);
        const key = `${nom}|${prenom}`;

        if (seen.has(key)) {
            // Même enseignant(e) sur plusieurs classes → on ne duplique pas
            // La classe secondaire sera gérée comme "coteacher" si nécessaire
            continue;
        }

        const id = newAdultId();
        seen.set(key, id);
        adults.push({
            id,
            nom,
            prenom,
            type: "teacher",
            defaultClassId: null, // résolu après buildClassesFromCSV via linkTeachersToClasses
            csvKey, // clé de rattachement CSV temporaire
            fromCSV: true, // ne pas supprimer à la normalisation
        });
    }

    return adults;
}

// ── Résolution croisée classes ↔ adults ───────────────────────────
// Mutates classes[].teacherId et adults[].defaultClassId
export function linkTeachersToClasses(classes, adults) {
    for (const cl of classes) {
        if (!cl.teacherRaw?.trim()) continue;

        const { nom, prenom } = cleanTeacherName(cl.teacherRaw);
        const key = `${nom}|${prenom}`;

        const adult = adults.find(
            (a) => a.type === "teacher" && `${a.nom}|${a.prenom}` === key
        );

        if (adult) {
            cl.teacherId = adult.id;
            adult.defaultClassId = cl.id;
            delete adult.csvKey; // nettoyage
        }
    }
}

// ── Point d'entrée principal ───────────────────────────────────────
// Retourne { classes, adults } prêt pour NormalizationStep
export function normalizeFromCSV(csvData) {
    _adultSeq = 0;
    _classSeq = 0;

    const classes = buildClassesFromCSV(csvData);
    const adults = buildAdultsFromCSV(csvData);
    linkTeachersToClasses(classes, adults);

    return { classes, adults };
}

// ── Factory : nouvel adulte vide (pour ajout manuel) ──────────────
export function createEmptyAdult(overrides = {}) {
    return {
        id: newAdultId(),
        nom: "",
        prenom: "",
        type: "aesh",
        defaultClassId: null,
        fromCSV: false,
        ...overrides,
    };
}
