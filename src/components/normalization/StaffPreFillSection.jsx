import Section from "../ui/Section";
import Field from "../ui/Field";
import { cx } from "../ui/cx";
import { FONCTIONS_STAFF } from "../../utils/config/defaults";

export default function StaffPreFillSection({
    classes,
    staff,
    classExtraTeachers,
    onAddStaff,
    onUpdateStaff,
    onRemoveStaff,
    onAddExtra,
    onUpdateExtra,
    onRemoveExtra,
}) {
    // Options de rattachement disponibles à cette étape (pas de zones encore)
    const rattachementOptions = [
        { value: "cellule", label: "Cellule de crise" },
        ...classes.map((cl) => ({
            value: `class_${cl}`,
            label: `Classe ${cl}`,
        })),
    ];

    const extrasCount = Object.values(classExtraTeachers).reduce(
        (acc, arr) => acc + (arr?.filter((et) => et.nom.trim()).length || 0),
        0
    );

    return (
        <Section title="Adultes complémentaires">
            <p className="text-sm text-gray-500">
                Déclarer les adultes non issus du CSV : AESH, ATSEM, service
                civique, co-titulaires, intervenants réguliers… Ils
                pré-rempliront la configuration.
            </p>

            {/* ── Adultes de l'école (staff) ──────────────────────── */}
            <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Adultes rattachés à une classe ou à la cellule de crise
                </p>

                {staff.length > 0 && (
                    <div className="space-y-2">
                        {staff.map((s) => (
                            <div
                                key={s.id}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end bg-white border border-gray-200 rounded-xl p-3"
                            >
                                <Field label="NOM">
                                    <input
                                        type="text"
                                        placeholder="GARCIA"
                                        value={s.nom}
                                        onChange={(e) =>
                                            onUpdateStaff(
                                                s.id,
                                                "nom",
                                                e.target.value
                                            )
                                        }
                                        className={cx()}
                                    />
                                </Field>
                                <Field label="Prénom">
                                    <input
                                        type="text"
                                        placeholder="Ana"
                                        value={s.prenom}
                                        onChange={(e) =>
                                            onUpdateStaff(
                                                s.id,
                                                "prenom",
                                                e.target.value
                                            )
                                        }
                                        className={cx()}
                                    />
                                </Field>
                                <Field label="Fonction">
                                    <select
                                        value={s.fonction}
                                        onChange={(e) =>
                                            onUpdateStaff(
                                                s.id,
                                                "fonction",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">
                                            — Sélectionner —
                                        </option>
                                        {FONCTIONS_STAFF.map((f) => (
                                            <option key={f} value={f}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Rattachement">
                                    <select
                                        value={s.rattachement}
                                        onChange={(e) =>
                                            onUpdateStaff(
                                                s.id,
                                                "rattachement",
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">— À définir —</option>
                                        {rattachementOptions.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <button
                                    type="button"
                                    onClick={() => onRemoveStaff(s.id)}
                                    className="text-xs text-red-400 hover:text-red-600 pb-1 transition-colors"
                                    aria-label="Supprimer"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={onAddStaff}
                    className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                >
                    <span className="text-lg leading-none">＋</span> Ajouter un
                    adulte
                </button>
            </div>

            {/* ── Co-titulaires / décharges ───────────────────────── */}
            <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Co-titulaires et décharges par classe
                    </p>
                    {extrasCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                            {extrasCount} ajouté{extrasCount > 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {classes.map((cl) => {
                    const extras = classExtraTeachers[cl] || [];
                    return (
                        <div
                            key={cl}
                            className="bg-white border border-gray-200 rounded-xl p-3 space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                    {cl}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onAddExtra(cl)}
                                    className="text-xs text-blue-700 hover:text-blue-900 transition-colors"
                                >
                                    ＋ Ajouter
                                </button>
                            </div>
                            {extras.map((et, idx) => (
                                <div
                                    key={idx}
                                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end bg-gray-50 rounded-lg p-2"
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
                                                onUpdateExtra(
                                                    cl,
                                                    idx,
                                                    "nom",
                                                    e.target.value
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
                                                onUpdateExtra(
                                                    cl,
                                                    idx,
                                                    "prenom",
                                                    e.target.value
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
                                                onUpdateExtra(
                                                    cl,
                                                    idx,
                                                    "fonction",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {[
                                                "Décharge",
                                                "Mi-temps",
                                                "Co-titulaire",
                                                "Remplaçant(e) habituel(le)",
                                            ].map((f) => (
                                                <option key={f} value={f}>
                                                    {f}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onRemoveExtra(cl, idx)}
                                        className="text-xs text-red-400 hover:text-red-600 pb-1 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}
