# DungeonsAndPuzzles - Game Specification

## 1. Project identity

**Name:** DungeonsAndPuzzles
**Type:** Educational browser game / fantasy puzzle combat
**Target:** Children learning multiplication tables
**Technology:** HTML5 + CSS3 + vanilla JavaScript
**Rendering:** HTML/CSS UI plus HTML5 Canvas for the game scene and combat animation
**Frameworks:** None for the initial version
**Initial scope:** 3 combat levels + final treasure challenge

The first version must remain simple, maintainable, dependency-light, and runnable locally from a browser. Do not introduce Phaser, React, Vue, Angular, PixiJS, Three.js, or another framework unless explicitly requested.

---

## 2. Core gameplay loop

The player controls a child knight with a sword.

Each level is a fight against a dragon. The player answers multiplication questions. A correct answer damages the dragon. An incorrect answer causes the dragon to attack the knight and remove one heart.

The game should feel like an adventure game rather than a worksheet.

Core loop:

1. Enter dungeon level.
2. Show knight, dragon, health/hearts, and multiplication question.
3. Present multiple-choice answers.
4. Correct answer:
   - play positive feedback;
   - knight attacks;
   - dragon receives 1 damage;
   - update dragon HP;
   - if the rival's HP reaches 0, clear the level;
   - otherwise advance to the next question.
5. Incorrect answer:
   - play error feedback;
   - dragon attacks;
   - knight loses one heart;
   - if the knight reaches 0 hearts, the attempt ends;
   - otherwise advance to the next question.
6. There is no fixed question count. The fight lasts exactly as long as it takes to drop the rival to 0 HP, or until the knight runs out of hearts.
7. When a rival is defeated, unlock the next level immediately. Do not wait for extra questions.
8. After level 3, enter the treasure challenge. The chest has 3 HP and opens when those 3 hits land.
9. Hearts are not restored between levels. A new attempt starts at full hearts.

---

## 3. Levels

Question count is not configured. A flawless clear asks one question per HP, because each correct answer deals 1 damage. Misses add questions and cost hearts. The planner prepares `dragonHp + heartsCarriedIn - 1` questions, which is the longest fight that can still happen.

### Level 1 - Tables 1, 2 and 3

- Dragon HP: 4
- Multiplication tables: 1, 2, 3
- Difficulty: Easy
- Dragon: small / friendly-looking fantasy dragon
- Recommended answer mode: `sameTable`

### Level 2 - Tables 4, 5 and 6

- Dragon HP: 5
- Multiplication tables: 4, 5, 6
- Difficulty: Medium
- Dragon: medium fantasy dragon
- Recommended answer mode: `sameTable` initially
- The implementation must support switching to `nearby` without changing question-generation code.

### Level 3 - Tables 6, 7 and 8

- Dragon HP: 6
- Multiplication tables: 6, 7, 8
- Difficulty: Hard
- Dragon: large / stronger fantasy dragon
- Recommended answer mode: `nearby`

### Treasure Challenge - Tables 9 and 10

- Chest HP: 3
- Multiplication tables: 9, 10
- Present the challenge as the final lock protecting the treasure.
- Three correct hits open the chest. A miss costs a heart and does not erase hits already landed.
- The knight enters with whatever hearts remain after level 3.

Note: table 6 intentionally appears in Levels 2 and 3. This is allowed and should not be treated as a configuration error.

---

## 4. Question generation

Questions must be generated from configuration, never hardcoded individually.

Conceptual configuration:

```js
const LEVELS = [
  {
    id: 'level-1',
    name: 'La Cueva Verde',
    tables: [1, 2, 3],
    dragonHp: 4,
    playerHearts: 3,
    answerMode: 'sameTable'
  },
  {
    id: 'level-2',
    name: 'La Guarida del Dragón',
    tables: [4, 5, 6],
    dragonHp: 5,
    playerHearts: 3,
    answerMode: 'sameTable'
  },
  {
    id: 'level-3',
    name: 'La Montaña Roja',
    tables: [6, 7, 8],
    dragonHp: 6,
    playerHearts: 3,
    answerMode: 'nearby'
  },
  {
    id: 'treasure',
    name: 'El Cofre del Tesoro',
    tables: [9, 10],
    dragonHp: 3,
    playerHearts: 3,
    answerMode: 'nearby'
  }
];
```

