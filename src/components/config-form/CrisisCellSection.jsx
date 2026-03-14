/**
 * CrisisCellSection.jsx
 * ─────────────────────
 * Section "Cellule de crise" de ConfigForm.
 * Remplace le bloc inline AdultSelector + showSubstitute de l'ancienne version.
 *
 * Responsabilités :
 * - Sélection du responsable principal (obligatoire, R5)
 * - Liste éditable des membres supplémentaires (0-N)
 * - Badge ⚠️ si un enseignant sélectionné quitte sa classe (R2)
 * - Exclusion des adultes déjà affectés dans les options (R1)
 *
 * Props :
 *   crisis       { responsible: AdultRef, members: AdultRef[] }
 *   onChange     (crisis) => void  — remplace l'intégralité de crisis
 *   teachers     { [className]: fullName }
 *   staff        [{ id, nom, prenom, fonction }]
 *   assignedIds  Set<string> des IDs déjà pris dans la config globale
 *   errors       objet d'erreurs du formulaire
 */

import AdultSelector from "../AdultSelector";
import { emptyAdult, FONCTIONS_CRISE } from "../../utils/config/defaults";
import { getAdultId } from "../../utils/config/adultId";

// ── Sous-composant : badge de vacance ─────────────────────────────────────────

function VacancyBadge({ teacherClass }) {
    if (!teacherClass) return null;
    return (
        <p className="mt-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <span aria-hidden="true">⚠️</span>
            Classe <strong>{teacherClass}</strong> sans encadrant — à couvrir
            dans la section « Supervision des classes » ci-dessous.
        </p>
    );
}

// ── Sous-composant : ligne membre ─────────────────────────────────────────────

function MemberRow({
    member,
    idx,
    onChange,
    onRemove,
    teachers,
    staff,
    excludeIds,
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Membre {idx + 1}
                </span>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    aria-label={`Supprimer le membre ${idx + 1}`}
                >
                    Supprimer
                </button>
            </div>
            <AdultSelector
                value={member}
                onChange={onChange}
                teachers={teachers}
                staff={staff}
                excludeIds={excludeIds}
            />
            {member.source === "teacher" && member.teacherClass && (
                <VacancyBadge teacherClass={member.teacherClass} />
            )}
        </div>
    );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function CrisisCellSection({
    crisis,
    onChange,
    teachers = {},
    staff = [],
    assignedIds = new Set(),
    errors = {},
}) {
    const responsible = crisis?.responsible ?? emptyAdult("Directeur/trice");
    const members = crisis?.members ?? [];

    // ── Helpers de mutation ───────────────────────────────────────

    const setResponsible = (ref) =>
        onChange({ ...crisis, responsible: ref, members });

    const addMember = () =>
        onChange({
            ...crisis,
            responsible,
            members: [...members, emptyAdult()],
        });

    const updateMember = (idx, ref) => {
        const next = [...members];
        next[idx] = ref;
        onChange({ ...crisis, responsible, members: next });
    };

    const removeMember = (idx) =>
        onChange({
            ...crisis,
            responsible,
            members: members.filter((_, i) => i !== idx),
        });

    // ── excludeIds pour chaque sélecteur ─────────────────────────
    // Principe : un adulte ne peut tenir qu'un seul rôle (R1).
    // Pour le responsable : exclure tous les assignés SAUF lui-même.
    // Pour chaque membre  : exclure tous les assignés SAUF lui-même.

    const responsibleId = getAdultId(responsible);
    const excludeForResponsible = [...assignedIds].filter(
        (id) => id !== responsibleId
    );

    // ── Rendu ─────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* ── Responsable principal ─────────────────────────── */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Responsable principal{" "}
                    <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                    Dirige la cellule de crise, communique avec les secours
                    (SAMU 15, Police 17, Pompiers 18), l'IEN et la mairie.
                </p>
                <AdultSelector
                    value={responsible}
                    onChange={setResponsible}
                    teachers={teachers}
                    staff={staff}
                    fonctionOptions={FONCTIONS_CRISE}
                    excludeIds={excludeForResponsible}
                    error={errors.crisisResponsible}
                />
                {responsible.source === "teacher" &&
                    responsible.teacherClass && (
                        <VacancyBadge teacherClass={responsible.teacherClass} />
                    )}
            </div>

            {/* ── Membres supplémentaires ───────────────────────── */}
            {members.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Membres supplémentaires
                    </p>
                    {members.map((member, idx) => {
                        const memberId = getAdultId(member);
                        const excludeForMember = [...assignedIds].filter(
                            (id) => id !== memberId
                        );
                        return (
                            <MemberRow
                                key={idx}
                                member={member}
                                idx={idx}
                                onChange={(ref) => updateMember(idx, ref)}
                                onRemove={() => removeMember(idx)}
                                teachers={teachers}
                                staff={staff}
                                excludeIds={excludeForMember}
                            />
                        );
                    })}
                </div>
            )}

            {/* ── Bouton ajouter un membre ──────────────────────── */}
            <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
            >
                <span className="text-lg leading-none" aria-hidden="true">
                    ＋
                </span>
                Ajouter un membre à la cellule
            </button>
            <p className="text-xs text-gray-400 pl-6 -mt-2">
                Optionnel. Adultes qui assistent le/la responsable et ne gèrent
                pas de classe pendant le PPMS.
            </p>
        </div>
    );
}
