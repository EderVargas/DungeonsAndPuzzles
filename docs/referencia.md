# Referencia del juego

Dungeons & Puzzles es un juego de navegador, sin framework. Al empezar se elige un caballero y ese camino dura la partida. Los dos pelean igual: un acierto lanza el ataque del caballero y un fallo lanza la mordida del dragón. Cada error quita un corazón. Los corazones no se recuperan entre cuevas.

## Caballeros

| | Tablas | Preguntas |
| --- | --- | --- |
| Edad | 7-8 años | 3-4 años |
| Aspecto | Más grande, pelo castaño `#8a5a32`, armadura verde `#3e8f4a` | Más pequeño, pelo oscuro `#3a241c`, armadura amarilla `#e2b43a` |
| Pregunta | Tablas de multiplicar, cuatro números | La voz dice la respuesta y se toca una de cuatro imágenes |
| Cuevas | La Cueva Verde (1-3), La Guarida del Dragón (4-6), La Montaña Roja (6-8), El Cofre del Tesoro (9-10) | Los colores, Las formas, Los números, y el cofre de Las vocales |

Las reglas de las tablas, la vida y el feedback siguen en `GAME_SPEC.md`.

## Cuevas de preguntas

No hace falta leer ni usar el micrófono. La voz pregunta y se responde tocando.

- **Colores.** Rojo, azul, amarillo y verde al principio. Naranja y morado entran después de las dos primeras rondas, y la voz los pregunta antes de repetir un color de apertura.
- **Formas.** Círculo, cuadrado, triángulo y estrella. En una cueva salen las cuatro antes de repetir alguna. Todas van del mismo color en la ronda para que el color no delate la respuesta.
- **Números.** Del 1 al 5, con el dígito y los puntos para contar. No se repite un número hasta que salieron los cinco.
- **Vocales.** A, E, I, O, U. No se repite una vocal hasta que salieron las cinco. Arriba el dibujo y abajo la palabra con la inicial remarcada: Araña, Estrella, Isla, Oso, Uvas. Esta cueva es el cofre: los aciertos lo abren y sale la espada mística.

Al terminar el cofre, en los dos caminos, el mensaje dice que se ganó la espada mística. **Otra vez** empieza de nuevo con el mismo caballero, desde la primera cueva. **Cambiar personaje** vuelve a la elección entre 7-8 años y 3-4 años.

Cada cueva tiene 4 de vida en el dragón y 3 corazones. La bocina repite la pregunta.

## Voz y música

La música de fondo es *The Old Tower Inn* y suena al 60 % del volumen máximo. Se pausa si se minimiza la ventana, se cambia de pestaña, se pasa a otra ventana o se bloquea el teléfono, y sigue al volver. La voz, con `speechSynthesis` en español (prefiere `es-MX`), va siempre al 100 %.

Mientras se dice una pregunta hablada, la música se pausa. Al terminar la frase, al cancelarla o al responder, la música vuelve desde donde se quedó. Entre una repetición y la siguiente (cada 7 segundos) la música sí suena. El camino de las tablas no tiene preguntas habladas, así que su música no se interrumpe. Silenciar el sonido apaga música y efectos; la voz de la pregunta sigue esa misma pausa y no reanuda la música si el jugador la dejó en silencio.

## Dónde está el código

- `js/characters.js` — los dos caballeros
- `js/levels.js` — cuevas de los dos
- `js/prompts.js` — rondas de las preguntas habladas
- `js/voice.js` — pregunta hablada
- `js/audio.js` — música, volumen y pausa
- `js/art.js` — dibujos de formas y vocales
- `js/game-state.js` y `js/combat.js` — pelea, compartida
