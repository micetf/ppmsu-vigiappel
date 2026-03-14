import { useState } from "react";
import { validateConfig, getAvailableForRole } from "../utils/configHelpers";
import ZoneEditor from "./ZoneEditor";
import ClassZoneMapper from "./ClassZoneMapper";
import AdultOverridePanel from "./AdultOverridePanel";
import StepHelp from "./StepHelp";

let _zoneSeq = 0;
const newZoneId = () => `z${++_zoneSeq}`;

export default function ConfigForm({
    classes,
    adults,
    initialConfig,
    onSubmit,
    onBack,
}) {
    const [config, setConfig] = useState(initialConfig);

    // ── Helpers génériques ───────────────────────────────────────────
    const patch = (partial) => setConfig((prev) => ({ ...prev, ...partial }));

    // ── Zones ────────────────────────────────────────────────────────
    const addZone = () => {
        const id = newZoneId();
        patch({
            zones: [
                ...config.zones,
                { id, displayName: "", responsibleAdultId: null },
            ],
            classZoneMap: { ...config.classZoneMap },
        });
    };

    const updateZone = (id, field, value) =>
        patch({
            zones: config.zones.map((z) =>
                z.id === id ? { ...z, [field]: value } : z
            ),
        });

    const removeZone = (id) => {
        // Réaffecter les classes de cette zone vers la première zone restante
        const remaining = config.zones.filter((z) => z.id !== id);
        const fallback = remaining[0]?.id ?? null;
        const newMap = Object.fromEntries(
            Object.entries(config.classZoneMap).map(([clId, zId]) => [
                clId,
                zId === id ? fallback : zId,
            ])
        );
        patch({ zones: remaining, classZoneMap: newMap });
    };

    const updateClassZone = (classId, zoneId) =>
        patch({ classZoneMap: { ...config.classZoneMap, [classId]: zoneId } });

    // ── Overrides adultes ────────────────────────────────────────────
    const setOverride = (adultId, assignedClassId) => {
        const overrides = { ...config.adultOverrides };
        if (assignedClassId === null) {
            delete overrides[adultId];
        } else {
            overrides[adultId] = { assignedClassId };
        }
        patch({ adultOverrides: overrides });
    };

    // ── Validation ───────────────────────────────────────────────────
    const { errors, warnings, valid } = validateConfig(config, classes, adults);

    const handleSubmit = () => {
        if (valid) onSubmit(config);
    };

    // ── Adultes disponibles pour la cellule de crise ─────────────────
    const crisisOptions = [
        { value: "", label: "— Non renseigné —" },
        ...getAvailableForRole(config.crisisCellAdultId, config, adults).map(
            (a) => ({
                value: a.id,
                label: [a.nom, a.prenom].filter(Boolean).join(" "),
            })
        ),
    ];

    return (
        <div className="space-y-8 pb-24">
            <StepHelp stepKey="step3" title="Comment configurer le PPMS ?">
                <div className="pt-3 space-y-2 text-sm">
                    <p>
                        <strong>🔵 Cellule de crise</strong> — L'adulte désigné
                        ne sera pas affecté à l'encadrement d'une classe.
                    </p>
                    <p>
                        <strong>🗺 Zones</strong> — Chaque zone correspond à un
                        secteur de mise en sûreté. Attribuez un responsable
                        adulte et rattachez-y les classes.
                    </p>
                    <p>
                        <strong>🔄 Overrides</strong> — Si un adulte encadre une
                        classe différente de son rattachement habituel (ex.
                        décharge), modifiez-le ici.
                    </p>
                </div>
            </StepHelp>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 3 – Configuration PPMS
                </h2>
                <p className="text-sm text-gray-500">
                    {classes.length} classe{classes.length > 1 ? "s" : ""} ·{" "}
                    {adults.length} adultes · {config.zones.length} zone
                    {config.zones.length > 1 ? "s" : ""}
                </p>
            </div>

            {/* ── A. Infos générales ─────────────────────────────────── */}
            <Section title="Informations générales">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Nom de l'école</label>
                        <input
                            type="text"
                            value={config.schoolName}
                            onChange={(e) =>
                                patch({ schoolName: e.target.value })
                            }
                            placeholder="École primaire Jean Moulin"
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Type de configuration</label>
                        <select
                            value={config.configType}
                            onChange={(e) =>
                                patch({ configType: e.target.value })
                            }
                            className="input"
                        >
                            <option value="A">
                                Type A — Petite école (≤ 3 classes)
                            </option>
                            <option value="B">
                                Type B — École standard (4+ classes)
                            </option>
                        </select>
                    </div>
                    <div>
                        <label className="label">
                            Lignes vides « intervenant » sur les fiches
                        </label>
                        <input
                            type="number"
                            min={0}
                            max={10}
                            value={config.blankIntervenantRows}
                            onChange={(e) =>
                                patch({
                                    blankIntervenantRows: Number(
                                        e.target.value
                                    ),
                                })
                            }
                            className="input w-24"
                        />
                    </div>
                </div>
            </Section>

            {/* ── B. Cellule de crise ────────────────────────────────── */}
            <Section title="Cellule de crise">
                <div className="max-w-sm">
                    <label className="label">Responsable de la cellule</label>
                    <select
                        value={config.crisisCellAdultId ?? ""}
                        onChange={(e) =>
                            patch({ crisisCellAdultId: e.target.value || null })
                        }
                        className="input"
                    >
                        {crisisOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">
                        Cet adulte sera exclu de l'encadrement des classes.
                    </p>
                </div>
            </Section>

            {/* ── C. Zones ───────────────────────────────────────────── */}
            <Section title="Zones de mise en sûreté">
                <div className="space-y-3">
                    {config.zones.map((zone) => (
                        <ZoneEditor
                            key={zone.id}
                            zone={zone}
                            adults={adults}
                            config={config}
                            onUpdate={updateZone}
                            onRemove={
                                config.zones.length > 1 ? removeZone : null
                            }
                        />
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addZone}
                    className="mt-2 flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 transition-colors"
                >
                    <span className="text-lg leading-none">＋</span> Ajouter une
                    zone
                </button>
            </Section>

            {/* ── D. Classes → zones ─────────────────────────────────── */}
            <Section title="Affectation des classes aux zones">
                <ClassZoneMapper
                    classes={classes}
                    zones={config.zones}
                    classZoneMap={config.classZoneMap}
                    onUpdate={updateClassZone}
                />
            </Section>

            {/* ── E. Overrides adultes ───────────────────────────────── */}
            <Section title="Rattachements exceptionnels">
                <AdultOverridePanel
                    adults={adults}
                    classes={classes}
                    config={config}
                    onSetOverride={setOverride}
                />
            </Section>

            {/* ── Erreurs / avertissements ───────────────────────────── */}
            {(errors.length > 0 || warnings.length > 0) && (
                <div className="space-y-2">
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 space-y-1">
                            <p className="text-sm font-semibold text-red-700">
                                {errors.length} erreur
                                {errors.length > 1 ? "s" : ""} bloquante
                                {errors.length > 1 ? "s" : ""}
                            </p>
                            <ul className="list-disc list-inside space-y-0.5">
                                {errors.map((e, i) => (
                                    <li
                                        key={i}
                                        className="text-xs text-red-600"
                                    >
                                        {e.msg}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {warnings.length > 0 && (
                        <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 space-y-1">
                            <p className="text-sm font-semibold text-yellow-700">
                                {warnings.length} avertissement
                                {warnings.length > 1 ? "s" : ""}
                            </p>
                            <ul className="list-disc list-inside space-y-0.5">
                                {warnings.map((w, i) => (
                                    <li
                                        key={i}
                                        className="text-xs text-yellow-700"
                                    >
                                        {w.msg}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* ── Barre sticky ───────────────────────────────────────── */}
            <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <button
                        type="button"
                        onClick={onBack}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        ← Retour aux adultes
                    </button>
                    <div className="flex items-center gap-3">
                        {valid && (
                            <p className="text-xs text-green-700 font-medium">
                                ✓ Configuration valide
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!valid}
                            className="px-6 py-2 text-sm bg-blue-800 text-white rounded-lg hover:bg-blue-900 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Générer les fiches →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">
                {title}
            </h3>
            {children}
        </div>
    );
}
