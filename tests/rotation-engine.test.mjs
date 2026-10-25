import test from 'node:test';
import assert from 'node:assert/strict';
import { familleCulture, diagnostiquerRotation, proposerRotation2027 } from '../src/rotation-engine.ts';

test('familles botaniques: tomate et pomme de terre sont toutes deux des solanacees', () => {
  assert.equal(familleCulture('tomate'), familleCulture('pomme-de-terre'));
  assert.notEqual(familleCulture('tomate'), familleCulture('carotte'));
});

test('evite la repetition directe de famille', () => {
  const r = diagnostiquerRotation('tomate', true, 'pomme-de-terre');
  assert.equal(r.etat, 'conflit');
});

test('autre famille: absence de repetition directe, pas de garantie agronomique', () => {
  const r = diagnostiquerRotation('tomate', true, 'carotte');
  assert.equal(r.etat, 'compatible');
  assert.match(r.explication, /Verifier/);
});

test('precedent incertain reste a verifier, meme si la famille change', () => {
  assert.equal(diagnostiquerRotation('tomate', false, 'carotte').etat, 'a-verifier');
});

test('engrais vert ne permet pas de deviner la famille botanique', () => {
  assert.equal(diagnostiquerRotation('engrais-vert', true, 'carotte').etat, 'a-verifier');
  assert.equal(diagnostiquerRotation('tomate', true, 'engrais-vert').etat, 'a-verifier');
});

test('aucune proposition renseignee ne doit pas etre declaree compatible', () => {
  assert.equal(diagnostiquerRotation('tomate', true, '').etat, 'non-evalue');
});

test('proposition reproductible et sans conflit connu', () => {
  const historique = Array.from({ length: 10 }, (_, index) => ({
    number: index + 1, crop: index < 5 ? 'tomate' : 'carotte', confirmed: true,
  }));
  const original = JSON.stringify(historique);
  const a = proposerRotation2027(historique);
  const b = proposerRotation2027(historique);
  assert.deepEqual(a, b);
  assert.equal(a.length, 10);
  assert.ok(a.every((p) => p.crop && p.diagnostic.etat === 'compatible'));
  assert.equal(JSON.stringify(historique), original, 'les donnees 2026 restent intactes');
});

test('historique incertain reste en avertissement dans la proposition', () => {
  const r = proposerRotation2027([{ number: 1, crop: 'inconnu', confirmed: false }]);
  assert.equal(r[0].diagnostic.etat, 'a-verifier');
});

test('sans candidate admissible, aucune fausse recommandation', () => {
  const r = proposerRotation2027([{ number: 1, crop: 'tomate', confirmed: true }], ['pomme-de-terre']);
  assert.equal(r[0].crop, '');
  assert.equal(r[0].diagnostic.etat, 'non-evalue');
});
