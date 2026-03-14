import { useState } from "react";
import { toNom, toPrenom, fullName } from "../utils/formatName";
import StepHelp from "./StepHelp";
import AdultSelector from "./AdultSelector";

// ── Factories ──────────────────────────────────────────────────────
let _zoneId = 1;
const newZoneId = () => `z${++_zoneId}`;

let _staffId = 0;
const newStaff = () => ({
    id: `s${++_staffId}`,
    nom: "",
    prenom: "",
    fonction: "",
    rattachement: "",
});

// ── Valeur adulte vide ─────────────────────────────────────────────
const emptyAdult = (defaultFonction = "") => ({
    source: "manual",
    teacherClass: "",
    staffId: "",
    nom: "",
    prenom: "",
    fonction: defaultFonction,
    substitute: null,
});

// ── Constantes ─────────────────────────────────────────────────────
const FONCTIONS_CRISE = [
    "Directeur/trice",
    "Directeur/trice adjoint(e)",
    "Enseignant(e) faisant fonction",
];

const FONCTIONS_ZONE = [
    "Responsable de zone",
    "Enseignant(e)",
    "AESH",
    "ATSEM",
    "Personnel entretien/cantine",
    "Autre",
];

const FONCTIONS_STAFF = [
    "AESH",
    "ATSEM",
    "Service civique",
    "Maître E (RASED)",
    "Psychologue EN (RASED)",
    "Personnel entretien/cantine",
    "Intervenant(e)",
    "Autre",
];

const DEFAULTS = {
    schoolName: "",
    configType: "A",
    zones: [{ id: "z1", name: "" }],
    classZoneMap: {},
    crisisCell: emptyAdult("Directeur/trice"),
    zoneResponsibles: { z1: emptyAdult("Responsable de zone") },
    classExtraTeachers: {},
    staff: [],
    blankIntervenantRows: 5,
};

