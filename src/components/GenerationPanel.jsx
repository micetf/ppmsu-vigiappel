import { useState } from "react";
import { generateAndDownload } from "../utils/docxGenerator";

export default function GenerationPanel({
    config,
    csvData,
    classes,
    totalStudents,
    onBack,
}) {
    const [status, setStatus] = useState("idle");
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const { configType, zones } = config;
    const multiZone = zones.length > 1;
    const docCount =
        configType === "A"
            ? 1
            : classes.length + (multiZone ? zones.length : 0) + 1;

    async function handleGenerate() {
        setStatus("generating");
        setError(null);
        try {
            const res = await generateAndDownload(config, csvData);
            setResult(res);
            setStatus("done");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
                Étape 4 – Génération des fiches DOCX
            </h2>

            {/* Récap */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-700 space-y-2.5">
                <Row label="École" value={config.schoolName} />
                <Row label="Responsable" value={config.responsible} />
                <Row
                    label="Format"
                    value={
                        configType === "A"
                            ? "Option A – Fiche unique"
                            : "Option B – Fiche par classe"
                    }
                />
                <Row
                    label="Élèves"
                    value={`${totalStudents} élèves — ${classes.length} classes`}
                />
                {zones.map((z, i) => (
                    <Row
                        key={z.id}
                        label={zones.length > 1 ? `Zone ${i + 1}` : "Zone"}
                        value={`${z.name} — ${z.responsible}`}
                    />
                ))}
                <div className="border-t border-gray-100 pt-2.5">
                    <Row
                        label="Fichiers"
                        value={`${docCount} document${docCount > 1 ? "s DOCX (ZIP)" : " DOCX"}`}
                    />
                </div>
            </div>

            {/* Actions */}
            {status === "idle" && (
                <button
                    onClick={handleGenerate}
                    className="px-8 py-3 bg-blue-800 text-white rounded-xl hover:bg-blue-900 font-semibold text-sm transition-colors shadow"
                >
                    📄 Générer et télécharger
                </button>
            )}

            {status === "generating" && (
                <div className="flex items-center gap-3 text-blue-700 text-sm animate-pulse">
                    <span>⏳</span> Génération en cours…
                </div>
            )}

            {status === "done" && (
                <div className="space-y-3">
                    <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-sm text-green-800 flex gap-3">
                        <span className="text-xl shrink-0">✅</span>
                        <div>
                            <p className="font-semibold">
                                {result.count} fichier
                                {result.count > 1 ? "s générés" : " généré"}{" "}
                                avec succès
                            </p>
                            <p className="text-green-700 mt-0.5">
                                {result.count > 1
                                    ? "Le fichier ZIP a été téléchargé — décompressez-le pour accéder aux fiches."
                                    : "Le fichier DOCX a été téléchargé."}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        className="text-sm text-blue-700 hover:underline"
                    >
                        ↺ Télécharger à nouveau
                    </button>
                </div>
            )}

            {status === "error" && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-sm text-red-700 flex gap-3">
                    <span>⚠️</span>
                    <div>
                        <p className="font-semibold">
                            Erreur lors de la génération
                        </p>
                        <p className="mt-0.5 font-mono text-xs">{error}</p>
                    </div>
                </div>
            )}

            <button
                onClick={onBack}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
                ← Modifier la configuration
            </button>
        </div>
    );
}

function Row({ label, value }) {
    return (
        <div className="flex gap-4">
            <span className="w-40 text-gray-400 shrink-0">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}
