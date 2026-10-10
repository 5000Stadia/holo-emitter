# People from place: prior art (2026-10-10)

Kabe, 2026-10-10: "I just want a computationally smart npc builder maybe with good mix and match face details you can
reuse like a digital mr potato man"; the painted busts are "kinda 2d weird right now and the faces are pretty jank";
"Bonus points if we do bodies too. Our biggest gap is npcs - think the london street again or hell any future populated
place. Can we apply the locational variety that we have to npcs in a smart way?"; and "babys vs kids vs teens vs adults
vs elderly"; and "Future dystopian old man warrior vs past young princess child sort of ranges".
My reading: the painted busts of R57 (src/make/sitter.js) are judged not good enough; he wants 3D people, heads and
bodies, built from reusable parts, generated from the place the way our rooms and street lots are (looks.js,
influence.js), across every age, in crowds, and across settings: the same builder dresses a far-future old soldier or a 1660 child princess, so the body and the wardrobe are separate (a wardrobe per era or genre, as looks.js is a set of materials per era). Nothing is on the roadmap for it yet; placing it is his call.
Two read-only passes (opus helpers), every claim linked in their reports; condensed here.

## Bodies and heads: what to build on

| Source | Licence | Gives | Fit |
|---|---|---|---|
| [MakeHuman / MPFB2](https://github.com/makehumancommunity/mpfb2) | code GPL/AGPL; base mesh, targets, proxies **CC0** since 2020 ([licence](https://static.makehumancommunity.org/about/license.html)) | body and face sliders; age 1–90 in one control (baby/child/young/old blends at 1, 10, 25, 90: [human.py](https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/apps/human.py)); GameEngine rig; 22 + 15 visemes and 54 ARKit face units (2.0.15, 2026-05); proxies down to 741 vertices; clothes fitted to body vertices, so they follow any shape | **pick**: the only clean stack of sliders + every age + rig + mouth shapes. Baked in Blender to glTF (shape keys surviving export: unverified) |
| [Naver Anny](https://github.com/naver/anny) | Apache-2.0 code, CC0 data; its optional smplx topology is non-commercial (trap) | the same MakeHuman data from a script: age infant→elder (WHO growth curves), 1,229-vertex coarse mesh, 104/163-bone rig; no clothes or hair | headless bake source (PyTorch) |
| [CharMorph](https://github.com/Upliner/CharMorph) | GPL code; Vitruvian base CC0, others CC-BY/AGPL | hair, fitting, face rig | second look only |
| MakeHuman community packs ([list](https://static.makehumancommunity.org/assets/assetpacks.html)) | mixed: Hats/Suits/Dress/Shoes/Shirts/Pants/Hair 01, beards (Bodyparts 05), Visemes CC0; Hair 02–03, Dress 02–03 etc. CC-BY | modern clothes to learn the fitting from | no 1660 dress exists anywhere; we author doublets, coifs, breeches, aprons with MakeClothes |
| [Quaternius](https://quaternius.com/license.html) | itch pages say CC0; quaternius.com now QAL v1.0 (2026-08-28): no redistribution "regardless of how much the Assets have been modified" | bodies (teen/regular only), 12 fantasy outfits, 250+ animations on one rig | **trap** for a public repo |
| Mixamo | free in games; raw files may not be redistributed (community FAQ) | animations | trap for a public repo |
| SMPL-X / STAR, MB-Lab | non-commercial / AGPL, archived | — | rejected |
| Ready Player Me | shut 2026-01-31 | — | gone |
| [UMA](https://github.com/umasteeringgroup/UMA) (Unity, MIT) | — | DNA (sliders), slots (meshes), overlays (texture layers), recipes (a person as data) | the design to copy |
| [CharacterStudio](https://github.com/M3-org/CharacterStudio) (three.js, MIT) | sample asset licences unstated | part swapping, atlasing | code reference |
| [three-vrm](https://github.com/pixiv/three-vrm) (MIT, WebGPU) | — | aa/ih/ou/ee/oh mouth set | naming pattern only; VRoid is anime |

No CC0 baby model exists beyond MakeHuman at age 1. No stoop control: a pose. Adult clothes shrink onto a child but
keep adult cut; children's dress needs its own pieces.

## Crowds: variety from place

- **Profile first, look and day from it.** Watch Dogs: Legion's Census ([GDC 2021](https://gdcvault.com/play/1027018/Census-The-Systemic-Backbone-Behind)): clothing implies job; job and income set hours and neighbourhood. That is our influence blend applied to people.
- **Fixed order, bounded retries.** RimWorld ([pawn generation](https://rimworldwiki.com/wiki/Modding_Tutorials/Pawn_Generation_Process)): faction → sex, age → head → backstory → traits → body → relations → hair → gear.
- **Weighted, tagged pools; overrides in priority order.** CK3 ([cultures](https://ck3.paradoxwikis.com/Culture_modding), [characters](https://ck3.paradoxwikis.com/Characters_modding)).
- **Few full agents, many cheap ones, swapped unseen.** AC Unity ([GDC 2015](https://gdcvault.com/play/1022141/Massive-Crowd-on-Assassin-s)): 40 AIs, 120 detailed models, 10,000 on screen.
- **What the eye checks.** McDonnell et al.: appearance clones are spotted far sooner than motion clones ([2008](https://history.siggraph.org/?p=112831)); the head and upper torso take the first and longest looks; hats, top texture and face texture work equally; face geometry least ([2009](https://www.tara.tcd.ie/items/9ffa2d7e-2a7a-4da5-8082-071b60ca0471)); size and shoulder/waist/hip proportion are the body cues seen ([2017](https://eprints.whiterose.ac.uk/113877/)); motion variety beats shape variety ([2024](https://arxiv.org/abs/2412.16151)).
- **Families.** CK3 carries a DNA from the parents ([GDC 2021](https://gdcvault.com/play/1027354/Creating-a-Portrait-System-Based); its per-gene rule unverified); Paralives reportedly takes each feature group whole from one parent (unverified); Dwarf Fortress colours are Mendelian ([wiki](https://dwarffortresswiki.org/index.php/Genetics)). No open code blends face sliders from two parents.
- **Ages.** Up to 70% of pedestrians walk in groups ([Moussaïd 2010](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2850937/)); children 6–10 about 1.1 m/s against 1.7 for men under 40 ([Fujiyama](https://discovery-pp.ucl.ac.uk/145191/1/Fujiyama_WalkingSpeed.pdf)); the old about 40% slower, leaning forward, shorter strides; families carry, split and rejoin; over-60s about 10% c. 1700 ([PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10321921/)); the 1660s under-15 share is unsourced (Wrigley and Schofield to check). KCD2 left children out (secondhand).
- **Rendering.** three.js `webgpu_skinning_instancing_individual` ([source](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_skinning_instancing_individual.html)): per-instance pose on the CPU, one compute skinning pass; won't scale to hundreds on a phone. Baked animation textures ([GPU Gems 3 ch. 2](https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch02.html)): clip and time per instance, no CPU posing. [InstancedMesh2](https://discourse.threejs.org/t/three-ez-instancedmesh2-enhanced-instancedmesh-with-frustum-culling-fast-raycasting-bvh-sorting-visibility-management-lod-skinning-and-more/69344): culling, LOD, skinning. **No phone figures anywhere**: ours to measure.

## Adopted / rejected (proposal, not yet placed)

Adopted: MakeHuman CC0 base (all ages, sliders, rig, visemes) baked offline to a few glTF bodies with morph targets;
UMA's recipe idea (a person is data: genes, slots, dyes); the Census/RimWorld pipeline fed by our influence blend;
genes inherited whole per feature group plus seeded noise; variety spent on head, hat, upper-body colour, size and
motion; a ms-arithmetic variety check at generation; tiers (full rigs near, baked-texture instances middle, cheap far).
Movement made in code (gait from age, build, load: pace, stride, stoop) rather than from a library, which also avoids
the Quaternius and Mixamo traps. Rejected: Quaternius and Mixamo files in the repo, SMPL/STAR, MB-Lab, VRoid, Ready
Player Me; buying anything.
