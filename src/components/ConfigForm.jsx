import { useState } from "react";
import StepHelp from "./StepHelp";
import Section from "./ui/Section";
import Field from "./ui/Field";
import { cx } from "./ui/cx";
import AdultSelector from "./AdultSelector";
import CrisisCellSection from "./config-form/CrisisCellSection";
import ClassSupervisionSection from "./config-form/ClassSupervisionSection";
import ExtraTeachersSection from "./config-form/ExtraTeachersSection";
import StaffCardDisplay from "./config-form/StaffCardDisplay";
import { useConfigForm } from "../hooks/useConfigForm";
import { emptyAdult, FONCTIONS_ZONE } from "../utils/config/defaults";
import { getAdultId } from "../utils/config/adultId";
import { getRattachementLabel } from "../utils/config/rattachement";

export default function ConfigForm({
    classes,
    teacherByClass = {},
    onSubmit,
    onBack,
    initialConfig,
}) {
    const form = useConfigForm(classes, initialConfig);
    const [showFormatOptions, setShowFormatOptions] = useState(false);

    const { config, errors, isRestored, reset, vacancies, assignedIds } = form;

    const handleSubmit = (e) => {
        e.preventDefault();
        form.submit(onSubmit);
    };

    // ── Dérivés ────────────────────────────────────────────────────────────
    const multiZone = config.zones.length > 1;
    const showClassMap = config.configType === "B" && multiZone;
    const docCount = (config.configType === "A" ? 1 : config.zones.length) + 1;
    const hasErrors = Object.keys(errors).length > 0;

    const extrasCount = Object.values(config.classExtraTeachers || {}).reduce(
        (acc, arr) => acc + (arr?.filter((et) => et.nom.trim()).length || 0),
        0
    );

    const summaryParts = [
        config.schoolName || "École non définie",
        `Option ${config.configType}`,
        `${config.zones.length} zone${config.zones.length > 1 ? "s" : ""}`,
        extrasCount > 0
            ? `${extrasCount} décharge${extrasCount > 1 ? "s" : ""}`
            : null,
        vacancies.length > 0
            ? `${vacancies.length} vacance${vacancies.length > 1 ? "s" : ""}`
            : null,
        `→ ${docCount} doc${docCount > 1 ? "s" : ""}`,
    ]
        .filter(Boolean)
        .join("  ·  ");

    // ── Rendu ──────────────────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8 pb-28">
            {/* ── Bannière restauration ───────────────────────────────── */}
            {isRestored && (
                <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-amber-800">
                        <span>🔄</span>
                        <span>
                            Configuration restaurée depuis votre dernière
                            session.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={reset}
                        className="text-xs text-amber-700 hover:text-amber-900 underline shrink-0"
                    >
                        Réinitialiser
                    </button>
                </div>
            )}

            {/* ── Aide contextuelle ───────────────────────────────────── */}
            <StepHelp
                stepKey="step_config"
                title="Comment configurer votre PPMS ?"
            >
                <div className="pt-3 space-y-2 text-sm">
                    <p>
                        <strong>1. Cellule de crise</strong> — Désigner le/la
                        directeur/trice (ou faisant fonction) qui coordonne la
                        gestion de l'événement depuis le poste de commandement.
                    </p>
                    <p>
                        <strong>2. Zones de mise en sûreté</strong> — Nommer
                        chaque espace de confinement (gymnase, salle
                        polyvalente, couloir…) et désigner son responsable.
                    </p>
                    <p>
                        <strong>3. Supervision des classes</strong> — Si un(e)
                        enseignant(e) est désigné(e) à un rôle PPMS, sa classe
                        doit être confiée à un autre adulte. Cette section
                        apparaît automatiquement si nécessaire.
                    </p>
                    <p className="text-blue-700">
                        💡 Le bouton « Générer » s'active dès que toutes les
                        informations obligatoires sont renseignées.
                    </p>
                </div>
            </StepHelp>

            {/* ── 1. École ────────────────────────────────────────────── */}
            <Section title="École">
                <Field label="Nom de l'école" error={errors.schoolName}>
                    <input
                        type="text"
                        placeholder="École élémentaire Jean Moulin"
                        value={config.schoolName}
                        onChange={(e) =>
                            form.setField("schoolName", e.target.value)
                        }
                        className={cx(errors.schoolName)}
                    />
                </Field>
            </Section>

            {/* ── 2. Format ───────────────────────────────────────────── */}
            <Section title="Format des fiches">
                {!showFormatOptions ? (
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">
                                {config.configType === "B" ? "📋" : "📄"}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800">
                                    {config.configType === "B"
                                        ? "Option B — Fiche par classe"
                                        : "Option A — Fiche unique"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {config.configType === "B"
                                        ? `${classes.length} classes · 1 fiche par enseignant + synthèse cellule de crise`
                                        : `${classes.length} classe${classes.length > 1 ? "s" : ""} · tous les élèves sur un seul document`}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFormatOptions(true)}
                            className="text-xs text-blue-700 hover:text-blue-900 hover:underline shrink-0 transition-colors"
                        >
                            Modifier ▾
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {classes.length > 3 && (
                            <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-amber-800">
                                💡{" "}
                                <strong>
                                    {classes.length} classes détectées
                                </strong>{" "}
                                — l'option B est recommandée.
                            </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                {
                                    id: "A",
                                    icon: "📄",
                                    label: "Option A — Fiche unique",
                                    desc: "Tous les élèves et adultes sur un seul document. Adapté aux petites écoles.",
                                },
                                {
                                    id: "B",
                                    icon: "📋",
                                    label: "Option B — Fiche par classe",
                                    desc: "1 fiche par enseignant + synthèse cellule de crise. Recommandé au-delà de 3 classes.",
                                },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                        form.setField("configType", opt.id);
                                        setShowFormatOptions(false);
                                    }}
                                    className={`text-left rounded-xl border-2 p-4 transition-colors
                                        ${
                                            config.configType === opt.id
                                                ? "border-blue-700 bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-blue-300"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                            className={`w-4 h-4 rounded-full border-2 shrink-0
                                            ${
                                                config.configType === opt.id
                                                    ? "border-blue-700 bg-blue-700"
                                                    : "border-gray-300"
                                            }`}
                                        />
                                        <span className="text-base">
                                            {opt.icon}
                                        </span>
                                        <span className="font-semibold text-sm text-gray-800">
                                            {opt.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 pl-6">
                                        {opt.desc}
                                    </p>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFormatOptions(false)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕ Réduire
                        </button>
                    </div>
                )}
            </Section>

            {/* ── 3. Cellule de crise ─────────────────────────────────── */}
            <Section title="Cellule de crise">
                <CrisisCellSection
                    crisis={config.crisis}
                    onChange={(crisis) => form.setField("crisis", crisis)}
                    teachers={teacherByClass}
                    staff={config.staff}
                    assignedIds={assignedIds}
                    classSupervision={config.classSupervision ?? {}}
                    errors={errors}
                />
            </Section>

            {/* ── 4. Zones de mise en sûreté ──────────────────────────── */}
            <Section title="Zones de mise en sûreté">
                <div className="space-y-4">
                    {config.zones.map((zone, idx) => (
                        <div
                            key={zone.id}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">
                                    Zone {idx + 1}
                                </span>
                                {config.zones.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => form.removeZone(zone.id)}
                                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        Supprimer
                                    </button>
                                )}
                            </div>

                            <Field
                                label="Lieu de confinement"
                                error={errors[`zone_${zone.id}_name`]}
                            >
                                <input
                                    type="text"
                                    placeholder="Gymnase, salle polyvalente, couloir condamnable…"
                                    value={zone.name}
                                    onChange={(e) =>
                                        form.updateZoneName(
                                            zone.id,
                                            e.target.value
                                        )
                                    }
                                    className={cx(
                                        errors[`zone_${zone.id}_name`]
                                    )}
                                />
                            </Field>

                            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Responsable de zone
                                </p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Centralise les fiches et les remonte à la
                                    cellule de crise.
                                    {multiZone
                                        ? " Doit être différent du/de la responsable cellule."
                                        : ""}
                                </p>
                                <AdultSelector
                                    value={
                                        config.zoneResponsibles?.[zone.id] ||
                                        emptyAdult("Responsable de zone")
                                    }
                                    onChange={(v) =>
                                        form.setZoneResponsible(zone.id, v)
                                    }
                                    teachers={teacherByClass}
                                    staff={config.staff}
                                    fonctionOptions={FONCTIONS_ZONE}
                                    excludeIds={[...assignedIds].filter(
                                        (id) =>
                                            id !==
                                            getAdultId(
                                                config.zoneResponsibles?.[
                                                    zone.id
                                                ]
                                            )
                                    )}
                                    error={
                                        errors[`zone_${zone.id}_responsible`]
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="space-y-1 mt-2">
                    <button
                        type="button"
                        onClick={form.addZone}
                        className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                    >
                        <span className="text-lg leading-none">＋</span> Ajouter
                        une zone
                    </button>
                    <p className="text-xs text-gray-400 pl-6">
                        Uniquement si votre école comporte plusieurs espaces de
                        confinement séparés.
                    </p>
                </div>
            </Section>

            {/* ── 5. Affectation classes → zones ──────────────────────── */}
            {showClassMap && (
                <Section title="Affectation des classes aux zones">
                    <p className="text-sm text-gray-500 mb-3">
                        Indiquer dans quelle zone chaque classe se confine.
                    </p>
                    <div className="space-y-2">
                        {classes.map((cl) => (
                            <div
                                key={cl}
                                className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg px-4 py-2.5"
                            >
                                <span className="text-sm font-medium text-gray-700 w-28 shrink-0">
                                    {cl}
                                </span>
                                <select
                                    value={
                                        config.classZoneMap[cl] ||
                                        config.zones[0]?.id
                                    }
                                    onChange={(e) =>
                                        form.setClassZone(cl, e.target.value)
                                    }
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {config.zones.map((z, i) => (
                                        <option key={z.id} value={z.id}>
                                            Zone {i + 1}
                                            {z.name ? ` — ${z.name}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ── 6. Supervision des classes vacantes ─────────────────── */}
            {vacancies.length > 0 && (
                <Section title="⚠️ Supervision des classes">
                    <ClassSupervisionSection
                        vacancies={vacancies}
                        classSupervision={config.classSupervision ?? {}}
                        onChange={form.setSupervision}
                        teachers={teacherByClass}
                        config={config}
                        assignedIds={assignedIds}
                        errors={errors}
                    />
                </Section>
            )}

            {/* ── 7. Co-titulaires et décharges ───────────────────────── */}
            <Section title="Co-titulaires et décharges">
                <ExtraTeachersSection
                    classes={classes}
                    teacherByClass={teacherByClass}
                    classExtraTeachers={config.classExtraTeachers || {}}
                    onAdd={form.addExtraTeacher}
                    onUpdate={form.updateExtraTeacher}
                    onRemove={form.removeExtraTeacher}
                    extrasCount={extrasCount}
                />
            </Section>

            {/* ── 8. Autres adultes — lecture seule ───────────────────── */}
            <Section title="Autres adultes">
                <p className="text-sm text-gray-500">
                    AESH, ATSEM, entretien, service civique… déclarés à l'étape
                    précédente. Ces adultes sont disponibles comme responsables
                    de zone ou superviseurs de classe.
                </p>

                {config.staff.length > 0 ? (
                    <div className="space-y-2 mt-3">
                        {config.staff.map((s) => (
                            <StaffCardDisplay
                                key={s.id}
                                staff={s}
                                rattachementLabel={getRattachementLabel(
                                    s.rattachement,
                                    config.zones
                                )}
                                hasError={false}
                                // Pas de onEdit / onRemove — lecture seule à cette étape
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className="text-gray-400 text-lg">👤</span>
                        <p className="text-sm text-gray-500">
                            Aucun adulte déclaré.{" "}
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-blue-700 hover:underline"
                            >
                                Retourner à l'étape précédente
                            </button>{" "}
                            pour en ajouter.
                        </p>
                    </div>
                )}

                {/* Lignes vierges — reste configurable ici */}
                <div className="flex items-center gap-3 mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <label className="text-sm text-gray-600 flex-1">
                        Lignes vierges pour intervenants / personnels variables
                        du jour
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="20"
                        value={config.blankIntervenantRows}
                        onChange={(e) =>
                            form.setField(
                                "blankIntervenantRows",
                                Math.max(0, parseInt(e.target.value) || 0)
                            )
                        }
                        className="w-16 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                </div>
            </Section>

            {/* ── Barre sticky ────────────────────────────────────────── */}
            <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
                <p className="text-xs text-gray-400 mb-2 truncate">
                    {summaryParts}
                </p>
                {hasErrors && (
                    <p className="text-xs text-red-600 mb-2 flex items-center gap-1.5">
                        <span aria-hidden="true">⚠️</span>
                        {Object.keys(errors).length} point
                        {Object.keys(errors).length > 1 ? "s" : ""} à corriger
                        avant de générer.
                    </p>
                )}
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        ← Retour à l'aperçu
                    </button>
                    <button
                        type="submit"
                        disabled={hasErrors}
                        className={`px-6 py-2 text-sm rounded-lg font-medium transition-colors
                            ${
                                hasErrors
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-800 text-white hover:bg-blue-900"
                            }`}
                    >
                        Générer les fiches →
                    </button>
                </div>
            </div>
        </form>
    );
}
