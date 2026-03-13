import { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { generateAll, slug } from "../utils/docxGenerator";

export default function GenerationPanel({
    config,
    csvData,
    classes,
    totalStudents,
    onBack,
}) {
    const [files, setFiles] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zipping, setZipping] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        generateAll(config, csvData)
            .then((result) => {
                if (!cancelled) {
                    setFiles(result);
                    setLoading(false);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setError(e.message || "Erreur.");
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleDownloadOne = (file) => saveAs(file.blob, file.name);

    const handleDownloadAll = async () => {
        setZipping(true);
        const zip = new JSZip();
        files.forEach((f) => zip.file(f.name, f.blob));
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `PPMS_${slug(config.schoolName)}.zip`);
        setZipping(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 4 – Téléchargement des fiches
                </h2>
                <p className="text-sm text-gray-500">
                    {totalStudents} élève{totalStudents > 1 ? "s" : ""} —{" "}
                    {classes.length} classe{classes.length > 1 ? "s" : ""} —{" "}
                    {config.zones.length} zone
                    {config.zones.length > 1 ? "s" : ""}
                </p>
            </div>

            {/* État : chargement */}
            {loading && (
                <div className="flex items-center gap-3 text-sm text-gray-500 py-8 justify-center">
                    <svg
                        className="animate-spin w-5 h-5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                        />
                    </svg>
                    Génération des documents en cours…
                </div>
            )}

            {/* État : erreur */}
            {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 text-sm">
                    ⚠️ {error}
                </div>
            )}

            {/* État : fichiers prêts */}
            {files && (
                <div className="space-y-4">
                    <p className="text-sm font-medium text-gray-700">
                        {files.length} document{files.length > 1 ? "s" : ""}{" "}
                        prêt{files.length > 1 ? "s" : ""}
                    </p>

                    {/* Cartes de téléchargement */}
                    <div className="space-y-3">
                        {files.map((file) => (
                            <div
                                key={file.name}
                                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-5 py-4 gap-4 hover:border-blue-300 transition-colors"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className="text-2xl shrink-0">
                                        {file.label.startsWith("Mallette")
                                            ? "📁"
                                            : "📋"}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                            {file.label}
                                        </p>
                                        {file.description && (
                                            <p className="text-xs text-gray-500">
                                                {file.description}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                                            {file.name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDownloadOne(file)}
                                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-800 text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-colors"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    Télécharger
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Option secondaire : tout en ZIP */}
                    {files.length > 1 && (
                        <div className="pt-2 border-t border-gray-100 flex justify-end">
                            <button
                                type="button"
                                onClick={handleDownloadAll}
                                disabled={zipping}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                {zipping
                                    ? "Compression…"
                                    : "Tout télécharger en ZIP"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    ← Modifier la configuration
                </button>
            </div>
        </div>
    );
}
