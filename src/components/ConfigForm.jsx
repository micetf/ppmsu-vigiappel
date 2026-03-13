import { useState } from "react";

let _zoneId = 1;
const newZone = () => ({ id: `z${++_zoneId}`, name: "", responsible: "" });

let _staffId = 0;
const newStaff = () => ({
    id: `s${++_staffId}`,
    nom: "",
    prenom: "",
    fonction: "",
    rattachement: "",
});

const FONCTIONS = [
    "Directeur/trice",
    "Directeur/trice adjoint(e)",
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
    zones: [{ id: "z1", name: "", responsible: "" }],
    classZoneMap: {},
    staff: [],
    blankIntervenantRows: 5,
};

export default function ConfigForm({ classes, onSubmit, onBack }) {
    const [config, setConfig] = useState({
        ...DEFAULTS,
        configType: classes.length > 3 ? "B" : "A",
        classZoneMap: Object.fromEntries(classes.map((cl) => [cl, "z1"])),
    });
    const [errors, setErrors] = useState({});

    // ── Setters génériques ─────────────────────────────────────────
    const setField = (field, value) => {
        setConfig((p) => ({ ...p, [field]: value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
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
            // Réaffecter le staff de cette zone vers la première zone restante
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
    const addStaff = () =>
        setConfig((p) => ({ ...p, staff: [...p.staff, newStaff()] }));

    const updateStaff = (id, field, value) => {
        setConfig((p) => ({
            ...p,
            staff: p.staff.map((s) =>
                s.id === id ? { ...s, [field]: value } : s
            ),
        }));
        setErrors((p) => ({ ...p, [`staff_${id}_${field}`]: undefined }));
    };

    const removeStaff = (id) =>
        setConfig((p) => ({ ...p, staff: p.staff.filter((s) => s.id !== id) }));

    // ── Validation ─────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!config.schoolName.trim()) e.schoolName = "Champ obligatoire";
        config.zones.forEach((z) => {
            if (!z.name.trim()) e[`zone_${z.id}_name`] = "Champ obligatoire";
            if (!z.responsible.trim())
                e[`zone_${z.id}_responsible`] = "Champ obligatoire";
        });
        config.staff.forEach((s) => {
            if (!s.nom.trim()) e[`staff_${s.id}_nom`] = "Obligatoire";
            if (!s.rattachement)
                e[`staff_${s.id}_rattachement`] = "Obligatoire";
        });
        const hasCellule = config.staff.some(
            (s) => s.rattachement === "cellule"
        );
        if (!hasCellule)
            e._cellule = "Aucun adulte n'est désigné pour la cellule de crise.";
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        onSubmit(config);
    };

    const multiZone = config.zones.length > 1;
    const showClassMap = config.configType === "B" && multiZone;

    // Options de rattachement pour le staff
    const rattachementOptions = [
        { value: "cellule", label: "🔴 Cellule de crise (directeur/trice)" },
        ...config.zones.map((z, i) => ({
            value: z.id,
            label: `Zone ${i + 1}${z.name ? " — " + z.name : ""} (adulte sans classe)`,
        })),
        ...classes.map((cl) => ({
            value: `class_${cl}`,
            label: `Classe ${cl} (rattaché à cette classe)`,
        })),
    ];

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 3 – Configuration des fiches
                </h2>
                <p className="text-sm text-gray-500">
                    Ces informations figureront dans l'en-tête — modèle Eduscol
                    PPMS 2024.
                </p>
            </div>

            {/* École */}
            <Section title="École">
                <Field label="Nom de l'école" error={errors.schoolName}>
                    <input
                        type="text"
                        placeholder="École élémentaire Jules Ferry"
                        value={config.schoolName}
                        onChange={(e) => setField("schoolName", e.target.value)}
                        className={cx(errors.schoolName)}
                    />
                </Field>
            </Section>

            {/* Format */}
            <Section title="Format des fiches générées">
                {classes.length > 3 && (
                    <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-amber-800 mb-3">
                        💡 <strong>{classes.length} classes détectées</strong> —
                        l'option B est recommandée.
                    </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        {
                            id: "A",
                            icon: "📄",
                            label: "Option A – Fiche unique",
                            desc: "Tous les élèves sur un même document. Adapté pour les petites écoles (≤ 3 classes).",
                        },
                        {
                            id: "B",
                            icon: "📋",
                            label: "Option B – Fiche par classe",
                            desc: "1 fiche par enseignant + 1 fiche adultes par zone + 1 synthèse cellule de crise.",
                        },
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setField("configType", opt.id)}
                            className={`text-left rounded-xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${
                    config.configType === opt.id
                        ? "border-blue-700 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                }`}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span
                                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                                        config.configType === opt.id
                                            ? "border-blue-700 bg-blue-700"
                                            : "border-gray-300"
                                    }`}
                                />
                                <span className="text-base">{opt.icon}</span>
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
            </Section>

            {/* Zones */}
            <Section title={`Zone${multiZone ? "s" : ""} de mise en sûreté`}>
                <div className="space-y-3">
                    {config.zones.map((zone, idx) => (
                        <div
                            key={zone.id}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-600">
                                    {multiZone
                                        ? `Zone ${idx + 1}`
                                        : "Zone de confinement"}
                                </span>
                                {multiZone && (
                                    <button
                                        type="button"
                                        onClick={() => removeZone(zone.id)}
                                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        Supprimer
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field
                                    label="Lieu"
                                    error={errors[`zone_${zone.id}_name`]}
                                >
                                    <input
                                        type="text"
                                        placeholder="Gymnase, salle polyvalente…"
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
                                <Field
                                    label="Responsable de cette zone"
                                    hint={
                                        multiZone
                                            ? "Adulte désigné pour coordonner les remontées vers la cellule de crise. Différent du directeur/de la directrice."
                                            : "Adulte désigné pour centraliser les fiches de recensement et les remonter à la cellule de crise. Peut être le/la directeur/trice si aucun autre adulte n'est disponible."
                                    }
                                    error={
                                        errors[`zone_${zone.id}_responsible`]
                                    }
                                >
                                    <input
                                        type="text"
                                        placeholder="M. Martin, enseignant"
                                        value={zone.responsible}
                                        onChange={(e) =>
                                            updateZone(
                                                zone.id,
                                                "responsible",
                                                e.target.value
                                            )
                                        }
                                        className={cx(
                                            errors[
                                                `zone_${zone.id}_responsible`
                                            ]
                                        )}
                                    />
                                </Field>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addZone}
                    className="mt-2 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                >
                    <span className="text-lg leading-none">＋</span> Ajouter une
                    zone
                </button>
            </Section>

            {/* Affectation classes → zones */}
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
                                <span className="text-sm font-medium text-gray-700 w-32 shrink-0">
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

            {/* Personnels de l'école */}
            <Section title="Personnels de l'école">
                <p className="text-sm text-gray-500">
                    Saisir tous les adultes présents dans l'école, hors
                    enseignants (extraits automatiquement du CSV). Chaque adulte
                    sera pointé sur la fiche correspondant à son rattachement.
                </p>

                {errors._cellule && (
                    <div
                        role="alert"
                        className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2"
                    >
                        <span>⚠️</span>
                        <span>{errors._cellule}</span>
                    </div>
                )}

                {config.staff.length > 0 && (
                    <div className="space-y-2">
                        {/* En-tête colonnes */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 px-3 text-xs text-gray-400 font-medium">
                            <span className="col-span-2">Nom *</span>
                            <span className="col-span-2">Prénom</span>
                            <span className="col-span-3">Fonction</span>
                            <span className="col-span-4">Rattachement *</span>
                        </div>
                        {config.staff.map((s) => (
                            <div
                                key={s.id}
                                className="grid grid-cols-12 gap-2 items-start bg-gray-50 border border-gray-200 rounded-lg p-3"
                            >
                                {/* Nom */}
                                <div className="col-span-6 sm:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Nom"
                                        value={s.nom}
                                        onChange={(e) =>
                                            updateStaff(
                                                s.id,
                                                "nom",
                                                e.target.value
                                            )
                                        }
                                        className={
                                            cx(errors[`staff_${s.id}_nom`]) +
                                            " text-xs"
                                        }
                                    />
                                    {errors[`staff_${s.id}_nom`] && (
                                        <p className="text-xs text-red-500 mt-0.5">
                                            {errors[`staff_${s.id}_nom`]}
                                        </p>
                                    )}
                                </div>
                                {/* Prénom */}
                                <div className="col-span-6 sm:col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Prénom"
                                        value={s.prenom}
                                        onChange={(e) =>
                                            updateStaff(
                                                s.id,
                                                "prenom",
                                                e.target.value
                                            )
                                        }
                                        className={cx() + " text-xs"}
                                    />
                                </div>
                                {/* Fonction */}
                                <div className="col-span-7 sm:col-span-3">
                                    <select
                                        value={s.fonction}
                                        onChange={(e) =>
                                            updateStaff(
                                                s.id,
                                                "fonction",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">— Fonction —</option>
                                        {FONCTIONS.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Rattachement */}
                                <div className="col-span-5 sm:col-span-4">
                                    <select
                                        value={s.rattachement}
                                        onChange={(e) =>
                                            updateStaff(
                                                s.id,
                                                "rattachement",
                                                e.target.value
                                            )
                                        }
                                        className={`w-full rounded-lg border px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 bg-white
                      ${errors[`staff_${s.id}_rattachement`] ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                                    >
                                        <option value="">
                                            — Rattachement —
                                        </option>
                                        {rattachementOptions.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors[`staff_${s.id}_rattachement`] && (
                                        <p className="text-xs text-red-500 mt-0.5">
                                            {
                                                errors[
                                                    `staff_${s.id}_rattachement`
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>
                                {/* Supprimer */}
                                <div className="col-span-12 sm:col-span-1 flex sm:justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeStaff(s.id)}
                                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                        aria-label="Supprimer ce personnel"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
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

                {/* Lignes vierges intervenants */}
                <div className="flex items-center gap-3 mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
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

            {/* Récapitulatif */}
            <Section title="Documents qui seront générés">
                <GenerationPreview config={config} classes={classes} />
            </Section>

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
                    Générer l'aperçu des fiches →
                </button>
            </div>
        </form>
    );
}

// ── Récapitulatif ──────────────────────────────────────────────────
function GenerationPreview({ config, classes }) {
    const { configType, zones, staff } = config;
    const multiZone = zones.length > 1;
    const cellule = staff.filter((s) => s.rattachement === "cellule");
    const fileCount = (configType === "A" ? 1 : zones.length) + 1;

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-1.5">
            {configType === "A" ? (
                <p>
                    → <strong>PPMS_Zone_{zones[0]?.name || "Zone"}.docx</strong>{" "}
                    — fiche recensement (adultes + élèves)
                </p>
            ) : (
                zones.map((z, i) => (
                    <p key={z.id}>
                        →{" "}
                        <strong>
                            PPMS_Zone_{z.name || `Zone${i + 1}`}.docx
                        </strong>{" "}
                        — adultes +{" "}
                        {
                            classes.filter((cl) =>
                                multiZone
                                    ? config.classZoneMap[cl] === z.id
                                    : true
                            ).length
                        }{" "}
                        classes
                    </p>
                ))
            )}
            <p>
                → <strong>PPMS_Cellule_Crise.docx</strong> — synthèse globale
                {multiZone ? " + synthèses par zone" : ""}
            </p>
            {cellule.length > 0 && (
                <p className="text-gray-500 text-xs">
                    Cellule de crise :{" "}
                    {cellule.map((s) => `${s.prenom} ${s.nom}`).join(", ")}
                </p>
            )}
            <p className="text-blue-700 font-semibold pt-1">
                = {fileCount} fichiers DOCX (ZIP)
            </p>
            <p className="text-gray-400 text-xs">
                1 fichier = 1 mallette PPMS · La date est laissée vierge.
            </p>
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────────
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

function Field({ label, hint, error, children }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}{" "}
                <span className="text-red-500" aria-hidden>
                    *
                </span>
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
