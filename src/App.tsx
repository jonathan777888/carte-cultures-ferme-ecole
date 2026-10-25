"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import RotationPanel from "./RotationPanel";

type ZoneId = "petit" | "moyen" | "grand" | "tunnel";
type ViewId = "carte" | "parcelles" | "rotations" | "travaux";
type WorkGuideId =
  | "decision"
  | "machines"
  | "pesticides"
  | "fertilisation"
  | "autres";
type PetitSectorId =
  | "PJ-N1"
  | "PJ-N2"
  | "PJ-N3"
  | "PJ-N4"
  | "PJ-N5"
  | "PJ-N6"
  | "PJ-S1"
  | "PJ-S2"
  | "PJ-S3"
  | "PJ-S4"
  | "PJ-S5"
  | "PJ-S6";
type CropId =
  | "laitue"
  | "pomme-de-terre"
  | "tomate"
  | "aubergine"
  | "poivron"
  | "patate-douce"
  | "basilic"
  | "celeri"
  | "melon"
  | "sarrasin"
  | "mais"
  | "soya"
  | "courge"
  | "kale"
  | "carotte"
  | "panais"
  | "courgette"
  | "engrais-vert"
  | "eucalyptus"
  | "betterave"
  | "oignon"
  | "ail"
  | "chou"
  | "brocoli"
  | "celeri-rave"
  | "rutabaga"
  | "fraise"
  | "fines-herbes"
  | "legumineuse"
  | "fleur"
  | "cerise-terre"
  | "tournesol"
  | "chou-rave"
  | "vide"
  | "inconnu";

type MediumParcel = {
  number: number;
  crop: CropId;
  label: string;
  confirmed: boolean;
};

type Plot = {
  id: string;
  zone: ZoneId;
  crop: CropId;
  label: string;
  location: string;
  details: string;
  confirmed: boolean;
  sector?: PetitSectorId;
  codeLabel?: string;
  footprint?: "wide" | "tall";
  parcels?: MediumParcel[];
};

type Zone = {
  id: ZoneId;
  name: string;
  shortName: string;
  icon: string;
  description: string;
};

const zones: Zone[] = [
  {
    id: "petit",
    name: "Petit Jardin",
    shortName: "Petit",
    icon: "🌱",
    description: "Secteurs N et S · planches P",
  },
  {
    id: "moyen",
    name: "Moyen Jardin",
    shortName: "Moyen",
    icon: "🌿",
    description: "24 parcelles · 10 planches par parcelle",
  },
  {
    id: "grand",
    name: "Grand Jardin",
    shortName: "Grand",
    icon: "🌳",
    description: "Sarrasin → Soya → Engrais vert → Maïs",
  },
  {
    id: "tunnel",
    name: "Grand Tunnel",
    shortName: "Tunnel",
    icon: "⌒",
    description: "Planches P1 à P4 · cultures et plateaux",
  },
];

const workGuideTabs: Array<{
  id: WorkGuideId;
  label: string;
  icon: string;
}> = [
  { id: "decision", label: "Décision", icon: "?" },
  { id: "machines", label: "Machines", icon: "⚙" },
  { id: "pesticides", label: "Pesticides", icon: "🛡" },
  { id: "fertilisation", label: "Fertilisation", icon: "◒" },
  { id: "autres", label: "Autres opérations", icon: "✓" },
];

const machineOperations = [
  {
    title: "Préparer le sol",
    tools:
      "Vibroculteur ou vibroplanche; billonneuse, herse-butteuse ou cultibutte; plastibutteuse selon la planche.",
    purpose:
      "Ameublir, niveler, former une planche ou une butte et préparer le lit de semence.",
    checks: [
      "Le sol est-il assez sec pour ne pas se compacter?",
      "Faut-il seulement niveler ou travailler plus profondément?",
      "Quelle largeur et quelle profondeur sont prévues au registre?",
      "La parcelle contient-elle encore une culture ou des résidus?",
    ],
  },
  {
    title: "Désherber entre les rangs",
    tools:
      "Houe rotative ou peigne pour les très jeunes mauvaises herbes; DUO, cage ou sarcleur à pattes d’oie entre les rangs.",
    purpose:
      "Détruire les mauvaises herbes lorsqu’elles sont encore jeunes, sans toucher les racines de la culture.",
    checks: [
      "Quel est le stade de la culture?",
      "Les mauvaises herbes sont-elles au stade fil blanc, jeunes ou déjà enracinées?",
      "Quelle est la largeur réelle entre les rangs?",
      "Peut-on faire un petit essai avant de continuer?",
    ],
  },
  {
    title: "Faucher ou broyer",
    tools:
      "Faucheuse à fléaux ou smochers, selon la zone et le travail prévu.",
    purpose:
      "Couper un engrais vert, des mauvaises herbes développées ou des résidus avant l’opération suivante.",
    checks: [
      "Veut-on seulement couper ou aussi incorporer les résidus?",
      "Les mauvaises herbes ont-elles déjà produit des graines?",
      "Y a-t-il des pierres, piquets, tuyaux ou bâches dans la zone?",
      "Quelle opération vient après la fauche?",
    ],
  },
  {
    title: "Transplanter et poser le paillis",
    tools:
      "Transplanteuse Rain-Flo ou transplantation manuelle; plastibutteuse lorsque le plan prévoit une butte et un paillis.",
    purpose:
      "Placer les plants à la bonne profondeur et au bon espacement, avec une planche bien préparée.",
    checks: [
      "La planche, le paillis et l’irrigation sont-ils prêts?",
      "Quel espacement est indiqué au calendrier ou au registre?",
      "Les plants ont-ils été arrosés et acclimatés?",
      "Faut-il vérifier chaque plant après le passage?",
    ],
  },
  {
    title: "Irriguer",
    tools:
      "Système d’aspersion, goutte-à-goutte ou canon enrouleur Kifco selon la culture et la zone.",
    purpose:
      "Apporter l’eau de façon uniforme sans ruissellement, érosion ni excès d’humidité.",
    checks: [
      "La culture manque-t-elle réellement d’eau?",
      "Quel volume ou quelle profondeur d’eau faut-il apporter?",
      "Pour le canon : largeur, débit, pression et vitesse d’enroulement ont-ils été calculés?",
      "Les buses, raccords et dernières tiges d’aspersion fonctionnent-ils?",
    ],
  },
];

const pesticideTypes = [
  {
    title: "Insecticide",
    target: "Insectes nuisibles",
    example: "Pucerons, doryphores, chrysomèles ou punaises ternes.",
    question:
      "L’insecte est-il bien identifié et le seuil d’intervention est-il atteint?",
  },
  {
    title: "Fongicide",
    target: "Maladies causées par des champignons",
    example: "Blanc ou oïdium, certaines taches et pourritures.",
    question:
      "Le symptôme a-t-il été confirmé comme une maladie fongique et non comme un manque d’eau ou de fertilisation?",
  },
  {
    title: "Herbicide",
    target: "Mauvaises herbes",
    example: "Graminées ou feuilles larges, selon l’étiquette du produit.",
    question:
      "Une méthode mécanique, manuelle, thermique ou préventive peut-elle régler le problème?",
  },
  {
    title: "Biopesticide ou lutte biologique",
    target: "Ennemis ciblés par un organisme ou une substance à faible risque",
    example:
      "Trichogrammes, autres auxiliaires ou produits biologiques homologués.",
    question:
      "La cible, le bon stade et les conditions d’efficacité sont-ils respectés?",
  },
];

const fertilisationTypes = [
  {
    title: "Compost ou amendement organique",
    moment: "Avant la culture ou pendant la préparation du sol.",
    role:
      "Apporter de la matière organique et contribuer à la fertilité du sol.",
    register:
      "Noter le produit, la quantité, la superficie, la date et la planche.",
  },
  {
    title: "Engrais granulaire",
    moment: "À la plantation, en présemis ou en apport d’entretien.",
    role:
      "Apporter des éléments nutritifs selon les besoins de la culture et l’analyse de sol.",
    register:
      "Noter la formulation, la dose autorisée, le mode d’application et le réglage.",
  },
  {
    title: "Engrais liquide ou fertigation",
    moment: "Avec l’eau d’irrigation ou en arrosage dirigé.",
    role:
      "Apporter rapidement des éléments nutritifs près de la zone racinaire.",
    register:
      "Noter le produit, la dilution, le volume total et la zone traitée.",
  },
  {
    title: "Application foliaire",
    moment: "Sur les feuilles, seulement lorsqu’elle est justifiée.",
    role:
      "Corriger un besoin précis sans remplacer une bonne fertilisation du sol.",
    register:
      "Noter le produit, la concentration, la météo et le stade de la culture.",
  },
  {
    title: "Pralinage des racines",
    moment: "Juste avant la transplantation.",
    role:
      "Tremper ou enrober les racines avec la préparation prévue. Pour l’eucalyptus, le projet utilise l’émulsion d’algue à 5 ml/L.",
    register:
      "Noter le mélange, la dilution, le nombre de plants et le résultat observé.",
  },
  {
    title: "Engrais vert",
    moment: "Entre deux cultures, pour l’hiver ou pendant une période de repos.",
    role:
      "Couvrir et protéger le sol; certaines espèces ajoutent de l’azote ou produisent de la biomasse.",
    register:
      "Noter les espèces du mélange, annuel ou vivace, la date de semis, la dose et la date de destruction.",
  },
];

const otherOperations = [
  {
    title: "Semis",
    stage: "Planche prête → semis → levée à vérifier",
    examples:
      "Semis direct, faux semis, semis d’engrais vert ou semis en plateau.",
  },
  {
    title: "Transplantation",
    stage: "Plants prêts → plantation → reprise à vérifier",
    examples:
      "Espacement, profondeur, arrosage de départ et remplacement des plants manquants.",
  },
  {
    title: "Entretien de la culture",
    stage: "Croissance → entretien régulier → suivi",
    examples:
      "Éclaircissage, tuteurage, cordes, effeuillage, égourmandage et retrait des fruits malformés.",
  },
  {
    title: "Protection de la culture",
    stage: "Risque observé → prévention → dépistage → intervention",
    examples:
      "Filets, bâches, pièges, crochets, auxiliaires et réparation des protections.",
  },
  {
    title: "Récolte et après-récolte",
    stage: "Maturité → récolte → tri → nettoyage",
    examples:
      "Vérifier le stade, la qualité, la quantité, le contenant et la destination.",
  },
  {
    title: "Fin de culture",
    stage: "Dernière récolte → résidus → prochaine préparation",
    examples:
      "Arrachage, broyage, fauche, nettoyage, travail du sol ou implantation d’un engrais vert.",
  },
];

