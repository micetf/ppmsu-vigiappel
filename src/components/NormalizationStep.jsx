import StepHelp from "./StepHelp";
import ClassNamesSection from "./normalization/ClassNamesSection";
import TeacherNamesSection from "./normalization/TeacherNamesSection";
import StaffPreFillSection from "./normalization/StaffPreFillSection";
import { useNormalization } from "../hooks/useNormalization";
import { applyCorrections } from "../utils/normalization";

export default function NormalizationStep({ csvData, onConfirm, onBack }) {
    const norm = useNormalization();
    const { corrections } = norm;

    // Prévisualisation en temps réel des noms normalisés
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
                        <strong>📝 Noms des classes</strong> — Corriger les
                        libellés du CSV ("Cours Préparatoire" → "CP").
                    </p>
                    <p>
                        <strong>👩‍🏫 Enseignants</strong> — Ajuster les noms si le
                        CSV contient des valeurs incomplètes ou erronées.
                    </p>
                    <p>
                        <strong>👥 Adultes complémentaires</strong> — Déclarer
                        AESH, ATSEM, co-titulaires, intervenants réguliers… Ils
                        pré-rempliront la configuration PPMS.
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

            <ClassNamesSection
                classes={csvData.classes}
                corrections={corrections}
                onSet={norm.setClassName}
                onReset={norm.resetClassName}
            />

            <TeacherNamesSection
                classes={preview.classes}
                teacherByClass={preview.teacherByClass}
                corrections={corrections}
                onSet={norm.setTeacherName}
                onReset={norm.resetTeacherName}
            />

            <StaffPreFillSection
                classes={preview.classes}
                staff={corrections.staff}
                classExtraTeachers={corrections.classExtraTeachers}
                onAddStaff={norm.addStaff}
                onUpdateStaff={norm.updateStaff}
                onRemoveStaff={norm.removeStaff}
                onAddExtra={norm.addExtraTeacher}
                onUpdateExtra={norm.updateExtraTeacher}
                onRemoveExtra={norm.removeExtraTeacher}
            />

            {/* ── Barre sticky ──────────────────────────────────── */}
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
