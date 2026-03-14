import { useState } from "react";
import { createEmptyAdult, ADULT_TYPES } from "../utils/normalizeCSV";
import ClassesTable from "./ClassesTable";
import AdultCard from "./AdultCard";
import StepHelp from "./StepHelp";

export default function NormalizationStep({ initial, onSubmit, onBack }) {
    const [classes, setClasses] = useState(initial.classes);
    const [adults, setAdults] = useState(initial.adults);

    // ── Classes ──────────────────────────────────────────────────────
    const updateClass = (id, field, value) =>
        setClasses((prev) =>
            prev.map((cl) => (cl.id === id ? { ...cl, [field]: value } : cl))
        );

    // ── Adults ───────────────────────────────────────────────────────
    const addAdult = () => setAdults((prev) => [...prev, createEmptyAdult()]);

    const updateAdult = (id, field, value) =>
        setAdults((prev) =>
            prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
        );

    const removeAdult = (id) => {
        // Détacher la classe si cet adulte était enseignant principal
        setClasses((prev) =>
            prev.map((cl) =>
                cl.teacherId === id ? { ...cl, teacherId: null } : cl
            )
        );
        setAdults((prev) => prev.filter((a) => a.id !== id));
    };

    // ── Validation légère ────────────────────────────────────────────
    const issues = [
        ...classes
            .filter((cl) => !cl.displayName.trim())
            .map((cl) => `Classe "${cl.csvKey}" : nom d'affichage vide.`),
        ...adults
            .filter((a) => !a.nom.trim())
            .map((a) => `Un adulte (id ${a.id}) n'a pas de nom.`),
    ];

    const handleSubmit = () => {
        if (issues.length > 0) return;
        // Synchroniser teacherId → defaultClassId des enseignants
        const syncedAdults = adults.map((a) => {
            if (a.type !== "teacher") return a;
            const linked = classes.find((cl) => cl.teacherId === a.id);
            return { ...a, defaultClassId: linked?.id ?? a.defaultClassId };
        });
        onSubmit({ classes, adults: syncedAdults });
    };

    // ── Dérivés ───────────────────────────────────────────────────────
    const teachers = adults.filter((a) => a.type === "teacher");
    const nonTeachers = adults.filter((a) => a.type !== "teacher");

    const classOptions = [
        { value: "", label: "— Établissement (sans classe) —" },
        ...classes.map((cl) => ({
            value: cl.id,
            label: cl.displayName || cl.csvKey,
        })),
    ];

    const teacherOptions = [
        { value: "", label: "— Non renseigné —" },
        ...teachers.map((a) => ({
            value: a.id,
            label: [a.nom, a.prenom].filter(Boolean).join(" "),
        })),
    ];

    const totalAdults = adults.length;
    const totalIssues = issues.length;

    return (
        <div className="space-y-8 pb-24">
            <StepHelp stepKey="step2" title="Comment normaliser les données ?">
                <div className="pt-3 space-y-2 text-sm">
                    <p>
                        <strong>📋 Classes</strong> — Vérifier le nom affiché et
                        l'enseignant(e) principal(e). Si le CSV contenait
                        plusieurs noms dans un même champ, corriger ici.
                    </p>
                    <p>
                        <strong>👥 Adultes</strong> — Tous les adultes doivent
                        être déclarés ici : AESH, ATSEM, RASED, entretien,
                        service civique… Les enseignants sont déjà importés
                        depuis le CSV.
                    </p>
                    <p>
                        Le rattachement par défaut peut être modifié à l'étape
                        suivante si nécessaire.
                    </p>
                </div>
            </StepHelp>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 2 – Vérification et saisie des adultes
                </h2>
                <p className="text-sm text-gray-500">
                    {classes.length} classe{classes.length > 1 ? "s" : ""} ·{" "}
                    {totalAdults} adulte{totalAdults > 1 ? "s" : ""}
                </p>
            </div>

            {/* ── A. Classes ─────────────────────────────────────────── */}
            <Section title="Classes et enseignants">
                <ClassesTable
                    classes={classes}
                    teacherOptions={teacherOptions}
                    onUpdate={updateClass}
                />
            </Section>

            {/* ── B. Enseignants ──────────────────────────────────────── */}
            <Section title={`Enseignants (${teachers.length})`}>
                <p className="text-sm text-gray-500 -mt-2">
                    Importés depuis le CSV. Corriger les noms si nécessaire.
                </p>
                <div className="space-y-2">
                    {teachers.map((a) => (
                        <AdultCard
                            key={a.id}
                            adult={a}
                            classOptions={classOptions}
                            typeOptions={ADULT_TYPES}
                            onUpdate={updateAdult}
                            onRemove={a.fromCSV ? null : removeAdult} // enseignants CSV non supprimables
                            locked={a.fromCSV}
                        />
                    ))}
                </div>
            </Section>

            {/* ── C. Autres adultes ───────────────────────────────────── */}
            <Section title={`Autres adultes (${nonTeachers.length})`}>
                <div className="space-y-2">
                    {nonTeachers.length === 0 && (
                        <p className="text-sm text-gray-400 italic">
                            Aucun adulte ajouté — utiliser le bouton ci-dessous.
                        </p>
                    )}
                    {nonTeachers.map((a) => (
                        <AdultCard
                            key={a.id}
                            adult={a}
                            classOptions={classOptions}
                            typeOptions={ADULT_TYPES.filter(
                                (t) => t.value !== "teacher"
                            )}
                            onUpdate={updateAdult}
                            onRemove={removeAdult}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addAdult}
                    className="mt-2 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                >
                    <span className="text-lg leading-none">＋</span> Ajouter un
                    adulte
                </button>
            </Section>

            {/* ── Erreurs ─────────────────────────────────────────────── */}
            {totalIssues > 0 && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 space-y-1">
                    <p className="text-sm font-semibold text-red-700">
                        {totalIssues} problème{totalIssues > 1 ? "s" : ""} à
                        corriger avant de continuer
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                        {issues.map((issue, i) => (
                            <li key={i} className="text-xs text-red-600">
                                {issue}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Barre sticky ────────────────────────────────────────── */}
            <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        ← Retour à l'aperçu
                    </button>
                    <div className="flex items-center gap-3">
                        {totalIssues === 0 && (
                            <p className="text-xs text-green-700 font-medium">
                                ✓ {totalAdults} adulte
                                {totalAdults > 1 ? "s" : ""} · {classes.length}{" "}
                                classe{classes.length > 1 ? "s" : ""}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={totalIssues > 0}
                            className="px-6 py-2 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Configurer les fiches →
                        </button>
                    </div>
                </div>
            </div>
        </div>
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
