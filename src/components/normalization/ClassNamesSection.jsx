import Section from "../ui/Section";

export default function ClassNamesSection({
    classes,
    corrections,
    onSet,
    onReset,
}) {
    return (
        <Section title="Noms des classes">
            <p className="text-sm text-gray-500">
                Corriger les noms tels qu'ils apparaissent dans le CSV. Laisser
                vide pour conserver le nom d'origine.
            </p>
            <div className="space-y-2 mt-2">
                {classes.map((original) => {
                    const corrected = corrections.classNames[original] ?? "";
                    const isDirty = !!corrections.classNames[original];
                    return (
                        <div
                            key={original}
                            className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5"
                        >
                            <span className="text-sm text-gray-400 w-40 shrink-0 truncate font-mono">
                                {original}
                            </span>
                            <span className="text-gray-300 shrink-0">→</span>
                            <input
                                type="text"
                                placeholder={original}
                                value={corrected}
                                onChange={(e) =>
                                    e.target.value
                                        ? onSet(original, e.target.value)
                                        : onReset(original)
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
                                    onClick={() => onReset(original)}
                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                                    aria-label="Annuler la correction"
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