const cropMeta: Record<
  CropId,
  { name: string; icon: string; color: string }
> = {
  laitue: { name: "Laitue", icon: "🥬", color: "#76a93f" },
  "pomme-de-terre": {
    name: "Pomme de terre",
    icon: "🥔",
    color: "#b38345",
  },
  tomate: { name: "Tomate", icon: "🍅", color: "#dc6247" },
  aubergine: { name: "Aubergine", icon: "🍆", color: "#76558f" },
  poivron: { name: "Poivron", icon: "🫑", color: "#4f914c" },
  "patate-douce": {
    name: "Patate douce",
    icon: "🍠",
    color: "#b66545",
  },
  basilic: { name: "Basilic", icon: "🌿", color: "#39845d" },
  celeri: { name: "Céleri", icon: "🌱", color: "#76a15c" },
  melon: { name: "Melon d’eau", icon: "🍉", color: "#5c9c61" },
  sarrasin: { name: "Sarrasin", icon: "🌾", color: "#b28a43" },
  mais: { name: "Maïs sucré", icon: "🌽", color: "#d4a72c" },
  soya: { name: "Soya", icon: "🫘", color: "#739947" },
  courge: { name: "Courge", icon: "🎃", color: "#d48432" },
  kale: { name: "Kale", icon: "🌿", color: "#397b58" },
  carotte: { name: "Carotte", icon: "🥕", color: "#d88937" },
  panais: { name: "Panais", icon: "🌱", color: "#b59a63" },
  courgette: { name: "Courgette", icon: "🥒", color: "#5d944b" },
  "engrais-vert": { name: "Engrais vert", icon: "🌾", color: "#8ca34c" },
  eucalyptus: { name: "Eucalyptus", icon: "🌱", color: "#789e9f" },
  betterave: { name: "Betterave", icon: "🟣", color: "#9b4d73" },
  oignon: { name: "Oignon", icon: "🧅", color: "#c89d54" },
  ail: { name: "Ail", icon: "🧄", color: "#b6a77b" },
  chou: { name: "Chou", icon: "🥬", color: "#557f4b" },
  brocoli: { name: "Brocoli", icon: "🥦", color: "#3d774d" },
  "celeri-rave": { name: "Céleri-rave", icon: "🌱", color: "#829762" },
  rutabaga: { name: "Rutabaga", icon: "🟡", color: "#aa8f45" },
  fraise: { name: "Fraise", icon: "🍓", color: "#c94d4d" },
  "fines-herbes": { name: "Fines herbes", icon: "🌿", color: "#4d8b60" },
  legumineuse: { name: "Pois et haricot", icon: "🫘", color: "#76964c" },
  fleur: { name: "Fleurs", icon: "🌸", color: "#c86f96" },
  "cerise-terre": { name: "Cerise de terre", icon: "🟠", color: "#d7922f" },
  tournesol: { name: "Tournesol", icon: "🌻", color: "#d2a520" },
  "chou-rave": { name: "Chou-rave", icon: "🥬", color: "#7d79a8" },
  vide: { name: "Planche vide", icon: "·", color: "#d7ceb3" },
  inconnu: { name: "À relever", icon: "＋", color: "#d7ceb3" },
};

const cropRowLayouts: Partial<
  Record<CropId, { count: number; label: string; detail: string }>
> = {
  mais: {
    count: 2,
    label: "2 rangs par planche",
    detail:
      "Une planche de maïs est organisée en deux rangs de culture.",
  },
  "pomme-de-terre": {
    count: 1,
    label: "1 rang dans une planche",
    detail:
      "La planche et le rang sont deux éléments différents. Pour les pommes de terre, la planche contient un rang de culture.",
  },
};

const petitSectors: Array<{
  id: PetitSectorId;
  side: "Nord" | "Sud";
  rotation: string;
}> = [
  { id: "PJ-N1", side: "Nord", rotation: "AUSIRIS" },
  { id: "PJ-N2", side: "Nord", rotation: "SVP" },
  { id: "PJ-N3", side: "Nord", rotation: "CIT" },
  { id: "PJ-N4", side: "Nord", rotation: "VIDE" },
  { id: "PJ-N5", side: "Nord", rotation: "VIDE" },
  { id: "PJ-N6", side: "Nord", rotation: "VIDE" },
  { id: "PJ-S1", side: "Sud", rotation: "EV" },
  { id: "PJ-S2", side: "Sud", rotation: "VIDE" },
  { id: "PJ-S3", side: "Sud", rotation: "SOL" },
  { id: "PJ-S4", side: "Sud", rotation: "SOL" },
  { id: "PJ-S5", side: "Sud", rotation: "EV" },
  { id: "PJ-S6", side: "Sud", rotation: "VIDE" },
];

type ParcelGroup = {
  numbers: number[];
  crop: CropId;
  label: string;
  confirmed?: boolean;
};

type MediumBlockSpec = {
  crop: CropId;
  label: string;
  details: string;
  groups?: ParcelGroup[];
  confirmed?: boolean;
};

const allMediumParcels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function buildMediumParcels(groups: ParcelGroup[] = []): MediumParcel[] {
  return allMediumParcels.map((number) => {
    const group = groups.find((entry) => entry.numbers.includes(number));
    return group
      ? {
          number,
          crop: group.crop,
          label: group.label,
          confirmed: group.confirmed ?? true,
        }
      : {
          number,
          crop: "inconnu",
          label: "À relever",
          confirmed: false,
        };
  });
}

