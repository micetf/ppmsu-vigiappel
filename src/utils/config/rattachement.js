/**
 * rattachement.js
 * ───────────────
 * Helpers pour le rattachement du staff aux zones et aux classes.
 *
 * Évolution Sprint 5 :
 * - buildRattachementOptions() : suppression de l'option "cellule".
 *   Les membres de la cellule de crise sont désormais gérés dans
 *   CrisisCellSection via config.crisis.members — ils ne sont plus
 *   des entrées staff avec rattachement = "cellule".
 * - getRattachementLabel() : le cas "cellule" est conservé de façon
 *   défensive pour afficher proprement d'éventuelles données héritées
 *   non encore migrées (ne devrait pas arriver après migrateConfig()).
 */

// ── Label lisible d'un rattachement ───────────────────────────────────────────

/**
 * @param {string}   rattachement  Valeur brute stockée dans staff[].rattachement
 * @param {Array}    zones         config.zones pour résoudre les IDs de zone
 * @returns {string}
 */
export const getRattachementLabel = (rattachement, zones) => {
    if (!rattachement) return "⚠️ Non rattaché";
    // Cas hérité — plus produit par l'UI mais peut exister dans données migrées
    if (rattachement === "cellule") return "Cellule de crise (hérité)";
    if (rattachement.startsWith("class_"))
        return `Classe ${rattachement.replace("class_", "")}`;
    const zone = zones.find((z) => z.id === rattachement);
    return zone ? `Zone — ${zone.name || "sans nom"}` : "Zone inconnue";
};

// ── Options du <select> de rattachement ───────────────────────────────────────

/**
 * Construit les options pour le select de rattachement du staff.
 * L'option "cellule" a été supprimée — les membres de cellule ont
 * désormais leur propre section (CrisisCellSection).
 *
 * @param {Array} zones    config.zones
 * @param {Array} classes  liste des noms de classes
 * @returns {{ value: string, label: string }[]}
 */
export const buildRattachementOptions = (zones, classes) => [
    ...zones.map((z, i) => ({
        value: z.id,
        label: `Zone ${i + 1}${z.name ? " — " + z.name : ""} (adulte sans classe assignée)`,
    })),
    ...classes.map((cl) => ({
        value: `class_${cl}`,
        label: `Classe ${cl} (rattaché à cette classe)`,
    })),
];
