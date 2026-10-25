# Matrice RPL MTU — état des preuves (non certifié)

Cette matrice décrit les éléments effectivement présents sur la branche `feature/rotation-parcelles-rpl-2026`. Un module de démonstration informatique ne prouve ni l'intégralité d'un module universitaire ni sa reconnaissance par MTU. Une évaluation des apprentissages, des explications personnelles et les objectifs officiels sont nécessaires.

| Domaine à démontrer | Preuve disponible | Limites observées / preuve suivante |
| --- | --- | --- |
| Développement web et UI | React / TypeScript, `src/App.tsx`, `src/RotationPanel.tsx` | Tests de parcours, accessibilité et performance à compléter |
| Algorithmique | `src/constraint-planner.ts` : recherche sous contraintes avec élagage et limite de noeuds | Benchmark, complexité, comparaison exhaustive, cas réalistes à approfondir |
| Mathématiques discrètes | Graphe de planches adjacentes, coloration des familles, fonction objectif | Preuves formelles, combinatoire et démonstration complète non établies |
| Structures de données | `Map`, `Set`, tableaux, graphe implicite et tri | Arbres, tas, graphes généraux et analyse comparative non couverts |
| Statistiques | Moyenne, variance, MAE, RMSE et biais : `src/agri-statistics.ts` | Inférence, probabilités, intervalles de confiance non couverts |
| Machine Learning | Régression Ridge de démonstration, séparation entraînement/test | Données **synthétiques** ; validation croisée, vraie étude agronomique et métriques réelles nécessaires |
| Programmation C | `labs/c-systemes/capteur.c` : pointeurs, `calloc`, `free`, structures et gestion d'erreurs | C avancé, outillage de débogage et tests supplémentaires nécessaires |
| Systèmes embarqués | Traitement d'une trame de capteur simulé dans le programme C | **Aucun firmware ni matériel réel** : preuve embarquée non acquise |
| Architecture des ordinateurs | Structures typées et données simulées | Assembleur, registres, mémoire cache et ISA non démontrés |
| Systèmes d'exploitation | Compilation C et allocation dynamique | Processus, threads, scheduling, synchronisation et IPC non démontrés |
| Programmation mobile | Interface responsive sur téléphone | Application native ou web hors ligne avec API appareil non démontrée |
| Big Data | Petit ensemble d'observations de démonstration | Ni volumétrie ni architecture distribuée justifiées |
| Sécurité applicative | TypeScript, validations, limitations de données non fiables | Authentification, revue de risques, tests de sécurité à ajouter |
| Recherche et projet final | Docs, historique des commits, cas de tests, choix d'algorithmes | Rapport de recherche personnel et soutenance du raisonnement nécessaires |

## Reproduire les contrôles

```sh
npm ci
npm run test:advanced
npm run build
cc -std=c11 -Wall -Wextra -Werror -pedantic labs/c-systemes/capteur.c -lm -o /tmp/capteur-test
/tmp/capteur-test
```

**Limite de la maquette statistique** : les 48 observations sont produites par une formule synthétique. Elles servent uniquement à tester la chaîne d'entraînement et d'évaluation, sans prétention à une prévision fiable de la culture.

**Limite de l'algorithme** : son optimum porte exclusivement sur un critère combinatoire de diversité des familles. Il ne prouve aucun optimum agronomique. La présence d'une famille inconnue dans l'historique rend le diagnostic incertain.

## Prochaine tranche technique recommandée

1. Vérifier les modules officiels du programme MT800, les descripteurs d'apprentissage et le niveau exigé.
2. Ajouter un historique réel multianuel et une provenance précise pour chaque parcelle.
3. Ajouter l'architecture de données persistantes sécurisée et les tests d'intégration.
4. Ajouter un programme embarqué réellement compilable pour microcontrôleur ou en environnement matériel simulé, avec protocole et tests.
5. Ajouter des expérimentations mesurées sur systèmes d'exploitation, architecture, probabilités et programmation mobile, indépendamment des fonctionnalités agricoles.
6. Documenter ce que le candidat a personnellement réalisé, les apports éventuels de l'IA, les corrections et les validations effectuées.
