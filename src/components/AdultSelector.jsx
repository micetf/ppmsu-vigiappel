import { toNom, toPrenom, fullName } from "../utils/formatName";

const FONCTIONS_SUBSTITUTE = [
    "AESH",
    "ATSEM",
    "Service civique",
    "Maître E (RASED)",
    "Psychologue EN (RASED)",
    "Personnel entretien/cantine",
    "Enseignant(e)",
    "Intervenant(e)",
    "Autre",
];

/**
 * Sélecteur d'adulte partagé — crisisCell et responsables de zone.
 * Trois sources : "teacher" (depuis CSV), "staff" (saisi), "manual" (libre).
 * Si source === "teacher", affiche le prompt substitut si showSubstitute = true.
 */
export default function AdultSelector({
    value,
    onChange,
    teachers = {}, // { className: teacherFullName }
    staff = [], // [{ id, nom, prenom, fonction }]
    fonctionOptions = [],
    showSubstitute = false,
    substituteTitle = "Qui encadrera cette classe pendant le PPMS ?",
    error,
}) {
    const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

    const selectValue =
        value.source === "teacher"
            ? `teacher_${value.teacherClass}`
            : value.source === "staff"
              ? `staff_${value.staffId}`
              : "manual";

    const handleSourceChange = (e) => {
        const val = e.target.value;
        const base = { ...value, substitute: null };
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

    const updateSub = (field, val) =>
        onChange({
            ...value,
            substitute: {
                ...(value.substitute || {
                    source: "manual",
                    staffId: "",
                    nom: "",
                    prenom: "",
                    fonction: "",
                }),
                [field]: val,
            },
        });

    const isTeacherSelected =
        value.source === "teacher" && !!value.teacherClass;
    const selectedTeacherName = isTeacherSelected
        ? teachers[value.teacherClass] || ""
        : "";
    const selectedStaff =
        value.source === "staff" ? staffById[value.staffId] : null;

    return (
        <div className="space-y-3">
            {/* ── Sélecteur principal ── */}
            <select
                value={selectValue}
                onChange={handleSourceChange}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none
          focus:ring-2 focus:ring-blue-500 transition-colors
          ${error ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-gray-400"}`}
            >
                <option value="manual">— Saisir manuellement —</option>
                {Object.keys(teachers).length > 0 && (
                    <optgroup label="Enseignants (depuis le CSV)">
                        {Object.entries(teachers).map(([cl, name]) => (
                            <option key={cl} value={`teacher_${cl}`}>
                                {name} — Classe {cl}
                            </option>
                        ))}
                    </optgroup>
                )}
                {staff.length > 0 && (
                    <optgroup label="Autres personnels saisis">
                        {staff.map((s) => (
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

            {/* ── Saisie manuelle ── */}
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
                                Fonction
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

            {/* ── Adulte sélectionné (teacher ou staff) ── */}
            {(isTeacherSelected || selectedStaff) && (
                <div className="flex flex-wrap items-center gap-3 pl-3 border-l-2 border-blue-300">
                    <p className="text-sm font-medium text-gray-800 flex-1">
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

            {/* ── Substitut si enseignant sélectionné ── */}
            {showSubstitute && isTeacherSelected && (
                <div className="ml-3 border border-amber-200 rounded-xl bg-amber-50 p-3 space-y-3">
                    <p className="text-xs font-semibold text-amber-900">
                        ⚠️ {selectedTeacherName} est enseignant(e) de la classe{" "}
                        {value.teacherClass}.
                    </p>
                    <p className="text-xs text-amber-700">{substituteTitle}</p>

                    {/* Source substitut */}
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: "staff", label: "Choisir dans la liste" },
                            { value: "manual", label: "Saisir manuellement" },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                    onChange({
                                        ...value,
                                        substitute: {
                                            source: opt.value,
                                            staffId: "",
                                            nom: "",
                                            prenom: "",
                                            fonction: "",
                                        },
                                    })
                                }
                                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                  ${
                      value.substitute?.source === opt.value
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-amber-700 border-amber-300 hover:border-amber-500"
                  }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Substitut — depuis staff */}
                    {value.substitute?.source === "staff" &&
                        (staff.length > 0 ? (
                            <select
                                value={value.substitute.staffId || ""}
                                onChange={(e) =>
                                    updateSub("staffId", e.target.value)
                                }
                                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                            >
                                <option value="">
                                    — Sélectionner un adulte —
                                </option>
                                {staff.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {fullName(s.nom, s.prenom)}
                                        {s.fonction ? ` — ${s.fonction}` : ""}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                                Aucun personnel dans "Autres adultes".
                                Renseigner cette section d'abord, ou utiliser la
                                saisie manuelle.
                            </p>
                        ))}

                    {/* Substitut — manuel */}
                    {value.substitute?.source === "manual" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                                {
                                    key: "nom",
                                    label: "NOM",
                                    placeholder: "GARCIA",
                                    transform: toNom,
                                },
                                {
                                    key: "prenom",
                                    label: "Prénom",
                                    placeholder: "Ana",
                                    transform: toPrenom,
                                },
                            ].map(({ key, label, placeholder, transform }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-amber-800 mb-1">
                                        {label}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={placeholder}
                                        value={value.substitute[key] || ""}
                                        onChange={(e) =>
                                            updateSub(
                                                key,
                                                transform(e.target.value)
                                            )
                                        }
                                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium text-amber-800 mb-1">
                                    Fonction
                                </label>
                                <select
                                    value={value.substitute?.fonction || ""}
                                    onChange={(e) =>
                                        updateSub("fonction", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                                >
                                    <option value="">— Fonction —</option>
                                    {FONCTIONS_SUBSTITUTE.map((f) => (
                                        <option key={f} value={f}>
                                            {f}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