`playerHearts` is the size of the life pool at the start of a new attempt. It is not refilled per level. `dragonHp` is the rival's life and, with 1 damage per hit, the number of correct answers required to clear that level.

For a selected table, the second operand should normally be selected from 1 through 10.

Example:

`7 x 8 = 56`

The correct answer must be calculated by code and never stored as an answer string in the level configuration.

Avoid repeating the exact same question within a single level unless the available question space makes repetition unavoidable.

---

## 5. Answer modes

The answer-generation system must be independent from question generation.

### Mode A - sameTable

The distractors should come from nearby products in the same multiplication table.

Example:

`2 x 3 = 6`

Possible answers:

`2, 4, 6, 8`

The correct answer must always be included exactly once.

The implementation should avoid duplicate options and should shuffle the final options.

### Mode B - nearby

The distractors should be nearby integer values around the correct answer.

Example:

`2 x 3 = 6`

Possible answers:

`4, 5, 6, 7`

The implementation must guarantee:

- exactly one correct answer;
- no duplicate options;
- integer answers only;
- configurable deviation.

Conceptual configuration:

```js
answerMode: {
  type: 'nearby',
  deviation: 2
}
```

The final option count should be configurable, with 4 as the initial default.

---

## 6. Combat system

The player character has hearts. The rival has HP.

Rules:

- A new attempt starts with 3 hearts. That value is the maximum shown on the HUD.
- Rival HP by level: level 1 = 4, level 2 = 5, level 3 = 6, treasure = 3.
- Every correct answer deals exactly 1 damage.
- Every incorrect answer removes exactly 1 player heart.
- The level is cleared at the moment rival HP reaches 0. The next level starts immediately after that feedback.
- The attempt ends at the moment player hearts reach 0.
- Hearts lost in a level carry into the next level, including the treasure challenge. Clearing a level does not heal the knight.
- Retry after defeat, the title screen, and "play again" after victory start a new attempt at full hearts.
- Question generation must cover every configured table on a flawless clear, so rival HP is at least the number of tables in that level.

This should be configuration-driven so the values can be changed later.

Conceptual state:

```js
const combatState = {
  playerHearts: 3,
  playerHeartsMax: 3,
  dragonHp: 4,
  dragonHpMax: 4,
  status: 'playing'
};
```

Do not couple combat logic directly to DOM elements or drawing code.

---

## 7. Feedback and game feel

Correct answers must have immediate visual feedback.

Recommended sequence:

1. Disable answer buttons briefly.
2. Highlight selected correct answer.
3. Knight attack animation.
4. Sword slash / impact effect.
5. Dragon hit reaction.
6. Dragon HP decreases.
7. A short synthesized hit cue.
8. Move to the next question, or, if that hit drops the opponent to 0, play the defeat animation first.

Incorrect answers:

1. Disable answer buttons briefly.
2. Highlight selected incorrect answer.
3. Dragon attack animation.
4. Knight hit reaction.
5. Remove one heart.
6. Show a short corrective message.
7. Move to the next question if the player still has hearts.
8. If that hit removes the last heart, play the defeat animation, then show the game-over screen.

### Defeat animation

When a fighter reaches 0 — the dragon's HP, or the knight's last heart — the attempt's fight beat is not over yet. The success or game-over message waits until the defeat animation has played.

The animation stays appropriate for children. No gore, realistic injury, horror, or a frightening dragon.

After the impact, the defeated fighter fades. A white, transparent copy of their shape rises, with small wings and a halo. The message appears once that spirit has settled. Reduced motion shortens the beat and skips extra shake.

The treasure chest opens on the final correct answer. A golden sword rises out of it, and the victory message follows that beat.

Sound cues are short tones synthesized in the browser: a hit, a miss, the spirit rising, a trumpet fanfare after the dragon's spirit cue, a descending comic sting when the knight's spirit appears, and the sword. There are no sampled recordings.

