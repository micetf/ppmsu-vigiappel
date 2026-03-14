import { useState } from "react";
import Navbar from "./components/Navbar"; // ← nouveau
import StepIndicator from "./components/StepIndicator";
import FileUpload from "./components/FileUpload";
import DataPreview from "./components/DataPreview";
import ConfigForm from "./components/ConfigForm";
import GenerationPanel from "./components/GenerationPanel";
import { useCSVData } from "./hooks/useCSVData";

export default function App() {
    const [step, setStep] = useState(1);
    const [csvResult, setCsvResult] = useState(null);
    const [config, setConfig] = useState(null);

    const csvData = useCSVData(csvResult);
    const { classes, totalStudents, teacherByClass } = csvData;

    const handleParsed = (result) => {
        setCsvResult(result);
        setStep(2);
    };
    const handleReset = () => {
        setCsvResult(null);
        setConfig(null);
        setStep(1);
    };
    const handleConfig = (cfg) => {
        setConfig(cfg);
        setStep(4);
    };

    function handleGoTo(n) {
        if (n === 1) handleReset();
        else setStep(n);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar micetf.fr — fixe, z-50 */}
            <Navbar />

            {/* h1 masqué visuellement mais présent pour l'accessibilité et le SEO */}
            <h1 className="sr-only">VigiAppel — Générateur de fiches PPMS</h1>

            {/* Contenu principal */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-6">
                <StepIndicator current={step} onGoTo={handleGoTo} />

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
                        teacherByClass={teacherByClass}
                        onSubmit={handleConfig}
                        onBack={() => setStep(2)}
                        initialConfig={config}
                    />
                )}
                {step === 4 && config && (
                    <GenerationPanel
                        config={config}
                        csvData={csvData}
                        classes={classes}
                        totalStudents={totalStudents}
                        onBack={() => setStep(3)}
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
