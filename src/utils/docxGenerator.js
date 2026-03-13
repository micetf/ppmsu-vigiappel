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
    SectionType,
} from "docx";
import { fullName } from "./formatName";

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
};
const PAGE_MARGIN = { top: 1134, bottom: 1134, left: 1134, right: 1134 };
const TABLE_W = 9400;

// ── Helpers ────────────────────────────────────────────────────────
export const slug = (str) =>
    String(str ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 40);

const zoneResponsible = (zone) =>
    fullName(zone.responsibleNom, zone.responsiblePrenom) || "Non défini";

const getCrisisCell = (config) => {
    const { nom, prenom, fonction } = config.crisisCell ?? {};
    if (!nom?.trim()) return "Non défini";
    return fullName(nom, prenom) + (fonction ? ` (${fonction})` : "");
};

const getClassStaff = (config, classe) =>
    config.staff.filter((s) => s.rattachement === `class_${classe}`);

const getZoneStaff = (config, zoneId) =>
    config.staff.filter((s) => s.rattachement === zoneId);

// ── Helpers typographie ────────────────────────────────────────────
const run = (text, opts = {}) =>
    new TextRun({
        text: String(text ?? ""),
        font: FONT,
        size: 20,
        color: "000000",
        ...opts,
    });

const para = (children, opts = {}) =>
    new Paragraph({ children, spacing: { before: 60, after: 60 }, ...opts });

const sectionTitle = (text) =>
    para([run(text, { bold: true, size: 20, color: "1E3A5F" })], {
        spacing: { before: 300, after: 100 },
    });

// ── Helpers tableau ────────────────────────────────────────────────
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

const tableRow = (cells, { isHeader = false, height = 450 } = {}) =>
    new TableRow({
        tableHeader: isHeader,
        height: { value: height, rule: HeightRule.ATLEAST },
        children: cells,
    });

const makeTable = (rows) =>
    new Table({ width: { size: TABLE_W, type: WidthType.DXA }, rows });

const makeSection = (children, isLast = false) => ({
    properties: isLast
        ? { page: { margin: PAGE_MARGIN } }
        : { type: SectionType.NEXT_PAGE, page: { margin: PAGE_MARGIN } },
    children,
});

// ── En-tête et pied ────────────────────────────────────────────────
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

const makeFooter = (nbEleves, nbAdultes) => [
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
        [run("Date : _____ / _____ / ____________      Heure : _____ h _____")],
        { spacing: { before: 200, after: 0 } }
    ),
];

const makeDateLine = () =>
    para(
        [run("Date : _____ / _____ / ____________      Heure : _____ h _____")],
        { spacing: { before: 200, after: 0 } }
    );

// ── Constructeurs de contenu ───────────────────────────────────────