The game should use lightweight "juice": hit flash, small particles, shake, squash/stretch or scale changes, and short easing-based transitions where appropriate.

Avoid excessive screen shake or effects that make the multiplication question difficult to read.

---

## 8. Visual direction

The game should look like a polished children's 2D fantasy adventure.

Desired characteristics:

- friendly fantasy
- colorful but not visually noisy
- readable characters
- expressive child knight
- expressive dragons
- dungeon environment
- treasure/adventure atmosphere
- strong silhouettes
- clear visual hierarchy
- playful combat without gore
- obvious distinction between correct and incorrect actions

The knight is a child hero wearing fantasy armor and carrying a sword.

The dragons should feel like opponents but remain appropriate for children. No gore, realistic injury, horror, or frightening imagery.

The visual style must be consistent across:

- knight
- dragons
- dungeon backgrounds
- buttons
- hearts
- treasure chest
- particles
- attack effects
- victory screen

Before producing a full asset family, establish one approved visual target for the knight and one representative dragon.

---

## 9. UI layout

The game should prioritize the playfield.

Suggested desktop composition:

```text
+------------------------------------------------+
| Level / Progress              Hearts           |
|                                                |
|                  DRAGON                        |
|                                                |
|                                                |
|             KNIGHT                             |
|                                                |
|             7 x 8 = ?                          |
|                                                |
|       [ 54 ] [ 55 ] [ 56 ] [ 57 ]             |
|                                                |
+------------------------------------------------+
```

The question and answer controls must remain highly readable.

Use CSS variables for the visual theme.

The UI must be responsive enough to work on desktop and mobile screens.

Do not let decorative UI cover the question or characters.

---

## 10. Screen states

The initial implementation should support these states:

- `title`
- `levelIntro`
- `playing`
- `correctFeedback`
- `incorrectFeedback`
- `levelComplete`
- `gameOver`
- `treasureChallenge`
- `victory`

State transitions should be explicit rather than inferred from scattered DOM conditions.

---

## 11. Suggested project architecture

```text
index.html
css/
  game.css
  animations.css
js/
  game.js
  game-state.js
  levels.js
  questions.js
  answers.js
  combat.js
  renderer.js
  ui.js
  animations.js
assets/
  knight/
  dragons/
  backgrounds/
  effects/
  ui/
docs/
  GAME_SPEC.md
  ART_DIRECTION.md
  ASSET_MANIFEST.json
```

The exact structure can be adjusted if the implementation demonstrates a simpler and equally maintainable organization.

Principles:

- separate state from rendering;
- separate question generation from answer generation;
- separate combat from presentation;
- avoid global mutable state where practical;
- avoid duplicated level logic;
- prefer small pure functions for question/answer generation;
- do not introduce a build system unless necessary.

---

## 12. Assets

Use generated or sourced assets only when they improve the game materially.

For initial development, placeholders are acceptable.

Every production asset should have provenance recorded in an asset manifest:

- asset id
- role
- path
- dimensions
- transparency
- animation frames if applicable
- source/tool
- license or generation note
- approval status

Do not use copyrighted characters or branded game assets.

---

## 13. Accessibility and child usability

The game is intended for children.

Requirements:

- large answer buttons;
- readable typography;
- strong contrast;
- no color-only indication of correctness;
- keyboard support where practical;
- touch-friendly controls;
- clear feedback after each answer;
- avoid excessive flashing;
- do not punish the player with confusing transitions.

---

## 14. Development rules for the AI agent

Before modifying the project, inspect the existing code and preserve working behavior.

Do not perform large rewrites unless required.

Do not introduce frameworks or libraries without explicit approval.

When implementing visual changes:

1. explain the intended visual change briefly;
2. implement it;
3. run the game;
4. inspect the result in a browser;
5. fix obvious visual/layout problems;
6. keep gameplay logic unchanged unless required.

When implementing gameplay changes:

1. keep configuration separate from engine logic;
2. add or update deterministic tests where practical;
3. verify question and answer generation;
4. verify combat state transitions;
5. verify the browser behavior.

Do not use an autonomous agent to make architectural or asset-license decisions without review.

---

## 15. Definition of done for v0.1

The first playable version is complete when:

