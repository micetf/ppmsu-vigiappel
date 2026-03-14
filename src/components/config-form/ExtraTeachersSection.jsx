import { useState } from "react";
import { toNom, toPrenom } from "../../utils/formatName";

const FONCTIONS_EXTRA = [
    "Décharge",
    "Mi-temps",
    "Co-titulaire",
    "Remplaçant(e) habituel(le)",
];

export default function ExtraTeachersSection({
    classes,
    teacherByClass,
    classExtraTeachers,
    onAdd,
    onUpdate,
    onRemove,
    extrasCount,
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left gap-3"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">
                        Co-titulaires / décharges / temps partiels
                    </span>
                    {extrasCount > 0 ? (
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {extrasCount} ajouté{extrasCount > 1 ? "s" : ""}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Optionnel</span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
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
                <div className="divide-y divide-gray-100">
                    <p className="px-4 py-3 text-xs text-gray-500 leading-relaxed bg-white">
                        Pour chaque classe, ajouter les adultes qui co-encadrent
                        le groupe régulièrement : enseignant(e) à mi-temps,
                        décharge, remplaçant(e) habituel(le)… Ils apparaîtront
                        sur la fiche avec leurs cases à cocher.
                    </p>

                    {classes.map((cl) => {
                        const extras = classExtraTeachers[cl] || [];
                        return (
                            <div
                                key={cl}
                                className="px-4 py-3 space-y-2 bg-white"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                            {cl}
                                        </span>
                                        {teacherByClass[cl] && (
                                            <span className="text-xs text-gray-500">
                                                {teacherByClass[cl]}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onAdd(cl)}
                                        className="text-xs text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1"
                                    >
                                        <span className="text-base leading-none">
                                            ＋
                                        </span>{" "}
                                        Ajouter
                                    </button>
                                </div>

                                {extras.map((et, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end bg-gray-50 border border-gray-200 rounded-lg p-2"
                                    >
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                NOM
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="BERNARD"
                                                value={et.nom}
                                                onChange={(e) =>
                                                    onUpdate(
                                                        cl,
                                                        idx,
                                                        "nom",
                                                        toNom(e.target.value)
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Prénom
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Claire"
                                                value={et.prenom}
                                                onChange={(e) =>
                                                    onUpdate(
                                                        cl,
                                                        idx,
                                                        "prenom",
                                                        toPrenom(e.target.value)
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Rôle
                                            </label>
                                            <select
                                                value={et.fonction}
                                                onChange={(e) =>
                                                    onUpdate(
                                                        cl,
                                                        idx,
                                                        "fonction",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {FONCTIONS_EXTRA.map((f) => (
                                                    <option key={f} value={f}>
                                                        {f}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onRemove(cl, idx)}
                                            className="text-xs text-red-400 hover:text-red-600 pb-1 transition-colors"
                                            aria-label="Supprimer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
