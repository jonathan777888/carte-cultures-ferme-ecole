# Carte des cultures – Ferme-école

Version publique de l’application de repérage des cultures de la ferme-école.

## Fonctions

- carte du Petit Jardin, du Moyen Jardin, du Grand Jardin et du Grand Tunnel;
- fiches par parcelle et par planche;
- recherche des cultures et des emplacements;
- guide de décision pour choisir les opérations agricoles;
- affichage adapté aux téléphones et aux ordinateurs.

Les données marquées **à confirmer** ne doivent pas être considérées comme définitives.

## Simulation des rotations 2027 (en cours de validation)

Dans l'onglet **Parcelles**, choisir **Moyen Jardin**, puis une parcelle (A1 à D6). Sous les planches, le simulateur permet de :

- comparer les cultures 2026 à un **scénario 2027** pour chacune des dix planches ;
- détecter les répétitions immédiates de familles botaniques connues ;
- signaler explicitement les historiques ou les familles non confirmés ;
- générer une proposition déterministe, la modifier manuellement et l'exporter au format JSON ;
- enregistrer ce scénario séparément dans le navigateur, **sans modifier le registre 2026**.

**Attention :** l'outil ne remplace pas le plan agronomique. Historique pluriannuel, mélanges d'engrais verts, sols, maladies et débouchés restent à valider.

Lire [la documentation technique des rotations](docs/rotation-2027-rpl.md).

Lancer les tests :

```bash
npm run test:rotations
```

## Développement local

```bash
npm install
npm run dev
```

## Vérification et production

```bash
npm run build
npm run preview
```

Le déploiement GitHub Pages est automatisé à chaque mise à jour de la branche `main`.
