# SRS — VigiAppel : Spécification des exigences logicielles

Version : 2.0 — Mars 2026
Périmètre : spécification cible + état du code au commit `0f10b2e`

---

## 1. Contexte et objectif

VigiAppel permet à un(e) directeur/directrice ou CPC de générer les fiches
PPMS (Plan Particulier de Mise en Sûreté) de son école primaire à partir de
l'export CSV du logiciel de vie scolaire ONDE.

**Contrainte absolue** : traitement 100 % local, aucune donnée personnelle
transmise (conformité RGPD, données élèves sensibles).

Référence réglementaire : modèle Eduscol PPMS, fascicule 2, février 2024.

---

## 2. Utilisateurs cibles

| Profil                                | Usage                                   |
| ------------------------------------- | --------------------------------------- |
| Directeur/directrice d'école primaire | Génération annuelle ou après mouvement  |
| CPC Numérique / référent PPMS         | Démonstration, formation, mutualisation |

---

## 3. Workflow cible en 6 étapes

```
┌─────────────────────────────────────────────────────────────┐
│ Étape 1 — Import CSV (ONDE)                                 │
│ Étape 2 — Correction classes & enseignants                  │
│ Étape 3 — Adultes rattachés à une classe                    │
│ Étape 4 — Adultes non rattachés à une classe                │
│ Étape 5 — Configuration PPMS                                │
│ Étape 6 — Génération .docx                                  │
└─────────────────────────────────────────────────────────────┘
```

### Étape 1 — Import CSV ONDE

- Accepter un fichier `.csv` (UTF-8 ou Latin-1, séparateur auto-détecté)
- Colonnes minimales attendues : `Nom`, `Prénom`, `Classe`, `Enseignant(s)`
- Afficher un aperçu tabulaire avant de continuer
- **État actuel** : ✅ implémenté (`FileUpload`, `DataPreview`, `useCSVData`)

---

### Étape 2 — Correction des classes et enseignants

**Objectif** : nettoyer et valider les données brutes du CSV avant toute
configuration.

- Afficher la liste des classes détectées (clé CSV → nom corrigeable)
- Afficher le nom de l'enseignant(e) détecté(e) pour chaque classe
  (corrigeable : le CSV ONDE peut contenir "NOM Prénom / NOM2 Prénom2")
- Permettre de renommer une classe (ex. "CP A" → "CP Salle 12")
- Permettre de corriger ou remplacer le nom de l'enseignant(e)
- **État actuel** : ❌ non implémenté
- **Note** : cette étape produit deux structures :
    ```js
    classes[]     = [{ id, csvKey, displayName, teacherName }]
    teacherByClass = { [displayName]: teacherName }  // alimenté depuis classes[]
    ```

---

### Étape 3 — Adultes rattachés à une classe

**Objectif** : déclarer les adultes dont la présence est liée à une classe
spécifique.

Profils concernés :

- Co-titulaire, enseignant(e) à temps partiel, décharge
- ATSEM (cycle 1)
- AESH affecté(e) à un ou des élève(s) d'une classe
- Intervenant(e) régulier(ère) rattaché(e) à une classe

Pour chaque adulte :

