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
const SHADE_MUTED = {
    type: ShadingType.SOLID,
    fill: "F0F0F0",
    color: "F0F0F0",
};

// ── Helpers ────────────────────────────────────────────────────────
export const slug = (str) =>
    String(str ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 40);

const getCrisisCell = (config, teacherByClass = {}, staffById = {}) => {
    const adult = resolveAdult(config.crisisCell, teacherByClass, staffById);
    if (!adult) return "Non défini";
    const extra =
        config.staff?.filter((s) => s.rattachement === "cellule") ?? [];
    const base =
        fullName(adult.nom, adult.prenom) +
        (config.crisisCell.fonction ? ` (${config.crisisCell.fonction})` : "");
    return extra.length > 0
        ? `${base} + ${extra.length} autre${extra.length > 1 ? "s" : ""}`
        : base;
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
    {
        header = false,
        alt = false,
        adult = false,
        center = false,
        w,
        muted = false,
    } = {}
) {
    const shading = header
        ? SHADE_HEADER
        : muted
          ? SHADE_MUTED
          : adult
            ? SHADE_ADULT
            : alt
              ? SHADE_ALT
              : undefined;
    const color = muted ? "AAAAAA" : "000000";
    return new TableCell({
        borders: ALL_BORDERS,
        shading,
        width: w ? { size: w, type: WidthType.DXA } : undefined,
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
            para(
                [
                    run(text, {
                        bold: header,
                        size: header ? 18 : 20,
                        strike: muted,
                        color,
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

// ── Helpers de résolution ──────────────────────────────────────────

/** Résout un objet adulte (crisisCell ou zoneResponsible) en { nom, prenom, fonction } */
function resolveAdult(adultConfig, teacherByClass, staffById) {
    if (!adultConfig) return null;
    if (adultConfig.source === "teacher") {
        const name = teacherByClass[adultConfig.teacherClass];
        if (!name) return null;
        return {
            nom: name,
            prenom: "",
            fonction: adultConfig.fonction || "Enseignant(e)",
        };
    }
    if (adultConfig.source === "staff") {
        const s = staffById[adultConfig.staffId];
        if (!s) return null;
        return {
            nom: s.nom,
            prenom: s.prenom,
            fonction: adultConfig.fonction || s.fonction || "",
        };
    }
    // manual
    if (!adultConfig.nom?.trim()) return null;
    return {
        nom: adultConfig.nom,
        prenom: adultConfig.prenom || "",
        fonction: adultConfig.fonction || "",
    };
}

/** Résout un substitut en { nom, prenom, fonction } */
function resolveSubstitute(substitute, staffById) {
    if (!substitute) return null;
    if (substitute.source === "staff") {
        const s = staffById[substitute.staffId];
        if (!s) return null;
        return {
            nom: s.nom,
            prenom: s.prenom,
            fonction: substitute.fonction || s.fonction || "",
        };
    }
    if (!substitute.nom?.trim()) return null;
    return {
        nom: substitute.nom,
        prenom: substitute.prenom || "",
        fonction: substitute.fonction || "",
    };
}

/** Nom d'affichage du responsable de zone pour les en-têtes */
function getZoneResponsibleName(zone, config, teacherByClass, staffById) {
    const resp = config.zoneResponsibles?.[zone.id];
    const adult = resolveAdult(resp, teacherByClass, staffById);
    return adult ? fullName(adult.nom, adult.prenom) : "Non défini";
}

/**
 * Retourne les infos de substitution pour une classe donnée,
 * en inspectant crisisCell et zoneResponsibles.
 * @returns { mission, teacherNom, sub: { nom, prenom, fonction } } | null
 */
function getClassSubstitute(classe, config, teacherByClass, staffById) {
    // Vérifier cellule de crise
    const cc = config.crisisCell;
    if (cc?.source === "teacher" && cc?.teacherClass === classe) {
        return {
            mission: cc.fonction || "Cellule de crise",
            teacherNom: teacherByClass[classe] || "",
            sub: resolveSubstitute(cc.substitute, staffById),
        };
    }
    // Vérifier chaque responsable de zone
    for (const [zoneId, resp] of Object.entries(
        config.zoneResponsibles || {}
    )) {
        if (resp?.source === "teacher" && resp?.teacherClass === classe) {
            const zone = config.zones.find((z) => z.id === zoneId);
            return {
                mission:
                    resp.fonction || `Responsable zone ${zone?.name || ""}`,
                teacherNom: teacherByClass[classe] || "",
                sub: resolveSubstitute(resp.substitute, staffById),
            };
        }
    }
    return null;
}

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

function makeAdultsChildren(
    zone,
    zoneStaff,
    blankRows,
    schoolName,
    config,
    teacherByClass,
    staffById
) {
    const W = [2200, 1800, 2200, 1200, 700, 700, 700, 700];
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

    // Responsable de zone en 1re ligne
    const resp = config.zoneResponsibles?.[zone.id];
    const responsible = resolveAdult(resp, teacherByClass, staffById);
    const respRow = responsible
        ? [{ ...responsible, fonction: resp.fonction || "Responsable de zone" }]
        : [];

    const allAdults = [...respRow, ...zoneStaff];

    const staffRows = allAdults.map((s) =>
        tableRow([
            cell(s.nom, { adult: true, w: W[0] }),
            cell(s.prenom, { adult: true, w: W[1] }),
            cell(s.fonction || "", { adult: true, w: W[2] }),
            cell(zone.name, { adult: true, w: W[3] }),
            cell(BOX, { adult: true, center: true, w: W[4] }),
            cell(BOX, { adult: true, center: true, w: W[5] }),
            cell(BOX, { adult: true, center: true, w: W[6] }),
            cell(BOX, { adult: true, center: true, w: W[7] }),
        ])
    );

    const blankRowsList = Array.from({ length: blankRows }, (_, i) => {
        const alt = (allAdults.length + i) % 2 !== 0;
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
            `Responsable de zone : ${getZoneResponsibleName(zone, config, teacherByClass, staffById)}`,
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
                run(`Total adultes permanents : ${allAdults.length}`, {
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
    schoolName,
    config,
    teacherByClass,
    staffById
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

    const substituteInfo = getClassSubstitute(
        classe,
        config,
        teacherByClass,
        staffById
    );
    const extras = (config?.classExtraTeachers?.[classe] || []).filter((et) =>
        et.nom.trim()
    );

    const allAdults = [];

    if (teacher) {
        if (substituteInfo) {
            // Enseignant absent → ligne grisée + barrée
            allAdults.push({
                nom: teacher,
                prenom: "",
                fonction: substituteInfo.mission,
                muted: true,
            });
            // Substitut actif
            if (substituteInfo.sub) {
                allAdults.push({
                    ...substituteInfo.sub,
                    fonction: `${substituteInfo.sub.fonction || ""}${substituteInfo.sub.fonction ? " — " : ""}encadrant(e) PPMS`,
                    muted: false,
                });
            }
        } else {
            allAdults.push({
                nom: teacher,
                prenom: "",
                fonction: "Enseignant(e)",
                muted: false,
            });
        }
    }

    // Co-titulaires / décharges
    extras.forEach((et) =>
        allAdults.push({
            nom: et.nom,
            prenom: et.prenom || "",
            fonction: et.fonction || "Décharge",
            muted: false,
        })
    );

    // Staff rattaché à cette classe
    allAdults.push(
        ...classStaff.map((s) => ({
            nom: s.nom,
            prenom: s.prenom,
            fonction: s.fonction || "",
            muted: false,
        }))
    );

    const activeAdults = allAdults.filter((a) => !a.muted);

    const adultRows = allAdults.map((a) =>
        tableRow([
            cell(a.nom, { adult: !a.muted, muted: a.muted, w: WA[0] }),
            cell(a.prenom, { adult: !a.muted, muted: a.muted, w: WA[1] }),
            cell(a.fonction, { adult: !a.muted, muted: a.muted, w: WA[2] }),
            ...(a.muted
                ? WA.slice(3).map((w) =>
                      cell("—", { muted: true, center: true, w })
                  )
                : WA.slice(3).map((w) =>
                      cell(BOX, { adult: true, center: true, w })
                  )),
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
            `Zone : ${zone.name}   |   Responsable : ${getZoneResponsibleName(zone, config, teacherByClass, staffById)}`,
        ]),
        sectionTitle(
            `Adultes (${activeAdults.length} actif${activeAdults.length > 1 ? "s" : ""})`
        ),
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
        ...makeFooter(students.length, activeAdults.length),
    ];
}

// ── makeOptionAChildren ────────────────────────────────────────────
function makeOptionAChildren(config, byClass, classes, teacherByClass) {
    const zone = config.zones[0];
    const crisisCell = getCrisisCell(config);
    const staffById = Object.fromEntries(config.staff.map((s) => [s.id, s]));

    // ── Construction de la liste adultes ──
    const allAdults = [];

    // 1. Responsable de zone en premier
    if (zone.responsibleNom?.trim()) {
        allAdults.push({
            nom: zone.responsibleNom,
            prenom: zone.responsiblePrenom || "",
            fonction: "Responsable de zone",
            muted: false,
        });
    }

    // 2. Enseignants (avec overrides et décharges)
    classes.forEach((cl) => {
        const teacher = teacherByClass[cl];
        const override = config.classOverrides?.[cl];
        const extras = (config.classExtraTeachers?.[cl] || []).filter((et) =>
            et.nom.trim()
        );

        if (teacher) {
            if (override?.teacherUnavailable) {
                // Enseignant absent → ligne grisée/barrée
                allAdults.push({
                    nom: teacher,
                    prenom: "",
                    fonction: `Absent(e) du groupe ${cl} — mission PPMS`,
                    muted: true,
                });
                // Substitut
                let sub = null;
                if (
                    override.substituteSource === "staff" &&
                    override.substituteStaffId
                ) {
                    const s = staffById[override.substituteStaffId];
                    if (s)
                        sub = {
                            nom: s.nom,
                            prenom: s.prenom,
                            fonction: `${s.fonction || ""} — encadrant(e) ${cl}`,
                        };
                } else if (
                    override.substituteSource === "manual" &&
                    override.substituteNom?.trim()
                ) {
                    sub = {
                        nom: override.substituteNom,
                        prenom: override.substitutePrenom || "",
                        fonction: `${override.substituteFonction || ""} — encadrant(e) ${cl}`,
                    };
                }
                if (sub) allAdults.push({ ...sub, muted: false });
            } else {
                allAdults.push({
                    nom: teacher,
                    prenom: "",
                    fonction: `Enseignant(e) — ${cl}`,
                    muted: false,
                });
            }
        }

        // Décharges / co-titulaires
        extras.forEach((et) =>
            allAdults.push({
                nom: et.nom,
                prenom: et.prenom || "",
                fonction: `${et.fonction || "Décharge"} — ${cl}`,
                muted: false,
            })
        );
    });

    // 3. Staff (hors cellule de crise)
    config.staff
        .filter((s) => s.rattachement !== "cellule")
        .forEach((s) =>
            allAdults.push({
                nom: s.nom,
                prenom: s.prenom,
                fonction: s.fonction || "",
                muted: false,
            })
        );

    const activeAdults = allAdults.filter((a) => !a.muted);

    // ── Tableau adultes ──
    const WA = [2000, 1600, 2800, 700, 700, 700, 700];
    const COLS_A = [
        "NOM",
        "PRÉNOM",
        "FONCTION",
        "PRÉSENT",
        "ABSENT",
        "MANQUANT",
        "BLESSÉ",
    ];

    const adultRows = allAdults.map((a) =>
        tableRow([
            cell(a.nom, { adult: !a.muted, muted: a.muted, w: WA[0] }),
            cell(a.prenom, { adult: !a.muted, muted: a.muted, w: WA[1] }),
            cell(a.fonction, { adult: !a.muted, muted: a.muted, w: WA[2] }),
            ...(a.muted
                ? WA.slice(3).map((w) =>
                      cell("—", { muted: true, center: true, w })
                  )
                : WA.slice(3).map((w) =>
                      cell(BOX, { adult: true, center: true, w })
                  )),
        ])
    );

    const blankRows = Array.from(
        { length: config.blankIntervenantRows },
        (_, i) => {
            const alt = (allAdults.length + i) % 2 !== 0;
            return tableRow([
                cell("", { alt, w: WA[0] }),
                cell("", { alt, w: WA[1] }),
                cell("", { alt, w: WA[2] }),
                ...WA.slice(3).map((w) => cell(BOX, { alt, center: true, w })),
            ]);
        }
    );

    // ── Tableau élèves ──
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
            `Zone : ${zone.name}   |   Responsable : ${fullName(zone.responsibleNom, zone.responsiblePrenom)}`,
            `Cellule de crise : ${crisisCell}`,
        ]),
        sectionTitle(
            `Adultes (${activeAdults.length} permanent${activeAdults.length > 1 ? "s" : ""}` +
                (config.blankIntervenantRows > 0
                    ? ` + ${config.blankIntervenantRows} lignes variables)`
                    : ")")
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
        ...makeFooter(totalStudents, activeAdults.length),
    ];
}

// ── makeZoneSummaryChildren ────────────────────────────────────────
function makeZoneSummaryChildren(
    zone,
    classesInZone,
    byClass,
    teacherByClass,
    schoolName,
    config = null
) {
    const W = [1400, 2000, 1400, 1000, 1000, 1000, 1000, 800];
    const COLS = [
        "CLASSE",
        "ENSEIGNANT(E)",
        "ÉLÈVES INSCRITS",
        "PRÉSENTS",
        "ABSENTS",
        "MANQUANTS",
        "BLESSÉS",
        "ADULTES PRÉSENTS",
    ];

    const totalStudents = classesInZone.reduce(
        (s, cl) => s + (byClass[cl]?.length ?? 0),
        0
    );

    // Adultes permanents de la zone (responsable + staff rattaché)
    const zoneStaff = config ? getZoneStaff(config, zone.id) : [];
    const hasResponsible = !!zone.responsibleNom?.trim();
    const permanentAdults = (hasResponsible ? 1 : 0) + zoneStaff.length;
    // + enseignants actifs des classes de cette zone
    const activeTeachers = classesInZone.filter((cl) => {
        if (!teacherByClass[cl]) return false;
        const override = config?.classOverrides?.[cl];
        return !override?.teacherUnavailable; // enseignant absent → ne compte pas
    }).length;
    const totalPermanentAdults = permanentAdults + activeTeachers;

    const classRows = classesInZone.map((cl, i) => {
        const override = config?.classOverrides?.[cl];
        const isOverridden = !!override?.teacherUnavailable;
        const extras = (config?.classExtraTeachers?.[cl] || []).filter((et) =>
            et.nom.trim()
        );
        const teacher = teacherByClass[cl] || "";

        // Nom affiché de l'enseignant : barré si absent
        const teacherDisplay = isOverridden ? `(${teacher} — absent)` : teacher;

        // Extras : ajouter en note
        const extrasNote =
            extras.length > 0
                ? ` + ${extras.map((et) => et.nom).join(", ")}`
                : "";

        return tableRow([
            cell(cl, { alt: i % 2 !== 0, w: W[0] }),
            cell(teacherDisplay + extrasNote, { alt: i % 2 !== 0, w: W[1] }),
            cell(String(byClass[cl]?.length ?? 0), {
                alt: i % 2 !== 0,
                center: true,
                w: W[2],
            }),
            ...W.slice(3).map((w) =>
                cell("_____", { alt: i % 2 !== 0, center: true, w })
            ),
        ]);
    });

    const totalRow = tableRow([
        cell("TOTAL", { w: W[0] }),
        cell("", { w: W[1] }),
        cell(String(totalStudents), { center: true, w: W[2] }),
        ...W.slice(3).map((w) => cell("_____", { center: true, w })),
    ]);

    return [
        ...makeDocHeader(
            schoolName,
            `SYNTHÈSE — ZONE ${zone.name.toUpperCase()}`,
            [
                `Responsable de zone : ${fullName(zone.responsibleNom, zone.responsiblePrenom)}`,
                `Adultes permanents de la zone : ${totalPermanentAdults}`,
            ]
        ),
        makeTable([
            tableRow(
                COLS.map((c, i) =>
                    cell(c, { header: true, center: i >= 2, w: W[i] })
                ),
                { isHeader: true }
            ),
            ...classRows,
            totalRow,
        ]),
        makeDateLine(),
    ];
}

function makeGlobalSummaryChildren(config, byClass, teacherByClass, classes) {
    const staffById = Object.fromEntries(config.staff.map((s) => [s.id, s]));
    const { zones, classZoneMap } = config;
    const multiZone = zones.length > 1;
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
        const override = getClassSubstitute(
            cl,
            config,
            teacherByClass,
            staffById
        );
        const teacherDisplay = teacherByClass[cl]
            ? override
                ? `(${teacherByClass[cl]} — ${override.mission})`
                : teacherByClass[cl]
            : "";
        const base = multiZone
            ? [
                  cell(zoneObj.name, { alt: i % 2 !== 0, w: W[0] }),
                  cell(cl, { alt: i % 2 !== 0, w: W[1] }),
                  cell(teacherDisplay, { alt: i % 2 !== 0, w: W[2] }),
                  cell(String(byClass[cl]?.length ?? 0), {
                      alt: i % 2 !== 0,
                      center: true,
                      w: W[3],
                  }),
              ]
            : [
                  cell(cl, { alt: i % 2 !== 0, w: W[0] }),
                  cell(teacherDisplay, { alt: i % 2 !== 0, w: W[1] }),
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
            `Responsable cellule de crise : ${getCrisisCell(config, teacherByClass, staffById)}`,
        ]),
        ...makeCrisisCellAdultsChildren(config, teacherByClass, staffById),
        para([run("─".repeat(60), { color: "CCCCCC" })], {
            spacing: { before: 200, after: 200 },
        }),
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

function makeCrisisCellAdultsChildren(config, teacherByClass, staffById) {
    const WA = [2200, 1800, 2800, 800, 800, 800, 800];
    const COLS_A = [
        "NOM",
        "PRÉNOM",
        "FONCTION",
        "PRÉSENT",
        "ABSENT",
        "MANQUANT",
        "BLESSÉ",
    ];

    // Responsable principal
    const ccAdult = resolveAdult(config.crisisCell, teacherByClass, staffById);
    const crisisStaff = [
        ...(ccAdult
            ? [
                  {
                      ...ccAdult,
                      fonction: config.crisisCell.fonction || "Directeur/trice",
                  },
              ]
            : []),
        ...config.staff
            .filter((s) => s.rattachement === "cellule")
            .map((s) => ({
                nom: s.nom,
                prenom: s.prenom,
                fonction: s.fonction || "",
            })),
    ].filter((a) => a.nom.trim());

    const rows = crisisStaff.map((a) =>
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

    return [
        sectionTitle(
            `Équipe cellule de crise (${crisisStaff.length} personne${crisisStaff.length > 1 ? "s" : ""})`
        ),
        makeTable([
            tableRow(
                COLS_A.map((c, i) =>
                    cell(c, { header: true, center: i >= 3, w: WA[i] })
                ),
                { isHeader: true }
            ),
            ...rows,
        ]),
        para(
            [
                run(
                    "Numéros d'urgence : SAMU 15  ·  Police 17  ·  Pompiers 18  ·  Secours 112",
                    { size: 18, bold: true, color: "1E3A5F" }
                ),
            ],
            { spacing: { before: 200, after: 80 } }
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
    const staffById = Object.fromEntries(config.staff.map((s) => [s.id, s]));
    const allChildren = [
        makeAdultsChildren(
            zone,
            getZoneStaff(config, zone.id),
            config.blankIntervenantRows,
            config.schoolName,
            config,
            teacherByClass,
            staffById
        ),
        ...classesInZone.map((cl) =>
            makeClassChildren(
                cl,
                byClass[cl] || [],
                teacherByClass[cl] || "",
                getClassStaff(config, cl),
                zone,
                config.schoolName,
                config,
                teacherByClass,
                staffById
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
                      config.schoolName,
                      config
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
