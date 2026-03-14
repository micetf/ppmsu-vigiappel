// src/components/StepIndicator.jsx — version navigable
const STEPS = [
    "Import CSV",
    "Aperçu",
    "Normalisation",
    "Configuration",
    "Export DOCX",
];

export default function StepIndicator({ current, onGoTo }) {
    return (
        <ol className="flex flex-wrap items-center gap-2 mb-8 text-sm select-none">
            {STEPS.map((label, i) => {
                const n = i + 1;
                const done = n < current;
                const active = n === current;
                const clickable = done && onGoTo;

                return (
                    <li key={n} className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={!clickable}
                            onClick={() => clickable && onGoTo(n)}
                            className={`flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded
                ${clickable ? "cursor-pointer" : "cursor-default"}`}
                        >
                            <span
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors
                ${done ? "bg-green-600 text-white group-hover:bg-green-700" : ""}
                ${active ? "bg-blue-800 text-white" : ""}
                ${!done && !active ? "bg-gray-200 text-gray-500" : ""}`}
                            >
                                {done ? "✓" : n}
                            </span>
                            <span
                                className={
                                    active
                                        ? "font-semibold text-blue-800"
                                        : done
                                          ? "text-green-700 group-hover:underline"
                                          : "text-gray-400"
                                }
                            >
                                {label}
                            </span>
                        </button>
                        {i < STEPS.length - 1 && (
                            <span className="text-gray-300 mx-1">→</span>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
