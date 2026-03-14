export default function ClassesTable({ classes, teacherOptions, onUpdate }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-32">
                            Clé CSV
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Nom affiché
                        </th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Enseignant(e) principal(e)
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
                            {/* Clé CSV — immuable */}
                            <td className="px-4 py-2.5">
                                <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                    {cl.csvKey}
                                </span>
                            </td>

                            {/* Nom affiché — éditable */}
                            <td className="px-4 py-2.5">
                                <input
                                    type="text"
                                    value={cl.displayName}
                                    onChange={(e) =>
                                        onUpdate(
                                            cl.id,
                                            "displayName",
                                            e.target.value
                                        )
                                    }
                                    className={`w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors
                    ${
                        !cl.displayName.trim()
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 hover:border-gray-400"
                    }`}
                                />
                            </td>

                            {/* Enseignant principal — select parmi adults[type=teacher] */}
                            <td className="px-4 py-2.5">
                                <select
                                    value={cl.teacherId || ""}
                                    onChange={(e) =>
                                        onUpdate(
                                            cl.id,
                                            "teacherId",
                                            e.target.value || null
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
                                >
                                    {teacherOptions.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
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
