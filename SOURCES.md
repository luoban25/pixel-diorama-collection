# Pixel scene collection: cricket, fishing, Western railway, street basketball and three-level scene building

The delivered `index.html` is a self-contained scene switcher. Cricket, the fishing pond, the Western railway, street basketball and the three-level scene building are separate projects, embedded as independent renderers. Only the active project animates. The gallery has five scene buttons at the bottom. All geometry, textures and shader logic run locally, with no CDN requests. The scene building has its own compact overview, floor, structure and construction controls.

## Visual direction

- User reference: https://x.com/nays1_/status/2112661743549780094
- Reference thumbnail visually inspected: https://pbs.twimg.com/amplify_video_thumb/2112661633294036992/img/-hiNtyZ91K7LSOLO.jpg
- The reference's pixel silhouettes, weathered miniature surfaces, open olive foliage and long directional shadows informed the rendering style. The current fishing pond follows the user's subsequently attached image: one shared shoreline, transparent water, planar tree/figure reflections, a timber pier with two seated anglers, reeds, stones, a path, bench, fences and a roofed notice board. The fixed camera, lighting, page layout and animation controls are retained.

## Integrated code

- **Three.js r180 — MIT license**, including the official `RenderPixelatedPass`, `SSAOPass`, `EffectComposer` and `OutputPass`. The Three.js license is embedded in `index.html`.
  - Source: https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/RenderPixelatedPass.js
  - License: https://github.com/mrdoob/three.js/blob/r180/LICENSE
  - Local adaptation: preserve alpha when outlining; render at a low native resolution; nearest-neighbor canvas enlargement. A locally authored 64-color palette and static Bayer threshold complete the final appearance.

## Researched references

- **WoodNeck/three-pixelate-showcase — MIT**: low-resolution rendering, palette reduction, depth outlines, ordered dithering. Used as a technique reference; its source files were not copied into this project.
  - https://github.com/WoodNeck/three-pixelate-showcase
  - https://github.com/WoodNeck/three-pixelate-showcase/blob/master/LICENSE
- **mesmotronic/three-retropass — BSD-2-Clause**: palette quantization and dithering reference; not integrated.
  - https://github.com/mesmotronic/three-retropass
- **Hugging Face: nerijs/pixel-art-xl — CreativeML Open RAIL-M**: researched as an image-generation alternative. The model card describes nearest-neighbor downsampling and isometric suitability. It was not downloaded or run; animated 3D geometry is rendered directly instead.
  - https://huggingface.co/nerijs/pixel-art-xl

## Files

- `index.html`: five-scene gallery; open directly in a modern browser, including offline.
- `projects/cricket/src/`: independent cricket source, restored from the saved pixel cricket project.
- `projects/pond/src/`: independent fishing pond source.
- `projects/western/src/`: independently authored Western railway scene based on the user's supplied desert railway image. Train, articulated horses/riders, trestle, layered red rock, stone arch, cacti, wind pump and water tank are procedural Three.js geometry. All textures are local Canvas textures; no downloaded models or image-generation assets are required.
- `projects/western/src/landscape.js`, `riders.js`: expanded landscape and separate articulated rider construction. The 31 × 25 plateau, joined buttes, frontal low cliffs, broad trestle gorge and camera-facing stone arch follow the supplied image's composition. Six enlarged horses face screen-right on a shallow upward diagonal; their heading also determines each dust trail. Steam is offset toward the camera so it clears the central riders.
- `versions/western-before-grand/`: preserved Western delivery before this composition revision.
- `scenes/western/index.html`, `western-train.zip`: self-contained Western railway delivery.
- `versions/before-western/`: gallery snapshot and hashes verifying the cricket and autumn pond sources and standalone pages are preserved.
- `scenes/cricket/index.html`, `scenes/pond/index.html`: independent clean render pages.
- `versions/pixel-cricket/index.html`, `versions/fishing-pond/index.html`, `versions/original-cricket/index.html`: full historical versions, preserved independently of gallery builds.
- `backups/soft-3d/index.html`: preserved previous smooth-shaded version.
- `backups/pixel-cricket/index.html`: preserved previous pixel cricket scene.
- `src/gallery.html`, `src/scene-shell.html`: minimal gallery and renderer templates. Existing `src/main.js` and `src/pond.js` remain saved legacy pond sources.
- `previews/gallery-qa.json`: offline scene switching, inactive-renderer pause, mobile layout and source preservation checks.

## Street basketball

The fourth scene follows the user-supplied image of a weathered blue neighborhood basketball court. It contains two hoops with woven nets, six articulated athletes, four bystanders, two active basketballs, a corner shop, vending machines, bicycle, mature tree, chain-link fencing and utility poles. Geometry and texture canvases are authored locally; the reference image is not embedded.

