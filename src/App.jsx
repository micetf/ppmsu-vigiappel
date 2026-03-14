import { useState, useMemo } from "react";
import Navbar from "./components/Navbar";
import StepIndicator from "./components/StepIndicator";
import FileUpload from "./components/FileUpload";
import DataPreview from "./components/DataPreview";
import NormalizationStep from "./components/NormalizationStep";
import ConfigForm from "./components/ConfigForm";
import GenerationPanel from "./components/GenerationPanel";
import { useCSVData } from "./hooks/useCSVData";
import { normalizeFromCSV } from "./utils/normalizeCSV";
import { createDefaultConfig } from "./utils/configHelpers";

export default function App() {
    const [step, setStep] = useState(1);
    const [csvResult, setCsvResult] = useState(null);
    const [normalized, setNormalized] = useState(null); // { classes, adults }
    const [config, setConfig] = useState(null);

    const csvData = useCSVData(csvResult);
    const { totalStudents } = csvData;

    // Mémoïsé : recalculé uniquement quand csvResult change
    const initialNormalized = useMemo(
        () => (csvResult ? normalizeFromCSV(csvData) : null),
        [csvResult] // csvData est stable si useCSVData mémoïse son résultat
    );

    // ── Handlers ────────────────────────────────────────────────────
    const handleParsed = (result) => {
        setCsvResult(result);
        setStep(2);
    };

    const handleReset = () => {
        setCsvResult(null);
        setNormalized(null);
        setConfig(null);
        setStep(1);
    };

    const handleNormalizationDone = (data) => {
        setNormalized(data);
        setStep(4);
    };

    const handleConfig = (cfg) => {
        setConfig(cfg);
        setStep(5);
    };

    function handleGoTo(n) {
        if (n === 1) handleReset();
        else setStep(n);
    }

    // ── Rendu ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <h1 className="sr-only">VigiAppel — Générateur de fiches PPMS</h1>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6">
                <StepIndicator current={step} onGoTo={handleGoTo} />

                {/* Étape 1 — Import CSV */}
                {step === 1 && <FileUpload onParsed={handleParsed} />}

                {/* Étape 2 — Aperçu CSV */}
                {step === 2 && csvResult && (
                    <DataPreview
                        result={csvResult}
                        onReset={handleReset}
                        onNext={() => setStep(3)}
                    />
                )}

                {/* Étape 3 — Normalisation adultes / classes ← NOUVEAU */}
                {step === 3 && initialNormalized && (
                    <NormalizationStep
                        initial={initialNormalized}
                        onSubmit={handleNormalizationDone}
                        onBack={() => setStep(2)}
                    />
                )}

                {/* Étape 4 — Configuration PPMS */}
                {step === 4 && normalized && (
                    <ConfigForm
                        classes={normalized.classes}
                        adults={normalized.adults}
                        initialConfig={createDefaultConfig(normalized.classes)}
                        onSubmit={handleConfig}
                        onBack={() => setStep(3)}
                    />
                )}

                {/* Étape 5 — Génération */}
                {step === 5 && config && normalized && (
                    <GenerationPanel
                        config={config}
                        csvData={csvData}
                        classes={normalized.classes}
                        adults={normalized.adults}
                        totalStudents={totalStudents}
                        onBack={() => setStep(4)}
                    />
                )}
            </main>

            <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200">
                VigiAppel — Traitement 100&nbsp;% local · Aucune donnée
                transmise · Conforme RGPD · Modèle Eduscol PPMS 2024
            </footer>
        </div>
    );
}
