import { toNom, toPrenom } from "../../utils/formatName";
import Field from "../ui/Field";
import { cx } from "../ui/cx";
import { FONCTIONS_STAFF } from "../../utils/config/defaults";

export default function StaffCardEditing({
    staff,
    onUpdate,
    onValidate,
    onRemove,
    rattachementOptions,
    errors,
}) {
    return (
        <div className="bg-white border-2 border-blue-300 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Field label="NOM" error={errors[`staff_${staff.id}_nom`]}>
                    <input
                        type="text"
                        placeholder="GARCIA"
                        value={staff.nom}
                        onChange={(e) => onUpdate("nom", toNom(e.target.value))}
                        className={cx(errors[`staff_${staff.id}_nom`])}
                    />
                </Field>
                <Field label="Prénom" optional>
                    <input
                        type="text"
                        placeholder="Ana"
                        value={staff.prenom}
                        onChange={(e) =>
                            onUpdate("prenom", toPrenom(e.target.value))
                        }
                        className={cx()}
                    />
                </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Fonction" optional>
                    <select
                        value={staff.fonction}
                        onChange={(e) => onUpdate("fonction", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">— Sélectionner —</option>
                        {FONCTIONS_STAFF.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field
                    label="Rattachement"
                    error={errors[`staff_${staff.id}_rattachement`]}
                >
                    <select
                        value={staff.rattachement}
                        onChange={(e) =>
                            onUpdate("rattachement", e.target.value)
                        }
                        className={cx(errors[`staff_${staff.id}_rattachement`])}
                    >
                        <option value="">— Zone ou Classe —</option>
                        {rattachementOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                    ✕ Supprimer
                </button>
                <button
                    type="button"
                    onClick={onValidate}
                    className="text-xs px-3 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
                >
                    Valider ✓
                </button>
            </div>
        </div>
    );
}
