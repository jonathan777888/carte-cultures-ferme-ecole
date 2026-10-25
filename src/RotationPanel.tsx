import { useEffect, useState } from "react";
import {
  CULTURES_CANDIDATES,
  diagnostiquerRotation,
  proposerRotation2027,
  type PlancheHistorique,
  type EtatRotation,
} from "./rotation-engine";
import "./rotation-panel.css";

type Props = {
  plotId: string;
  planches: readonly PlancheHistorique[];
  nomsCultures: Readonly<Record<string, { name: string }>>;
};

const STORAGE_KEY = "ferme-ecole-rotations-2027-v1";
const ETIQUETTES: Record<EtatRotation, string> = {
  "non-evalue": "Non planifiée",
  compatible: "Famille différente",
  conflit: "Conflit de famille",
  "a-verifier": "À vérifier",
};

function lireChoix(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([key, value]) =>
        /^[A-D][1-6]-P(?:10|[1-9])$/.test(key) && typeof value === "string",
      ),
    );
  } catch {
    return {};
  }
}

/** Simulation locale : ne modifie pas les donnees agricoles 2026 de la carte. */
export default function RotationPanel({ plotId, planches, nomsCultures }: Props) {
  const [choix, setChoix] = useState<Record<string, string>>(lireChoix);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(choix)); } catch { /* navigateur sans stockage */ }
  }, [choix]);

  const lignes = planches.map((planche) => {
    const cle = `${plotId}-P${planche.number}`;
    const envisagee = choix[cle] ?? "";
    const diagnostic = diagnostiquerRotation(planche.crop, planche.confirmed, envisagee);
    return { ...planche, cle, envisagee, diagnostic };
  });
  const conflits = lignes.filter((l) => l.diagnostic.etat === "conflit").length;
  const aVerifier = lignes.filter((l) => l.diagnostic.etat === "a-verifier").length;
  const sansRepetition = lignes.filter((l) => l.diagnostic.etat === "compatible").length;
  const cultures = Object.keys(nomsCultures)
    .filter((id) => id !== "inconnu" && id !== "vide")
    .sort((a, b) => nomsCultures[a].name.localeCompare(nomsCultures[b].name, "fr"));

  function generer() {
    const propositions = proposerRotation2027(planches, CULTURES_CANDIDATES);
    setChoix((etat) => ({
      ...etat,
      ...Object.fromEntries(propositions.map((p) => [`${plotId}-P${p.number}`, p.crop])),
    }));
  }

  function reinitialiser() {
    setChoix((etat) => {
      const suivant = { ...etat };
      for (const planche of planches) delete suivant[`${plotId}-P${planche.number}`];
      return suivant;
    });
  }

  function exporter() {
    const contenu = {
      scenario: "Rotation culturale exploratoire 2027",
      parcelle: plotId,
      dateExport: new Date().toISOString(),
      limites: "Contrôle de répétition directe de famille seulement. Validation agronomique requise.",
      planches: lignes.map((l) => ({
        planche: l.number,
        precedent2026: l.crop,
        precedentConfirme: l.confirmed,
        projet2027: l.envisagee || null,
        etat: l.diagnostic.etat,
        explication: l.diagnostic.explication,
      })),
    };
    const blob = new Blob([JSON.stringify(contenu, null, 2)], { type: "application/json" });
    const adresse = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = adresse;
    lien.download = `rotation-${plotId}-2027.json`;
    lien.click();
    URL.revokeObjectURL(adresse);
  }

  return (
    <section className="rotation-panel" aria-labelledby="rotation-title">
      <header className="rotation-intro">
        <div>
          <p className="eyebrow">Projet 2027 · simulation non validée</p>
          <h2 id="rotation-title">Rotations de la parcelle {plotId}</h2>
          <p>Compare les cultures répertoriées en 2026 aux cultures envisagées en 2027, planche par planche.</p>
        </div>
        <div className="rotation-actions">
          <button type="button" onClick={generer}>Proposer un scénario</button>
          <button type="button" className="secondary" onClick={reinitialiser}>Effacer ce scénario</button>
          <button type="button" className="secondary" onClick={exporter}>Exporter en JSON</button>
        </div>
      </header>
      <div className="rotation-summary" aria-live="polite">
        <span><strong>{sansRepetition}</strong> sans répétition directe</span>
        <span><strong>{conflits}</strong> conflit(s) détecté(s)</span>
        <span><strong>{aVerifier}</strong> à vérifier</span>
      </div>
      <div className="rotation-list">
        {lignes.map((ligne) => (
          <div className="rotation-line" key={ligne.cle}>
            <div className="rotation-history">
              <strong>P{ligne.number} · 2026</strong>
              <span>{nomsCultures[ligne.crop]?.name ?? ligne.crop}</span>
              {!ligne.confirmed && <small>Registre à confirmer</small>}
            </div>
            <label className="rotation-choice">
              <span>Projet 2027</span>
              <select
                aria-label={`Culture envisagée en 2027 pour ${plotId}, planche ${ligne.number}`}
                value={ligne.envisagee}
                onChange={(event) => setChoix((etat) => ({ ...etat, [ligne.cle]: event.target.value }))}
              >
                <option value="">Choisir une culture...</option>
                {cultures.map((id) => <option value={id} key={id}>{nomsCultures[id].name}</option>)}
              </select>
            </label>
            <div className={`rotation-diagnostic rotation-diagnostic--${ligne.diagnostic.etat}`}>
              <strong>{ETIQUETTES[ligne.diagnostic.etat]}</strong>
              <small>{ligne.diagnostic.explication}</small>
            </div>
          </div>
        ))}
      </div>
      <p className="rotation-limit">
        <strong>Limites :</strong> la comparaison ne porte que sur la répétition immédiate de familles botaniques.
        Les mélanges d'engrais verts, les cultures successives non renseignées, les précédents plus anciens,
        les maladies, les analyses de sol, la disponibilité et les débouchés restent à examiner.
        Le scénario est conservé uniquement dans ce navigateur et ne modifie jamais le registre 2026.
        Faire valider les choix au champ par l'équipe agronomique.
      </p>
    </section>
  );
}
