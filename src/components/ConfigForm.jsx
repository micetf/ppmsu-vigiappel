import { useState } from "react";
import { toNom, toPrenom, fullName } from "../utils/formatName";
import StepHelp from "./StepHelp";

// ── Factories ──────────────────────────────────────────────────────
let _zoneId = 1;
const newZone = () => ({
    id: `z${++_zoneId}`,
    name: "",
    responsibleNom: "",
    responsiblePrenom: "",
});

let _staffId = 0;
const newStaff = () => ({
    id: `s${++_staffId}`,
    nom: "",
    prenom: "",
    fonction: "",
    rattachement: "",
});

// ── Constantes ─────────────────────────────────────────────────────
const FONCTIONS_CRISE = [
    "Directeur/trice",
    "Directeur/trice adjoint(e)",
    "Enseignant(e) faisant fonction",
];

const FONCTIONS_STAFF = [
    "AESH",
    "ATSEM",
    "Service civique",
    "Maître E (RASED)",
    "Psychologue EN (RASED)",
    "Personnel entretien/cantine",
    "Intervenant(e)",
    "Autre",
];

const DEFAULTS = {
    schoolName: "",
    configType: "A",
    zones: [{ id: "z1", name: "", responsibleNom: "", responsiblePrenom: "" }],
    classZoneMap: {},
    crisisCell: { nom: "", prenom: "", fonction: "Directeur/trice" },
    classOverrides: {}, // ← nouveau
    staff: [],
    blankIntervenantRows: 5,
};