function makeAdultsChildren(zone, zoneStaff, blankRows, schoolName) {
    const W = [2200, 1600, 2000, 800, 700, 700, 700, 700];
    const COLS = [
        "NOM",
        "PRÉNOM",
        "FONCTION",
        "ZONE HABITUELLE",
        "PRÉSENT",
        "ABSENT",
        "MANQUANT",
        "BLESSÉ",
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

    return [
        ...makeDocHeader(schoolName, `ADULTES — ${zone.name.toUpperCase()}`, [
            `Responsable de zone : ${zoneResponsible(zone)}`,
            "Compléter les lignes vierges avec les intervenants présents le jour J",
        ]),
        makeTable([
            tableRow(
                COLS.map((c, i) =>
                    cell(c, { header: true, center: i >= 4, w: W[i] })
                ),
                { isHeader: true }
            ),
            ...staffRows,
            ...(blankRows > 0
                ? [
                      tableRow([
                          cell(
                              "← Intervenants / personnels variables — à compléter",
                              { w: TABLE_W }
                          ),
                      ]),
                      ...blankRowsList,
                  ]
                : []),
        ]),
        para(
            [
                run(`Total adultes permanents : ${zoneStaff.length}`, {
                    bold: true,
                }),
                run("     Intervenants variables présents : _____"),
            ],
            { spacing: { before: 200 } }
        ),
        makeDateLine(),
    ];
}

function makeClassChildren(
    classe,
    students,
    teacher,
    classStaff,
    zone,
    schoolName
) {
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

    const allAdults = [
        ...(teacher
            ? [{ nom: teacher, prenom: "", fonction: "Enseignant(e)" }]
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

    return [
        ...makeDocHeader(schoolName, "FICHE DE RECENSEMENT", [
            `Classe : ${classe}`,
            `Zone : ${zone.name}   |   Responsable de zone : ${zoneResponsible(zone)}`,
        ]),
        sectionTitle(`Adultes (${allAdults.length})`),
        makeTable([
            tableRow(
                COLS_A.map((c, i) =>
                    cell(c, { header: true, center: i >= 3, w: WA[i] })
                ),
                { isHeader: true }
            ),
            ...adultRows,
        ]),
        sectionTitle(`Élèves (${students.length})`),
        makeTable([
            tableRow(
                COLS_S.map((c, i) =>
                    cell(c, { header: true, center: i >= 2, w: WS[i] })
                ),
                { isHeader: true }
            ),
            ...studentRows,
        ]),
        ...makeFooter(students.length, allAdults.length),
    ];
}

function makeOptionAChildren(config, byClass, classes, teacherByClass) {
    const zone = config.zones[0];
    const crisisCell = getCrisisCell(config);

    const allAdults = [
        ...classes
            .filter((cl) => teacherByClass[cl])
            .map((cl) => ({
                nom: teacherByClass[cl],
                prenom: "",
                fonction: "Enseignant(e)",
            })),
        ...config.staff
            .filter((s) => s.rattachement !== "cellule")
            .map((s) => ({
                nom: s.nom,
                prenom: s.prenom,
                fonction: s.fonction || "",
            })),
    ];

    const WA = [2200, 1800, 2800, 500, 500, 500, 500];
    const COLS_A = ["NOM", "PRÉNOM", "FONCTION", "P", "A", "M", "B"];

    const adultRows = allAdults.map((a, i) =>
        tableRow([
            cell(a.nom, { alt: i % 2 !== 0, w: WA[0] }),
            cell(a.prenom, { alt: i % 2 !== 0, w: WA[1] }),
            cell(a.fonction, { alt: i % 2 !== 0, w: WA[2] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WA[3] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WA[4] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WA[5] }),
            cell(BOX, { alt: i % 2 !== 0, center: true, w: WA[6] }),
        ])
    );

    const blankRows = Array.from(
        { length: config.blankIntervenantRows },
        (_, i) => {
            const alt = (allAdults.length + i) % 2 !== 0;
            return tableRow(
                WA.map((w, j) =>
                    j < 3
                        ? cell("", { alt, w })
                        : cell(BOX, { alt, center: true, w })
                )
            );
        }
    );

    const W = [1400, 1800, 1400, 1000, 1000, 1000, 1000, 800];
    const COLS_S = [
        "CLASSE",
        "ENSEIGNANT(E)",
        "ÉLÈVES INSCRITS",
        "PRÉSENTS",
        "ABSENTS",
        "MANQUANTS",
        "BLESSÉS",
        "ADULTES PRÉSENTS",
    ];
    const totalStudents = classes.reduce(
        (s, cl) => s + (byClass[cl]?.length ?? 0),
        0
    );

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

    return [
        ...makeDocHeader(config.schoolName, "FICHE DE RECENSEMENT", [
            `Zone : ${zone.name}   |   Responsable : ${zoneResponsible(zone)}`,
            `Cellule de crise : ${crisisCell}`,
        ]),
        sectionTitle(
            `Adultes (${allAdults.length} permanents + ${config.blankIntervenantRows} lignes variables)`
        ),
        makeTable([
            tableRow(
                COLS_A.map((c, i) =>
                    cell(c, { header: true, center: i >= 3, w: WA[i] })
                ),
                { isHeader: true }
            ),
            ...adultRows,
            ...(config.blankIntervenantRows > 0
                ? [
                      tableRow([
                          cell(
                              "← Intervenants / personnels variables — à compléter",
                              { w: TABLE_W }
                          ),
                      ]),
                      ...blankRows,
                  ]
                : []),
        ]),
        sectionTitle(`Élèves (${totalStudents})`),
        makeTable([
            tableRow(
                COLS_S.map((c, i) =>
                    cell(c, { header: true, center: i >= 3, w: W[i] })
                ),
                { isHeader: true }
            ),
            ...studentRows,
        ]),
        ...makeFooter(totalStudents, allAdults.length),
    ];
}

function makeZoneSummaryChildren(
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

    return [
        ...makeDocHeader(
            schoolName,
            `SYNTHÈSE — ZONE ${zone.name.toUpperCase()}`,
            [`Responsable de zone : ${zoneResponsible(zone)}`]
        ),
        makeTable([
            tableRow(
                COLS.map((c, i) =>
                    cell(c, { header: true, center: i >= 2, w: W[i] })
                ),
                { isHeader: true }
            ),
            ...classesInZone.map((cl, i) =>
                tableRow([
                    cell(cl, { alt: i % 2 !== 0, w: W[0] }),
                    cell(teacherByClass[cl] || "", {
                        alt: i % 2 !== 0,
                        w: W[1],
                    }),
                    cell(String(byClass[cl]?.length ?? 0), {
                        alt: i % 2 !== 0,
                        center: true,
                        w: W[2],
                    }),
                    ...W.slice(3).map((w) =>
                        cell("_____", { alt: i % 2 !== 0, center: true, w })
                    ),
                ])
            ),
            tableRow([
                cell("TOTAL", { w: W[0] }),
                cell("", { w: W[1] }),
                cell(String(total), { center: true, w: W[2] }),
                ...W.slice(3).map((w) => cell("_____", { center: true, w })),
            ]),
        ]),
        makeDateLine(),
    ];
}

function makeGlobalSummaryChildren(config, byClass, teacherByClass, classes) {
    const { zones, classZoneMap } = config;
    const multiZone = zones.length > 1;
    const crisisCell = getCrisisCell(config);
    const totalStudents = classes.reduce(
        (s, cl) => s + (byClass[cl]?.length ?? 0),
        0
    );
    const totalAdultsTheo =
        classes.filter((cl) => teacherByClass[cl]).length +
        config.staff.filter((s) => s.rattachement !== "cellule").length;

    const W = multiZone
        ? [1000, 1400, 2200, 1000, 950, 950, 950, 950]
        : [1600, 2400, 1200, 1000, 1000, 1000, 1200];
    const COLS = multiZone
        ? [
              "ZONE",
              "CLASSE",
              "ENSEIGNANT(E)",
              "ÉLÈVES INSCRITS",
              "PRÉSENTS",
              "ABSENTS",
              "MANQUANTS",
              "BLESSÉS",
          ]
        : [
              "CLASSE",
              "ENSEIGNANT(E)",
              "ÉLÈVES INSCRITS",
              "PRÉSENTS",
              "ABSENTS",
              "MANQUANTS",
              "BLESSÉS",
          ];
    const offset = multiZone ? 4 : 3;

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
        return [
            ...base,
            ...W.slice(offset).map((w) =>
                cell("_____", { alt: i % 2 !== 0, center: true, w })
            ),
        ];
    };

    const makeTotalRow = (label, value) => {
        const base = multiZone
            ? [
                  cell(label, { w: W[0] }),
                  cell("", { w: W[1] }),
                  cell("", { w: W[2] }),
                  cell(String(value), { center: true, w: W[3] }),
              ]
            : [
                  cell(label, { w: W[0] }),
                  cell("", { w: W[1] }),
                  cell(String(value), { center: true, w: W[2] }),
              ];
        return tableRow([
            ...base,
            ...W.slice(offset).map((w) => cell("_____", { center: true, w })),
        ]);
    };

    return [
        ...makeDocHeader(config.schoolName, "SYNTHÈSE CELLULE DE CRISE", [
            `Responsable cellule de crise : ${crisisCell}`,
        ]),
        makeTable([
            tableRow(
                COLS.map((c, i) =>
                    cell(c, { header: true, center: i >= offset, w: W[i] })
                ),
                { isHeader: true }
            ),
            ...classes.map((cl, i) => tableRow(makeRowCells(cl, i))),
            makeTotalRow("TOTAL ÉLÈVES", totalStudents),
            makeTotalRow("TOTAL ADULTES*", totalAdultsTheo),
            makeTotalRow("TOTAL GÉNÉRAL", totalStudents + totalAdultsTheo),
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
        makeDateLine(),
    ];
}

// ── Builders de documents ──────────────────────────────────────────
function buildZoneDocument(
    zone,
    config,
    byClass,
    teacherByClass,
    classesInZone
) {
    const allChildren = [
        makeAdultsChildren(
            zone,
            getZoneStaff(config, zone.id),
            config.blankIntervenantRows,
            config.schoolName
        ),
        ...classesInZone.map((cl) =>
            makeClassChildren(
                cl,
                byClass[cl] || [],
                teacherByClass[cl] || "",
                getClassStaff(config, cl),
                zone,
                config.schoolName
            )
        ),
    ];
    return new Document({
        sections: allChildren.map((children, i) =>
            makeSection(children, i === allChildren.length - 1)
        ),
    });
}

function buildCrisisDocument(config, byClass, teacherByClass, classes) {
    const { zones, classZoneMap } = config;
    const multiZone = zones.length > 1;

    const allChildren = [
        makeGlobalSummaryChildren(config, byClass, teacherByClass, classes),
        ...(multiZone
            ? zones.map((zone) => {
                  const classesInZone = classes.filter(
                      (cl) => classZoneMap[cl] === zone.id
                  );
                  return makeZoneSummaryChildren(
                      zone,
                      classesInZone,
                      byClass,
                      teacherByClass,
                      config.schoolName
                  );
              })
            : []),
    ];

    return new Document({
        sections: allChildren.map((children, i) =>
            makeSection(children, i === allChildren.length - 1)
        ),
    });
}

// ── Point d'entrée — retourne [{name, blob}] ───────────────────────
export async function generateAll(config, csvData) {
    const { byClass, classes, teacherByClass } = csvData;
    const { configType, zones, classZoneMap } = config;
    const files = [];

    if (configType === "A") {
        const children = makeOptionAChildren(
            config,
            byClass,
            classes,
            teacherByClass
        );
        files.push({
            name: `PPMS_Zone_${slug(zones[0].name || "Zone")}.docx`,
            label: `Mallette — ${zones[0].name || "Zone"}`,
            blob: await Packer.toBlob(
                new Document({ sections: [makeSection(children, true)] })
            ),
        });
    } else {
        for (const zone of zones) {
            const classesInZone =
                zones.length > 1
                    ? classes.filter((cl) => classZoneMap[cl] === zone.id)
                    : classes;
            files.push({
                name: `PPMS_Zone_${slug(zone.name || "Zone")}.docx`,
                label: `Mallette — ${zone.name || "Zone"}`,
                description: `Adultes + ${classesInZone.length} classe(s)`,
                blob: await Packer.toBlob(
                    buildZoneDocument(
                        zone,
                        config,
                        byClass,
                        teacherByClass,
                        classesInZone
                    )
                ),
            });
        }
    }

    files.push({
        name: "PPMS_Cellule_Crise.docx",
        label: "Cellule de crise",
        description:
            "Synthèse globale" +
            (zones.length > 1 ? " + synthèses par zone" : ""),
        blob: await Packer.toBlob(
            buildCrisisDocument(config, byClass, teacherByClass, classes)
        ),
    });

    return files;
}
