import { useMemo } from "react";
import { groupByClass } from "../utils/csvParser";

export function useCSVData(csvResult) {
    // ← useMemo sur les deux primitives pour stabiliser les références
    const data = useMemo(() => csvResult?.data ?? [], [csvResult]);
    const fields = useMemo(() => csvResult?.fields ?? [], [csvResult]);

    const byClass = useMemo(() => groupByClass(data), [data]);
    const classes = useMemo(() => Object.keys(byClass).sort(), [byClass]);

    const teacherByClass = useMemo(
        () =>
            Object.fromEntries(
                classes.map((cl) => [
                    cl,
                    byClass[cl][0]?.["Enseignant(s)"] || "",
                ])
            ),
        [byClass, classes]
    );

    return {
        data,
        fields,
        byClass,
        classes,
        teacherByClass,
        totalStudents: data.length,
    };
}
