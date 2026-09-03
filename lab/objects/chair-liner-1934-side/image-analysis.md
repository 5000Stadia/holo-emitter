# Image analysis — chair-liner-1934-side (reference.png, 1254x1254, flat RGB 128 ground)

## L1 identification
Work type: side chair (armless dining/writing chair). Classification: furnishing. primaryDomain: object. Confidence 0.98.

## L2 form & silhouette
Bounding volume: cuboid ~0.46 w x 0.50 d x 0.88 h (declared). Bilateral symmetry about the sagittal plane. Geometric shape language with one lofted curve (the back). Footprint: four legs at the corners of a ~0.44 x 0.46 rectangle, rear legs slightly inboard.
Primitives: back = lofted/bent panel (thin extruded profile, concave toward the sitter, top edge rolled back); seat = rounded-corner cuboid slab with a shallow crown; seat rails = thin cuboids under the seat on all four sides; legs = tapered square-section prisms (frustums), front pair vertical, rear pair raked back ~8 deg and continuing up as the back stiles; ferrules = short cylinders at each foot.

## L3 macro → meso → micro
- macro: back panel; seat (upholstered pad + veneered frame); leg assembly.
- meso: back panel (one curved veneer shell), rear stiles (two, continuous with rear legs), front legs (two), seat rails (apron, four), seat pad (one).
- micro: chrome ferrules (four, ~2.5 cm tall), veneer edge lipping around the seat frame (~1.5 cm band), the reveal gap between back panel bottom edge and seat pad (~4 cm open slot), rolled top edge of the back.

## L4 spatial relationships
<back panel, attached-to, rear stiles> contact: overlap (panel wraps the stile faces). <rear stiles, continuous-with, rear legs> butt/one piece. <seat frame, attached-to, legs> socket (legs enter frame corners). <seat pad, sits-on, seat frame> overlap, flush with the frame's top edge. <ferrule, caps, leg foot> socket. Back panel bottom edge floats ~4 cm above the seat pad (open gap), stiles carry it.

## L5 materials (PBR)
- sycamore veneer (back panel outer+inner faces, seat frame lipping): albedo warm pale tan, metalness 0, roughness ~0.35 (satin lacquer), fine figured grain (bird's-eye/mottle) as a low-contrast albedo variation, no relief.
- macassar ebony (legs, stiles, rails): albedo very dark brown with warm reddish-brown streaks, metalness 0, roughness ~0.3, strong linear grain along the leg axis.
- wool upholstery (seat pad): albedo deep blue, mid-low value, metalness 0, roughness ~0.9, fine woven micro-texture, no specular.
- chrome (ferrules): metalness 1, roughness ~0.15, albedo neutral silver.

## L6 colour & finish
sycamore: hue ~35 deg (orange-tan), value high, saturation medium; satin gloss. ebony: hue ~15, value very low, saturation medium-low; satin. wool: hue ~225, value low-mid, saturation medium-high; matte. chrome: neutral, metallic.

## L7 identity-defining features
1 lofted concave back with rolled top edge; 2 open slot between back and seat; 3 tapered ebony legs with rear rake; 4 chrome ferrules; 5 pale veneer lipping band around a blue pad; 6 figured (bird's-eye) grain on the back.

## L8 uncertainty
Hidden: rear face of the back panel (inferred veneered, same as front); underside of seat; the exact rear leg rake (estimated). Occluded: far rear leg foot partially. Uncertain: whether the back panel is one shell or panel-on-frame (treated as one shell). No decals, no text, no patterned surface → procedural materials suffice; projection route not needed.
