# SRS — VigiAppel : Spécification des exigences logicielles

Version : 1.0 — Mars 2026  
Périmètre : état du code au commit `0f10b2e` (branche `main`)

---

## 1. Contexte et objectif

VigiAppel permet à un(e) directeur/directrice ou CPC de générer en quelques
minutes les fiches PPMS de son école à partir de l'export CSV du logiciel de
vie scolaire (PaperGénie, Onde).

**Contrainte absolue** : traitement 100 % local, aucune donnée personnelle
transmise (conformité RGPD).

---

## 2. Utilisateurs cibles

| Profil                           | Usage                                           |
| -------------------------------- | ----------------------------------------------- |
| Directeur/trice d'école primaire | Génération annuelle ou après mouvement d'élèves |
| CPC Numérique / référent PPMS    | Démonstration, formation, mutualisation         |

---

## 3. Exigences fonctionnelles

### 3.1 Import CSV (EF-01)

- Accepter un fichier `.csv` UTF-8 ou Latin-1
- Parser via PapaParse (détection auto du séparateur)
- Détecter les colonnes `Nom`, `Prénom`, `Classe`, `Enseignant(s)`
- Afficher un aperçu avant de continuer

### 3.2 Configuration PPMS (EF-02)

- Saisir le nom de l'école
- Choisir le format (Option A ou B)
- Définir 1 à N zones (nom du lieu de confinement)
- Affecter chaque classe à une zone (Option B uniquement)
- Désigner le responsable cellule de crise (`AdultRef`)
- Désigner un responsable par zone (`AdultRef`)
- Ajouter des co-titulaires / décharges par classe
- Ajouter des adultes non-enseignants (`staff[]`) avec rattachement
- Configurer le nombre de lignes vierges pour intervenants variables

### 3.3 Sélection d'un adulte — `AdultRef` (EF-03)

Trois sources disponibles dans `AdultSelector` :

- `teacher` : enseignant(e) issu du CSV → sélection par classe
- `staff` : adulte déclaré dans la section "Autres adultes"
- `manual` : saisie libre (NOM, Prénom, Fonction)

Si `source === "teacher"`, un bloc substitut s'affiche pour désigner
l'encadrant de la classe pendant la mission PPMS de l'enseignant(e).

### 3.4 Gestion des remplacements ponctuels — EF-04 ⚠️ PARTIELLEMENT IMPLÉMENTÉE

`docxGenerator.js` supporte `config.classOverrides[className]` pour signaler
qu'un(e) enseignant(e) est absent(e) ponctuellement et désigner un substitut.
**L'interface utilisateur correspondante n'existe pas encore dans ConfigForm.**

### 3.5 Génération des documents (EF-05)

- Générer les `.docx` en mémoire via la bibliothèque `docx`
- Chaque fichier est téléchargeable individuellement
- Option "Tout télécharger" produit un `.zip` via JSZip
- Aucune requête réseau pendant la génération

### 3.6 Documents produits (EF-06)

**Option A**

- 1 fiche unique : adultes de la zone + tous les élèves regroupés par classe

**Option B**

- 1 fiche adultes par zone (responsable + staff rattaché + lignes vierges)
- 1 fiche recensement par classe (adultes encadrants + liste élèves)
- 1 synthèse cellule de crise (tableau récapitulatif par zone)

### 3.7 Validation du formulaire (EF-07)

Champs obligatoires bloquant la soumission :

- `schoolName` non vide
- `crisisCell` résolu (source + identité)
- Chaque zone : `name` non vide + responsable résolu
- Chaque `staff` : `nom` + `rattachement` non vides

---

## 4. Exigences non fonctionnelles

| Code   | Exigence                                                        |
| ------ | --------------------------------------------------------------- |
| ENF-01 | Aucune donnée transmise à un serveur externe                    |
| ENF-02 | Fonctionne sans connexion internet après chargement             |
| ENF-03 | Compatible navigateurs modernes (Chrome, Firefox, Edge récents) |
| ENF-04 | Responsive — utilisable sur tablette (min. 768 px)              |
| ENF-05 | Temps de génération < 3 s pour une école de 12 classes          |

---

## 5. Interfaces externes

### 5.1 Entrée — CSV

```
Colonnes requises : Nom, Prénom, Classe, Enseignant(s)
Encodage         : UTF-8 ou Latin-1 (détection auto PapaParse)
Séparateur       : auto-détecté (virgule ou point-virgule)
```

### 5.2 Sortie — fichiers `.docx`

```
Bibliothèque : docx (génération en mémoire, Blob)
Nommage      : PPMS_<slug_école>_<type>.docx
Téléchargement : file-saver (saveAs)
Archive ZIP  : JSZip
```

---

## 6. Modèle de données — contrat `generateAll`

```ts
generateAll(config: Config, csvData: CsvData): Promise<FileEntry[]>

type FileEntry = { blob: Blob, name: string, label: string, description?: string }

type CsvData = {
  data: Row[],
  fields: string[],
  byClass: Record<string, Row[]>,
  classes: string[],
  teacherByClass: Record<string, string>,
  totalStudents: number,
}
```

Voir `README.md §Modèle de données` pour le type `Config` complet.

---

## 7. Travaux en attente

### T-01 — UI `classOverrides` (priorité haute)

**Problème** : `docxGenerator` supporte le remplacement ponctuel d'un(e)
enseignant(e) (ligne barrée + substitut) via `config.classOverrides`, mais
aucune section du formulaire ne permet de le renseigner.

**Travail** : ajouter dans `ConfigForm.jsx` une section dépliable
"Remplacements ponctuels" avec, pour chaque classe :

- Case à cocher "L'enseignant(e) est absent(e) ce jour"
- Si cochée : sélecteur `substituteSource` + champs substitut
- Alimenter `config.classOverrides[className]`

### T-02 — Pré-remplissage `staff[]` (priorité moyenne)

**Idée** : détecter les colonnes AESH/ATSEM dans le CSV et pré-remplir
`config.staff[]` avant l'étape ConfigForm.
**Risque** : les colonnes ne sont pas standardisées selon les logiciels.
**Approche recommandée** : étape légère de normalisation optionnelle
(NormalizationStep) entre DataPreview et ConfigForm, produisant le même
format `config` sans changer le modèle de données.

### T-03 — Sauvegarde locale config (priorité moyenne)

Sauvegarder/restaurer `config` dans `localStorage` pour éviter la
re-saisie lors d'un retour sur l'application.

### T-04 — Tests unitaires `docxGenerator` (priorité basse)

Ajouter des tests Vitest sur `generateAll` avec un jeu de données minimal
pour prévenir les régressions lors des modifications du générateur.

---

## 8. Contraintes de développement

- React + Vite sans TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` dans `index.css`)
- Pas de composants UI tiers (pas de shadcn, headlessui, etc.)
- Classes utilitaires globales : `.label`, `.input` (définies dans `index.css`)
- Conventions de nommage : `toNom` / `toPrenom` pour toute saisie de nom
