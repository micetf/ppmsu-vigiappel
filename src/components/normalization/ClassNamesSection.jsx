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
                Les noms sont pré-remplis depuis le CSV. Modifier directement si
                nécessaire — la correction s'active dès que la valeur diffère de
                l'original.
            </p>
            <div className="space-y-2 mt-2">
                {classes.map((original) => {
                    const corrected =
                        corrections.classNames[original] ?? original;
                    const isDirty = !!corrections.classNames[original];

                    return (
                        <div key={original} className="space-y-0.5">
                            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
                                <input
                                    type="text"
                                    value={corrected}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === original || val === "") {
                                            onReset(original);
                                        } else {
                                            onSet(original, val);
                                        }
                                    }}
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
                                        aria-label="Rétablir le nom CSV"
                                        title={`Rétablir : ${original}`}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {isDirty && (
                                <p className="text-xs text-gray-400 pl-4">
                                    CSV :{" "}
                                    <span className="font-mono">
                                        {original}
                                    </span>
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
