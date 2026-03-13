import { useMemo } from "react";
import { groupByClass } from "../utils/csvParser";

const PREVIEW_LIMIT = 20;
const VISIBLE_COLS = [
    "Classe ou regroupement",
    "Nom",
    "Prénom",
    "Enseignant(s)",
    "Niveau",
];

export default function DataPreview({ result, onReset, onNext }) {
    const { data, fields, totalRows } = result;
    const byClass = useMemo(() => groupByClass(data), [data]);
    const classes = Object.keys(byClass).sort();
    const cols = VISIBLE_COLS.filter((c) => fields.includes(c));

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
                Étape 2 – Vérification des données importées
            </h2>

            {/* Compteurs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Élèves total" value={totalRows} large />
                <StatCard label="Classes" value={classes.length} large />
                {classes.map((cl) => (
                    <StatCard
                        key={cl}
                        label={cl}
                        value={`${byClass[cl].length} élève${byClass[cl].length > 1 ? "s" : ""}`}
                    />
                ))}
            </div>

            {/* Aperçu tableau */}
            <div>
                <p className="text-sm text-gray-400 mb-2">
                    {totalRows > PREVIEW_LIMIT
                        ? `Aperçu des ${PREVIEW_LIMIT} premières lignes sur ${totalRows}`
                        : `${totalRows} élève${totalRows > 1 ? "s" : ""} importé${totalRows > 1 ? "s" : ""}`}
                </p>
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className="bg-blue-800 text-white">
                            <tr>
                                {cols.map((col) => (
                                    <th
                                        key={col}
                                        className="px-3 py-2 text-left font-medium whitespace-nowrap"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, PREVIEW_LIMIT).map((row, i) => (
                                <tr
                                    key={i}
                                    className={
                                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                    }
                                >
                                    {cols.map((col) => (
                                        <td
                                            key={col}
                                            className="px-3 py-1.5 text-gray-700"
                                        >
                                            {row[col] || "—"}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={onReset}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    ← Réimporter un fichier
                </button>
                <button
                    onClick={onNext}
                    className="px-6 py-2 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors"
                >
                    Continuer vers la configuration →
                </button>
            </div>
        </div>
    );
}

function StatCard({ label, value, large }) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div
                className={`font-bold text-blue-800 ${large ? "text-2xl" : "text-base"}`}
            >
                {value}
            </div>
            <div
                className="text-xs text-gray-500 mt-0.5 truncate"
                title={label}
            >
                {label}
            </div>
        </div>
    );
}