- Nom, Prénom, Fonction (liste prédéfinie + libre)
- Classe de rattachement (sélection parmi les classes de l'étape 2)
- **État actuel** : ⚠️ partiellement implémenté
    - Co-titulaires/décharges : `config.classExtraTeachers` ✅
    - AESH/ATSEM : `config.staff[].rattachement = "class_X"` ✅
    - Mais saisie dispersée dans ConfigForm, pas d'étape dédiée

---

### Étape 4 — Adultes non rattachés à une classe

**Objectif** : déclarer les adultes présents dans l'école sans classe fixe.

Profils concernés :

- Maître E (RASED)
- Psychologue de l'Éducation nationale (RASED)
- Service civique
- Personnel d'entretien / cantine
- Tout autre adulte présent régulièrement

Pour chaque adulte :

- Nom, Prénom, Fonction
- Pas de classe de rattachement — disponibles comme "adultes libres"
  pour la configuration PPMS (étape 5)
- **État actuel** : ⚠️ partiellement implémenté via `config.staff[]`
  avec `rattachement = zoneId`, mais non séparé de l'étape 3

---

### Étape 5 — Configuration PPMS

C'est l'étape la plus complexe. Elle s'appuie sur le **registre complet des
adultes** constitué aux étapes 2, 3 et 4.

#### 5a. Zones de Mise en Sûreté (ZMS)

- Créer 1 à N zones (nom du lieu : gymnase, salle polyvalente, couloir…)
- Affecter chaque classe à une ZMS
- **État actuel** : ✅ implémenté (`config.zones`, `config.classZoneMap`)

#### 5b. Cellule de crise

- Désigner **1 responsable** de la cellule de crise (directeur/trice
  le plus souvent)
- Désigner **0 à N membres** supplémentaires de la cellule de crise
  (secrétaire, adjoint, référent numérique…)
- Tous les membres de la cellule sont **retirés de l'encadrement des classes**
- **État actuel** : ⚠️ un seul responsable (`config.crisisCell`),
  membres supplémentaires via `config.staff[].rattachement = "cellule"` ✅
  mais sans distinction claire

#### 5c. Responsable de ZMS

- Désigner **1 responsable par ZMS** parmi les adultes disponibles
- Centralise les fiches de sa zone, remonte le bilan à la cellule
- **Règle de vigilance** : si le responsable de ZMS est un(e) enseignant(e),
  sa classe doit être encadrée par un adulte libre → déclencher la saisie
  d'un substitut
- **État actuel** : ✅ `config.zoneResponsibles` + `AdultSelector` avec
  bloc substitut

#### 5d. Règle de vigilance — adulte "libre" obligatoire

> **Chaque fois qu'un(e) enseignant(e) est affecté(e) à une mission PPMS
> (cellule de crise ou responsable de ZMS), sa classe doit avoir un adulte
> disponible pour l'encadrement des élèves.**

Mécanisme attendu :

1. Détecter automatiquement les classes dont l'enseignant(e) est en mission
2. Alerter si aucun adulte libre n'est rattaché à cette classe
3. Permettre d'affecter explicitement un substitut

- **État actuel** : ⚠️ le bloc substitut existe dans `AdultSelector`
  mais uniquement pour le responsable de ZMS et la cellule de crise.
  La détection automatique et l'alerte ne sont pas implémentées.
  `config.classOverrides` est supporté par `docxGenerator` mais
  **l'UI pour le renseigner est manquante**.

#### 5e. Format des fiches

- Option A : fiche unique (petites écoles, ≤ 3 classes recommandé)
- Option B : fiche par classe + fiche adultes par zone + synthèse
- Lignes vierges pour intervenants variables (nombre configurable)
- **État actuel** : ✅ implémenté

---

### Étape 6 — Génération .docx

- Générer tous les documents en mémoire (aucune requête réseau)
- Téléchargement individuel ou en lot (ZIP)
- **État actuel** : ✅ implémenté (`docxGenerator.js`, `GenerationPanel.jsx`)

Documents produits :

| Option | Fichiers                                     |
| ------ | -------------------------------------------- |
| A      | `PPMS_<école>_recensement.docx`              |
| B      | `PPMS_<école>_adultes_<zone>.docx` × N zones |
| B      | `PPMS_<école>_classe_<cl>.docx` × N classes  |
| B      | `PPMS_<école>_synthese.docx`                 |

---

## 4. Modèle de données cible

### Adultes — registre unifié (à construire)

```js
// Produit par les étapes 2, 3, 4 — consommé par étape 5
adults = [
    {
        id: string,
        nom: string,
        prenom: string,
        fonction: string,
        classAttachment: string | null, // displayName de classe (étapes 3) ou null (étape 4)
        fromCSV: boolean, // true = enseignant détecté automatiquement
    },
];
```

### Config PPMS — modèle actuel (`config`)

```js
// Produit par ConfigForm (étape 5) — consommé par docxGenerator
{
  schoolName: string,
  configType: "A" | "B",
  zones: [{ id, name }],
  classZoneMap: { [className]: zoneId },
  crisisCell: AdultRef,                         // 1 responsable
  zoneResponsibles: { [zoneId]: AdultRef },     // 1 par zone
  classExtraTeachers: { [className]: [{nom, prenom, fonction}] },
  classOverrides: { [className]: OverrideRef }, // ⚠️ UI manquante
  staff: [{ id, nom, prenom, fonction, rattachement }],
  blankIntervenantRows: number,
}
```

---

## 5. Travaux prioritaires

### T-01 — Étape 2 : correction classes/enseignants 🔴

Interface dédiée entre DataPreview et ConfigForm pour corriger les noms
bruts du CSV. Produit `classes[]` et `teacherByClass` corrigés.

### T-02 — UI `classOverrides` : règle de vigilance 🔴

Ajouter dans ConfigForm (ou étape dédiée) la détection des classes sans
encadrant quand leur enseignant(e) est en mission, et le formulaire de
substitution. Alimenter `config.classOverrides`.

### T-03 — Membres supplémentaires cellule de crise 🟡

Distinguer clairement "responsable cellule" et "membres cellule" dans
l'UI. Actuellement fusionné dans `staff[].rattachement = "cellule"`.

### T-04 — Séparation étapes 3 et 4 🟡

Séparer la saisie des adultes rattachés à une classe (étape 3) des adultes
libres (étape 4) pour clarifier leur disponibilité lors de l'étape 5.

### T-05 — Sauvegarde config localStorage 🟢

Restaurer la config après rechargement de page.

### T-06 — Tests unitaires docxGenerator 🟢

Vitest sur `generateAll` avec jeu de données minimal.

---

## 6. Contraintes techniques

- React + Vite, sans TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"`)
- Pas de composants UI tiers
- Classes globales : `.label`, `.input` (dans `index.css`)
- Nommage : `toNom` / `toPrenom` pour toute saisie de nom
- Aucun appel réseau — tout en mémoire

---

## 7. Ce qui ne doit pas changer

- La signature de `generateAll(config, csvData)` dans `docxGenerator.js`
- Le format de `config` consommé par `docxGenerator` (rétrocompatibilité)
- Le format du CSV ONDE attendu en entrée

Toute nouvelle étape doit produire un `config` ou des données
**compatibles** avec `docxGenerator` sans modifier ce module.
