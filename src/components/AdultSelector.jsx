/**
 * AdultSelector.jsx
 * ─────────────────
 * Sélecteur d'adulte partagé : cellule de crise, responsables de zone,
 * membres de cellule.
 *
 * Trois sources : "teacher" (depuis CSV), "staff" (saisi), "manual" (libre).
 *
 * Évolution Sprint 5 :
 * - Suppression de showSubstitute / substituteTitle / logique substitute.
 *   La substitution est désormais gérée globalement par ClassSupervisionSection.
 * - Ajout de la prop excludeIds[] : filtre les adultes déjà affectés (règle R1).
 */

import { toNom, toPrenom, fullName } from "../utils/formatName";

/**
 * @param {object}   value           AdultRef courant
 * @param {function} onChange        (AdultRef) => void
 * @param {object}   teachers        { [className]: teacherFullName }
 * @param {Array}    staff           [{ id, nom, prenom, fonction }]
 * @param {Array}    fonctionOptions Liste de chaînes pour le select de fonction
 * @param {Array}    excludeIds      IDs canoniques à exclure (getAdultId)
 *                                   ex. ["teacher:CP", "staff:s2"]
 * @param {string}   error           Message d'erreur à afficher
 */
export default function AdultSelector({
    value,
    onChange,
    teachers = {},
    staff = [],
    fonctionOptions = [],
    excludeIds = [],
    error,
}) {
    const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

    // Valeur courante du <select> principal
    const selectValue =
        value.source === "teacher"
            ? `teacher_${value.teacherClass}`
            : value.source === "staff"
              ? `staff_${value.staffId}`
              : "manual";

    // ── Filtrage R1 ───────────────────────────────────────────────
    // On retire les options dont l'id canonique est dans excludeIds,
    // SAUF la valeur actuellement sélectionnée (pour éviter de vider
    // un champ déjà renseigné quand on ouvre le select).
    const visibleTeachers = Object.entries(teachers).filter(([cl]) => {
        const id = `teacher:${cl}`;
        return !excludeIds.includes(id) || selectValue === `teacher_${cl}`;
    });

    const visibleStaff = staff.filter((s) => {
        const id = `staff:${s.id}`;
        return !excludeIds.includes(id) || selectValue === `staff_${s.id}`;
    });

    // ── Handlers ──────────────────────────────────────────────────

    const handleSourceChange = (e) => {
        const val = e.target.value;
        // Note : `substitute` n'est plus présent dans les AdultRef Sprint 5.
        // La destructuration est défensive pour les AdultRef migrés qui
        // pourraient encore avoir ce champ (supprimé à la prochaine modif).
        const { substitute: _sub, ...base } = value;

        if (val === "manual") {
            onChange({
                ...base,
                source: "manual",
                teacherClass: "",
                staffId: "",
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
                    ${
                        error
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 hover:border-gray-400"
                    }`}
            >
                <option value="manual">— Saisir manuellement —</option>

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
                    <optgroup label="Autres personnels saisis">
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

            {/* ── Saisie manuelle ───────────────────────────────── */}
            {value.source === "manual" && (
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
