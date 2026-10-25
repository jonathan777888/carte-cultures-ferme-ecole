/**
 * Scenarios exploratoires 2027. Ne modifie jamais le registre agricole 2026.
 * Le controle ne porte que sur la repetition de famille botanique 2026 -> 2027.
 * Sol, maladies, precedents anterieurs, debouches et disponibilite ne sont PAS evalues.
 */
export type Famille =
  | "solanacees"
  | "cucurbitacees"
  | "brassicacees"
  | "alliacees"
  | "apiacees"
  | "asteracees"
  | "amaranthacees"
  | "fabacees"
  | "poacees"
  | "polygonacees"
  | "lamiacees"
  | "convolvulacees"
  | "myrtacees"
  | "rosacees";

/** Les categories 'engrais vert', 'fines herbes', 'fleurs' et 'inconnu' ne fixent pas une famille. */
const familles: Readonly<Record<string, Famille>> = {
  "pomme-de-terre": "solanacees", tomate: "solanacees", aubergine: "solanacees",
  poivron: "solanacees", "cerise-terre": "solanacees",
  melon: "cucurbitacees", courge: "cucurbitacees", courgette: "cucurbitacees",
  kale: "brassicacees", chou: "brassicacees", brocoli: "brassicacees",
  "chou-rave": "brassicacees", rutabaga: "brassicacees",
  oignon: "alliacees", ail: "alliacees",
  carotte: "apiacees", panais: "apiacees", celeri: "apiacees", "celeri-rave": "apiacees",
  laitue: "asteracees", tournesol: "asteracees",
  betterave: "amaranthacees",
  soya: "fabacees", legumineuse: "fabacees",
  mais: "poacees", sarrasin: "polygonacees", basilic: "lamiacees",
  "patate-douce": "convolvulacees", eucalyptus: "myrtacees", fraise: "rosacees",
};

export function familleCulture(culture: string): Famille | null {
  return familles[culture] ?? null;
}

export type EtatRotation = "non-evalue" | "compatible" | "conflit" | "a-verifier";
export type DiagnosticRotation = { etat: EtatRotation; explication: string };

/**
 * Ne signifie PAS qu'une rotation est agronomiquement sure : uniquement que
 * la repetition immediate d'une famille a pu etre verifiee ou exclue.
 */
export function diagnostiquerRotation(
  culture2026: string,
  confirmee2026: boolean,
  culture2027: string,
): DiagnosticRotation {
  if (!culture2027) {
    return { etat: "non-evalue", explication: "Choisir d'abord une culture pour le scenario 2027." };
  }
  if (!confirmee2026) {
    return { etat: "a-verifier", explication: "Le precedent 2026 n'est pas confirme dans le registre." };
  }
  const precedente = familleCulture(culture2026);
  const suivante = familleCulture(culture2027);
  if (!precedente || !suivante) {
    return {
      etat: "a-verifier",
      explication: "La famille botanique est inconnue ou depend de la composition (engrais vert, fleurs, fines herbes ou vide).",
    };
  }
  if (precedente === suivante) {
    return {
      etat: "conflit",
      explication: "Meme famille botanique en 2026 et 2027 : repetition a eviter ou a faire valider par l'agronome.",
    };
  }
  return {
    etat: "compatible",
    explication: "Famille differente du precedent 2026. Verifier l'historique anterieur, le sol, les maladies et le plan de culture.",
  };
}

export type PlancheHistorique = { number: number; crop: string; confirmed: boolean };
export type PropositionRotation = { number: number; crop: string; diagnostic: DiagnosticRotation };

export const CULTURES_CANDIDATES = [
  "laitue", "tomate", "courgette", "brocoli", "carotte", "betterave",
  "oignon", "soya", "mais", "sarrasin", "basilic", "fraise",
] as const;

/**
 * Heuristique deterministe, sans optimisation agronomique globale :
 * 1. Ne propose pas de repetition immediate connue d'une famille.
 * 2. Equilibre les familles sur les planches de la parcelle.
 * 3. Departage par usage de la culture, puis ordre stable des candidats.
 * Les inconnues restent signalees, jamais considerees comme confirmees.
 */
export function proposerRotation2027(
  planches: readonly PlancheHistorique[],
  cultures: readonly string[] = CULTURES_CANDIDATES,
): PropositionRotation[] {
  const candidates = Array.from(new Set(cultures)).filter((culture) => familleCulture(culture));
  const parFamille = new Map<Famille, number>();
  const parCulture = new Map<string, number>();
  return [...planches].sort((a, b) => a.number - b.number).map((planche) => {
    const admissibles = candidates.filter((culture) =>
      diagnostiquerRotation(planche.crop, planche.confirmed, culture).etat !== "conflit",
    );
    const classees = admissibles.map((culture, index) => ({
      culture,
      score: (parFamille.get(familleCulture(culture)!) ?? 0) * 100 +
        (parCulture.get(culture) ?? 0) * 10 + index,
    })).sort((a, b) => a.score - b.score || a.culture.localeCompare(b.culture));
    const choix = classees[0]?.culture ?? "";
    if (choix) {
      const famille = familleCulture(choix)!;
      parFamille.set(famille, (parFamille.get(famille) ?? 0) + 1);
      parCulture.set(choix, (parCulture.get(choix) ?? 0) + 1);
    }
    return {
      number: planche.number,
      crop: choix,
      diagnostic: diagnostiquerRotation(planche.crop, planche.confirmed, choix),
    };
  });
}
