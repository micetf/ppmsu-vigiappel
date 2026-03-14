// ── Rattachement effectif d'un adulte ─────────────────────────────
// Priorité : adultOverrides > defaultClassId
export function getEffectiveClassId(adultId, adults, adultOverrides = {}) {
    if (adultId in adultOverrides)
        return adultOverrides[adultId].assignedClassId;
    return adults.find((a) => a.id === adultId)?.defaultClassId ?? null;
}

// ── Adultes "consommés" par un rôle PPMS ──────────────────────────
// (cellule de crise + responsables de zone)
export function getBusyAdultIds(config) {
    return new Set(
        [
            config.crisisCellAdultId,
            ...config.zones.map((z) => z.responsibleAdultId),
        ].filter(Boolean)
    );
}

// ── Adultes disponibles pour encadrer une classe ──────────────────
// = rattachés à cette classe ET non "consommés"
export function getAvailableSupervisors(classId, config, adults) {
    const busy = getBusyAdultIds(config);
    return adults.filter(
        (a) =>
            getEffectiveClassId(a.id, adults, config.adultOverrides) ===
                classId && !busy.has(a.id)
    );
}

// ── Adultes disponibles pour un select de rôle PPMS ───────────────
// Exclut les adultes déjà assignés à un rôle (sauf si c'est le rôle courant)
export function getAvailableForRole(currentId, config, adults) {
    const busy = getBusyAdultIds(config);
    return adults.filter((a) => !busy.has(a.id) || a.id === currentId);
}

// ── Adultes d'une classe (avec leur rattachement effectif) ─────────
export function getAdultsForClass(classId, config, adults) {
    const busy = getBusyAdultIds(config);
    return adults
        .filter(
            (a) =>
                getEffectiveClassId(a.id, adults, config.adultOverrides) ===
                classId
        )
        .map((a) => ({
            ...a,
            isBusy: busy.has(a.id),
            busyRole: getBusyRole(a.id, config),
        }));
}

// ── Quel rôle occupe un adulte ? ──────────────────────────────────
export function getBusyRole(adultId, config) {
    if (config.crisisCellAdultId === adultId) return "Cellule de crise";
    const zone = config.zones.find((z) => z.responsibleAdultId === adultId);
    if (zone) return `Responsable — ${zone.displayName || "Zone"}`;
    return null;
}

// ── Validation complète avant génération ─────────────────────────
export function validateConfig(config, classes, adults) {
    const errors = [];
    const warnings = [];

    // Cellule de crise
    if (!config.crisisCellAdultId)
        errors.push({
            code: "NO_CRISIS_CELL",
            msg: "Aucun responsable de cellule de crise.",
        });

    // Chaque zone a un responsable
    config.zones.forEach((z) => {
        if (!z.responsibleAdultId)
            errors.push({
                code: "NO_ZONE_RESPONSIBLE",
                zoneId: z.id,
                msg: `Zone "${z.displayName || z.id}" sans responsable.`,
            });
    });

    // Chaque classe a au moins un encadrant disponible
    classes.forEach((cl) => {
        const supervisors = getAvailableSupervisors(cl.id, config, adults);
        if (supervisors.length === 0)
            errors.push({
                code: "NO_SUPERVISOR",
                classId: cl.id,
                msg: `Classe "${cl.displayName}" sans adulte encadrant disponible.`,
            });
    });

    // Adulte référencé mais absent de la liste (sécurité)
    const adultIds = new Set(adults.map((a) => a.id));
    const allRefIds = [
        config.crisisCellAdultId,
        ...config.zones.map((z) => z.responsibleAdultId),
        ...Object.keys(config.adultOverrides || {}),
    ].filter(Boolean);

    allRefIds.forEach((id) => {
        if (!adultIds.has(id))
            warnings.push({
                code: "DANGLING_REF",
                adultId: id,
                msg: `Référence adulte inconnue : ${id}.`,
            });
    });

    return { errors, warnings, valid: errors.length === 0 };
}

// ── Config vide par défaut (initialisation ConfigForm) ────────────
export function createDefaultConfig(classes) {
    return {
        schoolName: "",
        configType: classes.length > 3 ? "B" : "A",
        crisisCellAdultId: null,
        zones: [{ id: "z1", displayName: "", responsibleAdultId: null }],
        classZoneMap: Object.fromEntries(classes.map((cl) => [cl.id, "z1"])),
        adultOverrides: {},
        blankIntervenantRows: 5,
    };
}
