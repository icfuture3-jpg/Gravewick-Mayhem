// Shared by Meet the Heroes, the Grimoire and the combat HUD.
export const HERO_ABILITIES = [
  {
    name: "Grimble", role: "The Master", color: "#a283e8",
    blurb: "Mysterious mentor. His golden lantern reveals hidden things and opens portals.",
    primaryName: "Lantern Sweep", primaryHint: "Sweep foes and reveal nearby hidden supplies.",
    skillName: "Lantern Portal", skillHint: "Teleport toward your aim (up to 260px); the exit pulls enemies in.", skillCd: 9,
    ultName: "Hidden Light", ultHint: "Reveal every hidden supply and strike all enemies with lantern light.",
  },
  {
    name: "Pip", role: "The Mischief Maker", color: "#c4d443",
    blurb: "Hyperactive apprentice with a pouch of unpredictable gadgets. Can shrink tiny.",
    primaryName: "Ham Whack", primaryHint: "A heavy close-range whack.",
    skillName: "Gadget Pouch", skillHint: "Throw a random bouncing gadget: dynamite, frost or a shock bomb.", skillCd: 5,
    ultName: "Tiny Trouble", ultHint: "Shrink for 6 seconds: move 50% faster with a smaller hitbox and half damage taken.",
  },
  {
    name: "Wisp", role: "The Clever Apprentice", color: "#ff6fe0",
    blurb: "Brainy and brave. Turns invisible, makes illusions, and her spellbook floats along.",
    primaryName: "Spellbook Bolt", primaryHint: "Your floating spellbook fires fast magic bolts.",
    skillName: "Invisible Veil", skillHint: "Vanish for 5 seconds so enemies lose you. Attacking ends the veil; existing hazards still hurt.", skillCd: 11,
    ultName: "Mirror Illusions", ultHint: "Create two decoys for 6 seconds. They draw enemy attacks and fire magic bolts.",
  },
] as const;

export const GADGETS = [
  { name: "Dynamite", color: "#ff9a3a", damage: 55, freeze: 0, knock: 520 },
  { name: "Frost", color: "#9fe3ff", damage: 25, freeze: 3, knock: 0 },
  { name: "Shock", color: "#ffd36a", damage: 35, freeze: 0, knock: 850 },
] as const;
