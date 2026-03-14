import { useState } from "react";
import { toNom, toPrenom, fullName } from "../utils/formatName";

export default function AdultCard({
    adult,
    classOptions,
    typeOptions,
    onUpdate,
    onRemove,
    locked = false, // enseignant issu du CSV — suppression désactivée
}) {
    const [editing, setEditing] = useState(!adult.nom.trim()); // auto-open si nouveau

    const displayName = fullName(adult.nom, adult.prenom) || "Nom manquant";
    const typeLabel =
        typeOptions.find((t) => t.value === adult.type)?.label ?? adult.type;
    const classLabel =
        classOptions.find((o) => o.value === (adult.defaultClassId ?? ""))
            ?.label ?? "Établissement";

    const hasError = !adult.nom.trim();

    if (!editing) {
        return (
            <div
                className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors
        ${
            hasError
                ? "bg-red-50 border-red-300"
                : "bg-gray-50 border-gray-200 hover:border-gray-300"
        }`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <TypeBadge type={adult.type} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            {hasError ? (
                                <span className="text-red-500">
                                    Nom manquant
                                </span>
                            ) : (
                                displayName
                            )}
                        </p>
                        <p className="text-xs text-gray-500">
                            {typeLabel} · {classLabel}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-3">
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                        ✎
                    </button>
                    {!locked && onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(adult.id)}
                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border-2 border-blue-300 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NOM */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        NOM <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="DUPONT"
                        value={adult.nom}
                        onChange={(e) =>
                            onUpdate(adult.id, "nom", toNom(e.target.value))
                        }
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors
              ${!adult.nom.trim() ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                    />
                </div>

                {/* PRÉNOM */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Prénom
                    </label>
                    <input
                        type="text"
                        placeholder="Marie"
                        value={adult.prenom}
                        onChange={(e) =>
                            onUpdate(
                                adult.id,
                                "prenom",
                                toPrenom(e.target.value)
                            )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* TYPE */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type
                    </label>
                    <select
                        value={adult.type}
                        onChange={(e) =>
                            onUpdate(adult.id, "type", e.target.value)
                        }
                        disabled={locked}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                        {typeOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* RATTACHEMENT PAR DÉFAUT */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rattachement par défaut
                    </label>
                    <select
                        value={adult.defaultClassId ?? ""}
                        onChange={(e) =>
                            onUpdate(
                                adult.id,
                                "defaultClassId",
                                e.target.value || null
                            )
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {classOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                        Modifiable à l'étape suivante si nécessaire.
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                {!locked && onRemove ? (
                    <button
                        type="button"
                        onClick={() => onRemove(adult.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                        ✕ Supprimer
                    </button>
                ) : (
                    <span className="text-xs text-gray-300 italic">
                        Importé du CSV
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => adult.nom.trim() && setEditing(false)}
                    disabled={!adult.nom.trim()}
                    className="text-xs px-3 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Valider ✓
                </button>
            </div>
        </div>
    );
}

// ── Badge couleur par type ────────────────────────────────────────
function TypeBadge({ type }) {
    const palette = {
        teacher: "bg-blue-100 text-blue-800",
        coteacher: "bg-indigo-100 text-indigo-800",
        aesh: "bg-purple-100 text-purple-800",
        atsem: "bg-pink-100 text-pink-800",
        rased: "bg-orange-100 text-orange-800",
        service: "bg-yellow-100 text-yellow-800",
        staff: "bg-gray-100 text-gray-700",
        other: "bg-gray-100 text-gray-500",
    };
    const ICONS = {
        teacher: "🎓",
        coteacher: "🎓",
        aesh: "🤝",
        atsem: "🌱",
        rased: "🔍",
        service: "🙋",
        staff: "🔧",
        other: "👤",
    };
    return (
        <span
            className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${palette[type] ?? palette.other}`}
        >
            {ICONS[type] ?? "👤"}
        </span>
    );
}
