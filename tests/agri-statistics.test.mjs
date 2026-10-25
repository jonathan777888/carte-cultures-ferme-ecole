import test from "node:test";
import assert from "node:assert/strict";
import {DEMO_SYNTHETIQUE,moyenne,variance,separerDonnees,entrainerRegression,evaluerRegression} from "../src/agri-statistics.ts";
test("statistiques echantillonnales et protection des entrees",()=>{
 assert.equal(moyenne([1,2,3]),2);
 assert.equal(variance([1,2,3]),1);
 assert.throws(()=>moyenne([]));
});
test("separation des exemples sans fuite de donnees",()=>{
 const {entrainement,test}=separerDonnees(DEMO_SYNTHETIQUE);
 assert.equal(entrainement.length+test.length,DEMO_SYNTHETIQUE.length);
 assert.ok(!entrainement.some(d=>test.includes(d)));
});
test("apprentissage, prediction et evaluation reproductibles",()=>{
 const {entrainement,test}=separerDonnees(DEMO_SYNTHETIQUE);
 const modele=entrainerRegression(entrainement);
 const metrics=evaluerRegression(test,modele.predire);
 assert.ok(metrics.mae<0.5);
 assert.ok(metrics.rmse<0.5);
 assert.equal(metrics.n,test.length);
 assert.deepEqual(modele.coefficients,entrainerRegression(entrainement).coefficients);
});
test("refuse valeurs manquantes ou non numeriques",()=>{
 assert.throws(()=>entrainerRegression([{eau:NaN,temperature:20,rendement:3},...DEMO_SYNTHETIQUE.slice(0,4)]));
});
