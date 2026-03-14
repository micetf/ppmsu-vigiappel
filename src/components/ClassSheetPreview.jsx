export default function ClassSheetPreview({ sheet }) {
    const {
        schoolName,
        displayName,
        teacher,
        zoneName,
        students,
        supervisors,
        blankRows,
        configType,
    } = sheet;

    return (
        <div className="sheet bg-white border border-gray-300 rounded-xl p-8 max-w-2xl mx-auto shadow-sm font-sans text-sm print:shadow-none print:border-none print:rounded-none print:max-w-none">
            {/* En-tête */}
            <div className="flex items-start justify-between border-b-2 border-blue-800 pb-3 mb-5">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                        PPMS — Fiche classe · Type {configType}
                    </p>
                    <h1 className="text-xl font-bold text-blue-900 mt-0.5">
                        {displayName}
                    </h1>
                    {teacher && (
                        <p className="text-sm text-gray-600">{teacher}</p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">École</p>
                    <p className="font-semibold text-gray-700">
                        {schoolName || "—"}
                    </p>
                    <div className="mt-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 font-semibold">
                        Zone : {zoneName}
                    </div>
                </div>
            </div>

            {/* Adultes encadrants */}
            <div className="mb-5">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Adultes encadrants
                </h2>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                                Nom / Prénom
                            </th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                                Fonction
                            </th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                                Présent · Signature
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {supervisors.map((s, i) => (
                            <tr key={i}>
                                <td className="px-3 py-2 font-medium">
                                    {s.name}
                                </td>
                                <td className="px-3 py-2 text-gray-500">
                                    {s.type}
                                </td>
                                <td className="px-3 py-2 text-gray-300">
                                    ____________
                                </td>
                            </tr>
                        ))}
                        {Array.from({ length: blankRows }).map((_, i) => (
                            <tr key={`blank-${i}`} className="text-gray-300">
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

            {/* Liste des élèves */}
            <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Élèves ({students.length})
                </h2>
                <div className="columns-2 gap-4">
                    {students.map((s, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 py-0.5 break-inside-avoid"
                        >
                            <span className="w-5 h-5 rounded border border-gray-400 shrink-0 inline-block" />
                            <span className="text-sm">
                                <span className="font-medium">{s.nom}</span>
                                {s.prenom && (
                                    <span className="text-gray-600">
                                        {" "}
                                        {s.prenom}
                                    </span>
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pied de page */}
            <div className="mt-6 pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-400">
                <span>VigiAppel — PPMS {new Date().getFullYear()}</span>
                <span>Traitement local · Conforme RGPD</span>
            </div>
        </div>
    );
}
