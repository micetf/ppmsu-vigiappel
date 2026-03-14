import { useState } from "react";
import StepHelp from "./StepHelp";
import Section from "./ui/Section";
import Field from "./ui/Field";
import { cx } from "./ui/cx";
import AdultSelector from "./AdultSelector";
import ExtraTeachersSection from "./config-form/ExtraTeachersSection";
import StaffCardEditing from "./config-form/StaffCardEditing";
import StaffCardDisplay from "./config-form/StaffCardDisplay";
import { useConfigForm } from "../hooks/useConfigForm";
import {
    emptyAdult,
    FONCTIONS_CRISE,
    FONCTIONS_ZONE,
} from "../utils/config/defaults";
import {
    getRattachementLabel,
    buildRattachementOptions,
} from "../utils/config/rattachement";

export default function ConfigForm({
    classes,
    teacherByClass = {},
    onSubmit,
    onBack,
    initialConfig,
}) {
    const form = useConfigForm(classes, initialConfig);
    const [showFormatOptions, setShowFormatOptions] = useState(false);
    const [editingStaffIds, setEditingStaffIds] = useState(new Set());

    const { config, errors, isRestored, reset } = form; // alias locaux pour lisibilité du JSX

    const handleSubmit = (e) => {
        e.preventDefault();
        const { valid, staffInError } = form.submit(onSubmit);
        if (!valid && staffInError.length)
            setEditingStaffIds((prev) => new Set([...prev, ...staffInError]));
    };

    // ── Dérivés ────────────────────────────────────────────────────
    const multiZone = config.zones.length > 1;
    const showClassMap = config.configType === "B" && multiZone;
    const docCount = (config.configType === "A" ? 1 : config.zones.length) + 1;
    const extrasCount = Object.values(config.classExtraTeachers || {}).reduce(
        (acc, arr) => acc + (arr?.filter((et) => et.nom.trim()).length || 0),
        0
    );
    const rattachementOptions = buildRattachementOptions(config.zones, classes);
    const summaryParts = [
        config.schoolName || "École non définie",
        `Option ${config.configType}`,
        `${config.zones.length} zone${config.zones.length > 1 ? "s" : ""}`,
        extrasCount > 0
            ? `${extrasCount} décharge${extrasCount > 1 ? "s" : ""}`
            : null,
        `→ ${docCount} doc${docCount > 1 ? "s" : ""}`,
    ]
        .filter(Boolean)
        .join("  ·  ");

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8 pb-28">
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
                        className="text-xs text-amber-700 hover:text-amber-900 underline shrink-0 transition-colors"
                    >
                        Effacer et recommencer
                    </button>
                </div>
            )}

            <StepHelp
                stepKey="step3"
                title="Comment remplir cette configuration ?"
            >
                <div className="pt-3 space-y-2 text-sm">
                    <p>
                        <strong>🏫 Votre école</strong> — Nom et identité du/de
                        la responsable de la cellule de crise.
                    </p>
                    <p>
                        <strong>📍 Zones</strong> — Pour chaque zone, indiquer
                        le lieu et son responsable.
                    </p>
                    <p>
                        <strong>👥 Autres adultes</strong> — AESH, ATSEM,
                        entretien… Les enseignants viennent du CSV.
                    </p>
                </div>
            </StepHelp>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 4 – Configuration des fiches
                </h2>
                <p className="text-sm text-gray-500">
                    Modèle Eduscol PPMS, fascicule 2, février 2024.
                </p>
            </div>

            {/* ── 1. École ────────────────────────────────────────────── */}
            <Section title="Votre école">
                <Field label="Nom de l'école" error={errors.schoolName}>
                    <input
                        type="text"
                        placeholder="École élémentaire Jules Ferry"
                        value={config.schoolName}
                        onChange={(e) =>
                            form.setField("schoolName", e.target.value)
                        }
                        className={cx(errors.schoolName)}
                    />
                </Field>
                <div className="border-2 border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-900">
                            🔒 Responsable de la cellule de crise
                        </p>
                        <span className="text-xs font-semibold text-blue-800 bg-blue-200 px-2 py-0.5 rounded-full">
                            Obligatoire
                        </span>
                    </div>
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Pilote la cellule de crise : appels aux secours (112,
                        IEN, mairie), centralise les bilans.
                    </p>
                    <AdultSelector
                        value={config.crisisCell}
                        onChange={(v) => form.setField("crisisCell", v)}
                        teachers={teacherByClass}
                        staff={config.staff}
                        fonctionOptions={FONCTIONS_CRISE}
                        showSubstitute={true}
                        substituteTitle="Qui encadrera cette classe pendant le PPMS ?"
                        error={errors.crisisCell}
                    />
                </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                {
                                    id: "A",
                                    icon: "📄",
                                    label: "Option A — Fiche unique",
                                    desc: "Tous les élèves sur un même document. Adapté pour les petites écoles (≤ 3 classes).",
                                },
                                {
                                    id: "B",
                                    icon: "📋",
                                    label: "Option B — Fiche par classe",
                                    desc: "1 fiche par enseignant + 1 fiche adultes par zone + 1 synthèse cellule de crise.",
                                },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                        form.setField("configType", opt.id);
                                        setShowFormatOptions(false);
                                    }}
                                    className={`text-left rounded-xl border-2 p-4 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                                        ${config.configType === opt.id ? "border-blue-700 bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"}`}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                            className={`w-4 h-4 rounded-full border-2 shrink-0 ${config.configType === opt.id ? "border-blue-700 bg-blue-700" : "border-gray-300"}`}
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

            {/* ── 3. Zones ────────────────────────────────────────────── */}
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
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Responsable de zone
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                                        Centralise les fiches et les remonte à
                                        la cellule de crise.
                                        {multiZone
                                            ? " Doit être différent du/de la directeur/trice."
                                            : ""}
                                    </p>
                                </div>
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
                                    showSubstitute={true}
                                    substituteTitle="Qui encadrera la classe pendant le PPMS ?"
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
                        Uniquement si votre école comporte plusieurs bâtiments
                        ou espaces de confinement séparés.
                    </p>
                </div>
            </Section>

            {/* ── 4. Affectation classes → zones ──────────────────────── */}
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

            {/* ── 5. Co-titulaires ────────────────────────────────────── */}
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

            {/* ── 6. Autres adultes ───────────────────────────────────── */}
            <Section title="Autres adultes">
                <p className="text-sm text-gray-500">
                    AESH, ATSEM, entretien, service civique… Les membres de la
                    cellule de crise peuvent être rattachés à{" "}
                    <strong>"Cellule de crise"</strong>.
                </p>
                {config.staff.length > 0 && (
                    <div className="space-y-2 mt-1">
                        {config.staff.map((s) =>
                            editingStaffIds.has(s.id) ? (
                                <StaffCardEditing
                                    key={s.id}
                                    staff={s}
                                    onUpdate={(field, value) =>
                                        form.updateStaff(s.id, field, value)
                                    }
                                    onValidate={() =>
                                        setEditingStaffIds((prev) => {
                                            const n = new Set(prev);
                                            n.delete(s.id);
                                            return n;
                                        })
                                    }
                                    onRemove={() => form.removeStaff(s.id)}
                                    rattachementOptions={rattachementOptions}
                                    errors={errors}
                                />
                            ) : (
                                <StaffCardDisplay
                                    key={s.id}
                                    staff={s}
                                    rattachementLabel={getRattachementLabel(
                                        s.rattachement,
                                        config.zones
                                    )}
                                    hasError={
                                        !!errors[`staff_${s.id}_nom`] ||
                                        !!errors[`staff_${s.id}_rattachement`]
                                    }
                                    onEdit={() =>
                                        setEditingStaffIds(
                                            (prev) => new Set([...prev, s.id])
                                        )
                                    }
                                    onRemove={() => form.removeStaff(s.id)}
                                />
                            )
                        )}
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => {
                        const id = form.addStaff();
                        setEditingStaffIds((prev) => new Set([...prev, id]));
                    }}
                    className="mt-2 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                >
                    <span className="text-lg leading-none">＋</span> Ajouter un
                    personnel
                </button>
                <div className="flex items-center gap-3 mt-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
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
                        className="px-6 py-2 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors"
                    >
                        Générer les fiches →
                    </button>
                </div>
            </div>
        </form>
    );
}
