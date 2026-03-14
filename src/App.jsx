import { useState } from "react";
import Navbar from "./components/Navbar";
import StepIndicator from "./components/StepIndicator";
import FileUpload from "./components/FileUpload";
import DataPreview from "./components/DataPreview";
import NormalizationStep from "./components/NormalizationStep";
import ConfigForm from "./components/ConfigForm";
import GenerationPanel from "./components/GenerationPanel";
import { useCSVData } from "./hooks/useCSVData";
import { buildPreConfig } from "./utils/normalization";
import { useNormalization } from "./hooks/useNormalization";

const STORAGE_KEY = "vigiappel_config";

export default function App() {
    const [step, setStep] = useState(1);
    const [csvResult, setCsvResult] = useState(null);
    const [normalizedCsvData, setNormalizedCsvData] = useState(null);
    const [initialConfig, setInitialConfig] = useState(null);
    const [config, setConfig] = useState(null);

    const csvData = useCSVData(csvResult);
    const norm = useNormalization();

    const handleNormalized = (corrections, preview) => {
        setNormalizedCsvData(preview);
        // corrections vient maintenant de norm.corrections (déjà à jour)
        const preConfig = buildPreConfig(corrections);
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setInitialConfig({
                    ...parsed,
                    staff: preConfig.staff,
                    classExtraTeachers: preConfig.classExtraTeachers,
                });
            } else {
                setInitialConfig(preConfig);
            }
        } catch {
            setInitialConfig(preConfig);
        }
        setStep(4);
    };

    const handleParsed = (result) => {
        setCsvResult(result);
        setStep(2);
    };

    const handleReset = () => {
        setCsvResult(null);
        setNormalizedCsvData(null);
        setInitialConfig(null);
        setConfig(null);
        norm.reset();
        setStep(1);
    };

    const handleConfig = (cfg) => {
        setConfig(cfg);
        setStep(5);
    };

    function handleGoTo(n) {
        if (n === 1) handleReset();
        else setStep(n);
    }

    // csvData actif = normalisé si disponible, brut sinon
    const activeCsvData = normalizedCsvData ?? csvData;
    const { classes, teacherByClass } = activeCsvData;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 pt-24">
                <StepIndicator current={step} onGoTo={handleGoTo} />

                {step === 1 && <FileUpload onParsed={handleParsed} />}

                {step === 2 && (
                    <DataPreview
                        result={csvResult}
                        onReset={handleReset}
                        onNext={() => setStep(3)}
                    />
                )}

                {step === 3 && (
                    <NormalizationStep
                        csvData={csvData}
                        norm={norm}
                        onConfirm={handleNormalized}
                        onBack={() => setStep(2)}
                    />
                )}

                {step === 4 && (
                    <ConfigForm
                        classes={classes}
                        teacherByClass={teacherByClass}
                        initialConfig={initialConfig}
                        onSubmit={handleConfig}
                        onBack={() => setStep(3)}
                    />
                )}

                {step === 5 && (
                    <GenerationPanel
                        config={config}
                        csvData={activeCsvData}
                        classes={classes}
                        totalStudents={activeCsvData.totalStudents}
                        onBack={() => setStep(4)}
                        onReset={handleReset}
                    />
                )}
            </div>
        </div>
    );
}
