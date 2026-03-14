import { useMemo, useState } from "react";
import { buildAllSheets } from "../utils/buildSheets";
import CrisisSheetPreview from "./CrisisSheetPreview";
import ClassSheetPreview from "./ClassSheetPreview";

export default function GenerationPanel({
    config,
    csvData,
    classes,
    adults,
    totalStudents,
    onBack,
}) {
    const sheets = useMemo(
        () => buildAllSheets(config, adults, classes, csvData),
        [config, adults, classes, csvData]
    );

    const [activeIdx, setActiveIdx] = useState(0);
    const active = sheets[activeIdx];

    const handlePrint = () => window.print();

    return (
        <div className="space-y-6 pb-12">
            {/* ── En-tête ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        Étape 5 — Fiches PPMS générées
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {sheets.length} fiche{sheets.length > 1 ? "s" : ""} ·{" "}
                        {classes.length} classe{classes.length > 1 ? "s" : ""} ·{" "}
                        {totalStudents} élève{totalStudents > 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        ← Modifier
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-5 py-2 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors print:hidden"
                    >
                        🖨 Imprimer / PDF
                    </button>
                </div>
            </div>

            {/* ── Onglets de navigation ─────────────────────────────── */}
            <div className="flex flex-wrap gap-1 print:hidden">
                {sheets.map((s, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setActiveIdx(i)}
                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
              ${
                  i === activeIdx
                      ? "bg-blue-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
                    >
                        {s.type === "crisis"
                            ? "🔵 Cellule de crise"
                            : `📋 ${s.displayName}`}
                    </button>
                ))}
            </div>

            {/* ── Aperçu de la fiche active ─────────────────────────── */}
            <div className="sheet-preview-container">
                {active?.type === "crisis" ? (
                    <CrisisSheetPreview sheet={active} />
                ) : (
                    <ClassSheetPreview sheet={active} />
                )}
            </div>

            {/* ── Zone d'impression : toutes les fiches ─────────────── */}
            <div className="hidden print:block">
                {sheets.map((s, i) => (
                    <div key={i} className="print-page">
                        {s.type === "crisis" ? (
                            <CrisisSheetPreview sheet={s} />
                        ) : (
                            <ClassSheetPreview sheet={s} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
