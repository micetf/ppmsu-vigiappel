/**
 * CrisisCellSection.jsx
 * ─────────────────────
 * Section "Cellule de crise" de ConfigForm.
 *
 * Props :
 *   crisis            { responsible: AdultRef, members: AdultRef[] }
 *   onChange          (crisis) => void
 *   teachers          { [className]: fullName }
 *   staff             [{ id, nom, prenom, fonction }]
 *   assignedIds       Set<string>
 *   classSupervision  Record<classe, AdultRef|null>  ← nouveau
 *   errors            objet d'erreurs
 */

import AdultSelector from "../AdultSelector";
import { emptyAdult } from "../../utils/config/defaults";
import { getAdultId } from "../../utils/config/adultId";

// ── Sous-composant : badge d'état de la classe ────────────────────────────────
// Affiche ⚠️ si la vacance n'est pas couverte, ✅ si elle l'est.

function VacancyBadge({ teacherClass, classSupervision }) {
    if (!teacherClass) return null;

    const isCovered = !!classSupervision?.[teacherClass];

    if (isCovered) {
        return (
            <p className="mt-1.5 text-xs text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <span aria-hidden="true">✅</span>
                Classe <strong>{teacherClass}</strong> — superviseur désigné.
            </p>
        );
    }

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
    classSupervision,
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
                <VacancyBadge
                    teacherClass={member.teacherClass}
                    classSupervision={classSupervision}
                />
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
    classSupervision = {},
    errors = {},
}) {
    const responsible = crisis?.responsible ?? emptyAdult("Directeur/trice");
    const members = crisis?.members ?? [];

    // ── Mutations ─────────────────────────────────────────────────

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

    // ── excludeIds par sélecteur ──────────────────────────────────

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
                    Généralement le/la directeur/trice.
                </p>
                <AdultSelector
                    value={responsible}
                    onChange={setResponsible}
                    teachers={teachers}
                    staff={staff}
                    excludeIds={excludeForResponsible}
                    error={errors.crisisResponsible}
                    // Pas de fonctionOptions : le fallback "Directeur/trice"
                    // dans le docx couvre le cas courant. La saisie manuelle
                    // permet de préciser si nécessaire (faisant-fonction, etc.)
                />
                {responsible.source === "teacher" &&
                    responsible.teacherClass && (
                        <VacancyBadge
                            teacherClass={responsible.teacherClass}
                            classSupervision={classSupervision}
                        />
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
                                classSupervision={classSupervision}
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
                Optionnel. Adultes qui assistent le/la responsable sans gérer de
                classe pendant le PPMS.
            </p>
        </div>
    );
}
