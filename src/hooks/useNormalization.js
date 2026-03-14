import { useState } from "react";
import { newStaff } from "../utils/config/defaults";
import { toNom, toPrenom } from "../utils/formatName";

export function useNormalization() {
    const [corrections, setCorrections] = useState({
        classNames: {},
        teacherNames: {},
        staff: [],
        classExtraTeachers: {},
    });

    // ── Noms de classes ───────────────────────────────────────────
    const setClassName = (original, corrected) =>
        setCorrections((p) => ({
            ...p,
            classNames: { ...p.classNames, [original]: corrected },
        }));

    const resetClassName = (original) =>
        setCorrections((p) => {
            const { [original]: _, ...rest } = p.classNames;
            return { ...p, classNames: rest };
        });

    // ── Noms d'enseignants ────────────────────────────────────────
    const setTeacherName = (cl, name) =>
        setCorrections((p) => ({
            ...p,
            teacherNames: { ...p.teacherNames, [cl]: name },
        }));

    const resetTeacherName = (cl) =>
        setCorrections((p) => {
            const { [cl]: _, ...rest } = p.teacherNames;
            return { ...p, teacherNames: rest };
        });

    // ── Staff ─────────────────────────────────────────────────────
    const addStaff = () => {
        const s = newStaff();
        setCorrections((p) => ({ ...p, staff: [...p.staff, s] }));
        return s.id;
    };

    const updateStaff = (id, field, rawValue) => {
        const value =
            field === "nom"
                ? toNom(rawValue)
                : field === "prenom"
                  ? toPrenom(rawValue)
                  : rawValue;
        setCorrections((p) => ({
            ...p,
            staff: p.staff.map((s) =>
                s.id === id ? { ...s, [field]: value } : s
            ),
        }));
    };

    const removeStaff = (id) =>
        setCorrections((p) => ({
            ...p,
            staff: p.staff.filter((s) => s.id !== id),
        }));

    // ── Co-titulaires / décharges ─────────────────────────────────
    const addExtraTeacher = (cl) =>
        setCorrections((p) => ({
            ...p,
            classExtraTeachers: {
                ...p.classExtraTeachers,
                [cl]: [
                    ...(p.classExtraTeachers[cl] || []),
                    { nom: "", prenom: "", fonction: "Décharge" },
                ],
            },
        }));

    const updateExtraTeacher = (cl, idx, field, rawValue) => {
        const value =
            field === "nom"
                ? toNom(rawValue)
                : field === "prenom"
                  ? toPrenom(rawValue)
                  : rawValue;
        setCorrections((p) => {
            const list = [...(p.classExtraTeachers[cl] || [])];
            list[idx] = { ...list[idx], [field]: value };
            return {
                ...p,
                classExtraTeachers: { ...p.classExtraTeachers, [cl]: list },
            };
        });
    };

    const removeExtraTeacher = (cl, idx) =>
        setCorrections((p) => ({
            ...p,
            classExtraTeachers: {
                ...p.classExtraTeachers,
                [cl]: (p.classExtraTeachers[cl] || []).filter(
                    (_, i) => i !== idx
                ),
            },
        }));

    return {
        corrections,
        setClassName,
        resetClassName,
        setTeacherName,
        resetTeacherName,
        addStaff,
        updateStaff,
        removeStaff,
        addExtraTeacher,
        updateExtraTeacher,
        removeExtraTeacher,
    };
}
