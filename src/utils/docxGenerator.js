import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    HeightRule,
    ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import JSZip from "jszip";

// ── Constantes ─────────────────────────────────────────────────────
const FONT = "Arial";
const BOX = "☐";
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const ALL_BORDERS = {
    top: BORDER,
    bottom: BORDER,
    left: BORDER,
    right: BORDER,
};

const SHADE_HEADER = {
    type: ShadingType.SOLID,
    fill: "D9D9D9",
    color: "D9D9D9",
};
const SHADE_ALT = { type: ShadingType.SOLID, fill: "F2F2F2", color: "F2F2F2" };
const PAGE_MARGIN = { top: 1134, bottom: 1134, left: 1134, right: 1134 }; // 2 cm
const TABLE_W = 9400; // DXA (~16,6 cm) pour une page A4 avec marges 2 cm

// ── Helpers typographie ────────────────────────────────────────────
const run = (text, opts = {}) =>
    new TextRun({ text, font: FONT, size: 20, color: "000000", ...opts });

function para(children, opts = {}) {
    return new Paragraph({
        children,
        spacing: { before: 60, after: 60 },
        ...opts,
    });
}

// ── En-tête document ───────────────────────────────────────────────
function makeDocHeader(schoolName, title, lines = []) {
    return [
        para(
            [
                run(schoolName.toUpperCase(), {
                    bold: true,
                    size: 26,
                    color: "1E3A5F",
                }),
            ],
            {
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 },
            }
        ),
        para(
            [
                run("PPMS – PLAN PARTICULIER DE MISE EN SÛRETÉ", {
                    size: 18,
                    color: "666666",
                }),
            ],
            {
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 80 },
            }
        ),
        para([run(title, { bold: true, size: 24 })], {
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 100 },
        }),
        ...lines.map((line) =>
            para([run(line, { size: 20, color: "333333" })], {
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60 },
            })
        ),
        para([]), // espacement
    ];
}

// ── Pied de fiche ──────────────────────────────────────────────────
const makeFooter = () => [
    para(
        [
            run("Nombre total d'élèves : ______", { bold: true }),
            run("          Nombre total d'adultes : ______"),
        ],
        { spacing: { before: 200, after: 80 } }
    ),
    para([
        run(
            "N.B. Un élève absent est un élève absent de l'école le jour de l'événement. " +
                "Un élève manquant à l'appel était présent en début de journée mais ne répond plus.",
            { size: 16, color: "666666", italics: true }
        ),
    ]),
    para(
        [run("Date : _____ / _____ / ____________      Heure : _____ h _____")],
        { spacing: { before: 200, after: 0 } }
    ),
];

// ── Cellule tableau ────────────────────────────────────────────────
function cell(text, { header = false, alt = false, center = false, w } = {}) {
    return new TableCell({
        borders: ALL_BORDERS,
        shading: header ? SHADE_HEADER : alt ? SHADE_ALT : undefined,
        width: w ? { size: w, type: WidthType.DXA } : undefined,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
            para(
                [
                    run(text, {
                        bold: header,
                        color: "000000",
                        size: header ? 18 : 20,
                    }),
                ],
                {
                    alignment: center
                        ? AlignmentType.CENTER
                        : AlignmentType.LEFT,
                    spacing: { before: 40, after: 40 },
                }
            ),
        ],
    });
}

function tableRow(cells, { isHeader = false, height = 450 } = {}) {
    return new TableRow({
        tableHeader: isHeader,
        height: { value: height, rule: HeightRule.ATLEAST },
        children: cells,
    });
}

