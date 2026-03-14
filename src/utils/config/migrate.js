/**
 * migrate.js
 * ──────────
 * Migration silencieuse du format config stocké dans localStorage.
 *
 * Versions gérées :
 *   v0 (avant Sprint 5) : crisisCell, staff[].rattachement === "cellule",
 *                         AdultRef.substitute, classOverrides
 *   v1 (Sprint 5+)      : crisis.{responsible,members}, classSupervision
 *
 * Contrat : migrateConfig() est idempotente — appelée plusieurs fois sur
 * la même config produit toujours le même résultat.
 *
 * ⚠️  Ne jamais importer depuis defaults.js ici pour éviter un cycle de
 * dépendance (defaults → migrate → defaults). Les valeurs par défaut sont
 * définies localement.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nettoie un AdultRef v0 en supprimant le champ `substitute` (désormais
 * géré par classSupervision) et en garantissant les champs requis.
 *
 * @param {object|null} ref  AdultRef v0 (peut contenir .substitute)
 * @returns {object|null}    AdultRef v1 propre, ou null si ref invalide
 */
function cleanAdultRef(ref) {
    if (!ref) return null;
    // Destructuring pour exclure explicitement `substitute`
    // eslint-disable-next-line no-unused-vars
    const { substitute, ...clean } = ref;
    return clean;
}

/**
 * Convertit l'ancien objet substitut (embarqué dans un AdultRef v0) en
 * AdultRef v1 compatible avec classSupervision.
 *
 * Ancien format substitute : { source: "staff"|"manual", staffId, nom, prenom, fonction }
 * Nouveau format AdultRef  : identique — la conversion est donc directe.
 *
 * @param {object|null} substitute  Ancien substitute
 * @returns {object|null}           AdultRef v1 ou null si invalide/vide
 */
function migrateSubstitute(substitute) {
    if (!substitute) return null;

    if (substitute.source === "staff") {
        if (!substitute.staffId) return null;
        return {
            source: "staff",
            staffId: substitute.staffId,
            nom: substitute.nom ?? "",
            prenom: substitute.prenom ?? "",
            // fonction non stockée dans AdultRef — portée par staff[]
        };
    }

    if (substitute.source === "manual") {
        if (!substitute.nom?.trim()) return null;
        return {
            source: "manual",
            teacherClass: "",
            staffId: "",
            nom: substitute.nom,
            prenom: substitute.prenom ?? "",
            fonction: substitute.fonction ?? "",
        };
    }

    return null;
}

/**
 * Extrait les substituts déjà configurés dans le format v0 et les
 * convertit en entrées classSupervision v1.
 *
 * Sources v0 :
 *   - config.crisisCell.substitute        → classSupervision[crisisCell.teacherClass]
 *   - config.zoneResponsibles[id].substitute → classSupervision[resp.teacherClass]
 *
 * Un substitut déjà présent dans `existing` n'est PAS écrasé (priorité
 * à l'existant pour éviter de perdre une saisie partielle).
 *
 * @param {object} config    Config v0
 * @param {object} existing  classSupervision déjà construit (peut être {})
 * @returns {object}         classSupervision enrichi
 */
function extractLegacySubstitutes(config, existing = {}) {
    const supervision = { ...existing };

    // Substitut du responsable cellule
    const cc = config.crisisCell;
    if (cc?.source === "teacher" && cc.teacherClass && cc.substitute) {
        if (!supervision[cc.teacherClass]) {
            const ref = migrateSubstitute(cc.substitute);
            if (ref) supervision[cc.teacherClass] = ref;
        }
    }

    // Substituts des responsables de zone
    Object.values(config.zoneResponsibles ?? {}).forEach((resp) => {
        if (
            resp?.source === "teacher" &&
            resp.teacherClass &&
            resp.substitute
        ) {
            if (!supervision[resp.teacherClass]) {
                const ref = migrateSubstitute(resp.substitute);
                if (ref) supervision[resp.teacherClass] = ref;
            }
        }
    });

    return supervision;
}

// ─────────────────────────────────────────────────────────────────────────────
// Export principal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Migre une config stockée dans localStorage vers le format Sprint 5.
 *
 * Idempotente : si `crisis` est déjà présent, retourne la config telle
 * quelle (au plus une normalisation défensive des membres vides).
 *
 * @param {object} stored  Config brute issue de JSON.parse(localStorage)
 * @returns {object}       Config au format Sprint 5
 */
export function migrateConfig(stored) {
    if (!stored || typeof stored !== "object") return null;

    // ── Déjà migré ────────────────────────────────────────────────
    if (stored.crisis) {
        // Normalisation défensive : s'assurer que members est un tableau
        return {
            ...stored,
            crisis: {
                ...stored.crisis,
                members: stored.crisis.members ?? [],
            },
            classSupervision: stored.classSupervision ?? {},
        };
    }

    // ── Migration v0 → v1 ─────────────────────────────────────────

    // 1. Membres de cellule : staff avec rattachement === "cellule"
    //    Convertis en AdultRef source:"staff"
    const staffCellule = (stored.staff ?? []).filter(
        (s) => s.rattachement === "cellule"
    );
    const crisisMembers = staffCellule
        .filter((s) => s.nom?.trim()) // ignorer les lignes vides
        .map((s) => ({
            source: "staff",
            staffId: s.id,
            nom: s.nom,
            prenom: s.prenom ?? "",
            // fonction non dupliquée dans l'AdultRef — disponible via staff[]
        }));

    // 2. Staff restant (sans les membres cellule)
    const staffWithoutCellule = (stored.staff ?? []).filter(
        (s) => s.rattachement !== "cellule"
    );

    // 3. Responsable cellule (nettoyé)
    const responsible = cleanAdultRef(stored.crisisCell) ?? null;

    // 4. Nettoyage des zoneResponsibles (suppression des .substitute)
    const zoneResponsibles = Object.fromEntries(
        Object.entries(stored.zoneResponsibles ?? {}).map(([id, ref]) => [
            id,
            cleanAdultRef(ref),
        ])
    );

    // 5. Récupération des substituts configurés en v0 → classSupervision
    const classSupervision = extractLegacySubstitutes(stored, {});

    return {
        // Champs inchangés
        schoolName: stored.schoolName ?? "",
        configType: stored.configType ?? "A",
        zones: stored.zones ?? [{ id: "z1", name: "" }],
        classZoneMap: stored.classZoneMap ?? {},
        classExtraTeachers: stored.classExtraTeachers ?? {},
        blankIntervenantRows: stored.blankIntervenantRows ?? 5,

        // Champs migrés
        crisis: {
            responsible,
            members: crisisMembers,
        },
        zoneResponsibles,
        staff: staffWithoutCellule,
        classSupervision,

        // classOverrides conservé tel quel : docxGenerator le lit encore
        // jusqu'à la mise à jour du Sprint E
        ...(stored.classOverrides
            ? { classOverrides: stored.classOverrides }
            : {}),
    };
}
