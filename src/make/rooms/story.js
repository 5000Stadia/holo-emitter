// Room types for places a story establishes (R49), read by the same house builder as the manor's. The text
// leaves their finish open; until a look of their own is authored they wear the c.1660 look's (Tenniel's plates
// show the hall panelled, with a curtain). Nothing is furnished beyond what the story requires (fullness 0).
export const STORY_ROOM_TYPES = {
  // "a long, low hall, which was lit up by a row of lamps hanging from the roof"; "that dark hall"
  story_hall: { fullness: 0, also: [], floor: "flags", walls: "wainscot", ceiling: "beams", hearth: "none", windows: "none", light: ["lamps"], anchor: [],
    why: "Alice, ch. I: panelling and flags chosen (open in the text; Tenniel draws panelling)" },
  // "a small passage, not much larger than a rat-hole"
  rat_hole: { fullness: 0, also: [], floor: "flags", walls: "stone", ceiling: "plaster", hearth: "none", windows: "none", light: [], anchor: [],
    why: "Alice, ch. I: a bare stone passage, chosen" },
};
