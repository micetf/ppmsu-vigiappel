import { useRef, useState } from "react";
import { parseCSV } from "../utils/csvParser";
import StepHelp from "./StepHelp";

export default function FileUpload({ onParsed }) {
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileStatuses, setFileStatuses] = useState([]); // ← nouveau
    const inputRef = useRef(null);

    async function handleFiles(fileList) {
        const files = Array.from(fileList).filter((f) =>
            f.name.toLowerCase().endsWith(".csv")
        );
        if (files.length === 0) {
            setError("Aucun fichier .csv détecté.");
            return;
        }
        setError(null);
        setLoading(true);
        setFileStatuses([]);

        const results = [];
        const statuses = [];

        for (const file of files) {
            try {
                const result = await parseCSV(file);
                results.push(result);
                statuses.push({
                    name: file.name,
                    rows: result.totalRows,
                    ok: true,
                });
            } catch (err) {
                statuses.push({
                    name: file.name,
                    rows: 0,
                    ok: false,
                    error: err.message,
                });
            }
        }

        setFileStatuses(statuses);
        setLoading(false);

        const hasErrors = statuses.some((s) => !s.ok);
        if (hasErrors && results.length === 0) {
            setError("Aucun fichier valide importé.");
            return;
        }

        // Fusion de tous les datasets en un seul
        const merged = results.flatMap((r) => r.data);
        // Récupère l'union de tous les champs (en conservant l'ordre de référence)
        const fields = [...new Set(results.flatMap((r) => r.fields))];

        onParsed({ data: merged, fields, totalRows: merged.length });
    }

    function onDrop(e) {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    }

    return (
        <div className="space-y-5">
            <StepHelp stepKey="step1" title="Comment importer ma liste d'élèves ?">
  <p className="pt-3 font-medium text-blue-800">Ce dont vous avez besoin :</p>
  <ul className="space-y-1 mt-1">
    <li>📄 Un fichier CSV exporté depuis <strong>ONDE</strong> (Base élèves)</li>
    <li>🔤 Colonnes attendues : <code className="bg-blue-100 px-1 rounded text-xs">Classe · Enseignant(s) · Nom · Prénom · Né(e) le · Sexe · Niveau</code></li>
  </ul>
  <p className="font-medium text-blue-800 mt-3">Comment exporter depuis ONDE :</p>
  <ol className="space-y-1 mt-1 list-decimal list-inside">
    <li>Aller dans <strong>ONDE → Exports → Liste des élèves</strong></li>
    <li>Sélectionner toutes les classes</li>
    <li>Cliquer sur <strong>Exporter en CSV</strong></li>
    <li>Importer le fichier téléchargé ici</li>
  </ol>
  <p className="text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2 mt-2">
    🔒 Vos données ne quittent pas votre ordinateur. Aucun fichier n'est envoyé sur internet.
  </p>
</StepHelp>
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 1 – Importer la liste d'élèves
                </h2>
                <p className="text-sm text-gray-500">
                    Un seul CSV (export école complet){" "}
                    <span className="text-gray-400">ou</span> plusieurs CSV
                    classe par classe — les deux sont supportés.
                </p>
            </div>

            <div
                role="button"
                tabIndex={0}
                aria-label="Zone de dépôt de fichiers CSV"
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
                    multiple // ← seul ajout ici
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="text-5xl mb-3" aria-hidden>
                    📂
                </div>
                {loading ? (
                    <p className="text-blue-700 font-medium animate-pulse">
                        Analyse des fichiers…
                    </p>
                ) : (
                    <>
                        <p className="font-medium text-gray-700">
                            Glisser-déposer un ou plusieurs fichiers CSV
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            ou cliquer pour sélectionner
                        </p>
                    </>
                )}
            </div>

            {/* Statut par fichier */}
            {fileStatuses.length > 0 && (
                <ul className="space-y-1.5">
                    {fileStatuses.map((s, i) => (
                        <li
                            key={i}
                            className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2
              ${s.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                        >
                            <span>{s.ok ? "✅" : "⚠️"}</span>
                            <span className="font-medium truncate">
                                {s.name}
                            </span>
                            {s.ok ? (
                                <span className="ml-auto text-green-600">
                                    {s.rows} élève{s.rows > 1 ? "s" : ""}
                                </span>
                            ) : (
                                <span className="ml-auto text-red-500">
                                    {s.error}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {error && (
                <div
                    role="alert"
                    className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 text-sm flex gap-2"
                >
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <span>🔒</span>
                Vos données ne quittent jamais votre navigateur — traitement 100
                % local, aucun serveur.
            </p>
        </div>
    );
}