// ── Fiche classe (Option B) ────────────────────────────────────────
function makeClassSheet(classe, students, teacher, zone, schoolName) {
    // Largeurs : NOM(2200) PRÉNOM(1800) PRÉSENT(1350) ABSENT(1350) MANQUANT(1350) BLESSÉ(1350) = 9400
    const W = [2200, 1800, 1350, 1350, 1350, 1350];
    const COLS = ["NOM", "PRÉNOM", "PRÉSENT", "ABSENT", "MANQUANT", "BLESSÉ"];

    const headerRow = tableRow(
        COLS.map((c, i) => cell(c, { header: true, center: i >= 2, w: W[i] })),
        { isHeader: true }
    );
    const studentRows = students.map((s, i) =>
        tableRow([
            cell(s["Nom"] || "", { alt: i % 2 !== 0, w: W[0] }),
            cell(s["Prénom"] || "", { alt: i % 2 !== 0, w: W[1] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: W[2] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: W[3] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: W[4] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: W[5] }),
        ])
    );

    return new Document({
        sections: [
            {
                properties: { page: { margin: PAGE_MARGIN } },
                children: [
                    ...makeDocHeader(schoolName, "FICHE DE RECENSEMENT", [
                        `Classe : ${classe}${teacher ? `   |   Enseignant(e) : ${teacher}` : ""}`,
                        `Zone de confinement : ${zone.name}   |   Responsable de zone : ${zone.responsible}`,
                    ]),
                    new Table({
                        width: { size: TABLE_W, type: WidthType.DXA },
                        rows: [headerRow, ...studentRows],
                    }),
                    ...makeFooter(),
                ],
            },
        ],
    });
}

// ── Fiche synthèse par zone (Option B multi-zones) ─────────────────
function makeZoneSummary(
    zone,
    classesInZone,
    byClass,
    teacherByClass,
    schoolName
) {
    // CLASSE(1800) ENSEIGNANT(2400) EFFECTIF(1200) PRÉSENTS(1000) ABSENTS(1000) MANQUANTS(1000) BLESSÉS(1000) = 9400
    const W = [1800, 2400, 1200, 1000, 1000, 1000, 1000];
    const COLS = [
        "CLASSE",
        "ENSEIGNANT(E)",
        "EFFECTIF",
        "PRÉSENTS",
        "ABSENTS",
        "MANQUANTS",
        "BLESSÉS",
    ];
    const total = classesInZone.reduce(
        (s, cl) => s + (byClass[cl]?.length ?? 0),
        0
    );

    const rows = classesInZone.map((cl, i) =>
        tableRow([
            cell(cl, { alt: i % 2 !== 0, w: W[0] }),
            cell(teacherByClass[cl] || "", { alt: i % 2 !== 0, w: W[1] }),
            cell(String(byClass[cl]?.length ?? 0), {
                alt: i % 2 !== 0,
                center: true,
                w: W[2],
            }),
            ...W.slice(3).map((w) =>
                cell("_____", { alt: i % 2 !== 0, center: true, w })
            ),
        ])
    );

    const totalRow = tableRow([
        cell("TOTAL", { w: W[0] }),
        cell("", { w: W[1] }),
        cell(String(total), { center: true, w: W[2] }),
        ...W.slice(3).map((w) => cell("_____", { center: true, w })),
    ]);

    return new Document({
        sections: [
            {
                properties: { page: { margin: PAGE_MARGIN } },
                children: [
                    ...makeDocHeader(
                        schoolName,
                        `SYNTHÈSE — ZONE ${zone.name.toUpperCase()}`,
                        [`Responsable de zone : ${zone.responsible}`]
                    ),
                    new Table({
                        width: { size: TABLE_W, type: WidthType.DXA },
                        rows: [
                            tableRow(
                                COLS.map((c, i) =>
                                    cell(c, {
                                        header: true,
                                        center: i >= 2,
                                        w: W[i],
                                    })
                                ),
                                { isHeader: true }
                            ),
                            ...rows,
                            totalRow,
                        ],
                    }),
                    para(
                        [
                            run(
                                "Date : _____ / _____ / ____________      Heure : _____ h _____"
                            ),
                        ],
                        { spacing: { before: 200 } }
                    ),
                ],
            },
        ],
    });
}

