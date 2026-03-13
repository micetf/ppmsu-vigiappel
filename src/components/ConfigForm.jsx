import { useState } from "react";

const today = new Date().toISOString().split("T")[0];

const DEFAULTS = {
    schoolName: "",
    zone: "",
    responsible: "",
    date: today,
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
        if (!config.date) e.date = "Champ obligatoire";
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

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 3 – Configuration des fiches
                </h2>
                <p className="text-sm text-gray-500">
                    Ces informations figureront dans l'en-tête de chaque fiche —
                    conformes au modèle Eduscol PPMS 2024.
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
                <Field
                    label="Date de l'événement"
                    hint="Pré-remplie avec la date du jour — modifiable si impression à l'avance"
                    error={errors.date}
                >
                    <input
                        type="date"
                        value={config.date}
                        onChange={(e) => set("date", e.target.value)}
                        className={cx(errors.date)}
                    />
                </Field>
            </Section>

            {/* Zone de mise en sûreté */}
            <Section title="Zone de mise en sûreté">
                <Field label="Lieu" error={errors.zone}>
                    <input
                        type="text"
                        placeholder="Gymnase, salle polyvalente, couloir B…"
                        value={config.zone}
                        onChange={(e) => set("zone", e.target.value)}
                        className={cx(errors.zone)}
                    />
                </Field>
                <Field
                    label="Nom du responsable de zone"
                    error={errors.responsible}
                >
                    <input
                        type="text"
                        placeholder="M. Dupont, directeur"
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

            {/* Récapitulatif lecture seule */}
            {classes.length > 0 && (
                <Section title="Aperçu de la génération">
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 space-y-1">
                        {config.configType === "A" ? (
                            <p>
                                → <strong>1 document</strong> avec{" "}
                                {classes.length} classe
                                {classes.length > 1 ? "s" : ""} regroupées
                            </p>
                        ) : (
                            <>
                                <p>
                                    →{" "}
                                    <strong>
                                        {classes.length} fiches classes
                                    </strong>{" "}
                                    ({classes.join(", ")})
                                </p>
                                <p>
                                    → <strong>1 fiche de synthèse</strong> pour
                                    la cellule de crise
                                </p>
                            </>
                        )}
                    </div>
                </Section>
            )}

            {/* Actions */}
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

// ── Sous-composants ──────────────────────────────────────────────

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
            className={`text-left rounded-xl border-2 p-4 transition-all outline-none
        focus-visible:ring-2 focus-visible:ring-blue-500
        ${selected ? "border-blue-700 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
        >
            <div className="flex items-center gap-2 mb-1.5">
                <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0
          ${selected ? "border-blue-700 bg-blue-700" : "border-gray-300"}`}
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
            {hint && <p className="text-xs text-gray-400">{hint}</p>}
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
    return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors
    focus:ring-2 focus:ring-blue-500
    ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"}`;
}
