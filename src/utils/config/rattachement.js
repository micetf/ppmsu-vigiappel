// ── Label lisible d'un rattachement ───────────────────────────────
export const getRattachementLabel = (rattachement, zones) => {
    if (!rattachement) return "⚠️ Non rattaché";
    if (rattachement === "cellule") return "Cellule de crise";
    if (rattachement.startsWith("class_"))
        return `Classe ${rattachement.replace("class_", "")}`;
    const zone = zones.find((z) => z.id === rattachement);
    return zone ? `Zone — ${zone.name || "sans nom"}` : "Zone inconnue";
};

// ── Options du <select> de rattachement ───────────────────────────
export const buildRattachementOptions = (zones, classes) => [
    {
        value: "cellule",
        label: "Cellule de crise (avec le/la directeur/trice)",
    },
    ...zones.map((z, i) => ({
        value: z.id,
        label: `Zone ${i + 1}${z.name ? " — " + z.name : ""} (adulte sans classe assignée)`,
    })),
    ...classes.map((cl) => ({
        value: `class_${cl}`,
        label: `Classe ${cl} (rattaché à cette classe)`,
    })),
];
