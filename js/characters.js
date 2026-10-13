/**
 * The two knights share one drawing.
 * Hair, armor and scale are the only differences.
 */
export const CHARACTERS = [
  {
    id: "leo",
    name: "LEO",
    ages: "7-8 años",
    hair: "#8a5a32",
    armor: "#3e8f4a",
    armorLight: "#8fd18a",
    scale: 1.14,
  },
  {
    id: "gael",
    name: "GAEL",
    ages: "3-4 años",
    hair: "#3a241c",
    armor: "#e2b43a",
    armorLight: "#f6de8a",
    scale: 0.8,
  },
];

export function getCharacter(id) {
  const character = CHARACTERS.find((item) => item.id === id);
  if (!character) {
    throw new Error(`Unknown character: ${id}`);
  }
  return character;
}