// ── Composant principal ────────────────────────────────────────────
export default function ConfigForm({
    classes,
    teacherByClass = {},
    onSubmit,
    onBack,
    initialConfig,
}) {
    const [config, setConfig] = useState(() => {
        if (initialConfig) return initialConfig;
        return {
            ...DEFAULTS,
            configType: classes.length > 3 ? "B" : "A",
            classZoneMap: Object.fromEntries(classes.map((cl) => [cl, "z1"])),
        };
    });
    const [errors, setErrors] = useState({});
    const [showFormatOptions, setShowFormatOptions] = useState(false);
    const [editingStaffIds, setEditingStaffIds] = useState(new Set());

    // ── Setters ────────────────────────────────────────────────────
    const setField = (field, value) => {
        setConfig((p) => ({ ...p, [field]: value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
    };

    // ── Zones ──────────────────────────────────────────────────────
    const updateZoneName = (id, name) =>
        setConfig((p) => ({
            ...p,
            zones: p.zones.map((z) => (z.id === id ? { ...z, name } : z)),
        }));

    const setZoneResponsible = (zoneId, value) =>
        setConfig((p) => ({
            ...p,
            zoneResponsibles: { ...p.zoneResponsibles, [zoneId]: value },
        }));

    const addZone = () => {
        const id = newZoneId();
        setConfig((p) => ({
            ...p,
            zones: [...p.zones, { id, name: "" }],
            zoneResponsibles: {
                ...p.zoneResponsibles,
                [id]: emptyAdult("Responsable de zone"),
            },
        }));
    };

    const removeZone = (id) =>
        setConfig((p) => {
            const zones = p.zones.filter((z) => z.id !== id);
            const fallback = zones[0]?.id;
            const { [id]: _removed, ...restResponsibles } =
                p.zoneResponsibles || {};
            const classZoneMap = Object.fromEntries(
                Object.entries(p.classZoneMap).map(([cl, zid]) => [
                    cl,
                    zid === id ? fallback : zid,
                ])
            );
            const staff = p.staff.map((s) =>
                s.rattachement === id
                    ? { ...s, rattachement: fallback ?? "" }
                    : s
            );
            return {
                ...p,
                zones,
                classZoneMap,
                staff,
                zoneResponsibles: restResponsibles,
            };
        });

    const setClassZone = (cl, zoneId) =>
        setConfig((p) => ({
            ...p,
            classZoneMap: { ...p.classZoneMap, [cl]: zoneId },
        }));

    // ── Extra teachers ─────────────────────────────────────────────
    const addExtraTeacher = (cl) =>
        setConfig((p) => ({
            ...p,
            classExtraTeachers: {
                ...p.classExtraTeachers,
                [cl]: [
                    ...(p.classExtraTeachers[cl] || []),
                    { nom: "", prenom: "", fonction: "Décharge" },
                ],
            },
        }));

    const updateExtraTeacher = (cl, idx, field, value) =>
        setConfig((p) => {
            const list = [...(p.classExtraTeachers[cl] || [])];
            list[idx] = { ...list[idx], [field]: value };
            return {
                ...p,
                classExtraTeachers: { ...p.classExtraTeachers, [cl]: list },
            };
        });

    const removeExtraTeacher = (cl, idx) =>
        setConfig((p) => {
            const list = (p.classExtraTeachers[cl] || []).filter(
                (_, i) => i !== idx
            );
            return {
                ...p,
                classExtraTeachers: { ...p.classExtraTeachers, [cl]: list },
            };
        });

    // ── Staff ──────────────────────────────────────────────────────
    const addStaff = () => {
        const s = newStaff();
        setConfig((p) => ({ ...p, staff: [...p.staff, s] }));
        setEditingStaffIds((prev) => new Set([...prev, s.id]));
    };

    const updateStaff = (id, field, value) => {
        setConfig((p) => ({
            ...p,
            staff: p.staff.map((s) =>
                s.id === id ? { ...s, [field]: value } : s
            ),
        }));
        setErrors((p) => ({ ...p, [`staff_${id}_${field}`]: undefined }));
    };

    const removeStaff = (id) => {
        setConfig((p) => ({ ...p, staff: p.staff.filter((s) => s.id !== id) }));
        setEditingStaffIds((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
        });
    };

    // ── Validation ─────────────────────────────────────────────────
    const validateAdult = (adult) => {
        if (!adult) return "Champ obligatoire";
        if (adult.source === "manual" && !adult.nom?.trim())
            return "Champ obligatoire";
        if (adult.source === "teacher" && !adult.teacherClass)
            return "Champ obligatoire";
        if (adult.source === "staff" && !adult.staffId)
            return "Champ obligatoire";
        return null;
    };

    const validate = () => {
        const e = {};
        if (!config.schoolName.trim()) e.schoolName = "Champ obligatoire";

        const ccErr = validateAdult(config.crisisCell);
        if (ccErr) e.crisisCell = ccErr;

        config.zones.forEach((z) => {
            if (!z.name.trim()) e[`zone_${z.id}_name`] = "Champ obligatoire";
            const respErr = validateAdult(config.zoneResponsibles?.[z.id]);
            if (respErr) e[`zone_${z.id}_responsible`] = respErr;
        });

        config.staff.forEach((s) => {
            if (!s.nom.trim()) e[`staff_${s.id}_nom`] = "Obligatoire";
            if (!s.rattachement)
                e[`staff_${s.id}_rattachement`] = "Obligatoire";
        });

        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            const staffInError = config.staff
                .filter(
                    (s) =>
                        errs[`staff_${s.id}_nom`] ||
                        errs[`staff_${s.id}_rattachement`]
                )
                .map((s) => s.id);
            if (staffInError.length)
                setEditingStaffIds(
                    (prev) => new Set([...prev, ...staffInError])
                );
            return;
        }
        onSubmit(config);
    };

    // ── Dérivés ────────────────────────────────────────────────────
    const multiZone = config.zones.length > 1;
    const showClassMap = config.configType === "B" && multiZone;
    const docCount = (config.configType === "A" ? 1 : config.zones.length) + 1;

    const extrasCount = Object.values(config.classExtraTeachers || {}).reduce(
        (acc, arr) => acc + (arr?.filter((et) => et.nom.trim()).length || 0),
        0
    );

    const getRattachementLabel = (rattachement) => {
        if (!rattachement) return "⚠️ Non rattaché";
        if (rattachement === "cellule") return "Cellule de crise";
        if (rattachement.startsWith("class_"))
            return `Classe ${rattachement.replace("class_", "")}`;
        const zone = config.zones.find((z) => z.id === rattachement);
        return zone ? `Zone — ${zone.name || "sans nom"}` : "Zone inconnue";
    };

    const rattachementOptions = [
        {
            value: "cellule",
            label: "Cellule de crise (avec le/la directeur/trice)",
        },
        ...config.zones.map((z, i) => ({
            value: z.id,
            label: `Zone ${i + 1}${z.name ? " — " + z.name : ""} (adulte sans classe assignée)`,
        })),
        ...classes.map((cl) => ({
            value: `class_${cl}`,
            label: `Classe ${cl} (rattaché à cette classe)`,
        })),
    ];

    // ── Résumé barre sticky ────────────────────────────────────────
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
            <StepHelp
                stepKey="step3"
                title="Comment remplir cette configuration ?"
            >
                <div className="pt-3 space-y-2 text-sm">
                    <p>
                        <strong>🏫 Votre école</strong> — Nom et identité du/de
                        la responsable de la cellule de crise (directeur/trice
                        le plus souvent). Si c'est un(e) enseignant(e), vous
                        pourrez désigner qui le remplace avec sa classe.
                    </p>
                    <p>
                        <strong>📍 Zones</strong> — Pour chaque zone, indiquer
                        le lieu et son responsable. Même logique : si le/la
                        responsable est enseignant(e), un substitut est demandé
                        immédiatement.
                    </p>
                    <p>
                        <strong>👥 Autres adultes</strong> — AESH, ATSEM,
                        entretien… Les enseignants viennent du CSV.
                    </p>
                </div>
            </StepHelp>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    Étape 3 – Configuration des fiches
                </h2>
                <p className="text-sm text-gray-500">
                    Modèle Eduscol PPMS, fascicule 2, février 2024.
                </p>
            </div>

            {/* ── 1. Votre école ──────────────────────────────────────── */}
            <Section title="Votre école">
                <Field label="Nom de l'école" error={errors.schoolName}>
                    <input
                        type="text"
                        placeholder="École élémentaire Jules Ferry"
                        value={config.schoolName}
                        onChange={(e) => setField("schoolName", e.target.value)}
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
                        IEN, mairie), centralise les bilans. Ne gère pas de
                        classe pendant le PPMS.
                    </p>
                    <AdultSelector
                        value={config.crisisCell}
                        onChange={(v) => {
                            setField("crisisCell", v);
                            setErrors((p) => ({ ...p, crisisCell: undefined }));
                        }}
                        teachers={teacherByClass}
                        staff={config.staff}
                        fonctionOptions={FONCTIONS_CRISE}
                        showSubstitute={true}
                        substituteTitle="Qui encadrera cette classe pendant le PPMS ?"
                        error={errors.crisisCell}
                    />
                </div>
            </Section>

            {/* ── 2. Format des fiches ────────────────────────────────── */}
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
                                        setField("configType", opt.id);
                                        setShowFormatOptions(false);
                                    }}
                                    className={`text-left rounded-xl border-2 p-4 transition-all outline-none
                    focus-visible:ring-2 focus-visible:ring-blue-500
                    ${
                        config.configType === opt.id
                            ? "border-blue-700 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                            className={`w-4 h-4 rounded-full border-2 shrink-0
                      ${config.configType === opt.id ? "border-blue-700 bg-blue-700" : "border-gray-300"}`}
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
                                        onClick={() => removeZone(zone.id)}
                                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                                    >
                                        Supprimer
                                    </button>
                                )}
                            </div>

                            {/* Lieu */}
                            <Field
                                label="Lieu de confinement"
                                error={errors[`zone_${zone.id}_name`]}
                            >
                                <input
                                    type="text"
                                    placeholder="Gymnase, salle polyvalente, couloir condamnable…"
                                    value={zone.name}
                                    onChange={(e) =>
                                        updateZoneName(zone.id, e.target.value)
                                    }
                                    className={cx(
                                        errors[`zone_${zone.id}_name`]
                                    )}
                                />
                            </Field>

                            {/* Responsable */}
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
                                    onChange={(v) => {
                                        setZoneResponsible(zone.id, v);
                                        setErrors((p) => ({
                                            ...p,
                                            [`zone_${zone.id}_responsible`]:
                                                undefined,
                                        }));
                                    }}
                                    teachers={teacherByClass}
                                    staff={config.staff}
                                    fonctionOptions={FONCTIONS_ZONE}
                                    showSubstitute={true}
                                    substituteTitle={`Qui encadrera la classe pendant le PPMS pendant que cette personne gère la zone ?`}
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
                        onClick={addZone}
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
                                        setClassZone(cl, e.target.value)
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

            {/* ── 5. Co-titulaires / décharges ────────────────────────── */}
            <Section title="Co-titulaires et décharges">
                <ExtraTeachersSection
                    classes={classes}
                    teacherByClass={teacherByClass}
                    classExtraTeachers={config.classExtraTeachers || {}}
                    onAdd={addExtraTeacher}
                    onUpdate={updateExtraTeacher}
                    onRemove={removeExtraTeacher}
                    extrasCount={extrasCount}
                />
            </Section>

            {/* ── 6. Autres adultes ───────────────────────────────────── */}
            <Section title="Autres adultes">
                <p className="text-sm text-gray-500">
                    AESH, ATSEM, entretien, service civique… Les enseignants
                    viennent du CSV. Les membres de la cellule de crise autres
                    que le directeur/la directrice peuvent être rattachés à{" "}
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
                                        updateStaff(s.id, field, value)
                                    }
                                    onValidate={() =>
                                        setEditingStaffIds((prev) => {
                                            const n = new Set(prev);
                                            n.delete(s.id);
                                            return n;
                                        })
                                    }
                                    onRemove={() => removeStaff(s.id)}
                                    rattachementOptions={rattachementOptions}
                                    errors={errors}
                                />
                            ) : (
                                <StaffCardDisplay
                                    key={s.id}
                                    staff={s}
                                    rattachementLabel={getRattachementLabel(
                                        s.rattachement
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
                                    onRemove={() => removeStaff(s.id)}
                                />
                            )
                        )}
                    </div>
                )}

                <button
                    type="button"
                    onClick={addStaff}
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
                            setField(
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

// ── Section co-titulaires ──────────────────────────────────────────
function ExtraTeachersSection({
    classes,
    teacherByClass,
    classExtraTeachers,
    onAdd,
    onUpdate,
    onRemove,
    extrasCount,
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left gap-3"
                aria-expanded={open}
            >
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">
                        Co-titulaires / décharges / temps partiels
                    </span>
                    {extrasCount > 0 ? (
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {extrasCount} ajouté{extrasCount > 1 ? "s" : ""}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-400">Optionnel</span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {open && (
                <div className="divide-y divide-gray-100">
                    <p className="px-4 py-3 text-xs text-gray-500 leading-relaxed bg-white">
                        Pour chaque classe, ajouter les adultes qui co-encadrent
                        le groupe régulièrement : enseignant(e) à mi-temps,
                        décharge, remplaçant(e) habituel(le)… Ils apparaîtront
                        sur la fiche avec leurs cases à cocher — le responsable
                        sur place coche les présents selon le jour.
                    </p>

                    {classes.map((cl) => {
                        const extras = classExtraTeachers[cl] || [];
                        return (
                            <div
                                key={cl}
                                className="px-4 py-3 space-y-2 bg-white"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                            {cl}
                                        </span>
                                        {teacherByClass[cl] && (
                                            <span className="text-xs text-gray-500">
                                                {teacherByClass[cl]}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onAdd(cl)}
                                        className="text-xs text-blue-700 hover:text-blue-900 transition-colors flex items-center gap-1"
                                    >
                                        <span className="text-base leading-none">
                                            ＋
                                        </span>{" "}
                                        Ajouter
                                    </button>
                                </div>

                                {extras.map((et, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end bg-gray-50 border border-gray-200 rounded-lg p-2"
                                    >
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                NOM
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="BERNARD"
                                                value={et.nom}
                                                onChange={(e) =>
                                                    onUpdate(
                                                        cl,
                                                        idx,
                                                        "nom",
                                                        toNom(e.target.value)
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Prénom
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Claire"
                                                value={et.prenom}
                                                onChange={(e) =>
                                                    onUpdate(
                                                        cl,
                                                        idx,
                                                        "prenom",
                                                        toPrenom(e.target.value)
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                Rôle
                                            </label>
                                            <select
                                                value={et.fonction}
                                                onChange={(e) =>
                                                    onUpdate(
                                                        cl,
                                                        idx,
                                                        "fonction",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                {[
                                                    "Décharge",
                                                    "Mi-temps",
                                                    "Co-titulaire",
                                                    "Remplaçant(e) habituel(le)",
                                                ].map((f) => (
                                                    <option key={f} value={f}>
                                                        {f}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onRemove(cl, idx)}
                                            className="text-xs text-red-400 hover:text-red-600 pb-1 transition-colors"
                                            aria-label="Supprimer"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Cartes staff ───────────────────────────────────────────────────
function StaffCardEditing({
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

function StaffCardDisplay({
    staff,
    rattachementLabel,
    hasError,
    onEdit,
    onRemove,
}) {
    return (
        <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors
      ${hasError ? "bg-red-50 border border-red-300" : "bg-gray-50 border border-gray-200 hover:border-gray-300"}`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="text-base shrink-0">👤</span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                        {fullName(staff.nom, staff.prenom) || (
                            <span className="text-red-500">Nom manquant</span>
                        )}
                    </p>
                    <p className="text-xs text-gray-500">
                        {[
                            staff.fonction || "Fonction non précisée",
                            rattachementLabel,
                        ].join("  ·  ")}
                    </p>
                </div>
            </div>
            <div className="flex gap-1 shrink-0">
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                    ✎
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

// ── Helpers UI ─────────────────────────────────────────────────────
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

function Field({ label, error, children, optional = false }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {!optional && (
                    <span className="text-red-500 ml-0.5" aria-hidden>
                        *
                    </span>
                )}
            </label>
            {children}
            {error && (
                <p className="text-xs text-red-500" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function cx(error) {
    return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500
    ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"}`;
}
