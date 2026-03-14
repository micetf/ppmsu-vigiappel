import Section from "../ui/Section";
import NormField from "../ui/NormField";

const FONCTIONS = [
    "AESH",
    "ATSEM",
    "Service civique",
    "Maître E (RASED)",
    "Psychologue EN (RASED)",
    "Personnel entretien/cantine",
    "Intervenant(e)",
    "Autre",
];

const cx =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500";

export default function OtherAdultsSection({
    classes,
    staff,
    onAdd,
    onUpdate,
    onRemove,
}) {
    const rattachementOptions = [
        { value: "school", label: "École (sans classe attitrée)" },
        ...classes.map((cl) => ({
            value: `class_${cl}`,
            label: `Classe ${cl}`,
        })),
    ];

    return (
        <Section title="Autres adultes de l'école">
            <p className="text-sm text-gray-500">
                AESH, ATSEM, service civique, Maître E, psychologue,
                intervenants réguliers… Indiquer leur classe de rattachement
                habituelle si applicable.
            </p>

            <div className="mt-4 space-y-2">
                {staff.map((s) => (
                    <div
                        key={s.id}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end bg-white border border-gray-200 rounded-xl p-3"
                    >
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                NOM
                            </label>
                            <NormField
                                value={s.nom}
                                placeholder="GARCIA"
                                onCommit={(val) => onUpdate(s.id, "nom", val)}
                                className={cx}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Prénom
                            </label>
                            <NormField
                                value={s.prenom}
                                placeholder="Ana"
                                onCommit={(val) =>
                                    onUpdate(s.id, "prenom", val)
                                }
                                className={cx}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Fonction
                            </label>
                            <select
                                value={s.fonction}
                                onChange={(e) =>
                                    onUpdate(s.id, "fonction", e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Sélectionner —</option>
                                {FONCTIONS.map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Rattachement
                            </label>
                            <select
                                value={s.rattachement}
                                onChange={(e) =>
                                    onUpdate(
                                        s.id,
                                        "rattachement",
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Non défini —</option>
                                {rattachementOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(s.id)}
                            className="text-xs text-red-400 hover:text-red-600 pb-1 transition-colors"
                            aria-label="Supprimer"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={onAdd}
                className="mt-3 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
            >
                <span className="text-lg leading-none">＋</span> Ajouter un
                adulte
            </button>
        </Section>
    );
}
