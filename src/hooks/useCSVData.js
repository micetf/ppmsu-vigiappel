import { useMemo } from "react";
import { groupByClass } from "../utils/csvParser";

export function useCSVData(csvResult) {
    const data = csvResult?.data ?? [];
    const fields = csvResult?.fields ?? [];

    const byClass = useMemo(() => groupByClass(data), [data]);
    const classes = useMemo(() => Object.keys(byClass).sort(), [byClass]);

    // Enseignant(s) référent par classe (première occurrence)
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
