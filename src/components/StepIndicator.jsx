const STEPS = ["Import CSV", "Aperçu", "Configuration", "Export DOCX"];

export default function StepIndicator({ current }) {
    return (
        <ol className="flex flex-wrap items-center gap-2 mb-8 text-sm select-none">
            {STEPS.map((label, i) => {
                const n = i + 1;
                const done = n < current;
                const active = n === current;
                return (
                    <li key={n} className="flex items-center gap-2">
                        <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                ${done ? "bg-green-600 text-white" : active ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-500"}`}
                        >
                            {done ? "✓" : n}
                        </span>
                        <span
                            className={
                                active
                                    ? "font-semibold text-blue-800"
                                    : done
                                      ? "text-green-700"
                                      : "text-gray-400"
                            }
                        >
                            {label}
                        </span>
                        {i < STEPS.length - 1 && (
                            <span className="text-gray-300 mx-1">→</span>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
