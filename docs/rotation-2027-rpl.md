# Rotation culturale 2027 — documentation technique

## Objectif

Ajouter une simulation de rotation **à l'outil existant « Parcelles et planches »** de la ferme-école, sans remplacer ni modifier les observations 2026.

Cette fonctionnalité aide à envisager une culture en 2027 pour les dix planches d'une parcelle du Moyen Jardin et à signaler une répétition immédiate de famille botanique. **Aucune suggestion n'est un plan agronomique validé.**

## Architecture et implémentation

- `src/rotation-engine.ts` : moteur déterministe pur, indépendant de React. Classification explicite des familles botaniques, évaluation de la répétition et proposition d'un scénario. Une famille non spécifiée ne reçoit **jamais** un statut « compatible ».
- `src/RotationPanel.tsx` : interface interactive dans l'écran « Parcelles » existant, changement de culture par planche, récapitulatif, génération de proposition, remise à zéro locale et export JSON documenté.
- `src/rotation-panel.css` : présentation responsive, état visible de chaque diagnostic.
- `tests/rotation-engine.test.mjs` : tests unitaires sur les familles, contradictions, incertitudes, répétabilité, absence de mutation du registre et cas sans proposition.

### Algorithme

Pour les planches numérotées de 1 à 10 :

1. Identifier la famille botanique de la culture 2026, si elle est connue et confirmée.
2. Exclure les candidats de la **même famille** pour la proposition 2027, si une répétition a été détectée.
3. Parmi les autres candidats, favoriser ceux dont la famille est la moins représentée dans le scénario en cours, puis ceux dont la culture est la moins utilisée.
4. Conserver un avertissement « à vérifier » pour toute information historique incomplète. Ne jamais la faire passer pour confirmée.

L'heuristique est déterministe et non globale : elle **n'optimise pas** le rendement, les marges, les ravageurs, la fertilisation, la viabilité commerciale, les contraintes d'équipement, ni les rotations sur plus d'un an.

### Complexité asymptotique

Pour `P` planches et `C` cultures candidates, le filtrage et le classement des candidates prennent au plus `O(P × C log C)` dans cette version (la cartographie des familles et les compteurs sont à accès moyen constant). L'espace supplémentaire est `O(P + C)` hors stockage des données d'entrée.

Cette analyse théorique ne remplace pas une mesure de performance de l'application.

## Qualité, provenance et validation

- L'historique 2026 reste inchangé : les propositions sont distinctes et enregistrées uniquement dans le `localStorage` du navigateur.
- Les entrées 2026 non confirmées, les engrais verts dont le mélange n'est pas précisé et les familles inconnues ne sont pas interprétés comme des rotations validées.
- L'export `JSON` identifie la parcelle, l'année, les propositions et leurs limites.
- La comparaison ne tient compte que des **familles botaniques immédiatement consécutives** (2026 → 2027). Les cultures successives sur une même planche, les autres années, les sols, les maladies et le marché demandent une analyse séparée.
- Ne pas publier de données personnelles ou confidentielles dans le scénario.
- Les choix restent à vérifier avec le registre et un responsable agronomique avant mise en oeuvre.

## Reproduire les tests

```bash
npm ci
npm run test:rotations
npm run build
```

L'implémentation est documentée pour faciliter sa maintenance : types, classifications, invariants, algorithmes, contrôles de validité et tests.

## Éléments à approfondir

- Historique multiannuel fiable (2025, 2024, etc.) par planche.
- Prise en compte des cultures successives et des associations sur une même planche.
- Contraintes botaniques supplémentaires, phytosanitaires, agronomiques, de surfaces et de débouchés.
- Vérification automatisée de l'interface et mesures de performance.
- Revue avec un agronome et compte rendu technique personnel : choix d'algorithme, limites, cas limites, corrections apportées.
