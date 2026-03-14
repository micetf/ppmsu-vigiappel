// ── Validation d'un AdultRef ───────────────────────────────────────
export const validateAdult = (adult) => {
    if (!adult) return "Champ obligatoire";
    if (adult.source === "manual" && !adult.nom?.trim())
        return "Champ obligatoire";
    if (adult.source === "teacher" && !adult.teacherClass)
        return "Champ obligatoire";
    if (adult.source === "staff" && !adult.staffId) return "Champ obligatoire";
    return null;
};

// ── Validation complète de la config ──────────────────────────────
export const validateConfig = (config) => {
    const errors = {};

    if (!config.schoolName.trim()) errors.schoolName = "Champ obligatoire";

    const ccErr = validateAdult(config.crisisCell);
    if (ccErr) errors.crisisCell = ccErr;

    config.zones.forEach((z) => {
        if (!z.name.trim()) errors[`zone_${z.id}_name`] = "Champ obligatoire";
        const respErr = validateAdult(config.zoneResponsibles?.[z.id]);
        if (respErr) errors[`zone_${z.id}_responsible`] = respErr;
    });

    config.staff.forEach((s) => {
        if (!s.nom.trim()) errors[`staff_${s.id}_nom`] = "Obligatoire";
        if (!s.rattachement)
            errors[`staff_${s.id}_rattachement`] = "Obligatoire";
    });

    return errors;
};

// ── Helper : IDs du staff en erreur ───────────────────────────────
export const getStaffInError = (staff, errors) =>
    staff
        .filter(
            (s) =>
                errors[`staff_${s.id}_nom`] ||
                errors[`staff_${s.id}_rattachement`]
        )
        .map((s) => s.id);
