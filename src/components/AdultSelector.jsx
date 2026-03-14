/**
 * AdultSelector.jsx
 * ─────────────────
 * Sélecteur d'adulte : enseignants (CSV) et personnels saisis.
 *
 * Props :
 *   value           AdultRef courant
 *   onChange        (AdultRef) => void
 *   teachers        { [className]: teacherFullName }
 *   staff           [{ id, nom, prenom, fonction }]
 *   fonctionOptions Liste de chaînes pour le select de fonction PPMS
 *                   (uniquement pour le responsable de zone — vide = pas de select)
 *   excludeIds      IDs canoniques à exclure (règle R1)
 *   allowManual     {boolean} default true — si false, supprime la saisie
 *                   manuelle (contexte ConfigForm où tous les adultes
 *                   sont issus de l'étape de normalisation)
 *   error           Message d'erreur
 */

import { toNom, toPrenom, fullName } from "../utils/formatName";

export default function AdultSelector({
    value,
    onChange,
    teachers = {},
    staff = [],
    fonctionOptions = [],
    excludeIds = [],
    allowManual = true,
    error,
}) {
    const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

    // ── Valeur du <select> ────────────────────────────────────────
    // "manual" quand allowManual=true et rien de sélectionné
    // ""       quand allowManual=false et rien de sélectionné
    const selectValue =
        value.source === "teacher"
            ? `teacher_${value.teacherClass}`
            : value.source === "staff"
              ? `staff_${value.staffId}`
              : allowManual
                ? "manual"
                : "";

    // ── Filtrage R1 ───────────────────────────────────────────────
    const visibleTeachers = Object.entries(teachers).filter(([cl]) => {
        const id = `teacher:${cl}`;
        return !excludeIds.includes(id) || selectValue === `teacher_${cl}`;
    });

    const visibleStaff = staff.filter((s) => {
        const id = `staff:${s.id}`;
        return !excludeIds.includes(id) || selectValue === `staff_${s.id}`;
    });

    // ── Handler ───────────────────────────────────────────────────
    const handleSourceChange = (e) => {
        const val = e.target.value;

        const { substitute: _sub, ...base } = value;

        if (val === "" || val === "manual") {
            // État vide (allowManual=false) ou saisie manuelle (allowManual=true)
            onChange({
                ...base,
                source: "manual",
                teacherClass: "",
                staffId: "",
                nom: "",
                prenom: "",
            });
        } else if (val.startsWith("teacher_")) {
            onChange({
                ...base,
                source: "teacher",
                teacherClass: val.replace("teacher_", ""),
                staffId: "",
            });
        } else if (val.startsWith("staff_")) {
            onChange({
                ...base,
                source: "staff",
                staffId: val.replace("staff_", ""),
                teacherClass: "",
            });
        }
    };

    // ── Dérivés d'affichage ───────────────────────────────────────
    const isTeacherSelected =
        value.source === "teacher" && !!value.teacherClass;
    const selectedTeacherName = isTeacherSelected
        ? teachers[value.teacherClass] || ""
        : "";
    const selectedStaff =
        value.source === "staff" ? staffById[value.staffId] : null;

    // ── Rendu ─────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            {/* ── Sélecteur principal ───────────────────────────── */}
            <select
                value={selectValue}
                onChange={handleSourceChange}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none
                    focus:ring-2 focus:ring-blue-500 transition-colors
                    ${error ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
            >
                {/* Option initiale : manuelle si allowManual, neutre sinon */}
                {allowManual ? (
                    <option value="manual">— Saisir manuellement —</option>
                ) : (
                    <option value="">— Sélectionner un adulte —</option>
                )}

                {visibleTeachers.length > 0 && (
                    <optgroup label="Enseignants (depuis le CSV)">
                        {visibleTeachers.map(([cl, name]) => (
                            <option key={cl} value={`teacher_${cl}`}>
                                {name} — Classe {cl}
                            </option>
                        ))}
                    </optgroup>
                )}

                {visibleStaff.length > 0 && (
                    <optgroup label="Autres personnels">
                        {visibleStaff.map((s) => (
                            <option key={s.id} value={`staff_${s.id}`}>
                                {fullName(s.nom, s.prenom)}
                                {s.fonction ? ` — ${s.fonction}` : ""}
                            </option>
                        ))}
                    </optgroup>
                )}
            </select>

            {error && (
                <p className="text-xs text-red-500 mt-0.5" role="alert">
                    {error}
                </p>
            )}

            {/* ── Saisie manuelle (allowManual uniquement) ──────── */}
            {allowManual && value.source === "manual" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-3 border-l-2 border-gray-200">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            NOM *
                        </label>
                        <input
                            type="text"
                            placeholder="DUPONT"
                            value={value.nom || ""}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    nom: toNom(e.target.value),
                                })
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Prénom
                        </label>
                        <input
                            type="text"
                            placeholder="Marie"
                            value={value.prenom || ""}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    prenom: toPrenom(e.target.value),
                                })
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {fonctionOptions.length > 0 && (
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Fonction PPMS
                            </label>
                            <select
                                value={value.fonction || ""}
                                onChange={(e) =>
                                    onChange({
                                        ...value,
                                        fonction: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Sélectionner —</option>
                                {fonctionOptions.map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* ── Adulte identifié (teacher ou staff) ──────────── */}
            {(isTeacherSelected || selectedStaff) && (
                <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
                    <p className="text-sm text-blue-900">
                        {isTeacherSelected ? (
                            <>
                                <strong>{selectedTeacherName}</strong>{" "}
                                <span className="text-gray-500">
                                    — Classe {value.teacherClass}
                                </span>
                            </>
                        ) : (
                            <strong>
                                {fullName(
                                    selectedStaff.nom,
                                    selectedStaff.prenom
                                )}
                            </strong>
                        )}
                    </p>
                    {/* fonctionOptions uniquement pour les responsables (zone),
                        pas pour les membres de cellule/zone */}
                    {fonctionOptions.length > 0 && (
                        <div className="w-full sm:w-56 shrink-0">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Fonction PPMS
                            </label>
                            <select
                                value={value.fonction || ""}
                                onChange={(e) =>
                                    onChange({
                                        ...value,
                                        fonction: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Sélectionner —</option>
                                {fonctionOptions.map((f) => (
                                    <option key={f} value={f}>
                                        {f}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