// ── Fiche synthèse globale cellule de crise ────────────────────────
function makeGlobalSummary(
    config,
    byClass,
    teacherByClass,
    classes,
    zones,
    classZoneMap
) {
    const multiZone = zones.length > 1;
    const total = classes.reduce((s, cl) => s + (byClass[cl]?.length ?? 0), 0);

    // Colonnes selon mono/multi-zones
    const COLS = multiZone
        ? [
              "ZONE",
              "CLASSE",
              "ENSEIGNANT(E)",
              "EFFECTIF",
              "PRÉSENTS",
              "ABSENTS",
              "MANQUANTS",
              "BLESSÉS",
          ]
        : [
              "CLASSE",
              "ENSEIGNANT(E)",
              "EFFECTIF",
              "PRÉSENTS",
              "ABSENTS",
              "MANQUANTS",
              "BLESSÉS",
          ];
    const W = multiZone
        ? [1200, 1200, 1900, 1000, 1025, 1025, 1025, 1025]
        : [1600, 2400, 1200, 1050, 1038, 1038, 1074];

    const makeRowCells = (cl, i) => {
        const zone = multiZone
            ? zones.find((z) => z.id === classZoneMap[cl]) || zones[0]
            : zones[0];
        const baseCells = multiZone
            ? [
                  cell(zone.name, { alt: i % 2 !== 0, w: W[0] }),
                  cell(cl, { alt: i % 2 !== 0, w: W[1] }),
                  cell(teacherByClass[cl] || "", { alt: i % 2 !== 0, w: W[2] }),
                  cell(String(byClass[cl]?.length ?? 0), {
                      alt: i % 2 !== 0,
                      center: true,
                      w: W[3],
                  }),
              ]
            : [
                  cell(cl, { alt: i % 2 !== 0, w: W[0] }),
                  cell(teacherByClass[cl] || "", { alt: i % 2 !== 0, w: W[1] }),
                  cell(String(byClass[cl]?.length ?? 0), {
                      alt: i % 2 !== 0,
                      center: true,
                      w: W[2],
                  }),
              ];
        const startIdx = multiZone ? 4 : 3;
        return [
            ...baseCells,
            ...W.slice(startIdx).map((w) =>
                cell("_____", { alt: i % 2 !== 0, center: true, w })
            ),
        ];
    };

    const totalCells = multiZone
        ? [
              cell("TOTAL", { w: W[0] }),
              cell("", { w: W[1] }),
              cell("", { w: W[2] }),
              cell(String(total), { center: true, w: W[3] }),
              ...W.slice(4).map((w) => cell("_____", { center: true, w })),
          ]
        : [
              cell("TOTAL", { w: W[0] }),
              cell("", { w: W[1] }),
              cell(String(total), { center: true, w: W[2] }),
              ...W.slice(3).map((w) => cell("_____", { center: true, w })),
          ];

    return new Document({
        sections: [
            {
                properties: { page: { margin: PAGE_MARGIN } },
                children: [
                    ...makeDocHeader(
                        config.schoolName,
                        "SYNTHÈSE CELLULE DE CRISE",
                        [`Responsable : ${config.responsible}`]
                    ),
                    new Table({
                        width: { size: TABLE_W, type: WidthType.DXA },
                        rows: [
                            tableRow(
                                COLS.map((c, i) =>
                                    cell(c, {
                                        header: true,
                                        center: i >= (multiZone ? 3 : 2),
                                        w: W[i],
                                    })
                                ),
                                { isHeader: true }
                            ),
                            ...classes.map((cl, i) =>
                                tableRow(makeRowCells(cl, i))
                            ),
                            tableRow(totalCells),
                        ],
                    }),
                    para(
                        [
                            run(
                                "Date : _____ / _____ / ____________      Heure : _____ h _____"
                            ),
                        ],
                        { spacing: { before: 200 } }
                    ),
                ],
            },
        ],
    });
}

