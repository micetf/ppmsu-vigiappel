import { useState } from "react";

const DEFAULTS = {
    schoolName: "",
    zone: "",
    responsible: "",
    configType: "A",
};

export default function ConfigForm({ classes, onSubmit, onBack }) {
    const [config, setConfig] = useState({
        ...DEFAULTS,
        configType: classes.length > 3 ? "B" : "A",
    });
    const [errors, setErrors] = useState({});

    function set(field, value) {
        setConfig((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    function validate() {
        const e = {};
        if (!config.schoolName.trim()) e.schoolName = "Champ obligatoire";
        if (!config.zone.trim()) e.zone = "Champ obligatoire";
        if (!config.responsible.trim()) e.responsible = "Champ obligatoire";
        return e;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        onSubmit(config);
    }

    // Le hint du responsable change selon l'option
    const responsableHint =
        config.configType === "B"
            ? "Personne en charge de la cellule de crise (directeur/trice, ou adulte désigné dans le PPMS). Son nom figurera sur la fiche de synthèse."
            : "Adulte responsable de la zone de confinement. Son nom figurera en en-tête de la fiche.";

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 3 – Configuration des fiches
                </h2>
                <p className="text-sm text-gray-500">
                    Ces informations figureront dans l'en-tête — conformes au
                    modèle Eduscol PPMS 2024.
                </p>
            </div>

            {/* École */}
            <Section title="École">
                <Field label="Nom de l'école" error={errors.schoolName}>
                    <input
                        type="text"
                        placeholder="École élémentaire Jules Ferry"
                        value={config.schoolName}
                        onChange={(e) => set("schoolName", e.target.value)}
                        className={cx(errors.schoolName)}
                    />
                </Field>
            </Section>

            {/* Zone */}
            <Section title="Zone de mise en sûreté">
                <Field label="Lieu de confinement" error={errors.zone}>
                    <input
                        type="text"
                        placeholder="Gymnase, salle polyvalente, couloir B…"
                        value={config.zone}
                        onChange={(e) => set("zone", e.target.value)}
                        className={cx(errors.zone)}
                    />
                </Field>
                <Field
                    label={
                        config.configType === "B"
                            ? "Responsable de la cellule de crise"
                            : "Responsable de zone"
                    }
                    hint={responsableHint}
                    error={errors.responsible}
                >
                    <input
                        type="text"
                        placeholder="Mme Dupont, directrice"
                        value={config.responsible}
                        onChange={(e) => set("responsible", e.target.value)}
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
                    {OPTIONS.map((opt) => (
                        <OptionCard
                            key={opt.id}
                            opt={opt}
                            selected={config.configType === opt.id}
                            onSelect={() => set("configType", opt.id)}
                        />
                    ))}
                </div>
            </Section>

            {/* Récapitulatif */}
            {classes.length > 0 && (
                <Section title="Aperçu de la génération">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-1">
                        {config.configType === "A" ? (
                            <p>
                                → <strong>1 document</strong> — {classes.length}{" "}
                                classe{classes.length > 1 ? "s" : ""}{" "}
                                regroupées, tous élèves listés
                            </p>
                        ) : (
                            <>
                                <p>
                                    →{" "}
                                    <strong>
                                        {classes.length} fiches classes
                                    </strong>{" "}
                                    — 1 par enseignant, noms pré-remplis
                                </p>
                                <p>
                                    → <strong>1 fiche de synthèse</strong> —
                                    cellule de crise, totaux par classe
                                </p>
                            </>
                        )}
                        <p className="text-gray-400 text-xs pt-1">
                            La date de l'événement est laissée vierge sur les
                            fiches (à compléter à la main).
                        </p>
                    </div>
                </Section>
            )}

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

// ── Sous-composants (inchangés) ───────────────────────────────────

const OPTIONS = [
    {
        id: "A",
        label: "Option A – Fiche unique",
        desc: "Tous les élèves sur un même document. Adapté pour les petites écoles (≤ 3 classes).",
        icon: "📄",
    },
    {
        id: "B",
        label: "Option B – Fiche par classe",
        desc: "1 fiche par enseignant + 1 fiche de synthèse cellule de crise. Recommandé à partir de 4 classes.",
        icon: "📋",
    },
];

function OptionCard({ opt, selected, onSelect }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`text-left rounded-xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${selected ? "border-blue-700 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
        >
            <div className="flex items-center gap-2 mb-1.5">
                <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 ${selected ? "border-blue-700 bg-blue-700" : "border-gray-300"}`}
                />
                <span className="text-lg">{opt.icon}</span>
                <span className="font-semibold text-sm text-gray-800">
                    {opt.label}
                </span>
            </div>
            <p className="text-xs text-gray-500 pl-6">{opt.desc}</p>
        </button>
    );
}

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
