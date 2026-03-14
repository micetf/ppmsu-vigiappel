import Section from "../ui/Section";

export default function ExtraTeachersSection({
    classes,
    classExtraTeachers,
    onAdd,
    onUpdate,
    onRemove,
}) {
    const extrasCount = Object.values(classExtraTeachers).reduce(
        (acc, arr) => acc + (arr?.filter((et) => et.nom.trim()).length || 0),
        0
    );

    return (
        <Section title="Co-enseignants et décharges">
            <p className="text-sm text-gray-500">
                Pour chaque classe concernée, ajouter les adultes qui
                co-encadrent régulièrement : mi-temps, décharge, co-titulaire,
                remplaçant(e) habituel(le).
            </p>

            <div className="mt-3 space-y-2">
                {classes.map((cl) => {
                    const extras = classExtraTeachers[cl] || [];
                    return (
                        <div
                            key={cl}
                            className="bg-white border border-gray-200 rounded-xl p-3 space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                    {cl}
                                </span>
                                {extrasCount > 0 && extras.length > 0 && (
                                    <span className="text-xs text-blue-700 font-medium">
                                        {extras.length} ajouté
                                        {extras.length > 1 ? "s" : ""}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onAdd(cl)}
                                    className="text-xs text-blue-700 hover:text-blue-900 transition-colors"
                                >
                                    ＋ Ajouter
                                </button>
                            </div>

                            {extras.map((et, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end bg-gray-50 rounded-lg p-2"
                                >
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            NOM
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="BERNARD"
                                            value={et.nom}
                                            onChange={(e) =>
                                                onUpdate(
                                                    cl,
                                                    idx,
                                                    "nom",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Prénom
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Claire"
                                            value={et.prenom}
                                            onChange={(e) =>
                                                onUpdate(
                                                    cl,
                                                    idx,
                                                    "prenom",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Rôle
                                        </label>
                                        <select
                                            value={et.fonction}
                                            onChange={(e) =>
                                                onUpdate(
                                                    cl,
                                                    idx,
                                                    "fonction",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {[
                                                "Décharge",
                                                "Mi-temps",
                                                "Co-titulaire",
                                                "Remplaçant(e) habituel(le)",
                                            ].map((f) => (
                                                <option key={f} value={f}>
                                                    {f}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(cl, idx)}
                                        className="text-xs text-red-400 hover:text-red-600 pb-1 transition-colors"
                                        aria-label="Supprimer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
