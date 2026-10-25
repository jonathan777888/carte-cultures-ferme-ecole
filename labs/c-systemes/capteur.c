/* Simulateur de mesures d'un capteur de parcelle (C11 / POSIX).
 * Aucune connexion a un capteur physique. Trame d'exemple, non mesure reelle.
 * Compilation : cc -std=c11 -Wall -Wextra -Werror -pedantic capteur.c -lm -o capteur
 * Utilisation : ./capteur
 */
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <stdint.h>

typedef struct {
    uint32_t parcelle;
    double temperature_c;
    double humidite_pct;
} Mesure;

static int valider(const Mesure *m) {
    return m != NULL && m->parcelle > 0 && isfinite(m->temperature_c)
        && m->temperature_c >= -40.0 && m->temperature_c <= 85.0
        && isfinite(m->humidite_pct)
        && m->humidite_pct >= 0.0 && m->humidite_pct <= 100.0;
}
static double moyenne_humidite(const Mesure *v, size_t n) {
    if (v == NULL || n == 0) return NAN;
    double total = 0.0;
    for (size_t i = 0; i < n; ++i) {
        if (!valider(&v[i])) return NAN;
        total += v[i].humidite_pct;
    }
    return total / (double)n;
}
int main(void) {
    Mesure *mesures = calloc(3, sizeof *mesures);
    if (mesures == NULL) {
        fputs("Echec allocation memoire\n", stderr);
        return EXIT_FAILURE;
    }
    mesures[0] = (Mesure){.parcelle=1,.temperature_c=22.0,.humidite_pct=43.0};
    mesures[1] = (Mesure){.parcelle=1,.temperature_c=23.0,.humidite_pct=48.0};
    mesures[2] = (Mesure){.parcelle=1,.temperature_c=24.0,.humidite_pct=53.0};
    double result = moyenne_humidite(mesures, 3);
    if (!isfinite(result)) {
        free(mesures);
        return EXIT_FAILURE;
    }
    printf("SIMULATION uniquement: humidite moyenne = %.2f %%\n", result);
    free(mesures);
    return fabs(result - 48.0) < 0.001 ? EXIT_SUCCESS : EXIT_FAILURE;
}
