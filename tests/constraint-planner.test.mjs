import test from "node:test";
import assert from "node:assert/strict";
import { optimiserRotations } from "../src/constraint-planner.ts";
import { familleCulture } from "../src/rotation-engine.ts";

const histor = [
  { number: 3, crop: "tomate", confirmed: true },
  { number: 1, crop: "carotte", confirmed: true },
  { number: 2, crop: "tomate", confirmed: true },
  { number: 4, crop: "inconnu", confirmed: false },
];

test("explore un graphe de planches adjacentes; donnees d'origine inchangees", () => {
  const avant = JSON.stringify(histor);
  const r = optimiserRotations(histor, { candidates: ["tomate", "carotte", "brocoli", "mais"] });
  assert.ok(r.propositions.length === 4);
  assert.deepEqual(r.aretes, [[1,2],[2,3],[3,4]]);
  assert.equal(JSON.stringify(histor), avant);
  assert.ok(r.noeuds > 0);
  assert.ok(r.solutions >= 1);
  assert.equal(r.optimaleProuvee, true);
  for (let i=1;i<r.propositions.length;i++) {
    assert.notEqual(familleCulture(r.propositions[i].crop), familleCulture(r.propositions[i-1].crop));
  }
  for (const item of r.propositions) {
    const h = histor.find(x => x.number === item.number);
    if(h.confirmed) assert.notEqual(familleCulture(item.crop), familleCulture(h.crop));
  }
  assert.equal(r.propositions.find(x => x.number === 4).diagnostic.etat, "a-verifier");
});

test("signalise les domaines sans solution plutot que d'inventer des cultures", () => {
  const r = optimiserRotations([{number:1,crop:"tomate",confirmed:true}],{candidates:["pomme-de-terre"]});
  assert.equal(r.propositions.length,0);
  assert.equal(r.optimaleProuvee,false);
});

test("une limite de recherche indique explicitement que l'optimum n'est pas prouve", () => {
  const h=Array.from({length:10},(_,i)=>({number:i+1,crop:"vide",confirmed:false}));
  const r=optimiserRotations(h,{noeudsMaximum:1});
  assert.equal(r.complete,false);
  assert.equal(r.optimaleProuvee,false);
});

test("resultats reproductibles et score de diversite non negatif", () => {
  const a=optimiserRotations(histor,{candidates:["tomate","carotte","brocoli","mais"]});
  const b=optimiserRotations(histor,{candidates:["tomate","carotte","brocoli","mais"]});
  assert.deepEqual(a,b);
  assert.ok(a.score>=4);
});

test("paires non consecutives n'ont pas d'arete de voisinage", () => {
  const r=optimiserRotations([{number:1,crop:"vide",confirmed:false},{number:3,crop:"vide",confirmed:false}],{
    candidates:["tomate"], diversifierVoisines:true,
  });
  assert.equal(r.aretes.length,0);
  assert.equal(r.propositions.length,2);
});
