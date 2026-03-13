import { useState } from "react";
import StepIndicator from "./components/StepIndicator";
import FileUpload from "./components/FileUpload";
import DataPreview from "./components/DataPreview";
import ConfigForm from "./components/ConfigForm";
import { useCSVData } from "./hooks/useCSVData";

export default function App() {
    const [step, setStep] = useState(1);
    const [csvResult, setCsvResult] = useState(null);
    const [config, setConfig] = useState(null);

    const { classes } = useCSVData(csvResult);

    function handleParsed(result) {
        setCsvResult(result);
        setStep(2);
    }
    function handleReset() {
        setCsvResult(null);
        setConfig(null);
        setStep(1);
    }
    function handleConfig(cfg) {
        setConfig(cfg);
        setStep(4);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-blue-800 text-white py-4 px-6 shadow-md">
                <div className="max-w-4xl mx-auto flex items-baseline gap-3">
                    <h1 className="text-xl font-bold tracking-tight">
                        VigiAppel
                    </h1>
                    <span className="text-blue-300 text-sm">
                        Générateur de fiches PPMS
                    </span>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-6">
                <StepIndicator current={step} />
                {step === 1 && <FileUpload onParsed={handleParsed} />}
                {step === 2 && csvResult && (
                    <DataPreview
                        result={csvResult}
                        onReset={handleReset}
                        onNext={() => setStep(3)}
                    />
                )}
                {step === 3 && csvResult && (
                    <ConfigForm
                        classes={classes}
                        onSubmit={handleConfig}
                        onBack={() => setStep(2)}
                    />
                )}
                {step === 4 && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-4xl mb-4">🚧</p>
                        <p>Aperçu & Export DOCX — Sprint 3</p>
                    </div>
                )}
            </main>

            <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200">
                VigiAppel — Traitement 100 % local | Conforme RGPD | Modèle
                Eduscol PPMS 2024
            </footer>
        </div>
    );
}
