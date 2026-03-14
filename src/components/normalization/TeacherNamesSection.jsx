import Section from "../ui/Section";
import { splitTeacherName } from "../../utils/normalization";

export default function TeacherNamesSection({
    classes,
    rawTeacherByClass, // clé = nom corrigé → chaîne brute CSV
    corrections,
    onSetField,
    onReset,
    onSwap,
}) {
    return (
        <Section title="Enseignants par classe">
            <p className="text-sm text-gray-500">
                Nom et prénom séparés automatiquement depuis le CSV (dernier mot
                = prénom). Corriger si nécessaire — ⇄ pour permuter.
            </p>
            <div className="space-y-2 mt-2">
                {classes.map((cl) => {
                    const rawFromCSV = rawTeacherByClass[cl] || "";
                    const autoSplit = splitTeacherName(rawFromCSV);
                    const override = corrections.teacherNames[cl];
                    const current = override ?? autoSplit;
                    const isDirty = !!override;
                    const nomDirty = isDirty && current.nom !== autoSplit.nom;
                    const prenomDirty =
                        isDirty && current.prenom !== autoSplit.prenom;
                    const prenomManquant =
                        !isDirty && !autoSplit.prenom && rawFromCSV;

                    return (
                        <div key={cl} className="space-y-0.5">
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                                {/* Label classe */}
                                <span className="text-sm font-bold text-gray-700 w-14 shrink-0">
                                    {cl}
                                </span>

                                {/* Champ NOM */}
                                <input
                                    type="text"
                                    aria-label={`NOM — ${cl}`}
                                    placeholder="NOM"
                                    value={current.nom}
                                    onChange={(e) =>
                                        onSetField(
                                            cl,
                                            "nom",
                                            e.target.value,
                                            autoSplit
                                        )
                                    }
                                    className={`w-36 rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500
                                        ${
                                            nomDirty
                                                ? "border-blue-400 bg-blue-50 font-semibold text-blue-900"
                                                : "border-gray-300 bg-white text-gray-700"
                                        }`}
                                />

                                {/* Champ Prénom */}
                                <input
                                    type="text"
                                    aria-label={`Prénom — ${cl}`}
                                    placeholder="Prénom"
                                    value={current.prenom}
                                    onChange={(e) =>
                                        onSetField(
                                            cl,
                                            "prenom",
                                            e.target.value,
                                            autoSplit
                                        )
                                    }
                                    className={`flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500
                                        ${
                                            prenomDirty
                                                ? "border-blue-400 bg-blue-50 font-semibold text-blue-900"
                                                : prenomManquant
                                                  ? "border-amber-300 bg-amber-50"
                                                  : "border-gray-300 bg-white text-gray-700"
                                        }`}
                                />

                                {/* Bouton permuter ⇄ */}
                                <button
                                    type="button"
                                    onClick={() => onSwap(cl, rawFromCSV)}
                                    className="shrink-0 text-sm text-gray-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                    aria-label="Permuter nom et prénom"
                                    title="Permuter nom et prénom"
                                >
                                    ⇄
                                </button>

                                {/* Annuler */}
                                {isDirty && (
                                    <button
                                        type="button"
                                        onClick={() => onReset(cl)}
                                        className="shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors"
                                        aria-label="Rétablir la valeur CSV"
                                        title={`Rétablir : ${rawFromCSV}`}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Référence CSV si modifié */}
                            {isDirty && rawFromCSV && (
                                <p className="text-xs text-gray-400 pl-4">
                                    CSV :{" "}
                                    <span className="font-mono">
                                        {rawFromCSV}
                                    </span>
                                </p>
                            )}

                            {/* Alerte douce si prénom non détecté */}
                            {prenomManquant && (
                                <p className="text-xs text-amber-500 pl-4">
                                    ⚠️ Prénom non détecté — saisir si connu
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