- [ ] Title screen works.
- [ ] Level 1 dragon has 4 HP and uses tables 1-3. The level ends when that HP reaches 0.
- [ ] Level 2 dragon has 5 HP and uses tables 4-6.
- [ ] Level 3 dragon has 6 HP and uses tables 6-8.
- [ ] Treasure chest has 3 HP and uses tables 9-10.
- [ ] Hearts carry from one level to the next and refill only on a new attempt.
- [ ] Both answer-generation modes work.
- [ ] Correct answers damage the dragon.
- [ ] Incorrect answers cause the dragon to attack.
- [ ] Player hearts decrease after incorrect answers.
- [ ] Level completion works.
- [ ] Treasure unlock works after the final challenge.
- [ ] Game-over state works.
- [ ] Visual feedback exists for correct/incorrect answers.
- [ ] Knight and dragon have basic attack/hit animations.
- [ ] The game is usable on desktop and mobile-sized viewports.
- [ ] No external framework is required.
- [ ] Visual assets are stylistically coherent.

---

## 16. Recommended implementation order

Do not build everything at once.

### Phase 1 - Vertical slice

Build one complete fight:

- one knight
- one dragon
- one dungeon background
- questions until the dragon falls or the knight runs out of hearts
- multiple choice
- hearts
- dragon HP
- correct attack
- incorrect attack
- win/lose state

### Phase 2 - Configuration

Extract level configuration and answer modes.

### Phase 3 - Remaining levels

Add Level 2, Level 3, and Treasure Challenge without duplicating game logic.

### Phase 4 - Visual polish

Improve assets, animations, particles, transitions, typography, and UI.

### Phase 5 - Validation

Test question generation, answer generation, state transitions, responsive layout, and complete playthroughs.

---

## 17. Skills used by this project

The project intentionally uses a small skill set.

### External skills to install

1. `create-game-assets`
   - Source: `gamedev-skills/awesome-gamedev-agent-skills`
   - Purpose: art direction, coherent asset families, asset manifest, provenance, visual QA.

2. `game-ui-ux`
   - Source: `gamedev-skills/awesome-gamedev-agent-skills`
   - Purpose: responsive HUD, UI architecture, safe areas, resolution scaling, state-driven UI.

3. `game-feel`
   - Source: `gamedev-skills/awesome-gamedev-agent-skills`
   - Purpose: hit feedback, animation timing, screen shake, easing, squash/stretch and combat juice.

4. `puzzle`
   - Source: `gamedev-skills/awesome-gamedev-agent-skills`
   - Purpose: puzzle/gameplay structure. Use only if the skill's actual scope proves useful after installation.

### Custom skill to create for this project

`html-canvas-game`

Reason: the external collection currently routes web-engine-specific work to Phaser, PixiJS, and Three.js, while this project intentionally uses vanilla HTML/CSS/JavaScript + Canvas. A small local skill should therefore define the project's preferred architecture instead of introducing a framework solely to satisfy an agent router.

The custom skill is provided at:

`.cursor/skills/html-canvas-game/SKILL.md`

This skill should govern:

- vanilla HTML/CSS/JS architecture;
- Canvas rendering;
- requestAnimationFrame game loop;
- explicit game states;
- separation of game state, rendering, UI and input;
- lightweight animation/tween patterns;
- DOM/CSS for text-heavy UI;
- responsive browser behavior;
- no framework introduction without explicit approval.

### Optional external skill

`game-ui-frontend` from OpenAI's `game-studio` plugin is a useful additional reference for browser-game UI. It can be used if available in the user's agent environment, but it is not required for v0.1 because `game-ui-ux` plus the custom skill are sufficient.

---

## 18. Cursor operating rule

When a request concerns game implementation, first inspect this specification and the relevant skill(s).

Do not load or apply every available game-development skill. Use the minimum skills necessary for the current task.

For visual work, use:

`create-game-assets` + `game-ui-ux` + `game-feel` + `html-canvas-game`

For gameplay/question work, use:

`html-canvas-game` + relevant puzzle/gameplay guidance

For generic HTML/CSS changes, use the project rules without adding unnecessary game-engine abstractions.
