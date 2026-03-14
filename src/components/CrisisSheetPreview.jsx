export default function CrisisSheetPreview({ sheet }) {
    const {
        schoolName,
        crisisAdult,
        zoneResponsibles,
        totalClasses,
        blankRows,
        configType,
    } = sheet;

    return (
        <div className="sheet bg-white border border-gray-300 rounded-xl p-8 max-w-2xl mx-auto shadow-sm font-sans text-sm print:shadow-none print:border-none print:rounded-none print:max-w-none">
            {/* En-tête */}
            <div className="flex items-start justify-between border-b-2 border-red-700 pb-3 mb-5">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                        PPMS — Cellule de crise · Type {configType}
                    </p>
                    <h1 className="text-xl font-bold text-red-800 mt-0.5">
                        Fiche de crise
                    </h1>
                    <p className="text-sm text-gray-600">{schoolName || "—"}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Responsable cellule</p>
                    <p className="font-bold text-gray-800">{crisisAdult}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {totalClasses} classe{totalClasses > 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Zones */}
            <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Responsables de zone
                </h2>
                <div className="space-y-3">
                    {zoneResponsibles.map((z, i) => (
                        <div
                            key={i}
                            className="rounded-lg border border-gray-200 p-3 bg-gray-50"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        {z.zoneName || `Zone ${i + 1}`}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {z.adult} —{" "}
                                        <span className="italic">
                                            {z.adultType}
                                        </span>
                                    </p>
                                </div>
                                <div className="text-xs text-gray-500 text-right">
                                    {z.classes.join(", ") || "—"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Intervenants extérieurs */}
            <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Intervenants extérieurs / Secours
                </h2>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                                Nom / Organisme
                            </th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                                Téléphone
                            </th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                                Heure d'arrivée
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {Array.from({ length: blankRows + 2 }).map((_, i) => (
                            <tr key={i} className="text-gray-300">
                                <td className="px-3 py-2">
                                    ___________________________
                                </td>
                                <td className="px-3 py-2">_______________</td>
                                <td className="px-3 py-2">____________</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-400">
                <span>VigiAppel — PPMS {new Date().getFullYear()}</span>
                <span>Traitement local · Conforme RGPD</span>
            </div>
        </div>
    );
}
