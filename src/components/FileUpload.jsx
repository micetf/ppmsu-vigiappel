import { useRef, useState } from "react";
import { parseCSV } from "../utils/csvParser";

export default function FileUpload({ onParsed }) {
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    async function handleFile(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".csv")) {
            setError("Seuls les fichiers .csv sont acceptés.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const result = await parseCSV(file);
            onParsed(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function onDrop(e) {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    }

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 1 – Importer la liste d'élèves
                </h2>
                <p className="text-sm text-gray-500">
                    Colonnes attendues :{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                        Classe ou regroupement ; Enseignant(s) ; Nom ; Prénom ;
                        Né(e) le ; Sexe ; Niveau
                    </code>
                </p>
            </div>

            {/* Zone drag & drop */}
            <div
                role="button"
                tabIndex={0}
                aria-label="Zone de dépôt de fichier CSV"
                className={`border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition-colors outline-none
          focus-visible:ring-2 focus-visible:ring-blue-500
          ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50"}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) =>
                    e.key === "Enter" && inputRef.current?.click()
                }
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                />
                <div className="text-5xl mb-3" aria-hidden>
                    📂
                </div>
                {loading ? (
                    <p className="text-blue-700 font-medium animate-pulse">
                        Analyse du fichier…
                    </p>
                ) : (
                    <>
                        <p className="font-medium text-gray-700">
                            Glisser-déposer le fichier CSV ici
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            ou cliquer pour sélectionner
                        </p>
                    </>
                )}
            </div>

            {/* Erreur */}
            {error && (
                <div
                    role="alert"
                    className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 text-sm flex gap-2"
                >
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Mention RGPD */}
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span>🔒</span>
                Vos données ne quittent jamais votre navigateur — traitement 100
                % local, aucun serveur.
            </p>
        </div>
    );
}
