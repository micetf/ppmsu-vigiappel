import { useState } from "react";
import StepIndicator from "./components/StepIndicator";
import FileUpload from "./components/FileUpload";
import DataPreview from "./components/DataPreview";

export default function App() {
    const [step, setStep] = useState(1);
    const [csvResult, setCsvResult] = useState(null);

    function handleParsed(result) {
        setCsvResult(result);
        setStep(2);
    }

    function handleReset() {
        setCsvResult(null);
        setStep(1);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
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

            {/* Main */}
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
                {step === 3 && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-4xl mb-4">🚧</p>
                        <p>Configuration — Sprint 2</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200">
                VigiAppel — Traitement 100 % local | Conforme RGPD | Modèle
                Eduscol PPMS 2024
            </footer>
        </div>
    );
}
