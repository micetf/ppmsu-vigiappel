/** "DUPONT" — tout en majuscules */
export const toNom = (v) => v.toUpperCase();

/** "Jean-Marie" / "Anne Sophie" — chaque mot capitalisé */
export const toPrenom = (v) =>
    v
        .toLowerCase()
        .replace(/(^|\s|-)([a-zà-ÿ])/g, (_, sep, c) => sep + c.toUpperCase());

/** "DUPONT Jean-Marie" — affichage combiné */
export const fullName = (nom, prenom) =>
    `${nom || ""}${nom && prenom ? " " : ""}${prenom || ""}`.trim();
