/** Campaign location data is separate from combat state and renderer ownership. */
export const CAMPAIGN_LOCATIONS = [
  {id: "backyard", label: "Backyard", name: "Gravewick Backyard", floor: ["#1f3a2c", "#10241c"]},
  {id: "crypts", label: "Crypts", name: "Cemetery Crypts", floor: ["#2a2840", "#15132a"]},
  {id: "citadel", label: "Citadel", name: "Underworld Citadel", floor: ["#3a1218", "#1b0509"]},
] as const;
