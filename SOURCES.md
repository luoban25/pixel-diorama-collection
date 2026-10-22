# Pixel scene collection: cricket, fishing, Western railway and street basketball

The delivered `index.html` is a self-contained scene switcher. Cricket, the fishing pond, the Western railway and street basketball are separate preserved projects, embedded as independent renderers. Only the active project animates. The only visible interface is the four scene buttons at the bottom. All geometry, textures and shader logic run locally, with no CDN requests.

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

- `index.html`: minimal three-scene gallery; open directly in a modern browser, including offline.
- `projects/cricket/src/`: independent cricket source, restored from the saved pixel cricket project.
- `projects/pond/src/`: independent fishing pond source.
- `projects/western/src/`: independently authored Western railway scene based on the user's supplied desert railway image. Train, articulated horses/riders, trestle, layered red rock, stone arch, cacti, wind pump and water tank are procedural Three.js geometry. All textures are local Canvas textures; no downloaded models or image-generation assets are required.
- `projects/western/src/landscape.js`, `riders.js`: expanded landscape and separate articulated rider construction. The 31 × 25 plateau, joined buttes, frontal low cliffs, broad trestle gorge and camera-facing stone arch follow the supplied image's composition. Six enlarged horses face screen-right on a shallow upward diagonal; their heading also determines each dust trail. Steam is offset toward the camera so it clears the central riders.
- `scenes/western/index.html`: self-contained Western railway delivery.
- `scenes/cricket/index.html`, `scenes/pond/index.html`: independent clean render pages.
- `src/gallery.html`, `src/scene-shell.html`: minimal gallery and renderer templates.

## Street basketball

The fourth scene follows the user-supplied image of a weathered blue neighborhood basketball court. It contains two hoops with woven nets, six articulated athletes, four bystanders, two bouncing basketballs, a corner shop, vending machines, bicycle, mature tree, chain-link fencing and utility poles. Geometry and texture canvases are authored locally; the reference image is not embedded.

The perimeter uses thousands of separate opaque ground flecks, with density falling toward open white space. Grass, grit and missing paving tiles interrupt the outline; there is no raised rectangular slab or opaque image plane behind the edge. Tree foliage has small leaf clusters and visible gaps. All figure movement and ball motion repeat on a shared 12-second loop; inactive scenes stop rendering.
