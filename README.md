# Dungeons & Puzzles

Juego de navegador con dos caballeros. Al empezar se elige uno y ese camino dura la partida.

**Tablas (7-8 años).** Tres combates (tablas del 1 al 8) y un cofre (tablas del 9 y del 10).

**Preguntas (3-4 años).** No hace falta leer. Una voz dice la pregunta y se toca una de cuatro imágenes: colores, formas, números del 1 al 5 y vocales.

Los dos recorren cuevas y enfrentan dragones con el mismo combate. Cada acierto daña al rival. Cada error le quita un corazón al caballero. Los corazones no se recuperan entre niveles.

## Jugar en local

Hace falta Node.js. El juego usa módulos de JavaScript, así que hay que abrirlo con el servidor del proyecto.

```bash
npm start
```

Abre http://localhost:4173

## Pruebas

```bash
npm test
```

## Publicación

Cada push a `main` ejecuta `.github/workflows/pages.yml`. El sitio publicado lleva solo `index.html`, `css/`, `js/` y `assets/`. Las pruebas, la referencia y el servidor local se quedan en el repositorio.

La dirección queda en `https://<usuario>.github.io/DungeonsAndPuzzles/`.

## Música

*The Old Tower Inn*, de RandomMind, suena al 60 % del volumen. Cuando suena una pregunta hablada, la música se pausa y vuelve al terminar. La voz va siempre al máximo.

Fuente: https://opengameart.org/content/medieval-the-old-tower-inn  
Licencia: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). El crédito también está en `assets/audio/CREDITS.txt`.

## Referencia

El mapa actual del juego está en `docs/referencia.md`. Las reglas de las tablas están en `GAME_SPEC.md`.
