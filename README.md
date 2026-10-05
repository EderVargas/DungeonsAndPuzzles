# Dungeons & Puzzles

Juego de navegador para practicar las tablas de multiplicar: un caballero recorre cuevas, enfrenta dragones y abre un cofre resolviendo multiplicaciones.

Tres combates (tablas del 1 al 8) y un reto final del cofre (tablas del 9 y del 10). Cada acierto daña al rival. Cada error le quita un corazón al caballero. Los corazones no se recuperan entre niveles.

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

Cada push a `main` ejecuta `.github/workflows/pages.yml`. El sitio publicado lleva solo `index.html`, `css/`, `js/` y `assets/`. Las pruebas, el spec y el servidor local se quedan en el repositorio.

La dirección queda en `https://<usuario>.github.io/DungeonsAndPuzzles/`.

## Música

*The Old Tower Inn*, de RandomMind.  
Fuente: https://opengameart.org/content/medieval-the-old-tower-inn  
Licencia: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). El crédito también está en `assets/audio/CREDITS.txt`.

## Spec

El diseño de reglas, niveles y feedback está en `GAME_SPEC.md`.
