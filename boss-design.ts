export const BOSS_DESIGNS = [
 {kind:"boogeyman",name:"The Boogeyman",color:"#a5db65",entrance:"The alley ambush",turn:"The nightmare closes in",defeat:"Daybreak in the alley",hint:"Dodge the snot fan; clear his clown ambushes. Below half health the fan widens.",
  intro:"The Boogeyman climbs out of the alley fog, spreading a fan of slime as two clowns block the street.",counter:"His slime fan widens! Grimble lights an escape route while Pip drives the clowns back.",ending:"The heroes scatter the clowns and drive the Boogeyman into the dawn. The street is free."},
 {kind:"nergal",name:"Lord Nergal",color:"#cf8dff",entrance:"The crypt sovereign",turn:"The crown's second command",defeat:"The broken crown",hint:"Thread the orb ring, then dash clear of the sweeping arc. Below half health the ring reverses.",
  intro:"Lord Nergal rises above the crypt dais. A ring of orbs guards his throne and his staff traces a sweeping arc.",counter:"Nergal reverses his orb ring and sweeps faster! Wisp opens a gap in the royal guard.",ending:"Pip cracks the staff as Wisp unravels the orb crown. Nergal's throne goes dark."},
 {kind:"meteor",name:"Brain Meteor",color:"#ff9e76",entrance:"Mind over the citadel",turn:"Twin impact protocol",defeat:"The final signal",hint:"Leave the marked impact circles; destroy the slime pods. Below half health paired impacts land together.",
  intro:"Brain Meteor anchors over the citadel. Its mind paints impact circles on the ground while slime pods spill out.",counter:"Two impact marks at once! The trio splits around the paired strikes and closes on the exposed brain.",ending:"Golden light breaks the brain's signal. Its pods fall silent and the citadel portal seals."},
] as const;
export function bossPattern(stage:number,healthFraction:number) {
 const enraged=healthFraction<=0.5;
 return {enraged,fan:enraged?7:5,fanInterval:enraged?1.9:2.4,
   orbs:enraged?12:10,orbDirection:enraged?-1:1,orbInterval:enraged?2.8:3.6,
   impacts:enraged?2:1,impactInterval:enraged?2.6:2.1,kind:BOSS_DESIGNS[stage]!.kind};
}
