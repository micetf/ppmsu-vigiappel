import { getAvailableForRole } from "../utils/configHelpers";

export default function ZoneEditor({
    zone,
    adults,
    config,
    onUpdate,
    onRemove,
}) {
    const options = [
        { value: "", label: "— Non renseigné —" },
        ...getAvailableForRole(zone.responsibleAdultId, config, adults).map(
            (a) => ({
                value: a.id,
                label: [a.nom, a.prenom].filter(Boolean).join(" "),
            })
        ),
    ];

    return (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-3">
            <div className="flex items-start justify-between gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    {/* Nom de zone */}
                    <div>
                        <label className="label">Nom de la zone</label>
                        <input
                            type="text"
                            value={zone.displayName}
                            onChange={(e) =>
                                onUpdate(zone.id, "displayName", e.target.value)
                            }
                            placeholder="Ex. : Bâtiment A, Étage 1…"
                            className="input"
                        />
                    </div>

                    {/* Responsable */}
                    <div>
                        <label className="label">Adulte responsable</label>
                        <select
                            value={zone.responsibleAdultId ?? ""}
                            onChange={(e) =>
                                onUpdate(
                                    zone.id,
                                    "responsibleAdultId",
                                    e.target.value || null
                                )
                            }
                            className={`input ${!zone.responsibleAdultId ? "border-orange-300 bg-orange-50" : ""}`}
                        >
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {onRemove && (
                    <button
                        type="button"
                        onClick={() => onRemove(zone.id)}
                        className="mt-6 text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors shrink-0"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
