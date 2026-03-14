import { getEffectiveClassId } from "../utils/configHelpers";

export default function AdultOverridePanel({
    adults,
    classes,
    config,
    onSetOverride,
}) {
    const classOptions = [
        { value: "", label: "— Établissement (sans classe) —" },
        ...classes.map((cl) => ({
            value: cl.id,
            label: cl.displayName || cl.csvKey,
        })),
    ];

    // Adultes avec un rattachement par défaut différent de leur override actuel
    // = seuls les adultes "overridables" sont affichés (tous sauf crisisCell)
    const overridableAdults = adults.filter(
        (a) => a.id !== config.crisisCellAdultId
    );

    return (
        <div className="space-y-2">
            <p className="text-xs text-gray-500">
                Modifiez ici si un adulte encadre une classe différente de son
                rattachement habituel (décharge, remplacement…).
            </p>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Adulte
                            </th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Rattachement habituel
                            </th>
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Rattachement aujourd'hui
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {overridableAdults.map((a, i) => {
                            const defaultClass = classes.find(
                                (cl) => cl.id === a.defaultClassId
                            );
                            const effectiveId = getEffectiveClassId(
                                a.id,
                                adults,
                                config.adultOverrides
                            );
                            const isOverridden = a.id in config.adultOverrides;

                            return (
                                <tr
                                    key={a.id}
                                    className={`${i % 2 !== 0 ? "bg-gray-50/50" : "bg-white"} ${
                                        isOverridden ? "bg-amber-50" : ""
                                    }`}
                                >
                                    {/* Adulte */}
                                    <td className="px-4 py-2.5">
                                        <span className="font-medium text-gray-800">
                                            {[a.nom, a.prenom]
                                                .filter(Boolean)
                                                .join(" ")}
                                        </span>
                                        {isOverridden && (
                                            <span className="ml-2 text-xs text-amber-600 font-semibold">
                                                override
                                            </span>
                                        )}
                                    </td>

                                    {/* Rattachement par défaut — lecture seule */}
                                    <td className="px-4 py-2.5 text-gray-500">
                                        {defaultClass?.displayName ??
                                            "Établissement"}
                                    </td>

                                    {/* Rattachement effectif — éditable */}
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={effectiveId ?? ""}
                                                onChange={(e) =>
                                                    onSetOverride(
                                                        a.id,
                                                        e.target.value || null
                                                    )
                                                }
                                                className={`rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors ${
                                                    isOverridden
                                                        ? "border-amber-400"
                                                        : "border-gray-300 hover:border-gray-400"
                                                }`}
                                            >
                                                {classOptions.map((opt) => (
                                                    <option
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Réinitialiser l'override */}
                                            {isOverridden && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onSetOverride(
                                                            a.id,
                                                            null
                                                        )
                                                    }
                                                    title="Revenir au rattachement par défaut"
                                                    className="text-xs text-amber-600 hover:text-red-600 transition-colors px-1"
                                                >
                                                    ↺
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
