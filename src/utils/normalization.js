/**
 * Applique les corrections à csvData.
 * Ne mute pas l'objet source — retourne un nouvel objet.
 */
export function applyCorrections(csvData, corrections) {
    const { classNames = {}, teacherNames = {} } = corrections;

    // Re-indexe byClass avec les noms corrigés
    const byClass = {};
    Object.entries(csvData.byClass).forEach(([original, rows]) => {
        const corrected = classNames[original] ?? original;
        byClass[corrected] = rows;
    });

    const classes = Object.keys(byClass).sort();

    // teacherNames prend la main sur le CSV, sinon conserve la valeur brute
    const teacherByClass = Object.fromEntries(
        classes.map((cl) => {
            const originalCl =
                Object.entries(classNames).find(([, v]) => v === cl)?.[0] ?? cl;
            return [
                cl,
                teacherNames[cl] ??
                    csvData.teacherByClass[originalCl] ??
                    csvData.teacherByClass[cl] ??
                    "",
            ];
        })
    );

    return { ...csvData, byClass, classes, teacherByClass };
}

/**
 * Construit la partie preConfig à fusionner dans useConfigForm.
 */
export function buildPreConfig(corrections) {
    return {
        staff: corrections.staff ?? [],
        classExtraTeachers: corrections.classExtraTeachers ?? {},
    };
}
