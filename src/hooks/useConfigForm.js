import { useState } from "react";
import {
    emptyAdult,
    newZoneId,
    newStaff,
    makeInitialConfig,
} from "../utils/config/defaults";
import { validateConfig, getStaffInError } from "../utils/config/validation";

export function useConfigForm(classes, initialConfig) {
    const [config, setConfig] = useState(
        () => initialConfig ?? makeInitialConfig(classes)
    );
    const [errors, setErrors] = useState({});

    // ── Champ simple ──────────────────────────────────────────────
    const setField = (field, value) => {
        setConfig((p) => ({ ...p, [field]: value }));
        setErrors((p) => ({ ...p, [field]: undefined }));
    };

    // ── Zones ─────────────────────────────────────────────────────
    const updateZoneName = (id, name) =>
        setConfig((p) => ({
            ...p,
            zones: p.zones.map((z) => (z.id === id ? { ...z, name } : z)),
        }));

    const setZoneResponsible = (zoneId, value) => {
        setConfig((p) => ({
            ...p,
            zoneResponsibles: { ...p.zoneResponsibles, [zoneId]: value },
        }));
        setErrors((p) => ({
            ...p,
            [`zone_${zoneId}_responsible`]: undefined,
        }));
    };

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
            return {
                ...p,
                zones,
                zoneResponsibles: restResponsibles,
                classZoneMap: Object.fromEntries(
                    Object.entries(p.classZoneMap).map(([cl, zid]) => [
                        cl,
                        zid === id ? fallback : zid,
                    ])
                ),
                staff: p.staff.map((s) =>
                    s.rattachement === id
                        ? { ...s, rattachement: fallback ?? "" }
                        : s
                ),
            };
        });

    const setClassZone = (cl, zoneId) =>
        setConfig((p) => ({
            ...p,
            classZoneMap: { ...p.classZoneMap, [cl]: zoneId },
        }));

    // ── Co-titulaires / décharges ─────────────────────────────────
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
                classExtraTeachers: {
                    ...p.classExtraTeachers,
                    [cl]: list,
                },
            };
        });

    const removeExtraTeacher = (cl, idx) =>
        setConfig((p) => ({
            ...p,
            classExtraTeachers: {
                ...p.classExtraTeachers,
                [cl]: (p.classExtraTeachers[cl] || []).filter(
                    (_, i) => i !== idx
                ),
            },
        }));

    // ── Staff ─────────────────────────────────────────────────────
    const addStaff = () => {
        const s = newStaff();
        setConfig((p) => ({ ...p, staff: [...p.staff, s] }));
        return s.id; // retourné pour ouvrir en mode édition côté UI
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

    const removeStaff = (id) =>
        setConfig((p) => ({
            ...p,
            staff: p.staff.filter((s) => s.id !== id),
        }));

    // ── Soumission ────────────────────────────────────────────────
    const submit = (onSubmit) => {
        const errs = validateConfig(config);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return {
                valid: false,
                staffInError: getStaffInError(config.staff, errs),
            };
        }
        onSubmit(config);
        return { valid: true, staffInError: [] };
    };

    return {
        config,
        errors,
        setField,
        updateZoneName,
        setZoneResponsible,
        addZone,
        removeZone,
        setClassZone,
        addExtraTeacher,
        updateExtraTeacher,
        removeExtraTeacher,
        addStaff,
        updateStaff,
        removeStaff,
        submit,
    };
}