const mediumBlockSpecs: Record<string, MediumBlockSpec> = {
  A6: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le registre confirme un semis d’engrais vert vivace le 28 juin 2026 sur les planches P1 à P10.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
  A5: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le registre confirme un semis d’engrais vert vivace le 28 juin 2026 sur les planches P1 à P10.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
  A4: {
    crop: "pomme-de-terre",
    label: "Pommes de terre",
    details:
      "Le calendrier et le registre confirment les pommes de terre sur toute la parcelle A4. A4 contient dix planches distinctes, numérotées P1 à P10. Une planche n’est pas un rang : chaque planche de pommes de terre contient un rang. Les dix planches ont encore été désherbées le 21 juillet 2026.",
    groups: [
      {
        numbers: allMediumParcels,
        crop: "pomme-de-terre",
        label: "Pommes de terre",
      },
    ],
    confirmed: true,
  },
  A3: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le registre indique le sarrasin puis un mélange d’engrais vert vivace sur P1 à P10 en juin 2026.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
  A2: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le registre confirme un semis d’engrais vert vivace le 28 juin 2026 sur les planches P1 à P10.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
  A1: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le registre confirme l’engrais vert dans tout A1, fauché puis ressemé en mélange vivace le 28 juin 2026.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
  B6: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le registre confirme le sarrasin puis l’engrais vert vivace sur les planches P1 à P10.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
  B5: {
    crop: "inconnu",
    label: "À relever",
    details:
      "Aucune opération 2026 du registre consulté ne localise une culture dans B5. Les dix planches restent à vérifier au champ.",
  },
  B4: {
    crop: "inconnu",
    label: "À relever",
    details:
      "Aucune opération 2026 du registre consulté ne localise une culture dans B4. Les dix planches restent à vérifier au champ.",
  },
  B3: {
    crop: "fraise",
    label: "Fraises + engrais vert",
    details:
      "Le registre nomme la parcelle « B3 – FRAISES » et confirme l’engrais vert sur P1 et P4 à P10. La présence actuelle des fraises sur les planches P2-P3 doit être vérifiée.",
    groups: [
      {
        numbers: [1, 4, 5, 6, 7, 8, 9, 10],
        crop: "engrais-vert",
        label: "Engrais vert",
      },
      {
        numbers: [2, 3],
        crop: "fraise",
        label: "Fraises à confirmer",
        confirmed: false,
      },
    ],
  },
  B2: {
    crop: "fraise",
    label: "Fraises + engrais vert",
    details:
      "Le registre nomme la parcelle « B2 – FRAISES » et confirme l’engrais vert seulement sur P9. Les autres planches associées aux fraises restent à confirmer.",
    groups: [
      { numbers: [9], crop: "engrais-vert", label: "Engrais vert" },
      {
        numbers: [1, 2, 3, 4, 5, 6, 7, 8, 10],
        crop: "fraise",
        label: "Fraises à confirmer",
        confirmed: false,
      },
    ],
  },
  B1: {
    crop: "engrais-vert",
    label: "Engrais vert partiel",
    details:
      "Le registre confirme l’engrais vert sur P1 à P5. Aucun emplacement assez précis n’est inscrit pour P6 à P10.",
    groups: [
      { numbers: [1, 2, 3, 4, 5], crop: "engrais-vert", label: "Engrais vert" },
    ],
  },
  C6: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le registre confirme un semis d’engrais vert vivace sur les planches P1 à P10.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
  C5: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le calendrier prévoit des cultures racines, mais le registre confirme un semis d’engrais vert vivace sur P1 à P10 le 28 juin. La carte suit l’opération la plus récente.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
  C4: {
    crop: "chou",
    label: "Choux — type à confirmer",
    details:
      "Le registre confirme l’engrais vert sur P1-P3, puis des choux sur P4-P10. Pour P9 et P10, le type exact de chou reste à confirmer. Le passage du Reigi et la fertilisation avec une chaudière de 18 L de Ferti-Vrac et du bore ont déjà été réalisés.",
    groups: [
      { numbers: [1, 2, 3], crop: "engrais-vert", label: "Engrais vert" },
      {
        numbers: [4, 5, 6, 7, 8],
        crop: "chou",
        label: "Choux",
      },
      {
        numbers: [9, 10],
        crop: "chou",
        label: "Choux — type à confirmer",
        confirmed: false,
      },
    ],
    confirmed: true,
  },
  C3: {
    crop: "engrais-vert",
    label: "Prairie",
    details:
      "Jonathan confirme que C3 est actuellement une prairie. Le mélange d’espèces et son caractère annuel ou vivace restent à préciser.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Prairie" },
    ],
    confirmed: true,
  },
  C2: {
    crop: "laitue",
    label: "EV, laitues et haricots",
    details:
      "Le registre confirme l’engrais vert sur P1-P6 et des laitues sur P8. Jonathan confirme les haricots sur P9, avec deux rangs dans cette planche. P7 a été fauchée et P10 doit être vérifiée.",
    groups: [
      {
        numbers: [1, 2, 3, 4, 5, 6],
        crop: "engrais-vert",
        label: "Engrais vert",
      },
      {
        numbers: [7],
        crop: "inconnu",
        label: "Après laitues · à relever",
        confirmed: false,
      },
      { numbers: [8], crop: "laitue", label: "Laitues" },
      { numbers: [9], crop: "legumineuse", label: "Haricots · 2 rangs" },
      {
        numbers: [10],
        crop: "inconnu",
        label: "À relever",
        confirmed: false,
      },
    ],
  },
  C1: {
    crop: "mais",
    label: "Maïs sucré",
    details:
      "Le calendrier inscrit le maïs sucré Allure et le registre documente encore son désherbage sur P1 à P10 le 21 juillet 2026. Une planche de maïs comporte deux rangs.",
    groups: [
      { numbers: allMediumParcels, crop: "mais", label: "Maïs sucré" },
    ],
    confirmed: true,
  },
  D6: {
    crop: "melon",
    label: "Courges et melons",
    details:
      "Le registre confirme les courges sur P1-P3 et la présence de melons dans le même groupe de six planches, sans cocher leurs numéros exacts. P8-P10 sont en engrais vert; P7 reste à relever.",
    groups: [
      { numbers: [1, 2, 3], crop: "courge", label: "Courges" },
      {
        numbers: [4, 5, 6],
        crop: "melon",
        label: "Melons à confirmer",
        confirmed: false,
      },
      { numbers: [8, 9, 10], crop: "engrais-vert", label: "Engrais vert" },
    ],
  },
  D5: {
    crop: "engrais-vert",
    label: "Engrais vert partiel",
    details:
      "Le registre confirme l’engrais vert sur P1 et P7-P10. P2 à P6 ne sont pas localisées avec assez de précision.",
    groups: [
      {
        numbers: [1, 7, 8, 9, 10],
        crop: "engrais-vert",
        label: "Engrais vert",
      },
    ],
  },
  D4: {
    crop: "carotte",
    label: "Cultures racines",
    details:
      "Le registre confirme P1-P3 en engrais vert, P4-P5 en betteraves, P6-P8 en carottes et P10 en panais. P9 a reçu un travail du sol le 21 juillet et reste à vérifier.",
    groups: [
      { numbers: [1, 2, 3], crop: "engrais-vert", label: "Engrais vert" },
      { numbers: [4, 5], crop: "betterave", label: "Betteraves" },
      { numbers: [6, 7, 8], crop: "carotte", label: "Carottes" },
      {
        numbers: [9],
        crop: "inconnu",
        label: "Après travail du sol",
        confirmed: false,
      },
      { numbers: [10], crop: "panais", label: "Panais" },
    ],
  },
  D3: {
    crop: "oignon",
    label: "Oignons, poireaux et ail",
    details:
      "Le registre confirme les oignons sur P1-P5, les poireaux sur P7-P8 et l’ail sur P9-P10. La planche P6 reste sans culture confirmée.",
    groups: [
      { numbers: [1, 2, 3, 4, 5], crop: "oignon", label: "Oignons" },
      { numbers: [7, 8], crop: "oignon", label: "Poireaux" },
      { numbers: [9, 10], crop: "ail", label: "Ail" },
    ],
  },
  D2: {
    crop: "celeri-rave",
    label: "Céleri, rutabaga, chou-rave",
    details:
      "Les transplantations confirment le céleri-rave sur P1-P2, le rutabaga sur P3 et le chou-rave sur P4. P5-P8 et P10 portent un engrais vert fauché; une récolte de rutabaga a été notée à P9 et doit être recroisée.",
    groups: [
      { numbers: [1, 2], crop: "celeri-rave", label: "Céleri-rave" },
      { numbers: [3], crop: "rutabaga", label: "Rutabaga" },
      { numbers: [4], crop: "chou-rave", label: "Chou-rave" },
      {
        numbers: [5, 6, 7, 8, 10],
        crop: "engrais-vert",
        label: "Engrais vert fauché",
      },
      {
        numbers: [9],
        crop: "rutabaga",
        label: "Rutabaga récolté · à vérifier",
        confirmed: false,
      },
    ],
  },
  D1: {
    crop: "engrais-vert",
    label: "Engrais vert",
    details:
      "Le registre confirme l’engrais vert sur P1 à P10, avec un semis de mélange vivace le 28 juin 2026.",
    groups: [
      { numbers: allMediumParcels, crop: "engrais-vert", label: "Engrais vert" },
    ],
    confirmed: true,
  },
};

const mediumBlocks: Plot[] = ["A", "B", "C", "D"].flatMap((row) =>
  [6, 5, 4, 3, 2, 1].map((column) => {
    const id = `${row}${column}`;
    const spec: MediumBlockSpec = mediumBlockSpecs[id] ?? {
      crop: "inconnu" as CropId,
      label: "À relever",
      details:
        "Cette parcelle comporte 10 planches. Les cultures doivent être confirmées pendant la tournée.",
    };

    return {
      id,
      zone: "moyen",
      crop: spec.crop,
      label: spec.label,
      location: `Parcelle ${id}`,
      details: spec.details,
      confirmed: spec.confirmed ?? false,
      parcels: buildMediumParcels(spec.groups),
    };
  }),
);

const mediumRotationRows = ["A", "B", "C", "D"] as const;
const mediumRotationColumns = [6, 5, 4, 3, 2, 1] as const;

const mediumRotationMarkers: Partial<Record<string, string>> = {
  C2: "→ C1",
  C1: "← C2 · → D6",
  A1: "→ B6",
  B6: "← A1",
  B1: "→ C6",
  C6: "← B1",
  D6: "← C1",
};

