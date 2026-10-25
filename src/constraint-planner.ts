import {
  CULTURES_CANDIDATES,
  diagnostiquerRotation,
  familleCulture,
  type Famille,
  type PlancheHistorique,
  type PropositionRotation,
} from "./rotation-engine.ts";

/**
 * Probleme de satisfaction de contraintes (CSP) : les sommets sont les planches,
 * les aretes relient les planches consecutives. Une coloration associe une famille
 * botanique a chaque sommet. Interdire deux familles identiques entre voisines est
 * une contrainte de DIVERSIFICATION EXPERIMENTALE et NON une regle agronomique.
 *
 * L'objectif de score ajoute +1, +3, +5... pour chaque occurrence d'une famille :
 * il minimise exactement la somme des carres des effectifs par famille.
 */
export type RechercheRotation = {
  propositions: PropositionRotation[];
  noeuds: number;
  solutions: number;
  branchesCoupees: number;
  optimaleProuvee: boolean;
  complete: boolean;
  score: number | null;
  aretes: ReadonlyArray<readonly [number, number]>;
};

export type OptionsRotation = {
  candidates?: readonly string[];
  noeudsMaximum?: number;
  diversifierVoisines?: boolean;
};

export function optimiserRotations(
  historique: readonly PlancheHistorique[],
  options: OptionsRotation = {},
): RechercheRotation {
  const planches = [...historique].sort((a, b) => a.number - b.number);
  const choix = Array.from(new Set(options.candidates ?? CULTURES_CANDIDATES))
    .filter((culture) => familleCulture(culture) !== null);
  const candidats = choix.slice().sort((a, b) => a.localeCompare(b, "fr"));
  const limite = Number.isFinite(options.noeudsMaximum) && (options.noeudsMaximum ?? 0) > 0
    ? Math.floor(options.noeudsMaximum!)
    : 60_000;
  const diversifier = options.diversifierVoisines ?? true;
  const aretes: Array<readonly [number, number]> = [];
  for (let i = 1; i < planches.length; i++) {
    if (planches[i].number === planches[i - 1].number + 1) {
      aretes.push([planches[i - 1].number, planches[i].number]);
    }
  }
  const compter = new Map<Famille, number>();
  const affectation: string[] = [];
  let meilleure: string[] | null = null;
  let scoreMinimal = Infinity;
  let noeuds = 0;
  let solutions = 0;
  let branchesCoupees = 0;
  let complete = true;

  function explorer(profondeur: number, score: number): void {
    if (noeuds >= limite) {
      complete = false;
      return;
    }
    noeuds++;
    if (profondeur === planches.length) {
      solutions++;
      if (score < scoreMinimal) {
        scoreMinimal = score;
        meilleure = [...affectation];
      }
      return;
    }

    // Chaque parcelle restante coute au moins un point (premiere occurrence).
    if (score + (planches.length - profondeur) >= scoreMinimal) {
      branchesCoupees++;
      return;
    }

    const planche = planches[profondeur];
    const domaines = candidats.filter((culture) =>
      diagnostiquerRotation(planche.crop, planche.confirmed, culture).etat !== "conflit",
    );
    domaines.sort((a, b) => {
      const ca = compter.get(familleCulture(a)!) ?? 0;
      const cb = compter.get(familleCulture(b)!) ?? 0;
      return ca - cb || a.localeCompare(b, "fr");
    });

    for (const culture of domaines) {
      if (noeuds >= limite) {
        complete = false;
        break;
      }
      const famille = familleCulture(culture)!;
      const voisin = profondeur > 0 &&
        planches[profondeur - 1].number + 1 === planche.number
        ? familleCulture(affectation[profondeur - 1])
        : null;
      if (diversifier && voisin === famille) {
        branchesCoupees++;
        continue;
      }
      const ancien = compter.get(famille) ?? 0;
      const supplement = 2 * ancien + 1;
      if (score + supplement + (planches.length - profondeur - 1) >= scoreMinimal) {
        branchesCoupees++;
        continue;
      }
      compter.set(famille, ancien + 1);
      affectation.push(culture);
      explorer(profondeur + 1, score + supplement);
      affectation.pop();
      if (ancien) compter.set(famille, ancien);
      else compter.delete(famille);
    }
  }

  explorer(0, 0);
  const solution: string[] = meilleure ?? [];
  return {
    propositions: solution.map((crop, i) => ({
      number: planches[i].number,
      crop,
      diagnostic: diagnostiquerRotation(planches[i].crop, planches[i].confirmed, crop),
    })),
    noeuds,
    solutions,
    branchesCoupees,
    // Prouve seulement l'optimalite du SCORE formule, jamais l'optimalite agronomique.
    optimaleProuvee: complete && meilleure !== null,
    complete,
    score: meilleure === null ? null : scoreMinimal,
    aretes,
  };
}
