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
    PageBreak,
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
const SHADE_ADULT = {
    type: ShadingType.SOLID,
    fill: "DBEAFE",
    color: "DBEAFE",
}; // bleu très clair
const PAGE_MARGIN = { top: 1134, bottom: 1134, left: 1134, right: 1134 };
const TABLE_W = 9400;

// ── Helpers typographie ────────────────────────────────────────────
const run = (text, opts = {}) =>
    new TextRun({
        text: String(text ?? ""),
        font: FONT,
        size: 20,
        color: "000000",
        ...opts,
    });

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
        para([]),
    ];
}

// ── Pied de fiche ──────────────────────────────────────────────────
function makeFooter(nbEleves, nbAdultes) {
    return [
        para(
            [
                run(`Nombre total d'élèves : ${nbEleves}     `, { bold: true }),
                run(`Nombre total d'adultes : ${nbAdultes}`, { bold: true }),
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
            [
                run(
                    "Date : _____ / _____ / ____________      Heure : _____ h _____"
                ),
            ],
            { spacing: { before: 200, after: 0 } }
        ),
    ];
}

// ── Cellule tableau ────────────────────────────────────────────────
function cell(
    text,
    { header = false, alt = false, adult = false, center = false, w } = {}
) {
    const shading = header
        ? SHADE_HEADER
        : adult
          ? SHADE_ADULT
          : alt
            ? SHADE_ALT
            : undefined;
    return new TableCell({
        borders: ALL_BORDERS,
        shading,
        width: w ? { size: w, type: WidthType.DXA } : undefined,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
            para([run(text, { bold: header, size: header ? 18 : 20 })], {
                alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { before: 40, after: 40 },
            }),
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

function makeTable(rows) {
    return new Table({ width: { size: TABLE_W, type: WidthType.DXA }, rows });
}

// ── Titre de section intra-document ───────────────────────────────
function sectionTitle(text) {
    return para([run(text, { bold: true, size: 20, color: "1E3A5F" })], {
        spacing: { before: 300, after: 100 },
    });
}

// ── Helpers config ─────────────────────────────────────────────────
function getCrisisCell(config) {
    const cc = config.staff.filter((s) => s.rattachement === "cellule");
    if (cc.length === 0) return "Non défini";
    return cc
        .map(
            (s) =>
                `${s.prenom} ${s.nom}${s.fonction ? " (" + s.fonction + ")" : ""}`
        )
        .join(", ");
}

function getClassStaff(config, classe) {
    return config.staff.filter((s) => s.rattachement === `class_${classe}`);
}

function getZoneStaff(config, zoneId) {
    return config.staff.filter((s) => s.rattachement === zoneId);
}

function slug(str) {
    return String(str ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 40);
}

// ── Fiche classe enrichie (Option B) ──────────────────────────────
function makeClassSheet(
    classe,
    students,
    teacher,
    classStaff,
    zone,
    schoolName
) {
    // Colonnes adultes : NOM(2200) PRÉNOM(1800) FONCTION(2200) P(800) A(800) M(800) B(800) = 9400
    const WA = [2200, 1800, 2200, 800, 800, 800, 800];
    const COLS_A = [
        "NOM",
        "PRÉNOM",
        "FONCTION",
        "PRÉSENT",
        "ABSENT",
        "MANQUANT",
        "BLESSÉ",
    ];

    // Tous les adultes de cette classe : enseignant (CSV) + staff rattaché
    const allAdults = [
        ...(teacher
            ? [
                  {
                      nom: teacher.split(" ").slice(1).join(" ") || teacher,
                      prenom: teacher.split(" ")[0] || "",
                      fonction: "Enseignant(e)",
                  },
              ]
            : []),
        ...classStaff.map((s) => ({
            nom: s.nom,
            prenom: s.prenom,
            fonction: s.fonction || "",
        })),
    ];

    const adultRows = allAdults.map((a) =>
        tableRow([
            cell(a.nom, { adult: true, w: WA[0] }),
            cell(a.prenom, { adult: true, w: WA[1] }),
            cell(a.fonction, { adult: true, w: WA[2] }),
            cell(BOX, { adult: true, center: true, w: WA[3] }),
            cell(BOX, { adult: true, center: true, w: WA[4] }),
            cell(BOX, { adult: true, center: true, w: WA[5] }),
            cell(BOX, { adult: true, center: true, w: WA[6] }),
        ])
    );

    // Colonnes élèves : NOM(2800) PRÉNOM(2200) P(1100) A(1100) M(1100) B(1100) = 9400
    const WS = [2800, 2200, 1100, 1100, 1100, 1100];
    const COLS_S = ["NOM", "PRÉNOM", "PRÉSENT", "ABSENT", "MANQUANT", "BLESSÉ"];

    const studentRows = students.map((s, i) =>
        tableRow([
            cell(s["Nom"] || "", { alt: i % 2 !== 0, w: WS[0] }),
            cell(s["Prénom"] || "", { alt: i % 2 !== 0, w: WS[1] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WS[2] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WS[3] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WS[4] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WS[5] }),
        ])
    );

    return new Document({
        sections: [
            {
                properties: { page: { margin: PAGE_MARGIN } },
                children: [
                    ...makeDocHeader(schoolName, "FICHE DE RECENSEMENT", [
                        `Classe : ${classe}`,
                        `Zone de confinement : ${zone.name}   |   Responsable de zone : ${zone.responsible}`,
                    ]),
                    sectionTitle(`Adultes (${allAdults.length})`),
                    makeTable([
                        tableRow(
                            COLS_A.map((c, i) =>
                                cell(c, {
                                    header: true,
                                    center: i >= 3,
                                    w: WA[i],
                                })
                            ),
                            { isHeader: true }
                        ),
                        ...adultRows,
                    ]),
                    sectionTitle(`Élèves (${students.length})`),
                    makeTable([
                        tableRow(
                            COLS_S.map((c, i) =>
                                cell(c, {
                                    header: true,
                                    center: i >= 2,
                                    w: WS[i],
                                })
                            ),
                            { isHeader: true }
                        ),
                        ...studentRows,
                    ]),
                    ...makeFooter(students.length, allAdults.length),
                ],
            },
        ],
    });
}

// ── Fiche adultes par zone ─────────────────────────────────────────
function makeAdultsZoneSheet(zone, zoneStaff, blankRows, schoolName) {
    // NOM(2200) PRÉNOM(1800) FONCTION(2200) ZONE_HAB(1200) P(500) A(500) M(500) B(500) = 9400
    const W = [2200, 1800, 2200, 1200, 500, 500, 500, 500];
    const COLS = [
        "NOM",
        "PRÉNOM",
        "FONCTION",
        "ZONE HABITUELLE",
        "P",
        "A",
        "M",
        "B",
    ];

    const staffRows = zoneStaff.map((s, i) =>
        tableRow([
            cell(s.nom, { alt: i % 2 !== 0, w: W[0] }),
            cell(s.prenom, { alt: i % 2 !== 0, w: W[1] }),
            cell(s.fonction || "", { alt: i % 2 !== 0, w: W[2] }),
            cell(zone.name, { alt: i % 2 !== 0, w: W[3] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: W[4] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: W[5] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: W[6] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: W[7] }),
        ])
    );

    const blankRowsList = Array.from({ length: blankRows }, (_, i) => {
        const alt = (zoneStaff.length + i) % 2 !== 0;
        return tableRow([
            cell("", { alt, w: W[0] }),
            cell("", { alt, w: W[1] }),
            cell("", { alt, w: W[2] }),
            cell("", { alt, w: W[3] }),
            cell(BOX, { alt, center: true, w: W[4] }),
            cell(BOX, { alt, center: true, w: W[5] }),
            cell(BOX, { alt, center: true, w: W[6] }),
            cell(BOX, { alt, center: true, w: W[7] }),
        ]);
    });

    return new Document({
        sections: [
            {
                properties: { page: { margin: PAGE_MARGIN } },
                children: [
                    ...makeDocHeader(
                        schoolName,
                        `ADULTES — ZONE : ${zone.name.toUpperCase()}`,
                        [
                            `Responsable de zone : ${zone.responsible}`,
                            "Compléter les lignes vierges avec les intervenants présents le jour J",
                        ]
                    ),
                    sectionTitle(`Personnels permanents (${zoneStaff.length})`),
                    makeTable([
                        tableRow(
                            COLS.map((c, i) =>
                                cell(c, {
                                    header: true,
                                    center: i >= 4,
                                    w: W[i],
                                })
                            ),
                            { isHeader: true }
                        ),
                        ...staffRows,
                        ...(blankRows > 0
                            ? [
                                  tableRow([
                                      cell(
                                          `← Intervenants / personnels variables — à compléter`,
                                          { w: TABLE_W }
                                      ),
                                  ]),
                                  ...blankRowsList,
                              ]
                            : []),
                    ]),
                    para(
                        [
                            run(
                                `Total adultes permanents : ${zoneStaff.length}     Total intervenants variables : _____`,
                                { bold: true }
                            ),
                        ],
                        { spacing: { before: 200 } }
                    ),
                    para(
                        [
                            run(
                                "Date : _____ / _____ / ____________      Heure : _____ h _____"
                            ),
                        ],
                        { spacing: { before: 100 } }
                    ),
                ],
            },
        ],
    });
}

// ── Synthèse par zone ──────────────────────────────────────────────
function makeZoneSummary(
    zone,
    classesInZone,
    byClass,
    teacherByClass,
    schoolName
) {
    const W = [1600, 2200, 1200, 1000, 1000, 1000, 1000, 400];
    const COLS = [
        "CLASSE",
        "ENSEIGNANT(E)",
        "ÉLÈVES THÉO.",
        "PRÉSENTS",
        "ABSENTS",
        "MANQUANTS",
        "BLESSÉS",
        "ADULTES P.",
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
                    makeTable([
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
                    ]),
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

// ── Synthèse globale cellule de crise ──────────────────────────────
function makeGlobalSummary(
    config,
    byClass,
    teacherByClass,
    classes,
    zones,
    classZoneMap
) {
    const multiZone = zones.length > 1;
    const crisisCell = getCrisisCell(config);
    const totalStudents = classes.reduce(
        (s, cl) => s + (byClass[cl]?.length ?? 0),
        0
    );

    // Calcul total adultes théoriques (hors cellule de crise)
    const totalAdults = config.staff.filter(
        (s) => s.rattachement !== "cellule"
    ).length;
    // + enseignants (1 par classe)
    const totalTeachers = classes.filter((cl) => teacherByClass[cl]).length;
    const totalAdultsTheo = totalAdults + totalTeachers;

    const W = multiZone
        ? [1000, 1400, 2200, 1000, 950, 950, 950, 950]
        : [1600, 2400, 1200, 1000, 1000, 1000, 1200];
    const COLS = multiZone
        ? [
              "ZONE",
              "CLASSE",
              "ENSEIGNANT(E)",
              "ÉLÈVES",
              "PRÉSENTS",
              "ABSENTS",
              "MANQUANTS",
              "BLESSÉS",
          ]
        : [
              "CLASSE",
              "ENSEIGNANT(E)",
              "ÉLÈVES THÉO.",
              "PRÉSENTS",
              "ABSENTS",
              "MANQUANTS",
              "BLESSÉS",
          ];

    const makeRowCells = (cl, i) => {
        const zoneObj = multiZone
            ? zones.find((z) => z.id === classZoneMap[cl]) || zones[0]
            : zones[0];
        const base = multiZone
            ? [
                  cell(zoneObj.name, { alt: i % 2 !== 0, w: W[0] }),
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
        const offset = multiZone ? 4 : 3;
        return [
            ...base,
            ...W.slice(offset).map((w) =>
                cell("_____", { alt: i % 2 !== 0, center: true, w })
            ),
        ];
    };

    const totRowCells = multiZone
        ? [
              cell("TOTAL ÉLÈVES", { w: W[0] }),
              cell("", { w: W[1] }),
              cell("", { w: W[2] }),
              cell(String(totalStudents), { center: true, w: W[3] }),
              ...W.slice(4).map((w) => cell("_____", { center: true, w })),
          ]
        : [
              cell("TOTAL ÉLÈVES", { w: W[0] }),
              cell("", { w: W[1] }),
              cell(String(totalStudents), { center: true, w: W[2] }),
              ...W.slice(3).map((w) => cell("_____", { center: true, w })),
          ];

    const adultsRowCells = multiZone
        ? [
              cell("TOTAL ADULTES*", { w: W[0] }),
              cell("", { w: W[1] }),
              cell("", { w: W[2] }),
              cell(String(totalAdultsTheo), { center: true, w: W[3] }),
              ...W.slice(4).map((w) => cell("_____", { center: true, w })),
          ]
        : [
              cell("TOTAL ADULTES*", { w: W[0] }),
              cell("", { w: W[1] }),
              cell(String(totalAdultsTheo), { center: true, w: W[2] }),
              ...W.slice(3).map((w) => cell("_____", { center: true, w })),
          ];

    const globalTotal = totalStudents + totalAdultsTheo;
    const globalRowCells = multiZone
        ? [
              cell("TOTAL GÉNÉRAL", { w: W[0] }),
              cell("", { w: W[1] }),
              cell("", { w: W[2] }),
              cell(String(globalTotal), { center: true, w: W[3] }),
              ...W.slice(4).map((w) => cell("_____", { center: true, w })),
          ]
        : [
              cell("TOTAL GÉNÉRAL", { w: W[0] }),
              cell("", { w: W[1] }),
              cell(String(globalTotal), { center: true, w: W[2] }),
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
                        [`Responsable cellule de crise : ${crisisCell}`]
                    ),
                    makeTable([
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
                        tableRow(totRowCells),
                        tableRow(adultsRowCells),
                        tableRow(globalRowCells),
                    ]),
                    para(
                        [
                            run(
                                "* Adultes théoriques permanents (hors intervenants variables du jour)",
                                { size: 16, italics: true, color: "666666" }
                            ),
                        ],
                        { spacing: { before: 120 } }
                    ),
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
function makeOptionASheet(config, data, byClass, classes, teacherByClass) {
    const zone = config.zones[0];

    // Section adultes : tous sauf cellule de crise
    const allAdults = [
        // Enseignants depuis CSV
        ...classes
            .filter((cl) => teacherByClass[cl])
            .map((cl) => ({
                nom: teacherByClass[cl],
                prenom: "",
                fonction: "Enseignant(e)",
                zone: zone.name,
            })),
        // Staff rattaché à une classe
        ...config.staff
            .filter((s) => s.rattachement.startsWith("class_"))
            .map((s) => ({
                nom: s.nom,
                prenom: s.prenom,
                fonction: s.fonction || "",
                zone: zone.name,
            })),
        // Staff rattaché à la zone
        ...getZoneStaff(config, zone.id).map((s) => ({
            nom: s.nom,
            prenom: s.prenom,
            fonction: s.fonction || "",
            zone: zone.name,
        })),
    ];

    const WA = [2200, 1800, 2200, 1200, 500, 500, 500, 500];
    const COLS_A = ["NOM", "PRÉNOM", "FONCTION", "ZONE", "P", "A", "M", "B"];

    const adultRows = allAdults.map((a, i) =>
        tableRow([
            cell(a.nom, { alt: i % 2 !== 0, w: WA[0] }),
            cell(a.prenom, { alt: i % 2 !== 0, w: WA[1] }),
            cell(a.fonction, { alt: i % 2 !== 0, w: WA[2] }),
            cell(a.zone, { alt: i % 2 !== 0, w: WA[3] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WA[4] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WA[5] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WA[6] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WA[7] }),
        ])
    );

    const blankAdultRows = Array.from(
        { length: config.blankIntervenantRows },
        (_, i) => {
            const alt = (allAdults.length + i) % 2 !== 0;
            return tableRow(
                WA.map((w, j) =>
                    j < 4
                        ? cell("", { alt, w })
                        : cell(BOX, { alt, center: true, w })
                )
            );
        }
    );

    // Section élèves
    const W = [2000, 1600, 1400, 1100, 1100, 1100, 1100];
    const COLS_S = [
        "NOM",
        "PRÉNOM",
        "CLASSE",
        "PRÉSENT",
        "ABSENT",
        "MANQUANT",
        "BLESSÉ",
    ];

    const studentRows = classes.flatMap((cl, ci) =>
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

    const crisisCell = getCrisisCell(config);

    return new Document({
        sections: [
            {
                properties: { page: { margin: PAGE_MARGIN } },
                children: [
                    ...makeDocHeader(
                        config.schoolName,
                        "FICHE DE RECENSEMENT",
                        [
                            `Zone : ${zone.name}   |   Responsable : ${zone.responsible}`,
                            `Cellule de crise : ${crisisCell}`,
                        ]
                    ),
                    sectionTitle(
                        `Adultes (${allAdults.length} permanents + ${config.blankIntervenantRows} lignes variables)`
                    ),
                    makeTable([
                        tableRow(
                            COLS_A.map((c, i) =>
                                cell(c, {
                                    header: true,
                                    center: i >= 4,
                                    w: WA[i],
                                })
                            ),
                            { isHeader: true }
                        ),
                        ...adultRows,
                        ...(config.blankIntervenantRows > 0
                            ? [
                                  tableRow([
                                      cell(
                                          "← Intervenants / personnels variables — à compléter le jour J",
                                          { w: TABLE_W }
                                      ),
                                  ]),
                                  ...blankAdultRows,
                              ]
                            : []),
                    ]),
                    sectionTitle(`Élèves (${data.length})`),
                    makeTable([
                        tableRow(
                            COLS_S.map((c, i) =>
                                cell(c, {
                                    header: true,
                                    center: i >= 3,
                                    w: W[i],
                                })
                            ),
                            { isHeader: true }
                        ),
                        ...studentRows,
                    ]),
                    ...makeFooter(data.length, allAdults.length),
                ],
            },
        ],
    });
}

// ── Point d'entrée ─────────────────────────────────────────────────
export async function generateAndDownload(config, csvData) {
    const { data, byClass, classes, teacherByClass } = csvData;
    const { configType, zones, classZoneMap } = config;

    if (configType === "A") {
        const zip = new JSZip();
        const sheet = makeOptionASheet(
            config,
            data,
            byClass,
            classes,
            teacherByClass
        );
        zip.file(
            `PPMS_${slug(config.schoolName)}_recensement.docx`,
            await Packer.toBlob(sheet)
        );

        // Fiche adultes zone unique
        const zoneStaff = getZoneStaff(config, zones[0].id);
        const adultsSheet = makeAdultsZoneSheet(
            zones[0],
            zoneStaff,
            config.blankIntervenantRows,
            config.schoolName
        );
        zip.file(
            `PPMS_${slug(config.schoolName)}_adultes.docx`,
            await Packer.toBlob(adultsSheet)
        );

        saveAs(
            await zip.generateAsync({ type: "blob" }),
            `PPMS_${slug(config.schoolName)}.zip`
        );
        return { count: 2 };
    }

    // Option B
    const zip = new JSZip();
    let count = 0;

    // 1 – Fiches classes
    for (const cl of classes) {
        const zoneId =
            zones.length > 1 ? classZoneMap[cl] || zones[0].id : zones[0].id;
        const zone = zones.find((z) => z.id === zoneId) || zones[0];
        const classStaff = getClassStaff(config, cl);
        const doc = makeClassSheet(
            cl,
            byClass[cl] || [],
            teacherByClass[cl] || "",
            classStaff,
            zone,
            config.schoolName
        );
        zip.file(`PPMS_Classe_${slug(cl)}.docx`, await Packer.toBlob(doc));
        count++;
    }

    // 2 – Fiches adultes par zone
    for (const zone of zones) {
        const zoneStaff = getZoneStaff(config, zone.id);
        const doc = makeAdultsZoneSheet(
            zone,
            zoneStaff,
            config.blankIntervenantRows,
            config.schoolName
        );
        zip.file(
            `PPMS_Adultes_Zone_${slug(zone.name)}.docx`,
            await Packer.toBlob(doc)
        );
        count++;
    }

    // 3 – Synthèses par zone (multi-zones seulement)
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
            count++;
        }
    }

    // 4 – Synthèse globale
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
    count++;

    saveAs(
        await zip.generateAsync({ type: "blob" }),
        `PPMS_${slug(config.schoolName)}.zip`
    );
    return { count };
}