const plots: Plot[] = [
  {
    id: "PJ-N5-P2",
    zone: "petit",
    crop: "tournesol",
    label: "Tournesol",
    location: "Secteur N5 · Planche 2",
    details:
      "Le registre confirme la transplantation du tournesol à N5-P2 le 25 juin 2026, après préparation et apport de compost.",
    confirmed: true,
    sector: "PJ-N5",
  },
  {
    id: "PJ-N6-P1",
    zone: "petit",
    crop: "betterave",
    label: "Betteraves",
    location: "Secteur N6 · Planche 1",
    details:
      "Le registre confirme les betteraves à N6-P1 : transplantation sur trois rangs le 17 juin 2026.",
    confirmed: true,
    sector: "PJ-N6",
  },
  {
    id: "PJ-N6-P2",
    zone: "petit",
    crop: "oignon",
    label: "Oignons verts et carottes",
    location: "Secteur N6 · Planche 2",
    details:
      "Le registre indique un semis de carottes Bolero le 17 juin, puis une transplantation d’oignons verts à la même planche le 25 juin 2026.",
    confirmed: true,
    sector: "PJ-N6",
  },
  {
    id: "PJ-N6-P3",
    zone: "petit",
    crop: "oignon",
    label: "Oignons à botteler",
    location: "Secteur N6 · Planche 3",
    details:
      "Le registre indique des oignons verts transplantés à N6-P3 le 9 juillet et désherbés le 13 juillet. Un engrais vert avoine-pois avait été semé auparavant.",
    confirmed: true,
    sector: "PJ-N6",
  },
  {
    id: "PJ-N6-P4",
    zone: "petit",
    crop: "vide",
    label: "Planche vide",
    location: "Secteur N6 · Planche 4",
    details:
      "La dernière inscription du registre pour N6-P4 indique « aucune » culture et le désherbage d’une planche vide.",
    confirmed: true,
    sector: "PJ-N6",
  },
  {
    id: "PJ-N6-P5",
    zone: "petit",
    crop: "betterave",
    label: "Betterave",
    location: "Secteur N6 · Planche 5",
    details:
      "Le registre confirme la transplantation de betteraves par l’équipe Ausiris à N6-P5 le 11 juin 2026.",
    confirmed: true,
    sector: "PJ-N6",
  },
  {
    id: "PJ-N6-P6",
    zone: "petit",
    crop: "carotte",
    label: "Carottes",
    location: "Secteur N6 · Planche 6",
    details:
      "Le registre associe N6-P6 aux carottes lors de la préparation de sol du 26 mai 2026.",
    confirmed: true,
    sector: "PJ-N6",
  },
  {
    id: "PJ-S1-P1",
    zone: "petit",
    crop: "kale",
    label: "Kale et Salanova",
    location: "Secteur S1 · Planche 1",
    details:
      "Le registre confirme la transplantation du kale et de la Salanova à S1-P1 le 27 mai. Le calendrier précise le kale Darkibor Org et les variétés de Salanova.",
    confirmed: true,
    sector: "PJ-S1",
  },
  {
    id: "PJ-S1-P2",
    zone: "petit",
    crop: "legumineuse",
    label: "Pois et haricot frais",
    location: "Secteur S1 · Planche 2",
    details:
      "Le registre confirme le haricot frais semé par Ausiris et la présence de pois mange-tout, encore désherbés à S1-P2 le 13 juillet.",
    confirmed: true,
    sector: "PJ-S1",
  },
  {
    id: "PJ-S1-P3",
    zone: "petit",
    crop: "legumineuse",
    label: "Haricot sec et aneth",
    location: "Secteur S1 · Planche 3",
    details:
      "Le registre confirme le haricot sec semé par Ausiris et l’aneth transplanté à S1-P3.",
    confirmed: true,
    sector: "PJ-S1",
  },
  {
    id: "PJ-S1-P4",
    zone: "petit",
    crop: "fines-herbes",
    label: "Fines herbes",
    location: "Secteur S1 · Planche 4",
    details:
      "Les fines herbes sont confirmées à S1-P4 par les opérations de préparation, fertilisation et désherbage du registre.",
    confirmed: true,
    sector: "PJ-S1",
  },
  {
    id: "PJ-S1-P5",
    zone: "petit",
    crop: "fines-herbes",
    label: "Basilic",
    location: "Secteur S1 · Planche 5",
    details:
      "Le registre confirme la transplantation du basilic à S1-P5 le 9 juin. Le calendrier précise le cultivar Basil Italian.",
    confirmed: true,
    sector: "PJ-S1",
  },
  {
    id: "PJ-S3-P1",
    zone: "petit",
    crop: "eucalyptus",
    label: "Eucalyptus R-D",
    location: "Secteur S3 · Planche 1",
    details:
      "Le registre confirme l’eucalyptus du projet R-D à S3-P1, transplanté le 11 juin 2026.",
    confirmed: true,
    sector: "PJ-S3",
  },
  {
    id: "PJ-S3-P2",
    zone: "petit",
    crop: "eucalyptus",
    label: "Eucalyptus R-D",
    location: "Secteur S3 · Planche 2",
    details:
      "Le registre confirme l’eucalyptus du projet R-D à S3-P2, transplanté le 11 juin 2026.",
    confirmed: true,
    sector: "PJ-S3",
  },
  {
    id: "PJ-S3-P3",
    zone: "petit",
    crop: "fleur",
    label: "Fleurs",
    location: "Secteur S3 · Planche 3",
    details:
      "Le registre associe S3-P3 aux fleurs lors de la préparation de sol et de la fertilisation du 28 mai 2026.",
    confirmed: true,
    sector: "PJ-S3",
  },
  {
    id: "PJ-S3-P4",
    zone: "petit",
    crop: "fleur",
    label: "Fleurs",
    location: "Secteur S3 · Planche 4",
    details:
      "Le registre associe S3-P4 aux fleurs lors des opérations de sol du 3 juin 2026.",
    confirmed: true,
    sector: "PJ-S3",
  },
  {
    id: "PJ-S3-P5",
    zone: "petit",
    crop: "eucalyptus",
    label: "Eucalyptus",
    location: "Secteur S3 · Planche 5",
    details:
      "Le registre confirme l’eucalyptus praliné du projet R-D à S3-P5. La transplantation a été terminée le 16 juin 2026.",
    confirmed: true,
    sector: "PJ-S3",
  },
  {
    id: "PJ-S4-P1",
    zone: "petit",
    crop: "eucalyptus",
    label: "Eucalyptus",
    location: "Secteur S4 · Planche 1",
    details:
      "Le registre confirme l’eucalyptus praliné à S4-P1; la transplantation a été terminée le 16 juin 2026.",
    confirmed: true,
    sector: "PJ-S4",
  },
  {
    id: "PJ-S4-P2",
    zone: "petit",
    crop: "eucalyptus",
    label: "Eucalyptus",
    location: "Secteur S4 · Planche 2",
    details:
      "Le registre confirme l’eucalyptus praliné à S4-P2; la transplantation a été terminée le 16 juin 2026.",
    confirmed: true,
    sector: "PJ-S4",
  },
  {
    id: "PJ-S4-P3",
    zone: "petit",
    crop: "courgette",
    label: "Courgette",
    location: "Secteur S4 · Planche 3 probable",
    details:
      "La préparation de la courgette est enregistrée à S4-P3 le 21 juillet, puis la transplantation au secteur S4 le 22 juillet sans numéro de planche. Le lien avec P3 reste donc à confirmer.",
    confirmed: false,
    sector: "PJ-S4",
  },
  {
    id: "PJ-S4-P5",
    zone: "petit",
    crop: "inconnu",
    label: "Culture à confirmer",
    location: "Secteur S4 · Planche 5",
    details:
      "La préparation de cette planche est documentée, mais la culture qui s’y trouve n’a pas été confirmée.",
    confirmed: false,
    sector: "PJ-S4",
  },
  {
    id: "PJ-S5-P1",
    zone: "petit",
    crop: "cerise-terre",
    label: "Cerises de terre",
    location: "Secteur S5 · Planche 1",
    details:
      "Le registre confirme les cerises de terre à S5-P1 : cultivars Goldie et Cossack Pineapple selon le calendrier.",
    confirmed: true,
    sector: "PJ-S5",
  },
  {
    id: "PJ-S5-P3",
    zone: "petit",
    crop: "courgette",
    label: "Courgettes",
    location: "Secteur S5 · Planche 3",
    details:
      "Le registre confirme les courgettes à S5-P3, transplantées sur paillis plastique le 3 juin 2026.",
    confirmed: true,
    sector: "PJ-S5",
  },
  {
    id: "PJ-S5-CAROTTE",
    codeLabel: "S5 · P?",
    zone: "petit",
    crop: "carotte",
    label: "Carotte",
    location: "Secteur S5 · Planche non renseignée",
    details:
      "Le registre confirme le semis de carotte au secteur S5 le 24 juillet 2026, mais aucune colonne de planche n’a été cochée.",
    confirmed: false,
    sector: "PJ-S5",
  },
  {
    id: "PJ-S6-P4",
    zone: "petit",
    crop: "chou-rave",
    label: "Chou-rave",
    location: "Secteur S6 · Planche 4",
    details:
      "Le registre confirme le chou-rave à S6-P4 : transplantation le 23 juin et désherbage le 13 juillet 2026.",
    confirmed: true,
    sector: "PJ-S6",
  },
  {
    id: "PJ-S6-P5",
    zone: "petit",
    crop: "betterave",
    label: "Betterave",
    location: "Secteur S6 · Planche 5",
    details:
      "Le registre associe S6-P5 aux betteraves lors du désherbage du 4 juin. Des oignons à botteler y avaient été transplantés auparavant.",
    confirmed: true,
    sector: "PJ-S6",
  },
  {
    id: "PJ-S6-P6",
    zone: "petit",
    crop: "laitue",
    label: "Salanova",
    location: "Secteur S6 · Planche 6",
    details:
      "Le registre confirme la transplantation de Salanova à S6-P6 le 4 juin 2026.",
    confirmed: true,
    sector: "PJ-S6",
  },
  ...mediumBlocks,
  {
    id: "GJ-SARRASIN",
    codeLabel: "GJ · SARRASIN",
    zone: "grand",
    crop: "sarrasin",
    label: "Sarrasin",
    location: "Grand Jardin · 1re section dans l’ordre relevé",
    details:
      "Jonathan confirme que le sarrasin est la première culture dans l’ordre relevé du Grand Jardin, avant le soya. Le fauchage avec la faucheuse, suivi du passage de l’andaineuse, est prévu.",
    confirmed: true,
  },
  {
    id: "GJ-SOYA",
    codeLabel: "GJ · SOYA",
    zone: "grand",
    crop: "soya",
    label: "Soya",
    location: "Grand Jardin · 2e section dans l’ordre relevé",
    details:
      "La culture et la zone sont documentées : le soya était levé en juin et allait bien à la fin du mois. Les opérations indiquent un sarcleur à 10 rangs, puis le smocker avec les doigts Kress, sans faire de butte. Le registre ne donne toutefois pas de numéro de parcelle.",
    confirmed: true,
  },
  {
    id: "GJ-EV",
    codeLabel: "GJ · EV",
    zone: "grand",
    crop: "engrais-vert",
    label: "Engrais vert",
    location: "Grand Jardin · 3e section dans l’ordre relevé",
    details:
      "Jonathan confirme que l’engrais vert vient après le soya et avant le maïs dans l’ordre relevé du Grand Jardin. Les limites de cette section ne sont pas numérotées dans les documents.",
    confirmed: true,
  },
  {
    id: "GJ-MAIS",
    codeLabel: "GJ · MAÏS",
    zone: "grand",
    crop: "mais",
    label: "Maïs",
    location: "Grand Jardin · 4e section dans l’ordre relevé",
    details:
      "Jonathan confirme que le maïs vient après l’engrais vert dans l’ordre relevé du Grand Jardin. Une planche de maïs comporte deux rangs; aucun numéro de planche n’est attribué dans les documents disponibles.",
    confirmed: true,
  },
  {
    id: "GT-P1-TOMATES-CERISES",
    codeLabel: "GT · P1",
    zone: "tunnel",
    crop: "tomate",
    label: "Tomates cerises",
    location: "Planche 1",
    details:
      "Le tableau de transplantation recopié le 9 juin 2026 place les tomates cerises en GT-P1. Le cultivar exact de cette planche n’est pas nommé dans ce tableau; il ne faut donc pas l’identifier automatiquement comme « Cherrykoo ».",
    confirmed: true,
  },
  {
    id: "GT-P2-POIVRONS",
    codeLabel: "GT · P2",
    zone: "tunnel",
    crop: "poivron",
    label: "Poivrons",
    location: "Planche 2 à confirmer",
    details:
      "Le tableau du 9 juin place les poivrons en GT-P2, tandis que le plan du 2 juin prévoyait GT-P3. La carte retient la donnée la plus récente, mais garde l’emplacement à confirmer à cause de cette contradiction. Les observations du 23 juin confirment bien la présence des poivrons dans le Grand Tunnel.",
    confirmed: false,
  },
  {
    id: "GT-P3-AUBERGINES",
    codeLabel: "GT · P3",
    zone: "tunnel",
    crop: "aubergine",
    label: "Aubergines",
    location: "Planche 3",
    details:
      "Le tableau du 9 juin place les aubergines en GT-P3. Les observations du 23 juin confirment leur présence dans le Grand Tunnel; des doryphores y avaient été observés et une fertilisation manuelle était à prévoir.",
    confirmed: true,
  },
  {
    id: "GT-P3-CELERIS",
    codeLabel: "GT · P3",
    zone: "tunnel",
    crop: "celeri",
    label: "Céleris",
    location: "Planche 3 · section à distinguer",
    details:
      "Le même tableau du 9 juin inscrit aussi des céleris en GT-P3. Comme les aubergines sont inscrites sur cette planche, la séparation exacte entre les deux cultures doit être relevée. Il ne faut pas confondre ces céleris avec les céleris-raves du Moyen Jardin, D2-P3.",
    confirmed: false,
  },
  {
    id: "GT-P4-TOMATES",
    codeLabel: "GT · P4",
    zone: "tunnel",
    crop: "tomate",
    label: "Tomates · 3 variétés",
    location: "Planche 4",
    details:
      "Le tableau du 9 juin place les tomates en GT-P4. L’assolement 2026 documente Roma VF sur 25 m de planche, Défiant PHR sur 12,5 m et Cherokee Purple sur 12,5 m. L’ordre de ces trois sections dans la planche n’est pas précisé. Les suivis parlant de « tomates roses » peuvent correspondre à Cherokee Purple, mais ce rapprochement reste à confirmer.",
    confirmed: true,
    footprint: "wide",
  },
  {
    id: "GT-P4-PATATES-DOUCES",
    codeLabel: "GT · P4",
    zone: "tunnel",
    crop: "patate-douce",
    label: "Patates douces",
    location: "Planche 4 · section à distinguer",
    details:
      "Jonathan confirme les patates douces en GT-P4. Les notes du 11 juin indiquent aussi « 3 plateaux de patate douce » et la planification mentionne leur bouturage. Comme les tomates sont également inscrites sur cette planche, la séparation exacte entre les deux cultures doit être relevée.",
    confirmed: true,
  },
  {
    id: "GT-P3-BASILIC",
    codeLabel: "GT · P3",
    zone: "tunnel",
    crop: "basilic",
    label: "Basilic",
    location: "Planche 3 · section à distinguer",
    details:
      "Jonathan confirme le basilic en GT-P3. Les notes liées à la préparation du Grand Tunnel mentionnent aussi un semis prévu d’un plateau de 128. Comme les aubergines et les céleris sont également inscrits sur cette planche, leur séparation exacte doit être relevée.",
    confirmed: true,
  },
];