// ── Fiche unique Option A ──────────────────────────────────────────
function makeOptionASheet(config, data, byClass, classes) {
    const zone = config.zones[0];
    // NOM(2000) PRÉNOM(1600) CLASSE(1400) PRÉSENT(1100) ABSENT(1100) MANQUANT(1100) BLESSÉ(1100) = 9400
    const W = [2000, 1600, 1400, 1100, 1100, 1100, 1100];
    const COLS = [
        "NOM",
        "PRÉNOM",
        "CLASSE",
        "PRÉSENT",
        "ABSENT",
        "MANQUANT",
        "BLESSÉ",
    ];

    const allRows = classes.flatMap((cl, ci) =>
        (byClass[cl] || []).map((s, si) => {
            const alt = (ci + si) % 2 !== 0;
            return tableRow([
                cell(s["Nom"] || "", { alt, w: W[0] }),
                cell(s["Prénom"] || "", { alt, w: W[1] }),
                cell(cl, { alt, w: W[2] }),
                cell(BOX, { alt, center: true, w: W[3] }),
                cell(BOX, { alt, center: true, w: W[4] }),
                cell(BOX, { alt, center: true, w: W[5] }),
                cell(BOX, { alt, center: true, w: W[6] }),
            ]);
        })
    );

    return new Document({
        sections: [
            {
                properties: { page: { margin: PAGE_MARGIN } },
                children: [
                    ...makeDocHeader(
                        config.schoolName,
                        "FICHE DE RECENSEMENT",
                        [
                            `Zone de confinement : ${zone.name}   |   Responsable : ${zone.responsible}`,
                        ]
                    ),
                    new Table({
                        width: { size: TABLE_W, type: WidthType.DXA },
                        rows: [
                            tableRow(
                                COLS.map((c, i) =>
                                    cell(c, {
                                        header: true,
                                        center: i >= 3,
                                        w: W[i],
                                    })
                                ),
                                { isHeader: true }
                            ),
                            ...allRows,
                        ],
                    }),
                    ...makeFooter(),
                ],
            },
        ],
    });
}

// ── Nom de fichier propre ──────────────────────────────────────────
function slug(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 40);
}

// ── Point d'entrée ─────────────────────────────────────────────────
export async function generateAndDownload(config, csvData) {
    const { data, byClass, classes, teacherByClass } = csvData;
    const { configType, zones, classZoneMap } = config;

    if (configType === "A") {
        const doc = makeOptionASheet(config, data, byClass, classes);
        saveAs(
            await Packer.toBlob(doc),
            `PPMS_${slug(config.schoolName)}_fiche_unique.docx`
        );
        return { count: 1 };
    }

    const zip = new JSZip();

    // 1 – Fiches classes
    for (const cl of classes) {
        const zoneId =
            zones.length > 1 ? classZoneMap[cl] || zones[0].id : zones[0].id;
        const zone = zones.find((z) => z.id === zoneId) || zones[0];
        const doc = makeClassSheet(
            cl,
            byClass[cl] || [],
            teacherByClass[cl] || "",
            zone,
            config.schoolName
        );
        zip.file(`PPMS_Classe_${slug(cl)}.docx`, await Packer.toBlob(doc));
    }

    // 2 – Synthèse(s) par zone (multi-zones seulement)
    if (zones.length > 1) {
        for (const zone of zones) {
            const classesInZone = classes.filter(
                (cl) => classZoneMap[cl] === zone.id
            );
            if (classesInZone.length === 0) continue;
            const doc = makeZoneSummary(
                zone,
                classesInZone,
                byClass,
                teacherByClass,
                config.schoolName
            );
            zip.file(
                `PPMS_Synthese_Zone_${slug(zone.name)}.docx`,
                await Packer.toBlob(doc)
            );
        }
    }

    // 3 – Synthèse globale cellule de crise (toujours présente en Option B)
    const globalDoc = makeGlobalSummary(
        config,
        byClass,
        teacherByClass,
        classes,
        zones,
        classZoneMap
    );
    zip.file(
        "PPMS_Synthese_Cellule_Crise.docx",
        await Packer.toBlob(globalDoc)
    );

    saveAs(
        await zip.generateAsync({ type: "blob" }),
        `PPMS_${slug(config.schoolName)}.zip`
    );

    return {
        count: classes.length + (zones.length > 1 ? zones.length : 0) + 1,
    };
}
