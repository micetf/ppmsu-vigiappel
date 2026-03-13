import Papa from "papaparse";

export const REQUIRED_COLS = ["Classe ou regroupement", "Nom", "Prénom"];
export const ALL_COLS = [
    "Classe ou regroupement",
    "Enseignant(s)",
    "Nom",
    "Prénom",
    "Né(e) le",
    "Sexe",
    "Niveau",
];

// Lecture fichier avec encodage explicite (gestion ISO-8859-1 et UTF-8)
function readAs(file, encoding) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () =>
            reject(new Error("Impossible de lire le fichier."));
        reader.readAsText(file, encoding);
    });
}

export async function parseCSV(file) {
    // Tentative UTF-8, fallback ISO-8859-1
    let text = await readAs(file, "UTF-8");
    const hasGarbled = /\uFFFD/.test(text) || /Ã©|Ã¨|Ã |Ã§/.test(text);
    if (hasGarbled) text = await readAs(file, "ISO-8859-1");

    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: "", // auto-détection , ou ;
            complete: ({ data, meta }) => {
                const fields = meta.fields ?? [];
                const missing = REQUIRED_COLS.filter(
                    (c) => !fields.includes(c)
                );
                if (missing.length > 0) {
                    reject(
                        new Error(
                            `Colonnes obligatoires manquantes : ${missing.join(", ")}`
                        )
                    );
                    return;
                }
                const clean = data
                    .filter(
                        (row) => row["Nom"]?.trim() && row["Prénom"]?.trim()
                    )
                    .map((row) =>
                        Object.fromEntries(
                            Object.entries(row).map(([k, v]) => [
                                k,
                                v?.trim() ?? "",
                            ])
                        )
                    );
                resolve({ data: clean, fields, totalRows: clean.length });
            },
            error: (err) =>
                reject(new Error(`Erreur de parsing : ${err.message}`)),
        });
    });
}

export function groupByClass(data) {
    return data.reduce((acc, row) => {
        const cl = row["Classe ou regroupement"] || "Non défini";
        acc[cl] = acc[cl] ? [...acc[cl], row] : [row];
        return acc;
    }, {});
}