function Icon({
  name,
  size = 28,
}: {
  name:
    | "map"
    | "leaf"
    | "plots"
    | "tasks"
    | "harvest"
    | "settings"
    | "help"
    | "search"
    | "calendar"
    | "pin"
    | "check";
  size?: number;
}) {
  const paths = {
    map: (
      <>
        <path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3Z" />
        <path d="M8 3v15M16 6v15" />
      </>
    ),
    leaf: (
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C14.4 3 21 3 21 3s0 6.6-3.1 11.2A7 7 0 0 1 11 17" />
        <path d="M2 21c0-3 1.9-5.7 4.8-6.8 3.3-1.3 6.3.2 8.2 1.8" />
      </>
    ),
    plots: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 3v3h6V3M8 11h8M8 15h5" />
      </>
    ),
    tasks: (
      <>
        <path d="M3 21h18M5 21l2-11h10l2 11M9 10V5h6v5" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
    harvest: (
      <>
        <path d="M4 9h16l-2 12H6ZM8 9V5M16 9V5M6 14h12" />
        <path d="M8 5c0-2 2-3 4-3s4 1 4 3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.5 9a2.7 2.7 0 1 1 4.4 2.1c-1.2.9-1.9 1.4-1.9 2.9M12 18h.01" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      aria-hidden="true"
      className="ui-icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewId>(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("vue") === "rotations"
      ? "rotations"
      : "carte",
  );
  const [activeWorkGuide, setActiveWorkGuide] =
    useState<WorkGuideId>("decision");
  const [activeZone, setActiveZone] = useState<ZoneId>("moyen");
  const [selectedPlotId, setSelectedPlotId] = useState("A1");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [operationStatus, setOperationStatus] = useState("À vérifier");
  const [cropStage, setCropStage] = useState("");
  const [weedStage, setWeedStage] = useState("");
  const [weedLocation, setWeedLocation] = useState("");
  const [soilState, setSoilState] = useState("");
  const [decisionReady, setDecisionReady] = useState(false);

  const activeZoneData = zones.find((zone) => zone.id === activeZone)!;
  const selectedPlot =
    plots.find((plot) => plot.id === selectedPlotId) ??
    plots.find((plot) => plot.zone === activeZone)!;

  const zonePlots = plots.filter((plot) => plot.zone === activeZone);
  const rotationPlot =
    mediumBlocks.find((plot) => plot.id === selectedPlotId) ??
    mediumBlocks.find((plot) => plot.id === "A1")!;

  // Permet de partager un lien direct vers le simulateur et de conserver la
  // page après actualisation, sans modifier les données du registre.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeView === "rotations") url.searchParams.set("vue", "rotations");
    else url.searchParams.delete("vue");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [activeView]);

  function openRotations() {
    setActiveZone("moyen");
    if (!mediumBlocks.some((plot) => plot.id === selectedPlotId)) {
      setSelectedPlotId("A1");
    }
    setActiveView("rotations");
  }

  const searchResults = useMemo(() => {
    const normalized = submittedQuery.trim().toLocaleLowerCase("fr");
    if (!normalized) return [];

    return plots.filter((plot) => {
      const crop = cropMeta[plot.crop].name;
      const parcels = (plot.parcels ?? [])
        .map(
          (parcel) =>
            `${plot.id}-P${parcel.number} ${parcel.label} ${
              cropMeta[parcel.crop].name
            }`,
        )
        .join(" ");
      return [
        plot.id,
        plot.codeLabel,
        plot.label,
        plot.location,
        plot.details,
        crop,
        parcels,
      ]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(normalized);
    });
  }, [submittedQuery]);

  function selectZone(zoneId: ZoneId) {
    setActiveZone(zoneId);
    const firstPlot = plots.find((plot) => plot.zone === zoneId);
    if (firstPlot) setSelectedPlotId(firstPlot.id);
    setSubmittedQuery("");
  }

  function selectPlot(plot: Plot) {
    setActiveZone(plot.zone);
    setSelectedPlotId(plot.id);
    setSubmittedQuery("");
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setSubmittedQuery(query);
  }

  const fieldDecision = useMemo(() => {
    if (!decisionReady) return null;
    if (weedStage === "graines") {
      return {
        priority: "Urgent",
        operation: "Enlever les mauvaises herbes avant qu’elles répandent leurs graines.",
        tool:
          weedLocation === "pres"
            ? "Désherbage manuel près des plants."
            : "Fauche ou sarclage adapté, après validation du responsable.",
      };
    }
    if (weedLocation === "pres") {
      return {
        priority: "À faire maintenant",
        operation: "Désherber près de la culture avec précision.",
        tool: "Travail manuel ou petit outil précis pour ne pas blesser les plants.",
      };
    }
    if (weedStage === "tres-jeunes" && soilState !== "detrempe") {
      return {
        priority: "Bon moment",
        operation: "Faire un sarclage léger entre les rangs.",
        tool:
          cropStage === "jeune"
            ? "Outil très précis et peu agressif; faire un essai sur une courte distance."
            : "Sarcleur léger adapté à la largeur des rangs.",
      };
    }
    if (soilState === "detrempe") {
      return {
        priority: "À reporter",
        operation: "Attendre que le sol soit assez ressuyé avant de passer.",
        tool: "Ne pas passer de tracteur ou de sarcleur dans un sol détrempé.",
      };
    }
    return {
      priority: "À valider",
      operation: "Observer de nouveau la parcelle et comparer avec la prochaine opération du registre.",
      tool: "Choisir l’outil avec Mario ou le responsable avant le passage.",
    };
  }, [cropStage, decisionReady, soilState, weedLocation, weedStage]);

  function renderPlot(plot: Plot, showLocationCode = false) {
    const meta = cropMeta[plot.crop];
    return (
      <button
        aria-label={`${plot.location}, ${plot.label}`}
        className={[
          "plot",
          `plot--${plot.crop}`,
          plot.footprint ? `plot--${plot.footprint}` : "",
          selectedPlotId === plot.id ? "is-selected" : "",
        ].join(" ")}
        key={plot.id}
        onClick={() => setSelectedPlotId(plot.id)}
        style={{ "--crop-color": meta.color } as React.CSSProperties}
        type="button"
      >
        <span className="plot-crop" aria-hidden="true">
          {meta.icon}
        </span>
        <span className="plot-copy">
          <strong>
            {activeZone === "moyen" || showLocationCode
              ? plot.codeLabel ??
                plot.id.replace("PJ-", "").replaceAll("-", " · ")
              : plot.label}
          </strong>
          <small>
            {activeZone === "moyen" || showLocationCode
              ? plot.label
              : plot.location}
          </small>
        </span>
        {activeZone === "moyen" && plot.parcels && (
          <>
            {mediumRotationMarkers[plot.id] && (
              <span className="medium-rotation-marker">
                <b>2027</b>
                {mediumRotationMarkers[plot.id]}
              </span>
            )}
            <span className="medium-parcel-strip" aria-hidden="true">
              {plot.parcels.map((parcel) => (
                <i
                  className={parcel.confirmed ? "" : "is-unconfirmed"}
                  key={parcel.number}
                  style={{
                    "--parcel-color": cropMeta[parcel.crop].color,
                  } as React.CSSProperties}
                  title={`P${parcel.number} · ${parcel.label}`}
                >
                  {parcel.number}
                </i>
              ))}
            </span>
          </>
        )}
        {!plot.confirmed && (
          <span className="unconfirmed-dot" title="À confirmer">
            ?
          </span>
        )}
      </button>
    );
  }

  return (
    <main className="app-shell">
      <aside className="side-rail" aria-label="Navigation principale">
        <div className="brand-mark" aria-label="Ferme-école">
          <span className="brand-house">⌂</span>
          <span className="brand-field">◒</span>
        </div>

        <nav className="rail-nav">
          <button
            className={`rail-item ${activeView === "carte" ? "is-active" : ""}`}
            onClick={() => setActiveView("carte")}
            type="button"
          >
            <Icon name="map" />
            <span>Carte</span>
          </button>
          <button
            className={`rail-item ${activeView === "rotations" ? "is-active" : ""}`}
            onClick={openRotations}
            type="button"
            aria-label="Ouvrir les rotations culturales 2027"
          >
            <Icon name="leaf" />
            <span>Rotations 2027</span>
          </button>
          <button
            className={`rail-item ${activeView === "parcelles" ? "is-active" : ""}`}
            onClick={() => setActiveView("parcelles")}
            type="button"
          >
            <Icon name="plots" />
            <span>Parcelles</span>
          </button>
          <button
            className={`rail-item ${activeView === "travaux" ? "is-active" : ""}`}
            onClick={() => setActiveView("travaux")}
            type="button"
          >
            <Icon name="tasks" />
            <span>Travaux</span>
          </button>
          <button className="rail-item" type="button">
            <Icon name="harvest" />
            <span>Récoltes</span>
          </button>
        </nav>

        <div className="rail-bottom">
          <button className="rail-item" type="button">
            <Icon name="settings" />
            <span>Réglages</span>
          </button>
          <button className="rail-item" type="button">
            <Icon name="help" />
            <span>Aide</span>
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ferme-école</p>
            <h1>
              {activeView === "carte"
                ? "Carte des cultures"
                : activeView === "parcelles"
                  ? "Parcelles et planches"
                  : activeView === "rotations"
                    ? "Rotations 2027"
                    : "Travaux à faire"}
            </h1>
          </div>
          <div className="top-actions">
            <span className="today-pill">
              <Icon name="calendar" size={22} />
              Aujourd’hui
            </span>
            <span className="avatar" aria-label="Jonathan Kpakpo">
              JK
            </span>
          </div>
        </header>

        {activeView === "carte" && (
          <section className="rotation-discovery" aria-label="Planification culturale 2027">
            <div>
              <p className="eyebrow">Planification 2027</p>
              <h2>Simuler les rotations de tes parcelles</h2>
              <p>Choisis une parcelle du Moyen Jardin, compare les familles botaniques et teste un scénario pour les dix planches.</p>
            </div>
            <button type="button" onClick={openRotations}>
              Ouvrir les rotations 2027 <span aria-hidden="true">→</span>
            </button>
          </section>
        )}

        {activeView === "carte" ? (
        <>
        <form className="search-bar" onSubmit={submitSearch} role="search">
          <span className="search-icon">
            <Icon name="search" size={31} />
          </span>
          <input
            aria-label="Rechercher une culture, une parcelle ou une planche"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une culture, une parcelle ou une planche"
            type="search"
            value={query}
          />
          <button aria-label="Lancer la recherche" type="submit">
            <Icon name="search" size={31} />
          </button>
        </form>

        {submittedQuery && (
          <section className="search-results" aria-live="polite">
            <div className="search-results-title">
              <strong>
                {searchResults.length} résultat
                {searchResults.length !== 1 ? "s" : ""}
              </strong>
              <button
                onClick={() => setSubmittedQuery("")}
                type="button"
              >
                Fermer
              </button>
            </div>
            {searchResults.length ? (
              <div className="result-list">
                {searchResults.slice(0, 8).map((plot) => (
                  <button
                    key={plot.id}
                    onClick={() => selectPlot(plot)}
                    type="button"
                  >
                    <span>{cropMeta[plot.crop].icon}</span>
                    <span>
                      <strong>{plot.label}</strong>
                      <small>
                        {zones.find((zone) => zone.id === plot.zone)?.name} ·{" "}
                        {plot.location}
                      </small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="empty-result">
                Aucune culture, parcelle ou planche ne correspond à « {submittedQuery} ».
              </p>
            )}
          </section>
        )}

        <div className="zone-tabs" role="tablist" aria-label="Jardins">
          {zones.map((zone) => (
            <button
              aria-selected={activeZone === zone.id}
              className={activeZone === zone.id ? "is-active" : ""}
              key={zone.id}
              onClick={() => selectZone(zone.id)}
              role="tab"
              type="button"
            >
              <span className="zone-icon" aria-hidden="true">
                {zone.icon}
              </span>
              <span>
                <strong>{zone.name}</strong>
                <small>{zone.description}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="prototype-note">
          <span aria-hidden="true">i</span>
          {activeZone === "moyen" ? (
            <p>
              <strong>Sources vérifiées :</strong> calendrier Cal_MJ-GJ-GT et
              registre d’opérations 2026. Chaque parcelle A1 à D6 contient les
              planches P1 à P10; les planches hachurées ou marquées « ? »
              doivent être confirmées.
            </p>
          ) : activeZone === "petit" ? (
            <p>
              <strong>Sources vérifiées :</strong> calendrier Cal_PJ et
              registre d’opérations 2026. Le registre contient les secteurs N1
              à N6 et S1 à S6; les cases avec « ? » signalent une planche non
              cochée.
            </p>
          ) : activeZone === "grand" ? (
            <p>
              <strong>Sources vérifiées :</strong> calendrier Cal_MJ-GJ-GT,
              registre d’opérations 2026 et suivis de terrain. Le Grand Jardin
              est identifié « GJ », mais ses planches ne sont pas numérotées
              dans les documents; aucune numérotation n’a donc été inventée.
            </p>
          ) : (
            <p>
              <strong>Sources recoupées :</strong> assolement 2026, tableaux des
              2 et 9 juin, notes du 11 juin et observations du 23 juin. Le Grand
              Tunnel comprend des tomates, poivrons, aubergines, céleris,
              patates douces et du basilic. Jonathan a confirmé le basilic en
              P3 et les patates douces en P4. Les contradictions restantes et
              les séparations internes à relever sont indiquées dans les
              détails. L’eucalyptus a eu un passage en tunnel, puis le registre
              le localise au Petit Jardin, en S3 et S4.
            </p>
          )}
        </div>

        {activeZone === "moyen" && (
          <section
            aria-label="Plan visuel de la rotation 2027 du Moyen Jardin"
            className="rotation-panel"
          >
            <div className="rotation-panel-heading">
              <span className="rotation-year">2027</span>
              <div>
                <p className="eyebrow">Rotation du Moyen Jardin</p>
                <h2>Circulation des cultures</h2>
              </div>
            </div>
            <div className="rotation-plan">
              <div className="rotation-row-list">
                {mediumRotationRows.map((row, rowIndex) => (
                  <div className="rotation-row-sequence" key={row}>
                    <div
                      aria-label={`${row}6 vers ${row}1`}
                      className="rotation-plot-row"
                    >
                      <span className="rotation-row-name">Rangée {row}</span>
                      <div className="rotation-boxes">
                        {mediumRotationColumns.map((column, index) => (
                          <span className="rotation-box-group" key={`${row}${column}`}>
                            <b
                              className={
                                [
                                  "A1",
                                  "B6",
                                  "B1",
                                  "C6",
                                  "C2",
                                  "C1",
                                  "D6",
                                ].includes(`${row}${column}`)
                                  ? "is-key-stop"
                                  : ""
                              }
                            >
                              {row}
                              {column}
                            </b>
                            {index < mediumRotationColumns.length - 1 && (
                              <span
                                aria-hidden="true"
                                className="rotation-line-arrow"
                              >
                                →
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    {rowIndex < mediumRotationRows.length - 1 && (
                      <div
                        aria-label={`${row}1 vers ${
                          mediumRotationRows[rowIndex + 1]
                        }6`}
                        className="rotation-row-bridge"
                      >
                        <span>
                          {row}1 → {mediumRotationRows[rowIndex + 1]}6
                        </span>
                        <i aria-hidden="true" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="rotation-crossing" aria-label="Sens général">
                <span>Un seul parcours continu</span>
                <div className="rotation-summary">
                  <b>A1</b><strong>→</strong><b>B6</b>
                  <b>B1</b><strong>→</strong><b>C6</b>
                  <b>C1</b><strong>→</strong><b>D6</b>
                </div>
              </div>
            </div>
            <p className="rotation-panel-note">
              Chaque flèche indique où ira en 2027 la culture présente en 2026.
              Les grandes flèches relient A1 à B6, B1 à C6 et C1 à D6.
            </p>
          </section>
        )}

        <section className="map-layout">
          <div className="map-card">
            <div className="map-heading">
              <div>
                <p>Zone sélectionnée</p>
                <h2>{activeZoneData.name}</h2>
              </div>
              <span>
                {activeZone === "moyen"
                  ? "24 parcelles · 240 planches"
                  : activeZone === "petit"
                    ? `${zonePlots.filter((plot) => plot.confirmed).length} planches localisées · ${zonePlots.filter((plot) => !plot.confirmed).length} à confirmer`
                    : activeZone === "grand"
                      ? `${zonePlots.filter((plot) => plot.confirmed).length} culture localisée · ${zonePlots.filter((plot) => !plot.confirmed).length} sections à préciser`
                      : `${zonePlots.length} groupes · planches et zones recoupées`}
              </span>
            </div>

            <div className={`plot-map plot-map--${activeZone}`} role="tabpanel">
              {activeZone === "moyen" && (
                <div className="column-order" aria-hidden="true">
                  {[6, 5, 4, 3, 2, 1].map((number) => (
                    <span key={number}>{number}</span>
                  ))}
                </div>
              )}
              {activeZone === "petit" ? (
                <div className="petit-garden-plan">
                  {(["Nord", "Sud"] as const).map((side) => (
                    <section className="petit-side" key={side}>
                      <div className="petit-side-heading">
                        <strong>Partie {side}</strong>
                        <span>
                          {side === "Nord" ? "N1 → N6" : "S1 → S6"}
                        </span>
                      </div>
                      <div className="petit-side-sectors">
                        {petitSectors
                          .filter((sector) => sector.side === side)
                          .map((sector) => {
                            const sectorPlots = zonePlots.filter(
                              (plot) => plot.sector === sector.id,
                            );
                            return (
                              <section
                                className={`petit-sector ${
                                  sectorPlots.length ? "" : "is-empty"
                                }`}
                                key={sector.id}
                              >
                                <div className="petit-sector-heading">
                                  <strong>
                                    {sector.id.replace("PJ-", "")}
                                  </strong>
                                  <span>Rotation : {sector.rotation}</span>
                                </div>
                                {sectorPlots.length ? (
                                  <div className="petit-sector-plots">
                                    {sectorPlots.map((plot) =>
                                      renderPlot(plot, true),
                                    )}
                                  </div>
                                ) : (
                                  <p className="petit-sector-empty">
                                    Aucune culture localisée par planche dans le
                                    registre.
                                  </p>
                                )}
                              </section>
                            );
                          })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                zonePlots.map((plot) => renderPlot(plot))
              )}
            </div>
          </div>

          <aside className="details-panel">
            <div className="detail-top">
              <span
                className="detail-crop-icon"
                style={{
                  backgroundColor: `${cropMeta[selectedPlot.crop].color}22`,
                }}
              >
                {cropMeta[selectedPlot.crop].icon}
              </span>
              <div>
                <p>Détail de l’emplacement</p>
                <h2>{selectedPlot.label}</h2>
              </div>
            </div>

            <dl>
              <div>
                <dt>Zone</dt>
                <dd>
                  {zones.find((zone) => zone.id === selectedPlot.zone)?.name}
                </dd>
              </div>
              <div>
                <dt>Localisation</dt>
                <dd>{selectedPlot.location}</dd>
              </div>
              <div>
                <dt>Culture</dt>
                <dd>{cropMeta[selectedPlot.crop].name}</dd>
              </div>
            </dl>

            <p className="detail-note">{selectedPlot.details}</p>

            {cropRowLayouts[selectedPlot.crop] && (
              <div className="crop-row-layout">
                <div>
                  <strong>Rangs à l’intérieur d’une planche</strong>
                  <span>{cropRowLayouts[selectedPlot.crop]?.label}</span>
                </div>
                <div
                  aria-label={cropRowLayouts[selectedPlot.crop]?.label}
                  className="crop-row-lines"
                >
                  {Array.from({
                    length: cropRowLayouts[selectedPlot.crop]?.count ?? 0,
                  }).map((_, index) => (
                    <i key={index} />
                  ))}
                </div>
                <p>{cropRowLayouts[selectedPlot.crop]?.detail}</p>
              </div>
            )}

            {activeZone === "moyen" && selectedPlot.parcels && (
              <div className="medium-detail">
                <strong>10 planches de la parcelle</strong>
                <div className="medium-detail-grid">
                  {selectedPlot.parcels.map((parcel) => (
                    <span
                      className={parcel.confirmed ? "" : "is-unconfirmed"}
                      key={parcel.number}
                      style={{
                        "--parcel-color": cropMeta[parcel.crop].color,
                      } as React.CSSProperties}
                    >
                      <b>P{parcel.number}</b>
                      <small>{parcel.label}</small>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <span
              className={`confirmation-badge ${
                selectedPlot.confirmed ? "is-confirmed" : ""
              }`}
            >
              <Icon
                name={selectedPlot.confirmed ? "check" : "pin"}
                size={19}
              />
              {selectedPlot.confirmed
                ? "Emplacement documenté"
                : "Localisation à préciser"}
            </span>

            {activeZone === "petit" ? (
              <div className="block-reminder">
                <strong>Lecture du code</strong>
                <span>Exemple : S6-P5 = secteur Sud 6, planche 5.</span>
              </div>
          ) : activeZone === "moyen" ? (
              <div className="block-reminder">
                <strong>Lecture du code et rotation</strong>
                <span>
                  A4-P3 = parcelle A4, planche 3. Chaque parcelle contient 10
                  planches. Une planche n’est pas un rang. Rotation confirmée :
                  C2 → C1 et D6 → A1 → B6.
                </span>
              </div>
            ) : activeZone === "grand" ? (
              <div className="block-reminder">
                <strong>Lecture de la carte</strong>
                <span>
                  « GJ » désigne le Grand Jardin. Les documents ne donnent pas
                  encore de code de planche pour cette zone.
                </span>
              </div>
            ) : activeZone === "tunnel" ? (
              <div className="block-reminder">
                <strong>Lecture de la carte</strong>
                <span>
                  « GT-P1 » désigne la planche 1 du Grand Tunnel. Le basilic est
                  en P3 et les patates douces en P4; leur section exacte dans
                  ces planches reste à distinguer.
                </span>
              </div>
            ) : null}
          </aside>
        </section>

        <section className="legend-card" aria-label="Légende des cultures">
          <div>
            <p className="eyebrow">Repères rapides</p>
            <h2>Légende des cultures</h2>
          </div>
          <div className="legend-list">
            {Object.entries(cropMeta)
              .filter(([cropId]) => cropId !== "inconnu")
              .map(([cropId, meta]) => (
                <span key={cropId}>
                  <i
                    aria-hidden="true"
                    style={{ backgroundColor: meta.color }}
                  />
                  {meta.icon} {meta.name}
                </span>
              ))}
          </div>
        </section>
        </>
        ) : activeView === "parcelles" ? (
          <section className="parcel-browser">
            <div className="parcel-intro">
              <div>
                <p className="eyebrow">Organisation des champs</p>
                <h2>Choisir une parcelle</h2>
                <p>
                  Une parcelle contient des planches. Une planche contient un
                  ou plusieurs rangs selon la culture.
                </p>
              </div>
              <button className="rotation-shortcut" type="button" onClick={openRotations}>
                Ouvrir les rotations 2027 <span aria-hidden="true">→</span>
              </button>
              <div className="parcel-structure" aria-label="Structure d’une parcelle">
                <b>Parcelle C2</b><span>→</span><b>10 planches</b>
                <span>→</span><b>Culture et rangs</b>
              </div>
            </div>

            <div className="zone-tabs parcel-zone-tabs" role="tablist" aria-label="Jardins">
              {zones.map((zone) => (
                <button
                  aria-selected={activeZone === zone.id}
                  className={activeZone === zone.id ? "is-active" : ""}
                  key={zone.id}
                  onClick={() => selectZone(zone.id)}
                  role="tab"
                  type="button"
                >
                  <span className="zone-icon" aria-hidden="true">{zone.icon}</span>
                  <span>
                    <strong>{zone.name}</strong>
                    <small>{zone.description}</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="parcel-browser-layout">
              <div className="parcel-list-card">
                <div className="parcel-list-heading">
                  <div>
                    <p className="eyebrow">{activeZoneData.name}</p>
                    <h2>
                      {activeZone === "moyen" ? "24 parcelles" : "Emplacements"}
                    </h2>
                  </div>
                  <span>Clique pour voir la composition</span>
                </div>
                <div className={`parcel-card-grid parcel-card-grid--${activeZone}`}>
                  {zonePlots.map((plot) => (
                    <button
                      className={`parcel-card ${selectedPlot.id === plot.id ? "is-selected" : ""}`}
                      key={plot.id}
                      onClick={() => selectPlot(plot)}
                      type="button"
                    >
                      <span
                        className="parcel-card-icon"
                        style={{ backgroundColor: `${cropMeta[plot.crop].color}22` }}
                      >
                        {cropMeta[plot.crop].icon}
                      </span>
                      <span>
                        <strong>{plot.codeLabel ?? plot.id.replace("PJ-", "")}</strong>
                        <small>{plot.label}</small>
                      </span>
                      <span aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              </div>

              <aside className="parcel-sheet">
                <div className="parcel-sheet-heading">
                  <p>{activeZoneData.name}</p>
                  <h2>{selectedPlot.codeLabel ?? selectedPlot.id.replace("PJ-", "")}</h2>
                  <strong>{selectedPlot.label}</strong>
                </div>
                <p className="parcel-sheet-note">{selectedPlot.details}</p>

                {selectedPlot.parcels ? (
                  <>
                    <div className="parcel-definition">
                      <b>Cette parcelle contient 10 planches</b>
                      <span>Chaque case ci-dessous représente une planche, pas un rang.</span>
                    </div>
                    <div className="planche-list">
                      {selectedPlot.parcels.map((planche) => (
                        <article
                          className={planche.confirmed ? "" : "is-unconfirmed"}
                          key={planche.number}
                          style={{
                            "--planche-color": cropMeta[planche.crop].color,
                          } as React.CSSProperties}
                        >
                          <span>P{planche.number}</span>
                          <div>
                            <strong>{planche.label}</strong>
                            <small>{cropMeta[planche.crop].name}</small>
                          </div>
                          {planche.label.includes("2 rangs") && (
                            <b className="row-count">2 rangs</b>
                          )}
                          {!planche.confirmed && <b className="to-check">À relever</b>}
                        </article>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="parcel-definition">
                    <b>{selectedPlot.location}</b>
                    <span>
                      La composition détaillée en planches sera ajoutée à mesure
                      qu’elle est confirmée au champ ou dans le registre.
                    </span>
                  </div>
                )}
              </aside>
            </div>
            {activeZone === "moyen" && selectedPlot.parcels && (
              <RotationPanel
                plotId={selectedPlot.id}
                planches={selectedPlot.parcels}
                nomsCultures={cropMeta}
              />
            )}
          </section>
        ) : activeView === "rotations" ? (
          <section className="rotations-view">
            <div className="rotations-view-intro">
              <div>
                <p className="eyebrow">Moyen Jardin · Planification culturale</p>
                <h2>Rotations des planches en 2027</h2>
                <p>Les scénarios proposés sont séparés du registre de 2026. Ils doivent être vérifiés avant toute décision au champ.</p>
              </div>
              <label className="rotations-view-select" htmlFor="rotation-parcelle">
                <span>Parcelle à étudier</span>
                <select
                  id="rotation-parcelle"
                  value={rotationPlot.id}
                  onChange={(event) => {
                    setActiveZone("moyen");
                    setSelectedPlotId(event.target.value);
                  }}
                >
                  {mediumBlocks.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.id} — {plot.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <RotationPanel
              key={rotationPlot.id}
              plotId={rotationPlot.id}
              planches={rotationPlot.parcels ?? []}
              nomsCultures={cropMeta}
            />
          </section>
        ) : (
          <section className="work-assistant">
            <div className="work-intro">
              <div>
                <p className="eyebrow">Assistant de décision au champ</p>
                <h2>Qu’est-ce qu’il faut faire ici?</h2>
                <p>
                  Commence par le registre, puis réponds aux questions. La
                  proposition obtenue doit être vérifiée avant de commencer le
                  travail.
                </p>
              </div>
              <div className="method-line" aria-label="Étapes de la méthode">
                <b>Registre</b><span>→</span><b>Culture</b><span>→</span>
                <b>Mauvaises herbes</b><span>→</span><b>Opération</b><span>→</span>
                <b>Machine</b><span>→</span><b>Résultat</b>
              </div>
            </div>

            <nav
              aria-label="Types d’opérations"
              className="work-guide-tabs"
            >
              {workGuideTabs.map((tab) => (
                <button
                  aria-pressed={activeWorkGuide === tab.id}
                  className={activeWorkGuide === tab.id ? "is-active" : ""}
                  key={tab.id}
                  onClick={() => setActiveWorkGuide(tab.id)}
                  type="button"
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <b>{tab.label}</b>
                </button>
              ))}
            </nav>

            {activeWorkGuide === "decision" ? (
            <div className="work-grid">
              <section className="decision-form-card">
                <div className="step-heading"><span>1</span><div><strong>Consulter le registre</strong><small>Que dit l’historique de la parcelle?</small></div></div>
                <label>
                  État de l’opération dans le registre
                  <select value={operationStatus} onChange={(e) => setOperationStatus(e.target.value)}>
                    <option>Prévue</option><option>À faire maintenant</option>
                    <option>En cours</option><option>Terminée</option>
                    <option>À vérifier</option><option>À recommencer</option>
                    <option>Reportée</option>
                  </select>
                </label>

                <div className="step-heading"><span>2</span><div><strong>Observer la culture</strong><small>La machine risque-t-elle de la blesser?</small></div></div>
                <label>
                  Stade de la culture
                  <select value={cropStage} onChange={(e) => setCropStage(e.target.value)}>
                    <option value="">Choisir…</option>
                    <option value="semis">Semis ou levée</option>
                    <option value="jeune">Jeune plante fragile</option>
                    <option value="developpee">Plante bien développée</option>
                    <option value="floraison">Floraison</option>
                    <option value="fruits">Fruits en croissance</option>
                    <option value="recolte">Prête à récolter</option>
                  </select>
                </label>

                <div className="step-heading"><span>3</span><div><strong>Observer les mauvaises herbes</strong><small>Stade, quantité et emplacement</small></div></div>
                <div className="field-pair">
                  <label>
                    Stade
                    <select value={weedStage} onChange={(e) => setWeedStage(e.target.value)}>
                      <option value="">Choisir…</option>
                      <option value="tres-jeunes">Très jeunes</option>
                      <option value="jeunes">Jeunes</option>
                      <option value="developpees">Développées</option>
                      <option value="graines">En fleurs ou en graines</option>
                    </select>
                  </label>
                  <label>
                    Emplacement
                    <select value={weedLocation} onChange={(e) => setWeedLocation(e.target.value)}>
                      <option value="">Choisir…</option>
                      <option value="entre">Entre les rangs</option>
                      <option value="pres">Près des plants</option>
                      <option value="partout">Partout</option>
                    </select>
                  </label>
                </div>

                <div className="step-heading"><span>4</span><div><strong>Vérifier les conditions</strong><small>Sol, météo, largeur et sécurité</small></div></div>
                <label>
                  État du sol
                  <select value={soilState} onChange={(e) => setSoilState(e.target.value)}>
                    <option value="">Choisir…</option>
                    <option value="sec">Sec</option>
                    <option value="humide">Humide mais praticable</option>
                    <option value="detrempe">Détrempé</option>
                  </select>
                </label>

                <button
                  className="decision-button"
                  disabled={!cropStage || !weedStage || !weedLocation || !soilState}
                  onClick={() => setDecisionReady(true)}
                  type="button"
                >
                  Voir l’opération proposée
                </button>
              </section>

              <aside className="decision-result-card">
                <p className="eyebrow">Prochaine décision</p>
                {fieldDecision ? (
                  <>
                    <span className="priority-pill">{fieldDecision.priority}</span>
                    <h2>{fieldDecision.operation}</h2>
                    <div className="machine-answer">
                      <strong>Outil ou machine</strong>
                      <p>{fieldDecision.tool}</p>
                    </div>
                    <div className="safety-check">
                      <strong>Avant de commencer</strong>
                      <ul>
                        <li>Vérifier la largeur entre les rangs.</li>
                        <li>Vérifier le réglage et la profondeur de l’outil.</li>
                        <li>Faire un petit essai et regarder si la culture est blessée.</li>
                        <li>Après le travail, noter le résultat dans le registre.</li>
                      </ul>
                    </div>
                    <p className="register-status">Registre : <b>{operationStatus}</b></p>
                  </>
                ) : (
                  <div className="empty-decision">
                    <span>?</span>
                    <h2>Réponds aux questions</h2>
                    <p>L’application proposera ensuite l’opération et le type d’outil à vérifier.</p>
                  </div>
                )}
              </aside>
            </div>
            ) : activeWorkGuide === "machines" ? (
              <section className="operation-library">
                <div className="library-heading">
                  <p className="eyebrow">Machines et outils de la ferme-école</p>
                  <h2>Quelle opération peut-on faire avec la machine?</h2>
                  <p>
                    Commence toujours par les trois questions de Mario :
                    <b> stade de la culture</b>, <b>stade des mauvaises herbes</b>
                    {" "}et <b>machine adaptée à l’opération</b>.
                  </p>
                </div>
                <div className="operation-card-grid">
                  {machineOperations.map((operation) => (
                    <article className="operation-card" key={operation.title}>
                      <span className="operation-number" aria-hidden="true">⚙</span>
                      <h3>{operation.title}</h3>
                      <p>{operation.purpose}</p>
                      <div className="operation-tool">
                        <strong>Machines ou outils possibles</strong>
                        <p>{operation.tools}</p>
                      </div>
                      <strong>Questions avant de passer</strong>
                      <ul>
                        {operation.checks.map((check) => (
                          <li key={check}>{check}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
                <div className="warning-panel">
                  <strong>Important</strong>
                  <p>
                    Le nom de la machine ne suffit pas. Vérifie aussi l’outil
                    attelé, la largeur, la profondeur, la vitesse, l’humidité du
                    sol et la présence de tuyaux, bâches ou personnes.
                  </p>
                </div>
              </section>
            ) : activeWorkGuide === "pesticides" ? (
              <section className="operation-library">
                <div className="library-heading">
                  <p className="eyebrow">Protection des cultures</p>
                  <h2>Comprendre les types de pesticides</h2>
                  <p>
                    Le type indique la cible; il ne donne pas encore le produit
                    à utiliser. Il faut d’abord identifier le problème, dépister
                    et vérifier si le seuil d’intervention est atteint.
                  </p>
                </div>
                <div className="pesticide-flow" aria-label="Ordre de décision">
                  <b>Identifier</b><span>→</span><b>Dépister</b><span>→</span>
                  <b>Comparer au seuil</b><span>→</span><b>Prévenir</b>
                  <span>→</span><b>Intervenir si nécessaire</b>
                </div>
                <div className="operation-card-grid operation-card-grid--four">
                  {pesticideTypes.map((type) => (
                    <article className="operation-card pesticide-card" key={type.title}>
                      <span className="category-pill">{type.target}</span>
                      <h3>{type.title}</h3>
                      <p>{type.example}</p>
                      <div className="operation-tool">
                        <strong>Question principale</strong>
                        <p>{type.question}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="safety-library">
                  <div>
                    <strong>Avant toute application</strong>
                    <ul>
                      <li>Confirmer la culture, l’ennemi et le stade.</li>
                      <li>Vérifier que le produit est homologué pour cette culture et cette cible.</li>
                      <li>Lire l’étiquette : dose, délai de rentrée, délai avant récolte et équipement de protection.</li>
                      <li>Vérifier la météo, les buses, la pression et le réglage du pulvérisateur.</li>
                      <li>Faire valider l’intervention par la personne responsable.</li>
                    </ul>
                  </div>
                  <div>
                    <strong>À noter au registre</strong>
                    <ul>
                      <li>Date, heure, parcelle et culture.</li>
                      <li>Produit, numéro d’homologation et matière active.</li>
                      <li>Dose, volume, superficie et quantité totale.</li>
                      <li>Cible, météo, applicateur et résultat du suivi.</li>
                    </ul>
                  </div>
                </div>
                <div className="source-links">
                  <a href="https://www.quebec.ca/agriculture-environnement-et-ressources-naturelles/agriculture/pratiques-agricoles-environnement/utilisation-gestion-pesticides" rel="noreferrer" target="_blank">
                    Gestion intégrée — Québec
                  </a>
                  <a href="https://www.sagepesticides.qc.ca/" rel="noreferrer" target="_blank">
                    Rechercher dans SAgE pesticides
                  </a>
                  <a href="https://www.canada.ca/fr/sante-canada/services/securite-produits-consommation/pesticides-lutte-antiparasitaire/titulaires-demandeurs/outils/recherche-etiquettes-pesticides.html" rel="noreferrer" target="_blank">
                    Étiquettes homologuées — Santé Canada
                  </a>
                </div>
              </section>
            ) : activeWorkGuide === "fertilisation" ? (
              <section className="operation-library">
                <div className="library-heading">
                  <p className="eyebrow">Nourrir la culture et protéger le sol</p>
                  <h2>Les types de fertilisation</h2>
                  <p>
                    On ne fertilise pas seulement parce qu’une plante semble
                    faible. Il faut comparer le registre, l’analyse de sol, les
                    besoins de la culture, son stade et le plan de fertilisation.
                  </p>
                </div>
                <div className="operation-card-grid operation-card-grid--three">
                  {fertilisationTypes.map((type) => (
                    <article className="operation-card fertilisation-card" key={type.title}>
                      <span className="category-pill">{type.moment}</span>
                      <h3>{type.title}</h3>
                      <p>{type.role}</p>
                      <div className="operation-tool">
                        <strong>Dans le registre</strong>
                        <p>{type.register}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="question-checklist">
                  <strong>Questions avant de fertiliser</strong>
                  <ol>
                    <li>Quelle culture et quel stade?</li>
                    <li>Quel besoin ou quelle carence a été confirmé?</li>
                    <li>Qu’est-ce qui a déjà été appliqué dans cette parcelle?</li>
                    <li>Quel produit et quelle dose sont prévus au plan?</li>
                    <li>Quelle méthode : incorporé, localisé, liquide, foliaire ou pralinage?</li>
                    <li>La pluie ou l’irrigation risque-t-elle d’entraîner une perte?</li>
                  </ol>
                </div>
                <div className="source-links">
                  <a href="https://www.quebec.ca/agriculture-environnement-et-ressources-naturelles/agriculture/pratiques-agricoles-environnement/gestion-matieres-fertilisantes/grilles-reference-fertilisation" rel="noreferrer" target="_blank">
                    Grilles de fertilisation — Québec
                  </a>
                </div>
              </section>
            ) : (
              <section className="operation-library">
                <div className="library-heading">
                  <p className="eyebrow">Cycle complet des travaux</p>
                  <h2>Les autres types d’opérations</h2>
                  <p>
                    Le registre sert à voir ce qui a été fait, ce qui vient
                    ensuite et ce qu’il faut vérifier après chaque opération.
                  </p>
                </div>
                <div className="operation-timeline">
                  {otherOperations.map((operation, index) => (
                    <article key={operation.title}>
                      <span>{index + 1}</span>
                      <div>
                        <h3>{operation.title}</h3>
                        <b>{operation.stage}</b>
                        <p>{operation.examples}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="register-template">
                  <div>
                    <p className="eyebrow">À écrire après chaque travail</p>
                    <h3>La note minimale dans le registre</h3>
                  </div>
                  <div className="register-fields">
                    {[
                      "Date et lieu exact",
                      "Culture et stade",
                      "Opération réalisée",
                      "Machine, outil ou produit",
                      "Réglage, dose ou quantité",
                      "Sol et météo",
                      "Résultat observé",
                      "Prochaine opération",
                    ].map((field) => (
                      <span key={field}>✓ {field}</span>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
