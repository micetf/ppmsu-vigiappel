import StepHelp from "./StepHelp";
import ClassNamesSection from "./normalization/ClassNamesSection";
import TeacherNamesSection from "./normalization/TeacherNamesSection";
import ExtraTeachersSection from "./config-form/ExtraTeachersSection";
import OtherAdultsSection from "./normalization/OtherAdultsSection";
import { applyCorrections } from "../utils/normalization";

export default function NormalizationStep({
    csvData,
    norm,
    onConfirm,
    onBack,
}) {
    const { corrections } = norm;
    const preview = applyCorrections(csvData, corrections);

    const dirtyCount =
        Object.keys(corrections.classNames).length +
        Object.keys(corrections.teacherNames).length +
        corrections.staff.length +
        Object.values(corrections.classExtraTeachers).reduce(
            (acc, arr) => acc + arr.length,
            0
        );

    return (
        <div className="space-y-8 pb-28">
            <StepHelp
                stepKey="step_normalization"
                title="À quoi sert cette étape ?"
            >
                <div className="pt-3 space-y-2 text-sm">
                    <p>
                        <strong>1. Noms des classes</strong> — Corriger les
                        libellés du CSV si nécessaire.
                    </p>
                    <p>
                        <strong>2. Enseignants</strong> — Séparer et corriger
                        nom et prénom.
                    </p>
                    <p>
                        <strong>3. Co-enseignants / décharges</strong> —
                        Déclarer les adultes qui partagent une classe.
                    </p>
                    <p>
                        <strong>4. Autres adultes</strong> — AESH, ATSEM, Maître
                        E, intervenants réguliers…
                    </p>
                </div>
            </StepHelp>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 3 – Normalisation des données
                </h2>
                <p className="text-sm text-gray-500">
                    {preview.classes.length} classe
                    {preview.classes.length > 1 ? "s" : ""} ·{" "}
                    {csvData.totalStudents} élève
                    {csvData.totalStudents > 1 ? "s" : ""}
                    {dirtyCount > 0 && (
                        <span className="ml-2 text-blue-700 font-medium">
                            · {dirtyCount} correction{dirtyCount > 1 ? "s" : ""}
                        </span>
                    )}
                </p>
            </div>

            {/* 1 — Noms des classes */}
            <ClassNamesSection
                classes={csvData.classes}
                corrections={corrections}
                onSet={norm.setClassName}
                onReset={norm.resetClassName}
            />

            {/* 2 — Enseignants */}
            <TeacherNamesSection
                classes={preview.classes}
                rawTeacherByClass={preview.rawTeacherByClass}
                corrections={corrections}
                onSetField={norm.setTeacherField}
                onReset={norm.resetTeacherName}
                onSwap={norm.swapTeacher}
            />

            {/* 3 — Co-enseignants et décharges */}
            <ExtraTeachersSection
                classes={preview.classes}
                classExtraTeachers={corrections.classExtraTeachers}
                onAdd={norm.addExtraTeacher}
                onUpdate={norm.updateExtraTeacher}
                onRemove={norm.removeExtraTeacher}
            />

            {/* 4 — Autres adultes */}
            <OtherAdultsSection
                classes={preview.classes}
                staff={corrections.staff}
                onAdd={norm.addStaff}
                onUpdate={norm.updateStaff}
                onRemove={norm.removeStaff}
            />

            {/* Barre sticky */}
            <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        ← Retour à l'aperçu
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(corrections, preview)}
                        className="px-6 py-2 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors"
                    >
                        Valider et configurer →
                    </button>
                </div>
            </div>
        </div>
    );
}