// ── Composant principal ────────────────────────────────────────────
export default function ConfigForm({
    classes,
    teacherByClass = {},
    onSubmit,
    onBack,
    initialConfig,
}) {
    const [config, setConfig] = useState(() => {
        if (initialConfig) return initialConfig;
        return {
            ...DEFAULTS,
            configType: classes.length > 3 ? "B" : "A",
            classZoneMap: Object.fromEntries(classes.map((cl) => [cl, "z1"])),
        };
    });
    const [errors, setErrors] = useState({});
    const [showFormatOptions, setShowFormatOptions] = useState(false);
    const [editingStaffIds, setEditingStaffIds] = useState(new Set());

    // ── Setters ────────────────────────────────────────────────────
    const setField = (field, value) => {
        setConfig((p) => ({ ...p, [field]: value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
    };

    const setCrisisCell = (field, value) => {
        setConfig((p) => ({
            ...p,
            crisisCell: { ...p.crisisCell, [field]: value },
        }));
        setErrors((p) => ({ ...p, [`crisisCell_${field}`]: undefined }));
    };

    // ── Zones ──────────────────────────────────────────────────────
    const updateZone = (id, field, value) => {
        setConfig((p) => ({
            ...p,
            zones: p.zones.map((z) =>
                z.id === id ? { ...z, [field]: value } : z
            ),
        }));
        setErrors((p) => ({ ...p, [`zone_${id}_${field}`]: undefined }));
    };

    const addZone = () =>
        setConfig((p) => ({ ...p, zones: [...p.zones, newZone()] }));

    const removeZone = (id) =>
        setConfig((p) => {
            const zones = p.zones.filter((z) => z.id !== id);
            const fallback = zones[0]?.id;
            const classZoneMap = Object.fromEntries(
                Object.entries(p.classZoneMap).map(([cl, zid]) => [
                    cl,
                    zid === id ? fallback : zid,
                ])
            );
            const staff = p.staff.map((s) =>
                s.rattachement === id
                    ? { ...s, rattachement: fallback ?? "" }
                    : s
            );
            return { ...p, zones, classZoneMap, staff };
        });

    const setClassZone = (cl, zoneId) =>
        setConfig((p) => ({
            ...p,
            classZoneMap: { ...p.classZoneMap, [cl]: zoneId },
        }));

    // ── Staff ──────────────────────────────────────────────────────
    const addStaff = () => {
        const s = newStaff();
        setConfig((p) => ({ ...p, staff: [...p.staff, s] }));
        setEditingStaffIds((prev) => new Set([...prev, s.id]));
    };

    const updateStaff = (id, field, value) => {
        setConfig((p) => ({
            ...p,
            staff: p.staff.map((s) =>
                s.id === id ? { ...s, [field]: value } : s
            ),
        }));
        setErrors((p) => ({ ...p, [`staff_${id}_${field}`]: undefined }));
    };

    const removeStaff = (id) => {
        setConfig((p) => ({ ...p, staff: p.staff.filter((s) => s.id !== id) }));
        setEditingStaffIds((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
        });
    };

    const validateStaff = (id) =>
        setEditingStaffIds((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
        });

    const editStaff = (id) =>
        setEditingStaffIds((prev) => new Set([...prev, id]));

    // ── Validation ─────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!config.schoolName.trim()) e.schoolName = "Champ obligatoire";
        if (!config.crisisCell.nom.trim())
            e.crisisCell_nom = "Champ obligatoire";
        config.zones.forEach((z) => {
            if (!z.name.trim()) e[`zone_${z.id}_name`] = "Champ obligatoire";
            if (!z.responsibleNom.trim())
                e[`zone_${z.id}_responsibleNom`] = "Champ obligatoire";
        });
        config.staff.forEach((s) => {
            if (!s.nom.trim()) e[`staff_${s.id}_nom`] = "Obligatoire";
            if (!s.rattachement)
                e[`staff_${s.id}_rattachement`] = "Obligatoire";
        });
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            const staffInError = config.staff
                .filter(
                    (s) =>
                        errs[`staff_${s.id}_nom`] ||
                        errs[`staff_${s.id}_rattachement`]
                )
                .map((s) => s.id);
            if (staffInError.length)
                setEditingStaffIds(
                    (prev) => new Set([...prev, ...staffInError])
                );
            return;
        }
        onSubmit(config);
    };

    // ── Dérivés ────────────────────────────────────────────────────
    const multiZone = config.zones.length > 1;
    const showClassMap = config.configType === "B" && multiZone;
    const docCount = (config.configType === "A" ? 1 : config.zones.length) + 1;
    const overrideCount = Object.values(config.classOverrides || {}).filter(
        (o) => o?.teacherUnavailable
    ).length;

    const getRattachementLabel = (rattachement) => {
        if (!rattachement) return "⚠️ Non rattaché";
        if (rattachement.startsWith("class_"))
            return `Classe ${rattachement.replace("class_", "")}`;
        const zone = config.zones.find((z) => z.id === rattachement);
        return zone ? `Zone — ${zone.name || "sans nom"}` : "Zone inconnue";
    };

    const rattachementOptions = [
        ...config.zones.map((z, i) => ({
            value: z.id,
            label: `Zone ${i + 1}${z.name ? " — " + z.name : ""} (adulte sans classe)`,
        })),
        ...classes.map((cl) => ({
            value: `class_${cl}`,
            label: `Classe ${cl} (rattaché à cette classe)`,
        })),
    ];

    const summaryText = [
        config.schoolName || "École non définie",
        `Option ${config.configType}`,
        `${config.zones.length} zone${config.zones.length > 1 ? "s" : ""}`,
        overrideCount > 0
            ? `${overrideCount} remplacement${overrideCount > 1 ? "s" : ""}`
            : null,
        `→ ${docCount} doc${docCount > 1 ? "s" : ""}`,
    ]
        .filter(Boolean)
        .join("  ·  ");

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8 pb-28">
            <StepHelp
                stepKey="step3"
                title="Comment remplir cette configuration ?"
            >
                <div className="pt-3 space-y-2 text-sm">
                    <p>
                        <strong>🏫 Votre école</strong> — Nom tel qu'il
                        apparaîtra en en-tête, et identité du/de la
                        directeur/trice (responsable de la cellule de crise).
                    </p>
                    <p>
                        <strong>📍 Zones</strong> — Lieu(x) de confinement et
                        adulte responsable de chaque zone. La plupart des écoles
                        n'ont qu'une seule zone.
                    </p>
                    <p>
                        <strong>🔄 Encadrement PPMS</strong> — Si un enseignant
                        ne sera pas avec sa classe (directrice à la cellule de
                        crise, responsable de zone…), désigner son remplaçant
                        ici.
                    </p>
                    <p>
                        <strong>👥 Autres adultes</strong> — AESH, ATSEM,
                        entretien, service civique… Les enseignants sont déjà
                        extraits du CSV.
                    </p>
                </div>
            </StepHelp>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 3 – Configuration des fiches
                </h2>
                <p className="text-sm text-gray-500">
                    Ces informations figureront dans l'en-tête des documents —
                    modèle Eduscol PPMS 2024.
                </p>
            </div>

            {/* ── 1. Votre école ──────────────────────────────────────── */}
            <Section title="Votre école">
                <Field label="Nom de l'école" error={errors.schoolName}>
                    <input
                        type="text"
                        placeholder="École élémentaire Jules Ferry"
                        value={config.schoolName}
                        onChange={(e) => setField("schoolName", e.target.value)}
                        className={cx(errors.schoolName)}
                    />
                </Field>

                <div className="border-2 border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-900">
                            🔒 Responsable de la cellule de crise
                        </p>
                        <span className="text-xs font-semibold text-blue-800 bg-blue-200 px-2 py-0.5 rounded-full">
                            Obligatoire
                        </span>
                    </div>
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Pilote la cellule de crise : communications avec les
                        secours (112, IEN, mairie), centralise les bilans de
                        toutes les zones. Ne gère pas de classe pendant le PPMS.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Field label="NOM" error={errors.crisisCell_nom}>
                            <input
                                type="text"
                                placeholder="DUPONT"
                                value={config.crisisCell.nom}
                                onChange={(e) =>
                                    setCrisisCell("nom", toNom(e.target.value))
                                }
                                className={cx(errors.crisisCell_nom)}
                            />
                        </Field>
                        <Field label="Prénom" optional>
                            <input
                                type="text"
                                placeholder="Marie"
                                value={config.crisisCell.prenom}
                                onChange={(e) =>
                                    setCrisisCell(
                                        "prenom",
                                        toPrenom(e.target.value)
                                    )
                                }
                                className={cx()}
                            />
                        </Field>
                        <Field label="Fonction" optional>
                            <select
                                value={config.crisisCell.fonction}
                                onChange={(e) =>
                                    setCrisisCell("fonction", e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {FONCTIONS_CRISE.map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </div>
            </Section>

            {/* ── 2. Format des fiches ────────────────────────────────── */}
            <Section title="Format des fiches">
                {!showFormatOptions ? (
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">
                                {config.configType === "B" ? "📋" : "📄"}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800">
                                    {config.configType === "B"
                                        ? "Option B — Fiche par classe"
                                        : "Option A — Fiche unique"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {config.configType === "B"
                                        ? `${classes.length} classes · 1 fiche par enseignant + synthèse cellule de crise`
                                        : `${classes.length} classe${classes.length > 1 ? "s" : ""} · tous les élèves sur un seul document`}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFormatOptions(true)}
                            className="text-xs text-blue-700 hover:text-blue-900 hover:underline shrink-0 transition-colors"
                        >
                            Modifier ▾
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {classes.length > 3 && (
                            <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-amber-800">
                                💡{" "}
                                <strong>
                                    {classes.length} classes détectées
                                </strong>{" "}
                                — l'option B est recommandée.
                            </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                {
                                    id: "A",
                                    icon: "📄",
                                    label: "Option A — Fiche unique",
                                    desc: "Tous les élèves sur un même document. Adapté pour les petites écoles (≤ 3 classes).",
                                },
                                {
                                    id: "B",
                                    icon: "📋",
                                    label: "Option B — Fiche par classe",
                                    desc: "1 fiche par enseignant + 1 fiche adultes par zone + 1 synthèse cellule de crise.",
                                },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                        setField("configType", opt.id);
                                        setShowFormatOptions(false);
                                    }}
                                    className={`text-left rounded-xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    ${config.configType === opt.id ? "border-blue-700 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                            className={`w-4 h-4 rounded-full border-2 shrink-0
                      ${config.configType === opt.id ? "border-blue-700 bg-blue-700" : "border-gray-300"}`}
                                        />
                                        <span className="text-base">
                                            {opt.icon}
                                        </span>
                                        <span className="font-semibold text-sm text-gray-800">
                                            {opt.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 pl-6">
                                        {opt.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFormatOptions(false)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕ Réduire
                        </button>
                    </div>
                )}
            </Section>

            {/* ── 3. Zones de mise en sûreté ──────────────────────────── */}
            <Section title="Zones de mise en sûreté">
                <div className="space-y-4">
                    {config.zones.map((zone, idx) => (
                        <div
                            key={zone.id}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">
                                    Zone {idx + 1}
                                </span>
                                {config.zones.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeZone(zone.id)}
                                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        Supprimer cette zone
                                    </button>
                                )}
                            </div>

                            <Field
                                label="Lieu de confinement"
                                error={errors[`zone_${zone.id}_name`]}
                            >
                                <input
                                    type="text"
                                    placeholder="Gymnase, salle polyvalente, couloir condamnable…"
                                    value={zone.name}
                                    onChange={(e) =>
                                        updateZone(
                                            zone.id,
                                            "name",
                                            e.target.value
                                        )
                                    }
                                    className={cx(
                                        errors[`zone_${zone.id}_name`]
                                    )}
                                />
                            </Field>

                            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Responsable de zone
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                                        {multiZone
                                            ? "Centralise les remontées de cette zone et les transmet à la cellule de crise. Doit être différent du directeur/de la directrice."
                                            : "Centralise les fiches de recensement et les remonte à la cellule de crise."}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field
                                        label="NOM"
                                        error={
                                            errors[
                                                `zone_${zone.id}_responsibleNom`
                                            ]
                                        }
                                    >
                                        <input
                                            type="text"
                                            placeholder="MARTIN"
                                            value={zone.responsibleNom}
                                            onChange={(e) =>
                                                updateZone(
                                                    zone.id,
                                                    "responsibleNom",
                                                    toNom(e.target.value)
                                                )
                                            }
                                            className={cx(
                                                errors[
                                                    `zone_${zone.id}_responsibleNom`
                                                ]
                                            )}
                                        />
                                    </Field>
                                    <Field label="Prénom" optional>
                                        <input
                                            type="text"
                                            placeholder="Paul"
                                            value={zone.responsiblePrenom}
                                            onChange={(e) =>
                                                updateZone(
                                                    zone.id,
                                                    "responsiblePrenom",
                                                    toPrenom(e.target.value)
                                                )
                                            }
                                            className={cx()}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="space-y-1">
                    <button
                        type="button"
                        onClick={addZone}
                        className="mt-2 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                    >
                        <span className="text-lg leading-none">＋</span> Ajouter
                        une zone
                    </button>
                    <p className="text-xs text-gray-400 pl-6">
                        Uniquement si votre école comporte plusieurs bâtiments
                        ou espaces de confinement séparés.
                    </p>
                </div>
            </Section>

            {/* ── 4. Affectation classes → zones (si multi-zones) ─────── */}
            {showClassMap && (
                <Section title="Affectation des classes aux zones">
                    <p className="text-sm text-gray-500 mb-3">
                        Indiquer dans quelle zone chaque classe se confine.
                    </p>
                    <div className="space-y-2">
                        {classes.map((cl) => (
                            <div
                                key={cl}
                                className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-2.5"
                            >
                                <span className="text-sm font-medium text-gray-700 w-28 shrink-0">
                                    {cl}
                                </span>
                                <select
                                    value={
                                        config.classZoneMap[cl] ||
                                        config.zones[0]?.id
                                    }
                                    onChange={(e) =>
                                        setClassZone(cl, e.target.value)
                                    }
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {config.zones.map((z, i) => (
                                        <option key={z.id} value={z.id}>
                                            Zone {i + 1}
                                            {z.name ? ` — ${z.name}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── 4bis. Encadrement PPMS par classe ───────────────────── */}
            <Section title="Encadrement PPMS par classe">
                <EncadrementSection
                    classes={classes}
                    teacherByClass={teacherByClass}
                    config={config}
                    setConfig={setConfig}
                />
            </Section>

            {/* ── 5. Autres adultes ───────────────────────────────────── */}
            <Section title="Autres adultes">
                <p className="text-sm text-gray-500">
                    Saisir les adultes présents dans l'école hors enseignants —
                    déjà extraits du CSV — et hors directeur/trice — déjà
                    renseigné ci-dessus. Chaque adulte sera pointé sur la fiche
                    de sa zone ou de sa classe.
                </p>

                {config.staff.length > 0 && (
                    <div className="space-y-2 mt-1">
                        {config.staff.map((s) =>
                            editingStaffIds.has(s.id) ? (
                                <StaffCardEditing
                                    key={s.id}
                                    staff={s}
                                    onUpdate={(field, value) =>
                                        updateStaff(s.id, field, value)
                                    }
                                    onValidate={() => validateStaff(s.id)}
                                    onRemove={() => removeStaff(s.id)}
                                    rattachementOptions={rattachementOptions}
                                    errors={errors}
                                />
                            ) : (
                                <StaffCardDisplay
                                    key={s.id}
                                    staff={s}
                                    rattachementLabel={getRattachementLabel(
                                        s.rattachement
                                    )}
                                    hasError={
                                        !!errors[`staff_${s.id}_nom`] ||
                                        !!errors[`staff_${s.id}_rattachement`]
                                    }
                                    onEdit={() => editStaff(s.id)}
                                    onRemove={() => removeStaff(s.id)}
                                />
                            )
                        )}
                    </div>
                )}

                <button
                    type="button"
                    onClick={addStaff}
                    className="mt-2 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                >
                    <span className="text-lg leading-none">＋</span> Ajouter un
                    personnel
                </button>

                <div className="flex items-center gap-3 mt-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <label className="text-sm text-gray-600 flex-1">
                        Lignes vierges pour intervenants / personnels variables
                        du jour
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="20"
                        value={config.blankIntervenantRows}
                        onChange={(e) =>
                            setField(
                                "blankIntervenantRows",
                                Math.max(0, parseInt(e.target.value) || 0)
                            )
                        }
                        className="w-16 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                </div>
            </Section>

            {/* ── Barre sticky ────────────────────────────────────────── */}
            <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
                <p className="text-xs text-gray-400 mb-2 truncate">
                    {summaryText}
                </p>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        ← Retour à l'aperçu
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors"
                    >
                        Générer les fiches →
                    </button>
                </div>
            </div>
        </form>
    );
}

// ── Section Encadrement PPMS ───────────────────────────────────────
function EncadrementSection({ classes, teacherByClass, config, setConfig }) {
    const [open, setOpen] = useState(false);
    const overrides = config.classOverrides || {};
    const activeCount = Object.values(overrides).filter(
        (o) => o?.teacherUnavailable
    ).length;

    const toggleClass = (cl, enabled) =>
        setConfig((p) => ({
            ...p,
            classOverrides: {
                ...p.classOverrides,
                [cl]: enabled
                    ? {
                          teacherUnavailable: true,
                          substituteSource: "staff",
                          substituteStaffId: "",
                          substituteNom: "",
                          substitutePrenom: "",
                          substituteFonction: "",
                      }
                    : undefined,
            },
        }));

    const updateOverride = (cl, updates) =>
        setConfig((p) => ({
            ...p,
            classOverrides: {
                ...p.classOverrides,
                [cl]: { ...p.classOverrides[cl], ...updates },
            },
        }));

    const staffOptions = config.staff.map((s) => ({
        value: s.id,
        label: [fullName(s.nom, s.prenom), s.fonction]
            .filter(Boolean)
            .join(" — "),
    }));

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* En-tête accordéon */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left gap-3"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">
                        Remplacements d'encadrement
                    </span>
                    {activeCount > 0 ? (
                        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {activeCount} remplacement
                            {activeCount > 1 ? "s" : ""}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">
                            Optionnel — aucun remplacement
                        </span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {open && (
                <div className="divide-y divide-gray-100">
                    {/* Explication */}
                    <p className="px-4 py-3 text-xs text-gray-500 leading-relaxed bg-white">
                        Cocher si un enseignant ne sera pas avec son groupe
                        pendant le PPMS : directeur/trice à la cellule de crise,
                        responsable de zone, toute autre mission. Son nom
                        restera visible sur la fiche avec mention de sa mission
                        — il faut alors désigner l'adulte qui encadrera
                        réellement la classe.
                    </p>

                    {/* Une ligne par classe */}
                    {classes.map((cl) => {
                        const teacher = teacherByClass[cl];
                        const override = overrides[cl];
                        const isOverridden = !!override?.teacherUnavailable;

                        return (
                            <div
                                key={cl}
                                className="px-4 py-3 space-y-3 bg-white"
                            >
                                {/* Toggle */}
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isOverridden}
                                        onChange={(e) =>
                                            toggleClass(cl, e.target.checked)
                                        }
                                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    />
                                    <div>
                                        <span className="text-sm font-semibold text-gray-800">
                                            {cl}
                                        </span>
                                        {teacher ? (
                                            <span className="text-sm text-gray-500">
                                                {" "}
                                                — {teacher} absent(e) du groupe
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">
                                                {" "}
                                                — enseignant(e) non détecté(e)
                                                dans le CSV
                                            </span>
                                        )}
                                    </div>
                                </label>

                                {/* Formulaire de remplacement */}
                                {isOverridden && (
                                    <div className="ml-7 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
                                        <p className="text-xs font-semibold text-amber-900">
                                            Adulte qui encadrera cette classe
                                            pendant le PPMS :
                                        </p>

                                        {/* Source toggle */}
                                        <div className="flex gap-2">
                                            {[
                                                {
                                                    value: "staff",
                                                    label: "Choisir dans la liste",
                                                },
                                                {
                                                    value: "manual",
                                                    label: "Saisir manuellement",
                                                },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() =>
                                                        updateOverride(cl, {
                                                            substituteSource:
                                                                opt.value,
                                                        })
                                                    }
                                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                            ${
                                override.substituteSource === opt.value
                                    ? "bg-amber-600 text-white border-amber-600"
                                    : "bg-white text-amber-700 border-amber-300 hover:border-amber-500"
                            }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Depuis la liste staff */}
                                        {override.substituteSource ===
                                            "staff" &&
                                            (staffOptions.length > 0 ? (
                                                <select
                                                    value={
                                                        override.substituteStaffId ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        updateOverride(cl, {
                                                            substituteStaffId:
                                                                e.target.value,
                                                        })
                                                    }
                                                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                                                >
                                                    <option value="">
                                                        — Sélectionner un adulte
                                                        —
                                                    </option>
                                                    {staffOptions.map((o) => (
                                                        <option
                                                            key={o.value}
                                                            value={o.value}
                                                        >
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                                                    Aucun adulte dans la section
                                                    "Autres adultes". Renseigner
                                                    d'abord la section
                                                    ci-dessous, ou utiliser la
                                                    saisie manuelle.
                                                </p>
                                            ))}

                                        {/* Saisie manuelle */}
                                        {override.substituteSource ===
                                            "manual" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                {[
                                                    {
                                                        key: "substituteNom",
                                                        label: "NOM",
                                                        placeholder: "GARCIA",
                                                        transform: toNom,
                                                    },
                                                    {
                                                        key: "substitutePrenom",
                                                        label: "Prénom",
                                                        placeholder: "Ana",
                                                        transform: toPrenom,
                                                    },
                                                ].map(
                                                    ({
                                                        key,
                                                        label,
                                                        placeholder,
                                                        transform,
                                                    }) => (
                                                        <div key={key}>
                                                            <label className="block text-xs font-medium text-amber-800 mb-1">
                                                                {label}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder={
                                                                    placeholder
                                                                }
                                                                value={
                                                                    override[
                                                                        key
                                                                    ] || ""
                                                                }
                                                                onChange={(e) =>
                                                                    updateOverride(
                                                                        cl,
                                                                        {
                                                                            [key]: transform(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            ),
                                                                        }
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                                                            />
                                                        </div>
                                                    )
                                                )}
                                                <div>
                                                    <label className="block text-xs font-medium text-amber-800 mb-1">
                                                        Fonction
                                                    </label>
                                                    <select
                                                        value={
                                                            override.substituteFonction ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            updateOverride(cl, {
                                                                substituteFonction:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                                                    >
                                                        <option value="">
                                                            — Fonction —
                                                        </option>
                                                        {FONCTIONS_STAFF.map(
                                                            (f) => (
                                                                <option
                                                                    key={f}
                                                                    value={f}
                                                                >
                                                                    {f}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Carte staff — mode édition ─────────────────────────────────────
function StaffCardEditing({
    staff,
    onUpdate,
    onValidate,
    onRemove,
    rattachementOptions,
    errors,
}) {
    return (
        <div className="bg-white border-2 border-blue-300 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Field label="NOM" error={errors[`staff_${staff.id}_nom`]}>
                    <input
                        type="text"
                        placeholder="GARCIA"
                        value={staff.nom}
                        onChange={(e) => onUpdate("nom", toNom(e.target.value))}
                        className={cx(errors[`staff_${staff.id}_nom`])}
                    />
                </Field>
                <Field label="Prénom" optional>
                    <input
                        type="text"
                        placeholder="Ana"
                        value={staff.prenom}
                        onChange={(e) =>
                            onUpdate("prenom", toPrenom(e.target.value))
                        }
                        className={cx()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Fonction" optional>
                    <select
                        value={staff.fonction}
                        onChange={(e) => onUpdate("fonction", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">— Sélectionner —</option>
                        {FONCTIONS_STAFF.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field
                    label="Rattachement"
                    error={errors[`staff_${staff.id}_rattachement`]}
                >
                    <select
                        value={staff.rattachement}
                        onChange={(e) =>
                            onUpdate("rattachement", e.target.value)
                        }
                        className={cx(errors[`staff_${staff.id}_rattachement`])}
                    >
                        <option value="">— Zone ou Classe —</option>
                        {rattachementOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                    ✕ Supprimer
                </button>
                <button
                    type="button"
                    onClick={onValidate}
                    className="text-xs px-3 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
                >
                    Valider ✓
                </button>
            </div>
        </div>
    );
}

// ── Carte staff — mode affichage ───────────────────────────────────
function StaffCardDisplay({
    staff,
    rattachementLabel,
    hasError,
    onEdit,
    onRemove,
}) {
    return (
        <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 group transition-colors
      ${hasError ? "bg-red-50 border border-red-300" : "bg-gray-50 border border-gray-200 hover:border-gray-300"}`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="text-base shrink-0">👤</span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                        {fullName(staff.nom, staff.prenom) || (
                            <span className="text-red-500">Nom manquant</span>
                        )}
                    </p>
                    <p className="text-xs text-gray-500">
                        {[
                            staff.fonction || "Fonction non précisée",
                            rattachementLabel,
                        ].join("  ·  ")}
                    </p>
                </div>
            </div>
            <div className="flex gap-1 shrink-0">
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    aria-label="Modifier"
                >
                    ✎
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    aria-label="Supprimer"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

// ── Helpers UI ─────────────────────────────────────────────────────
function Section({ title, children }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">
                {title}
            </h3>
            {children}
        </div>
    );
}

function Field({ label, hint, error, children, optional = false }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {!optional && (
                    <span className="text-red-500 ml-0.5" aria-hidden>
                        *
                    </span>
                )}
            </label>
            {hint && (
                <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>
            )}
            {children}
            {error && (
                <p className="text-xs text-red-500" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function cx(error) {
    return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500
    ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"}`;
}