The perimeter uses clusters of camera-facing X marks, each built from five square cells on a 3×3 pixel grid, forming a stepped X silhouette. Deep olive, grass-green and yellow-green marks overlap in irregular groups and become sparse toward open white space. Loose square fragments are removed from the outer fringe; inner paving and vegetation remain unchanged. A separate random seed preserves all existing court, shop, tree and figure details. Tree foliage has small leaf clusters and visible gaps. All figure movement and ball motion repeat on a shared 12-second loop; inactive scenes stop rendering.

The six athletes have different jersey colors, short colors, shoes and trim; four bystanders have separate casual outfits. `outfits.js` supplies the wardrobe and joint-attached garment details. `play.js` defines continuous world-space dribbles, gravity-driven shots, net passage, catches and bounce passes. `actions.js` synchronizes articulated hands, knee bends, jumps, receiver runs and defensive shuffles with two six-second practice possessions, offset by three seconds. The shared twelve-second clock remains seamless. The camera, scenery, lighting, navigation and pixel-X fringe are preserved. `previews/basketball-actions-qa.json` records actual figure/ball transform checks for both hoop crossings, shot hand contacts, movement, ball height and phase boundaries.

The character clipping correction restores collar dimensions, keeps raised balls ahead of the face, points the elbows outward, and lowers catches in each receiver's local frame so turns do not pull the ball through the torso. Seated hips clear the planks and their shoes clear both the ground and fence. `basketball-clipping-qa.cjs` samples real arm and ball mesh vertices over the complete loop, validates collar depth and seated clearances, and writes `previews/basketball-clipping-qa.json`. Normal sleeve seams at the shoulder are reported separately from body penetration.

## Three-level scene building

The lived-in rooftop follows the user's subsequently attached rooftop reference. `projects/tower/src/rooftop.js` adds weathered plaster, mixed paving, a terrace-facing iron door, chain-link perimeter with an entrance aligned to the existing stairs, a tank and exposed ladder, outdoor AC, folding wooden furniture, two laundry lines, planted beds, pots, trailing vines and a small ginger-and-white cat. The reference is not embedded; geometry and additional texture canvases are authored locally. Laundry movement, cat idle motion and the fan share the existing 12-second loop. `?scene=tower&floor=roof` opens the higher orthographic rooftop view; the original floor views and four standalone projects remain unchanged. The previous equipment roof is preserved in the local workspace's `versions/tower-before-rooftop-terrace/`.

The user requested one existing scene per floor and then excluded the desert. The building therefore has three occupied floors: full street basketball, the autumn fishing pond and cricket, from bottom to top. The revised architecture has 0.76-square stone columns, 0.70-deep beams, 0.64-thick stone floor frames, six red exterior stair flights and an equipment roof. Three side walls have real door openings, with an iron door at each scene level and a fourth at the roof. Blue and red utility risers connect roof equipment to open lower outlets and drain grilles. Organic masked moss follows ledges, column feet and damp areas. Generic rooms from the earlier 24-floor proposal are removed. The original four independent projects and pages remain byte-identical; Western is excluded from the building, not erased from its independent project.

The tower's stone uses **Rock 04 by Rob Tuytel, Poly Haven, CC0**: https://polyhaven.com/a/rock_04 and https://polyhaven.com/license. Its 1K color, bump and roughness JPEG maps are stored in `projects/tower/assets/`, with original URLs and verified MD5 hashes in `stone-source.json`. All three maps are embedded in the built HTML. World-scale UVs prevent stretching on columns and beams. Other architectural texture canvases are authored locally. Each source terrain fits the same 11.90 × 9.044 floor opening at its original uniform aspect ratio; the floor ring has a recessed interior so pond water remains unobstructed. The previous thinner tower is preserved in `versions/tower-before-stone-frame/`.

The building embeds actual source geometry and animation, not screenshots. Basketball includes its original shop, tree, vending machines, pixel-X perimeter, six athletes and four bystanders. The pond retains its shoreline, autumn foliage, two anglers, nine fish, ripples and planar water reflection. Cricket retains its platform, striped grass, pitch, wickets, furniture, twelve articulated players and ball delivery. Each project evaluates its original local animation before applying its fitted scale and floor transform. Independent material caches preserve project textures; reflection cameras and fishing lines are transformed consistently.

The building's structural shell, imported scenes and exterior decoration are independent visibility groups. Structure mode hides the actual scene geometry. A continuous assembly progress reveals structural modules, then the original scene, then balcony decoration. Native sliders and buttons provide pause, floor selection, progress scrubbing and reduced-motion operation. Static geometry is merged per visibility group, moving parts are instanced, and transparent water, fishing lines and ripples retain their own live materials. Inactive scenes stop their animation loop.

`projects/tower/README.md` describes the architectural hierarchy, stage timing, source reuse and editing points. `scenes/tower/index.html` is the standalone self-contained delivery. `tower-projects-qa.cjs` records offline loading, 17 old-file hashes, all three original animation loops, 435 scene/floor boundary checks, structural visibility, construction stages, pause/resume and responsive controls in `previews/tower-qa.json`. The earlier tower version is saved in `versions/tower-before-original-scenes/`. The published GitHub checkout is separate from this local addition.
