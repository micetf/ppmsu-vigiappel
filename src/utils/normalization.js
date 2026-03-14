import { toNom, toPrenom } from "./formatName";

/**
 * Découpe "Dupont Ana" → { nom: "DUPONT", prenom: "Ana" }
 * Heuristique : dernier mot = prénom.
 */
export function splitTeacherName(raw) {
    const parts = (raw || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { nom: "", prenom: "" };
    if (parts.length === 1) return { nom: toNom(parts[0]), prenom: "" };
    const prenom = parts[parts.length - 1];
    const nom = parts.slice(0, -1).join(" ");
    return { nom: toNom(nom), prenom: toPrenom(prenom) };
}

/**
 * Applique les corrections à csvData.
 * Retourne un nouvel objet — ne mute jamais la source.
 */
export function applyCorrections(csvData, corrections) {
    const { classNames = {}, teacherNames = {} } = corrections;

    // ── 1. byClass re-indexé avec noms corrigés ───────────────────
    const byClass = {};
    Object.entries(csvData.byClass).forEach(([original, rows]) => {
        const corrected = classNames[original] ?? original;
        byClass[corrected] = rows;
    });

    const classes = Object.keys(byClass).sort();

    // ── 2. teacherByClass (string) + teacherSplitByClass ({nom,prenom})
    // Pour les classes renommées, on remonte à la clé CSV d'origine.
    const teacherByClass = {};
    const teacherSplitByClass = {};
    const rawTeacherByClass = {}; // clé corrigée → chaîne brute CSV

    classes.forEach((cl) => {
        const originalCl =
            Object.entries(classNames).find(([, v]) => v === cl)?.[0] ?? cl;
        const rawFromCSV =
            csvData.teacherByClass[originalCl] ??
            csvData.teacherByClass[cl] ??
            "";

        rawTeacherByClass[cl] = rawFromCSV;

        const override = teacherNames[cl]; // { nom, prenom } | undefined
        if (override) {
            teacherSplitByClass[cl] = override;
            teacherByClass[cl] = [override.nom, override.prenom]
                .filter(Boolean)
                .join(" ");
        } else {
            const split = splitTeacherName(rawFromCSV);
            teacherSplitByClass[cl] = split;
            teacherByClass[cl] = rawFromCSV;
        }
    });

    return {
        ...csvData,
        byClass,
        classes,
        teacherByClass,
        teacherSplitByClass,
        rawTeacherByClass,
    };
}

/**
 * Extrait la partie preConfig à fusionner dans useConfigForm.
 */
export function buildPreConfig(corrections) {
    return {
        staff: corrections.staff ?? [],
        classExtraTeachers: corrections.classExtraTeachers ?? {},
    };
}
