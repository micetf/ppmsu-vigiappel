import { getAdultsForClass } from "./configHelpers";
import { ADULT_TYPE_LABELS } from "./normalizeCSV";

// ── Fiche par classe ──────────────────────────────────────────────
export function buildClassSheet(cl, config, adults, csvData) {
    const zone = config.zones.find(
        (z) => z.id === config.classZoneMap?.[cl.id]
    );
    const students = csvData.byClass?.[cl.csvKey] ?? [];
    const supervisors = getAdultsForClass(cl.id, config, adults).filter(
        (a) => !a.isBusy
    );

    const teacher = adults.find(
        (a) => a.id === cl.teacherId && a.type === "teacher"
    );

    return {
        type: "class",
        classId: cl.id,
        displayName: cl.displayName || cl.csvKey,
        teacher: teacher
            ? [teacher.nom, teacher.prenom].filter(Boolean).join(" ")
            : "",
        zoneName: zone?.displayName || zone?.id || "—",
        students: students.map((row) => ({
            nom: row["Nom"] ?? row["NOM"] ?? "",
            prenom: row["Prénom"] ?? row["PRENOM"] ?? "",
        })),
        supervisors: supervisors.map((a) => ({
            name: [a.nom, a.prenom].filter(Boolean).join(" "),
            type: ADULT_TYPE_LABELS[a.type] ?? a.type,
        })),
        blankRows: config.blankIntervenantRows ?? 3,
        schoolName: config.schoolName,
        configType: config.configType,
    };
}

// ── Fiche cellule de crise ────────────────────────────────────────
export function buildCrisisSheet(config, adults, classes) {
    const crisisAdult = adults.find((a) => a.id === config.crisisCellAdultId);

    const zoneResponsibles = config.zones.map((z) => {
        const adult = adults.find((a) => a.id === z.responsibleAdultId);
        const zoneClasses = classes.filter(
            (cl) => config.classZoneMap?.[cl.id] === z.id
        );
        return {
            zoneName: z.displayName || z.id,
            adult: adult
                ? [adult.nom, adult.prenom].filter(Boolean).join(" ")
                : "—",
            adultType: adult
                ? (ADULT_TYPE_LABELS[adult.type] ?? adult.type)
                : "",
            classes: zoneClasses.map((cl) => cl.displayName || cl.csvKey),
        };
    });

    return {
        type: "crisis",
        schoolName: config.schoolName,
        configType: config.configType,
        crisisAdult: crisisAdult
            ? [crisisAdult.nom, crisisAdult.prenom].filter(Boolean).join(" ")
            : "—",
        zoneResponsibles,
        totalClasses: classes.length,
        blankRows: config.blankIntervenantRows ?? 3,
    };
}

// ── Point d'entrée : toutes les fiches ────────────────────────────
export function buildAllSheets(config, adults, classes, csvData) {
    const classSheets = classes.map((cl) =>
        buildClassSheet(cl, config, adults, csvData)
    );
    const crisisSheet = buildCrisisSheet(config, adults, classes);
    return [crisisSheet, ...classSheets];
}
