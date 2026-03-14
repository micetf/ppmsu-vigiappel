import Section from "../ui/Section";

export default function TeacherNamesSection({
    classes,
    teacherByClass,
    corrections,
    onSet,
    onReset,
}) {
    return (
        <Section title="Enseignants par classe">
            <p className="text-sm text-gray-500">
                Corriger les noms issus du CSV si nécessaire (casse, prénom
                manquant, enseignant habituel différent…).
            </p>
            <div className="space-y-2 mt-2">
                {classes.map((cl) => {
                    const fromCSV = teacherByClass[cl] || "";
                    const corrected = corrections.teacherNames[cl] ?? fromCSV;
                    const isDirty = !!corrections.teacherNames[cl];
                    return (
                        <div
                            key={cl}
                            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5"
                        >
                            <span className="text-sm font-bold text-gray-700 w-16 shrink-0">
                                {cl}
                            </span>
                            <input
                                type="text"
                                placeholder={fromCSV || "Nom Prénom"}
                                value={corrected}
                                onChange={(e) =>
                                    e.target.value !== fromCSV
                                        ? onSet(cl, e.target.value)
                                        : onReset(cl)
                                }
                                className={`flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500
                                    ${
                                        isDirty
                                            ? "border-blue-400 bg-blue-50 font-semibold text-blue-900"
                                            : "border-gray-300 bg-white text-gray-700"
                                    }`}
                            />
                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={() => onReset(cl)}
                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                                    aria-label="Rétablir valeur CSV"
                                    title={`Rétablir : ${fromCSV}`}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
