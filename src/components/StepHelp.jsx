import { useState } from "react";

/**
 * Accordéon d'aide contextuelle par étape.
 * Ouvert par défaut à la première visite (localStorage).
 * Refermé automatiquement après fermeture manuelle.
 */
export default function StepHelp({ stepKey, title, children }) {
    const storageKey = `vigiappel_help_seen_${stepKey}`;
    const [open, setOpen] = useState(() => !localStorage.getItem(storageKey));

    const handleToggle = () => {
        if (open) localStorage.setItem(storageKey, "1");
        setOpen((o) => !o);
    };

    return (
        <div
            className={`mb-6 rounded-xl border overflow-hidden transition-colors
      ${open ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"}`}
        >
            <button
                type="button"
                onClick={handleToggle}
                className="w-full flex items-center justify-between px-4 py-3 text-left gap-3 group"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">💡</span>
                    <span
                        className={`text-sm font-semibold ${open ? "text-blue-800" : "text-gray-600 group-hover:text-gray-800"}`}
                    >
                        {title}
                    </span>
                    {!open && (
                        <span className="text-xs text-gray-400 group-hover:text-gray-500">
                            Cliquer pour afficher l'aide
                        </span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180 text-blue-600" : "text-gray-400"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {open && (
                <div className="px-4 pb-4 text-sm text-blue-900 space-y-3 border-t border-blue-200">
                    {children}
                </div>
            )}
        </div>
    );
}
