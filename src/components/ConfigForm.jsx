import { useState } from "react";

let _zoneId = 1;
const newZone = () => ({ id: `z${++_zoneId}`, name: "", responsible: "" });

const DEFAULTS = {
    schoolName: "",
    responsible: "",
    configType: "A",
    zones: [{ id: "z1", name: "", responsible: "" }],
    classZoneMap: {},
};

export default function ConfigForm({ classes, onSubmit, onBack }) {
    const [config, setConfig] = useState({
        ...DEFAULTS,
        configType: classes.length > 3 ? "B" : "A",
        classZoneMap: Object.fromEntries(classes.map((cl) => [cl, "z1"])),
    });
    const [errors, setErrors] = useState({});

    // ── Setters ────────────────────────────────────────────────────
    const setField = (field, value) => {
        setConfig((p) => ({ ...p, [field]: value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
    };

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
            return { ...p, zones, classZoneMap };
        });

    const setClassZone = (cl, zoneId) =>
        setConfig((p) => ({
            ...p,
            classZoneMap: { ...p.classZoneMap, [cl]: zoneId },
        }));

    // ── Validation ─────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!config.schoolName.trim()) e.schoolName = "Champ obligatoire";
        if (!config.responsible.trim()) e.responsible = "Champ obligatoire";
        config.zones.forEach((z) => {
            if (!z.name.trim()) e[`zone_${z.id}_name`] = "Champ obligatoire";
            if (!z.responsible.trim())
                e[`zone_${z.id}_responsible`] = "Champ obligatoire";
        });
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
                <Field
                    label={
                        config.configType === "B"
                            ? "Responsable de la cellule de crise"
                            : "Responsable de zone"
                    }
                    hint={
                        config.configType === "B"
                            ? "Directeur/trice ou adulte désigné dans le PPMS. Apparaît sur la fiche de synthèse globale."
                            : "Adulte responsable de la zone. Apparaît en en-tête de la fiche."
                    }
                    error={errors.responsible}
                >
                    <input
                        type="text"
                        placeholder="Mme Dupont, directrice"
                        value={config.responsible}
                        onChange={(e) =>
                            setField("responsible", e.target.value)
                        }
                        className={cx(errors.responsible)}
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
                            desc: "1 fiche par enseignant + 1 fiche de synthèse cellule de crise. Recommandé à partir de 4 classes.",
                        },
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setField("configType", opt.id)}
                            className={`text-left rounded-xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${config.configType === opt.id ? "border-blue-700 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span
                                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${config.configType === opt.id ? "border-blue-700 bg-blue-700" : "border-gray-300"}`}
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

            {/* Affectation classes → zones (Option B + multi-zones) */}
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

function GenerationPreview({ config, classes }) {
    const { configType, zones } = config;
    const multiZone = zones.length > 1;
    if (configType === "A") {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-1">
                <p>
                    → <strong>1 document DOCX</strong> — {classes.length} classe
                    {classes.length > 1 ? "s" : ""}, tous élèves listés
                </p>
                <p className="text-gray-400 text-xs pt-1">
                    La date est laissée vierge (à compléter à la main lors de
                    l'événement).
                </p>
            </div>
        );
    }
    const docCount = classes.length + (multiZone ? zones.length : 0) + 1;
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 space-y-1.5">
            <p>
                → <strong>{classes.length} fiches classes</strong> — 1 par
                enseignant, noms pré-remplis
            </p>
            {multiZone ? (
                <p>
                    →{" "}
                    <strong>{zones.length} fiches de synthèse par zone</strong>{" "}
                    — 1 par responsable de zone
                </p>
            ) : null}
            <p>
                → <strong>1 fiche de synthèse globale</strong> — cellule de
                crise, {multiZone ? "toutes zones" : "toutes classes"}
            </p>
            <p className="text-blue-700 font-semibold pt-1">
                = {docCount} fichiers DOCX (téléchargés en ZIP)
            </p>
            <p className="text-gray-400 text-xs">
                La date est laissée vierge (à compléter à la main).
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
