/**
 * useConfigForm.js
 * ────────────────
 * Hook central de l'étape de configuration PPMS.
 * Seul endroit de l'application qui mute `config` — aucun composant
 * ne doit modifier config directement.
 */

import { useState, useEffect } from "react";
import {
    emptyAdult,
    newZoneId,
    newStaff,
    makeInitialConfig,
} from "../utils/config/defaults";
import { validateConfig, getStaffInError } from "../utils/config/validation";
import { migrateConfig } from "../utils/config/migrate";
import { computeVacancies } from "../utils/config/vacancies";
import { buildAssignedIds } from "../utils/config/adultId";

const STORAGE_KEY = "vigiappel_config";

export function useConfigForm(classes, initialConfig) {
    const [config, setConfig] = useState(() => {
        // initialConfig (fusion post-normalisation) a toujours la priorité
        if (initialConfig) return initialConfig;

        // Restauration depuis localStorage avec migration silencieuse
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const migrated = migrateConfig(parsed);
                // migrateConfig peut retourner null sur donnée corrompue
                if (migrated) return migrated;
            }
        } catch {
            console.warn("vigiappel: impossible de restaurer la config");
        }

        return makeInitialConfig(classes);
    });

    const [errors, setErrors] = useState({});

    // Persistance automatique à chaque modification
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch {
            console.warn("vigiappel: impossible de sauvegarder la config");
        }
    }, [config]);

    // ── Dérivés calculés (pas de useState — recalculés au render) ──────────

    /**
     * Vacances de classes : classes dont l'enseignant est en mission PPMS.
     * Règle R2/R4 — exposé aux composants pour affichage et validation.
     */
    const vacancies = computeVacancies(config);

    /**
     * Set des IDs canoniques déjà affectés à un rôle PPMS.
     * Passé à AdultSelector (excludeIds) et buildAvailableSubstitutes.
     */
    const assignedIds = buildAssignedIds(config);

    // ── Détection de restauration ──────────────────────────────────────────

    const isRestored =
        !initialConfig &&
        JSON.stringify(config) !== JSON.stringify(makeInitialConfig(classes));

    // ── Reset ──────────────────────────────────────────────────────────────

    const reset = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            console.warn("vigiappel: impossible de vider le localStorage");
        }
        setConfig(makeInitialConfig(classes));
        setErrors({});
    };

    // ── Setter générique ───────────────────────────────────────────────────

    const setField = (field, value) => {
        setConfig((p) => ({ ...p, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    // ── Zones ──────────────────────────────────────────────────────────────

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
        setErrors((prev) => ({
            ...prev,
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

    // ── Cellule de crise (Sprint 5) ────────────────────────────────────────

    /** Remplace le responsable de la cellule de crise. */
    const setCrisisResponsible = (ref) => {
        setConfig((p) => ({
            ...p,
            crisis: { ...p.crisis, responsible: ref },
        }));
        setErrors((prev) => ({ ...prev, crisisResponsible: undefined }));
    };

    /** Ajoute un membre vide à la cellule de crise. */
    const addCrisisMember = () =>
        setConfig((p) => ({
            ...p,
            crisis: {
                ...p.crisis,
                members: [...(p.crisis?.members ?? []), emptyAdult()],
            },
        }));

    /** Met à jour le membre à l'index `idx`. */
    const updateCrisisMember = (idx, ref) =>
        setConfig((p) => {
            const members = [...(p.crisis?.members ?? [])];
            members[idx] = ref;
            return { ...p, crisis: { ...p.crisis, members } };
        });

    /** Supprime le membre à l'index `idx`. */
    const removeCrisisMember = (idx) =>
        setConfig((p) => ({
            ...p,
            crisis: {
                ...p.crisis,
                members: (p.crisis?.members ?? []).filter((_, i) => i !== idx),
            },
        }));

    // ── Supervision des classes (Sprint 5) ────────────────────────────────

    /**
     * Désigne le superviseur d'une classe vacante.
     * Passer `null` efface la désignation (vacance non couverte).
     *
     * @param {string}      classe  Nom de la classe
     * @param {AdultRef|null} ref   Substitut choisi
     */
    const setSupervision = (classe, ref) => {
        setConfig((p) => ({
            ...p,
            classSupervision: {
                ...(p.classSupervision ?? {}),
                [classe]: ref,
            },
        }));
        setErrors((prev) => ({
            ...prev,
            [`supervision_${classe}`]: undefined,
        }));
    };

    // ── Co-titulaires ──────────────────────────────────────────────────────

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
        setConfig((p) => ({
            ...p,
            classExtraTeachers: {
                ...p.classExtraTeachers,
                [cl]: (p.classExtraTeachers[cl] || []).filter(
                    (_, i) => i !== idx
                ),
            },
        }));

    // ── Staff ──────────────────────────────────────────────────────────────

    const addStaff = () => {
        const s = newStaff();
        setConfig((p) => ({ ...p, staff: [...p.staff, s] }));
        return s.id;
    };

    const updateStaff = (id, field, value) => {
        setConfig((p) => ({
            ...p,
            staff: p.staff.map((s) =>
                s.id === id ? { ...s, [field]: value } : s
            ),
        }));
        setErrors((prev) => ({
            ...prev,
            [`staff_${id}_${field}`]: undefined,
        }));
    };

    const removeStaff = (id) =>
        setConfig((p) => ({
            ...p,
            staff: p.staff.filter((s) => s.id !== id),
        }));

    // ── Soumission ─────────────────────────────────────────────────────────

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

    // ── API publique ───────────────────────────────────────────────────────

    return {
        // État
        config,
        errors,
        isRestored,

        // Dérivés calculés
        vacancies,
        assignedIds,

        // Actions globales
        reset,
        submit,

        // Setters génériques
        setField,

        // Cellule de crise (Sprint 5)
        setCrisisResponsible,
        addCrisisMember,
        updateCrisisMember,
        removeCrisisMember,

        // Supervision des classes (Sprint 5)
        setSupervision,

        // Zones
        updateZoneName,
        setZoneResponsible,
        addZone,
        removeZone,
        setClassZone,

        // Co-titulaires
        addExtraTeacher,
        updateExtraTeacher,
        removeExtraTeacher,

        // Staff
        addStaff,
        updateStaff,
        removeStaff,
    };
}
