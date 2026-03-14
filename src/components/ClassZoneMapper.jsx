export default function ClassZoneMapper({
    classes,
    zones,
    classZoneMap,
    onUpdate,
}) {
    if (zones.length === 0) {
        return (
            <p className="text-sm text-gray-400 italic">Aucune zone définie.</p>
        );
    }

    if (zones.length === 1) {
        return (
            <p className="text-sm text-gray-500 italic">
                Toutes les classes sont dans la zone unique{" "}
                <strong>{zones[0].displayName || zones[0].id}</strong>.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Classe
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Zone de mise en sûreté
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {classes.map((cl, i) => (
                        <tr
                            key={cl.id}
                            className={
                                i % 2 !== 0 ? "bg-gray-50/50" : "bg-white"
                            }
                        >
                            <td className="px-4 py-2.5 font-medium text-gray-700">
                                {cl.displayName || cl.csvKey}
                            </td>
                            <td className="px-4 py-2.5">
                                <select
                                    value={classZoneMap[cl.id] ?? ""}
                                    onChange={(e) =>
                                        onUpdate(cl.id, e.target.value)
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {zones.map((z) => (
                                        <option key={z.id} value={z.id}>
                                            {z.displayName || z.id}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
