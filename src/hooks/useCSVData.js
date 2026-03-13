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

    const { classes, totalStudents } = useCSVData(csvResult);

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
                {step === 4 && config && (
                    <GenerationSummary
                        config={config}
                        classes={classes}
                        totalStudents={totalStudents}
                        onBack={() => setStep(3)}
                    />
                )}
            </main>

            <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200">
                VigiAppel — Traitement 100 % local | Conforme RGPD | Modèle
                Eduscol PPMS 2024
            </footer>
        </div>
    );
}

// Placeholder Sprint 3 — affiche le récap de ce qui sera généré
function GenerationSummary({ config, classes, totalStudents, onBack }) {
    const docCount = config.configType === "A" ? 1 : classes.length + 1;

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
                Étape 4 – Génération des fiches DOCX
            </h2>

            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 text-sm text-gray-700">
                <Row label="École" value={config.schoolName} />
                <Row label="Zone de confinement" value={config.zone} />
                <Row label="Responsable" value={config.responsible} />
                <Row
                    label="Format"
                    value={
                        config.configType === "A"
                            ? "Option A – Fiche unique"
                            : "Option B – Fiche par classe"
                    }
                />
                <Row label="Élèves" value={`${totalStudents} élèves`} />
                <Row
                    label="Documents à générer"
                    value={`${docCount} fichier${docCount > 1 ? "s" : ""} DOCX`}
                />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                🚧 Génération DOCX — Sprint 3 en cours
            </div>

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
