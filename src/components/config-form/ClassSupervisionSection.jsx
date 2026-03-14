/**
 * ClassSupervisionSection.jsx
 * ───────────────────────────
 * Tableau des classes dont l'enseignant est en mission PPMS.
 * Affiché uniquement si au moins une vacance existe (R2).
 * La validation est bloquante tant qu'une ligne n'est pas renseignée (R4).
 *
 * Pour chaque vacance :
 * - Colonne Classe / Enseignant / Rôle PPMS : lecture seule (informatif)
 * - Colonne Superviseur : select parmi les substituts disponibles (R3)
 *   Priorité : co-titulaires de la classe > staff non affecté
 *
 * Props :
 *   vacancies         Vacancy[]  — [{ classe, reason }]
 *   classSupervision  Record<classe, AdultRef|null>
 *   onChange          (classe, AdultRef|null) => void
 *   teachers          { [className]: fullName }
 *   config            Config complète (pour buildAvailableSubstitutes)
 *   assignedIds       Set<string> des IDs déjà pris (rôles PPMS)
 *   errors            objet d'erreurs du formulaire
 */

import {
    buildAvailableSubstitutes,
    buildFullAssignedIds,
} from "../../utils/config/substitutes";

// ── Sous-composant : une ligne de vacance ─────────────────────────────────────

function VacancyRow({
    vacancy,
    teacherName,
    current,
    options,
    onChange,
    error,
}) {
    const { classe, reason } = vacancy;

    // Valeur courante du select : identifiant optionnel stocké dans _label
    // On utilise l'index comme clé de select pour éviter les collisions
    // sur les adultes homonymes.
    // eslint-disable-next-line no-unused-vars
    const selectValue = current
        ? JSON.stringify({
              source: current.source,
              id:
                  current.staffId ||
                  current.teacherClass ||
                  `${current.nom}:${current.prenom}`,
          })
        : "";

    const handleChange = (e) => {
        if (!e.target.value) {
            onChange(null);
            return;
        }
        const idx = parseInt(e.target.value, 10);
        onChange(options[idx] ?? null);
    };

    // Index de l'option courante dans `options`
    const currentIndex = current
        ? options.findIndex(
              (o) =>
                  o.source === current.source &&
                  (o.staffId === current.staffId ||
                      (o.nom === current.nom &&
                          o.prenom === current.prenom &&
                          o.classe === current.classe))
          )
        : -1;

    const isCovered = currentIndex !== -1;

    return (
        <tr
            className={`border-b border-gray-100 ${error ? "bg-red-50" : isCovered ? "bg-green-50" : "bg-amber-50"}`}
        >
            {/* Classe */}
            <td className="px-3 py-2.5 font-semibold text-sm text-gray-800 whitespace-nowrap">
                <span className="flex items-center gap-1.5">
                    <span aria-hidden="true">{isCovered ? "✅" : "⚠️"}</span>
                    {classe}
                </span>
            </td>

            {/* Enseignant */}
            <td className="px-3 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                {teacherName || <span className="text-gray-400 italic">—</span>}
            </td>

            {/* Rôle PPMS */}
            <td className="px-3 py-2.5 text-sm text-amber-800 whitespace-nowrap">
                {reason}
            </td>

            {/* Superviseur — select */}
            <td className="px-3 py-2.5 min-w-50">
                <select
                    value={currentIndex === -1 ? "" : String(currentIndex)}
                    onChange={handleChange}
                    aria-label={`Superviseur pour la classe ${classe}`}
                    className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none
                        focus:ring-2 focus:ring-blue-500 bg-white transition-colors
                        ${
                            error
                                ? "border-red-400 bg-red-50"
                                : isCovered
                                  ? "border-green-400"
                                  : "border-amber-300"
                        }`}
                >
                    <option value="">— Choisir un superviseur —</option>

                    {/* Co-titulaires en premier (R3) */}
                    {options.some((o) => o.source === "extra") && (
                        <optgroup label="Co-titulaires / décharges de cette classe">
                            {options
                                .map((o, i) => ({ o, i }))
                                .filter(({ o }) => o.source === "extra")
                                .map(({ o, i }) => (
                                    <option key={i} value={String(i)}>
                                        {o._label}
                                    </option>
                                ))}
                        </optgroup>
                    )}

                    {/* Staff ensuite */}
                    {options.some((o) => o.source === "staff") && (
                        <optgroup label="Autres adultes disponibles">
                            {options
                                .map((o, i) => ({ o, i }))
                                .filter(({ o }) => o.source === "staff")
                                .map(({ o, i }) => (
                                    <option key={i} value={String(i)}>
                                        {o._label}
                                    </option>
                                ))}
                        </optgroup>
                    )}
                </select>

                {error && (
                    <p className="text-xs text-red-500 mt-1" role="alert">
                        {error}
                    </p>
                )}

                {options.length === 0 && (
                    <p className="text-xs text-amber-700 mt-1">
                        Aucun adulte disponible — ajouter du personnel dans «
                        Autres adultes » ou des co-titulaires.
                    </p>
                )}
            </td>
        </tr>
    );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ClassSupervisionSection({
    vacancies = [],
    classSupervision = {},
    onChange,
    teachers = {},
    config,
    assignedIds = new Set(),
    errors = {},
}) {
    // Rendu conditionnel : section invisible si aucune vacance
    if (vacancies.length === 0) return null;

    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
                Les enseignants ci-dessous sont en mission PPMS et quittent leur
                classe. Désigner un adulte pour superviser chaque classe
                vacante.
            </p>

            {/* ── Tableau responsive ───────────────────────────── */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                Classe
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                Enseignant
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                Rôle PPMS
                            </th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase tracking-wide">
                                Superviseur{" "}
                                <span className="text-red-500">*</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {vacancies.map((vacancy) => {
                            const { classe } = vacancy;

                            // Pool de substituts pour cette classe spécifique.
                            // On exclut aussi les superviseurs déjà désignés
                            // pour d'autres classes (buildFullAssignedIds).
                            const fullIds = buildFullAssignedIds(
                                assignedIds,
                                classSupervision,
                                classe
                            );
                            const options = buildAvailableSubstitutes(
                                classe,
                                config,
                                fullIds
                            );

                            return (
                                <VacancyRow
                                    key={classe}
                                    vacancy={vacancy}
                                    teacherName={teachers[classe] || ""}
                                    current={classSupervision[classe] ?? null}
                                    options={options}
                                    onChange={(ref) => onChange(classe, ref)}
                                    error={errors[`supervision_${classe}`]}
                                />
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Résumé de couverture */}
            {vacancies.length > 1 &&
                (() => {
                    const covered = vacancies.filter(
                        (v) => classSupervision[v.classe]
                    ).length;
                    return (
                        <p className="text-xs text-gray-400">
                            {covered}/{vacancies.length} classe
                            {vacancies.length > 1 ? "s" : ""} couverte
                            {covered > 1 ? "s" : ""}
                        </p>
                    );
                })()}
        </div>
    );
}
