function buildEnvironment() {
  const group = new THREE.Group();
  group.name = 'Ground furniture and planting';
  scene.add(group);
  const trees = [];
  const flags = [];
  const bins = new Map();
  const up = new THREE.Vector3(0, 1, 0);
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const M = {
    steel: mat(0x454b42, 0.92, 0.12),
    paleSteel: mat(0x777d70, 0.87, 0.14),
    wood: mat(0x998063, 1),
    lightWood: mat(0xb3a07c, 1),
    darkWood: mat(0x6b5b49, 1),
    trunk: mat(0x65533b, 1),
    leaf: mat(0x596138, 1),
    leafLight: mat(0x7a8348, 1),
    leafDark: mat(0x3b442a, 1),
    leafDry: mat(0x8a8050, 1),
    leafShade: mat(0x4b532e, 1),
    path: mat(0xa9a38e, 1),
    cream: mat(0xdad3b9),
    blue: mat(0x58727c, 0.91),
    blueDark: mat(0x3a535f),
    white: mat(0xe4e0cf),
    dark: mat(0x2f3a34),
    terra: mat(0x8e6544),
    silver: mat(0x9b9e8e, 0.87, 0.18),
    moss: mat(0x5a6134, 1),
    mossLight: mat(0x7b7d46, 1),
    mossDark: mat(0x424c2e, 1),
    dirt: mat(0x68664c, 1),
    rust: mat(0x76513b, 1)
  };

  // Fine directional grain survives the deliberately coarse final raster.
  // Every mark is made here: timber and bark require no image files.
  function woodGrain() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = '#c2bbab'; context.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 2400; i++) {
      const light = rand() > .5;
      context.fillStyle = light ? 'rgba(255,246,218,.18)' : 'rgba(48,43,31,.15)';
      context.fillRect(rand() * 256, rand() * 128, 1 + rand() * 23, .4 + rand() * 1.1);
    }
    for (let i = 0; i < 95; i++) {
      context.fillStyle = 'rgba(44,42,31,.3)';
      context.fillRect(rand() * 256, rand() * 128, 8 + rand() * 46, .5);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }
  const timberGrain = woodGrain();
  for (const material of [M.wood, M.lightWood, M.darkWood, M.trunk]) {
    material.map = timberGrain; material.needsUpdate = true;
  }

  // Static parts share one draw call per material. This also avoids an object
  // per plank, bolt and fence post once the scene is running.
  function collect(geometry, material, position = v(0, 0, 0), rotation, scale) {
    const q = rotation instanceof THREE.Quaternion
      ? rotation : new THREE.Quaternion().setFromEuler(rotation || new THREE.Euler());
    const matrix = new THREE.Matrix4().compose(position, q, scale || v(1, 1, 1));
    const flat = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    flat.applyMatrix4(matrix);
    if (!bins.has(material)) bins.set(material, []);
    bins.get(material).push(flat);
    geometry.dispose();
  }
  function b(w, h, d, material, x, y, z, ry = 0) {
    collect(new THREE.BoxGeometry(w, h, d), material, v(x, y, z), new THREE.Euler(0, ry, 0));
  }
  function c(rt, rb, h, material, x, y, z, segments = 8) {
    collect(new THREE.CylinderGeometry(rt, rb, h, segments), material, v(x, y, z));
  }
  function rod(a, end, radius, material, segments = 6) {
    const d = end.clone().sub(a);
    collect(new THREE.CylinderGeometry(radius, radius, d.length(), segments), material,
      a.clone().add(end).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(up, d.normalize()));
  }
  function merge(parts) {
    const length = parts.reduce((n, part) => n + part.attributes.position.array.length, 0);
    const position = new Float32Array(length);
    const normal = new Float32Array(length);
    const uv = new Float32Array(length / 3 * 2);
    let offset = 0;
    for (const part of parts) {
      position.set(part.attributes.position.array, offset);
      normal.set(part.attributes.normal.array, offset);
      if (part.attributes.uv) uv.set(part.attributes.uv.array, offset / 3 * 2);
      offset += part.attributes.position.array.length;
      part.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(position, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.computeBoundingSphere();
    return g;
  }

  // A low open fence frames the field without putting mesh across its front.
  const wireVertices = [];
  const fenceHeight = 1.12;
  function fence(a, end) {
    const delta = end.clone().sub(a);
    const length = delta.length();
    const direction = delta.normalize();
    const base = groundY + 0.05;
    const at = (u, h) => a.clone().addScaledVector(direction, u).setY(base + h);
    const count = Math.ceil(length / 2.1);
    for (let i = 0; i <= count; i++) {
      const p = at(length * i / count, fenceHeight / 2);
      c(0.039, 0.047, fenceHeight + 0.14, M.steel, p.x, p.y, p.z);
      c(0.063, 0.063, 0.055, M.paleSteel, p.x, base + fenceHeight + 0.075, p.z);
      c(0.049, 0.052, .10 + rand() * .15, M.rust, p.x, base + .10 + rand() * .08, p.z, 6);
    }
    rod(at(0, fenceHeight), at(length, fenceHeight), 0.026, M.steel);
    rod(at(0, 0.08), at(length, 0.08), 0.019, M.steel);
    // Clip diagonal runs to each rectangular panel, producing tidy diamonds.
    for (const slope of [-1, 1]) {
      const min = slope === 1 ? -length : 0;
      const max = slope === 1 ? fenceHeight : length + fenceHeight;
      for (let intercept = min; intercept <= max; intercept += 0.28) {
        const points = [];
        const push = (u, h) => {
          if (u >= -0.0001 && u <= length + 0.0001 && h >= -0.0001 && h <= fenceHeight + 0.0001) {
            if (!points.some(p => Math.abs(p[0] - u) + Math.abs(p[1] - h) < 0.0001)) points.push([u, h]);
          }
        };
        push(0, intercept);
        push(length, slope * length + intercept);
        push(-intercept / slope, 0);
        push((fenceHeight - intercept) / slope, fenceHeight);
        if (points.length >= 2) {
          const p = at(points[0][0], points[0][1]);
          const q = at(points[1][0], points[1][1]);
          wireVertices.push(p.x, p.y, p.z, q.x, q.y, q.z);
        }
      }
    }
  }
  fence(v(-11.6, 0, -8.55), v(11.6, 0, -8.55));
  fence(v(-11.6, 0, -8.55), v(-11.6, 0, 6.65));
  fence(v(11.6, 0, -8.55), v(11.6, 0, 6.65));
  const wireGeometry = new THREE.BufferGeometry();
  wireGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wireVertices, 3));
  const wireMesh = new THREE.LineSegments(wireGeometry,
    new THREE.LineBasicMaterial({ color: 0x4c5348, transparent: true, opacity: 0.5, depthWrite: false }));
  wireMesh.name = 'Fine diamond chain-link mesh';
  group.add(wireMesh);

  // Three tiers of warm timber bleachers with individual planks, feet and braces.
  b(6.0, 0.035, 3.0, M.path, 7.6, groundY + 0.018, -6.65);
  for (let tier = 0; tier < 3; tier++) {
    const z = -5.62 - tier * 0.85;
    const y = groundY + 0.43 + tier * 0.4;
    for (let plank = 0; plank < 3; plank++) {
      b(5.35, 0.105, 0.18, plank === 1 ? M.lightWood : M.wood, 7.6, y, z + (plank - 1) * 0.205);
      for (let wear = 0; wear < 7; wear++) {
        b(.11 + rand() * .55, .004, .007 + rand() * .015,
          wear % 3 ? M.darkWood : M.lightWood,
          5.1 + rand() * 4.9, y + .055, z + (plank - 1) * .205 + (rand() - .5) * .14,
          (rand() - .5) * .04);
      }
    }
    // Narrow foot boards make the rising rows read as usable grandstand steps.
    if (tier < 2) b(5.35, 0.085, 0.23, M.darkWood, 7.6, y - 0.21, z + 0.5);
    for (const x of [5.25, 7.6, 9.95]) {
      b(0.105, y - groundY - 0.04, 0.1, M.steel, x, (groundY + y) / 2 - 0.04, z);
      b(0.29, 0.055, 0.33, M.steel, x, groundY + 0.065, z);
      for (const offset of [-0.2, 0.2]) c(0.026, 0.026, 0.012, M.darkWood, x, y + 0.061, z + offset, 6);
    }
  }
  for (const x of [5.25, 7.6, 9.95]) {
    rod(v(x, groundY + 0.19, -5.38), v(x, groundY + 1.48, -7.57), 0.046, M.steel);
    b(0.075, 1.2, 0.075, M.steel, x, groundY + 1.05, -7.65);
  }
  b(5.4, 0.23, 0.105, M.lightWood, 7.6, groundY + 1.82, -7.65);
  b(5.4, 0.06, 0.09, M.wood, 7.6, groundY + 1.63, -7.65);

  // Four compact floodlight standards, with six inset lenses per light bank.
  const lamps = new THREE.MeshStandardMaterial({ color: 0xfff6dc, roughness: 0.42, emissive: 0xffe7ad, emissiveIntensity: 0.18 });
  for (const [x, z, height] of [[-10.5, -6.25, 5.2], [10.65, -6.25, 5.2], [-10.65, 6.5, 4.75], [10.65, 6.5, 4.75]]) {
    c(0.065, 0.12, height, M.paleSteel, x, groundY + height / 2, z, 10);
    c(0.21, 0.27, 0.13, M.steel, x, groundY + 0.065, z, 8);
    c(0.12, 0.12, 0.13, M.steel, x, groundY + height - 0.35, z, 8);
    // Irregular rust chips follow the taper instead of forming decorative bands.
    for (let patch = 0; patch < 14; patch++) {
      const h = .2 + rand() * (height - .5), angle = rand() * Math.PI * 2;
      const radius = .12 - h / height * .055 + .002;
      b(.023 + rand() * .034, .025 + rand() * .12, .007, patch % 3 ? M.rust : M.silver,
        x + Math.sin(angle) * radius, groundY + h, z + Math.cos(angle) * radius, angle);
    }
    const headY = groundY + height + 0.1;
    rod(v(x, headY - 0.3, z), v(x, headY, z - 0.15), 0.058, M.steel);
    b(1.03, 0.52, 0.17, M.steel, x, headY + 0.13, z - 0.15);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
      b(0.255, 0.165, 0.035, lamps, x + (col - 1) * 0.31, headY + 0.025 + row * 0.22, z - 0.05);
    }
    for (const side of [-1, 1]) rod(v(x + side * 0.39, headY + 0.06, z - 0.15), v(x + side * 0.28, headY - 0.22, z - 0.15), 0.025, M.paleSteel);
  }

  // A worn painted club score board, still legible at the pixel-art scale.
  const boardX = -7.6, boardZ = -6.95, boardY = groundY + 2.0;
  for (const offset of [-1.12, 1.12]) {
    b(0.13, 2.0, 0.14, M.darkWood, boardX + offset, groundY + 1.0, boardZ);
    b(0.45, 0.07, 0.35, M.path, boardX + offset, groundY + 0.035, boardZ);
  }
  b(3.38, 2.0, 0.22, M.darkWood, boardX, boardY, boardZ);
  b(3.5, 0.09, 0.34, M.wood, boardX, boardY + 1.03, boardZ);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#343d30'; ctx.fillRect(0, 0, 1024, 600);
  for (let i = 0; i < 7000; i++) {
    ctx.fillStyle = rand() > .5 ? 'rgba(216,211,172,.08)' : 'rgba(9,19,17,.13)';
    ctx.fillRect(rand() * 1024, rand() * 600, 1 + rand() * 5, .5 + rand() * 2);
  }
  ctx.strokeStyle = '#c0cdb1'; ctx.lineWidth = 4; ctx.strokeRect(23, 23, 978, 554);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e3e7ce'; ctx.font = '600 60px Arial, sans-serif'; ctx.fillText('C R I C K E T', 512, 104);
  ctx.strokeStyle = '#7d8669'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(94, 169); ctx.lineTo(930, 169); ctx.stroke();
  ctx.font = 'bold 205px Arial, sans-serif'; ctx.fillStyle = '#fff7df'; ctx.fillText('128/4', 512, 300);
  ctx.font = '500 63px Arial, sans-serif'; ctx.fillStyle = '#cfddbf'; ctx.fillText('16.2 OV', 512, 478);
  // Pinpoint paint loss is kept out of the center of the large score numerals.
  for (let i = 0; i < 320; i++) {
    const x = rand() * 1024, y = rand() * 600;
    if (x < 90 || x > 934 || y < 35 || y > 550) {
      ctx.fillStyle = '#7e795f'; ctx.fillRect(x, y, 1 + rand() * 4, 1 + rand() * 2);
    }
  }
  const scoreTexture = new THREE.CanvasTexture(canvas);
  scoreTexture.colorSpace = THREE.SRGBColorSpace;
  scoreTexture.anisotropy = 2;
  const score = new THREE.Mesh(new THREE.PlaneGeometry(3.19, 1.86), new THREE.MeshStandardMaterial({ map: scoreTexture, roughness: 0.88 }));
  score.name = 'Procedural club scoreboard';
  score.position.set(boardX, boardY, boardZ + 0.116);
  score.receiveShadow = true;
  group.add(score);

  function bench(x, z, ry = 0) {
    const q = new THREE.Quaternion().setFromAxisAngle(up, ry);
    function part(w, h, d, material, px, py, pz) {
      const position = v(px, py, pz).applyQuaternion(q).add(v(x, groundY, z));
      collect(new THREE.BoxGeometry(w, h, d), material, position, q);
    }
    for (let i = 0; i < 3; i++) part(2.1, 0.08, 0.13, i === 1 ? M.lightWood : M.wood, 0, 0.48, (i - 1) * 0.15);
    for (const side of [-1, 1]) {
      part(0.11, 0.46, 0.41, M.steel, side * 0.75, 0.23, 0);
      part(0.07, 0.48, 0.07, M.steel, side * 0.75, 0.65, -0.19);
    }
    for (const y of [0.75, 0.92]) part(2.1, 0.12, 0.065, M.wood, 0, y, -0.23);
  }
  bench(-9.25, -3.4, Math.PI / 2);
  bench(8.95, -3.3, -Math.PI / 2);

  // Sideline kit: cooler, a folded towel, spare bats and a cricket kit bag.
  const kitX = 9.18, kitZ = -2.1;
  b(0.51, 0.56, 0.47, M.blue, kitX, groundY + 0.31, kitZ);
  b(0.55, 0.08, 0.51, M.cream, kitX, groundY + 0.62, kitZ);
  b(0.22, 0.04, 0.11, M.white, kitX, groundY + 0.68, kitZ);
  b(0.08, 0.1, 0.06, M.white, kitX, groundY + 0.25, kitZ + 0.265);
  b(0.13, 0.07, 0.14, M.dark, kitX, groundY + 0.16, kitZ + 0.29);
  b(0.64, 0.3, 0.36, M.blueDark, 8.72, groundY + 0.17, -3.18);
  b(0.54, 0.025, 0.15, M.cream, 8.72, groundY + 0.33, -3.18);
  rod(v(8.53, groundY + 0.3, -3.18), v(8.53, groundY + 0.44, -3.18), 0.022, M.dark);
  rod(v(8.53, groundY + 0.44, -3.18), v(8.89, groundY + 0.44, -3.18), 0.022, M.dark);
  rod(v(8.89, groundY + 0.44, -3.18), v(8.89, groundY + 0.3, -3.18), 0.022, M.dark);
  for (const offset of [0, 0.22]) {
    collect(new THREE.BoxGeometry(0.13, 0.7, 0.055), M.lightWood, v(9.54 + offset, groundY + 0.38, -2.98), new THREE.Euler(-0.25, 0, -0.15));
    rod(v(9.58 + offset, groundY + 0.72, -3.05), v(9.61 + offset, groundY + 1.0, -3.12), 0.032, M.blueDark);
  }
  // Three water bottles, the same blue as the cooler.
  for (let i = 0; i < 3; i++) {
    c(0.037, 0.046, 0.19, M.blue, 8.9 + i * 0.13, groundY + 0.15, -1.63);
    c(0.028, 0.028, 0.055, M.white, 8.9 + i * 0.13, groundY + 0.272, -1.63);
  }

  // Open, irregular broadleaf crowns: visible branch structure and hundreds of
  // small leaves make an organic silhouette when rasterized, never big toy lobes.
  const treeData = [
    [-10.35, -7.3, 1.02], [-4.05, -8.03, 0.9], [0.25, -8.02, 1.06],
    [10.85, -8.02, 0.94], [-10.7, -0.4, 1.03], [-10.6, 4.3, 0.82]
  ];
  treeData.forEach(([x, z, scale], index) => {
    const at = (px, py, pz) => v(x + px * scale, groundY + py * scale, z + pz * scale);
    const base = at(0, .03, 0), fork = at(.09, 1.13, -.05), crown = at(-.09, 2.15, .06);
    function tapered(a, end, rt, rb) {
      const d = end.clone().sub(a);
      collect(new THREE.CylinderGeometry(rt * scale, rb * scale, d.length(), 6), M.trunk,
        a.clone().add(end).multiplyScalar(.5), new THREE.Quaternion().setFromUnitVectors(up, d.normalize()));
    }
    tapered(base, fork, .09, .16); tapered(fork, crown, .045, .092);
    // Exposed roots and broken soil replace the old circular planter disks.
    collect(new THREE.IcosahedronGeometry(1, 0), M.dirt, at(0, .008, 0), undefined, v(.54 * scale, .026, .46 * scale));
    for (let root = 0; root < 5; root++) {
      const angle = root / 5 * Math.PI * 2 + index * .5;
      tapered(at(0, .15, 0), at(Math.cos(angle) * .46, .025, Math.sin(angle) * .46), .014, .06);
    }
    const foliage = [M.leaf, M.leafLight, M.leafDark, M.leafShade, M.leafDry];
    const terminals = [];
    for (let branch = 0; branch < 8; branch++) {
      const angle = branch / 8 * Math.PI * 2 + index * .67 + (rand() - .5) * .45;
      const radius = .65 + rand() * .38;
      const height = 2.0 + rand() * .75;
      const middle = at(Math.cos(angle) * radius * .61, height - .30, Math.sin(angle) * radius * .61);
      const end = at(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      tapered(at(.04, 1.27 + branch % 3 * .17, 0), middle, .027, .055);
      tapered(middle, end, .011, .028);
      terminals.push(end);
      for (const side of [-1, 1]) {
        const twigAngle = angle + side * (.3 + rand() * .35);
        const twig = at(Math.cos(twigAngle) * (radius + .14), height + .16 + rand() * .15,
          Math.sin(twigAngle) * (radius + .14));
        tapered(middle, twig, .009, .022);
        terminals.push(twig);
      }
    }
    terminals.push(at(-.03, 2.91, .04), at(.25, 2.75, -.25));
    for (let cluster = 0; cluster < terminals.length; cluster++) {
      const center = terminals[cluster];
      const count = 14 + Math.floor(rand() * 7);
      for (let leaf = 0; leaf < count; leaf++) {
        const angle = rand() * Math.PI * 2;
        const r = Math.sqrt(rand());
        const position = center.clone().add(v(Math.cos(angle) * r * .36 * scale,
          (rand() - .5) * .4 * scale, Math.sin(angle) * r * .32 * scale));
        const size = (.075 + rand() * .085) * scale;
        const shade = rand();
        const material = shade < .30 ? foliage[0] : shade < .49 ? foliage[1] : shade < .72 ? foliage[2] : shade < .94 ? foliage[3] : foliage[4];
        collect(new THREE.IcosahedronGeometry(1, 0), material, position,
          new THREE.Euler(rand() * 2, rand() * 5, rand() * 2),
          v(size * (1 + rand() * .35), size * (.40 + rand() * .27), size * (.7 + rand() * .35)));
      }
    }
    const pivot = new THREE.Group();
    pivot.position.copy(crown);
    group.add(pivot);
    trees.push({ pivot, phase: index * 1.37 });
  });

  // Irregular low moss and weeds soften the plinth and the foot of the fence.
  // The open playing surface stays clear; these patches never become a hedge wall.
  const mossPalette = [M.moss, M.mossLight, M.mossDark, M.leafDry];
  function weedPatch(x, z, radius, lush = false) {
    const count = lush ? 18 : 9;
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2, distance = Math.sqrt(rand()) * radius;
      const px = x + Math.cos(angle) * distance, pz = z + Math.sin(angle) * distance;
      const width = .065 + rand() * (lush ? .16 : .10);
      collect(new THREE.IcosahedronGeometry(1, 0), mossPalette[i % 4],
        v(px, groundY + .025 + rand() * .045, pz), new THREE.Euler(0, rand() * 6, 0),
        v(width, .035 + rand() * (lush ? .11 : .05), width * (.6 + rand() * .5)));
      if (lush && i % 3 === 0) {
        const h = .13 + rand() * .23;
        rod(v(px, groundY + .03, pz), v(px + .04, groundY + h, pz - .03), .008, M.mossDark, 3);
        collect(new THREE.IcosahedronGeometry(1, 0), M.leaf,
          v(px + .04, groundY + h - .02, pz - .03), new THREE.Euler(.3, rand() * 6, .2), v(.055, .025, .08));
      }
    }
  }
  for (let i = 0; i < 72; i++) {
    const side = i % 4;
    let x, z;
    if (side < 2) { x = -12.1 + rand() * 24.2; z = side ? 9.17 : -9.10; }
    else { x = side === 2 ? -12.08 : 12.08; z = -8.8 + rand() * 17.6; }
    weedPatch(x, z, .12 + rand() * .18);
  }
  for (let i = 0; i < 28; i++) {
    const side = i % 3;
    const x = side === 0 ? -10.9 + rand() * 21.8 : side === 1 ? -11.3 : 11.3;
    const z = side === 0 ? -8.47 + rand() * .22 : -8.0 + rand() * 13.5;
    // Leave the stairs and equipment readable rather than filling their footprint.
    if (x > 4.8 && z < -5.0) continue;
    weedPatch(x, z, .23 + rand() * .20, true);
  }
  for (let i = 0; i < 36; i++) {
    const x = -12.1 + rand() * 24.2, z = 9.0 + rand() * .28;
    collect(new THREE.IcosahedronGeometry(1, 0), i % 3 ? M.path : M.dirt,
      v(x, groundY + .01, z), new THREE.Euler(0, rand() * 6, 0), v(.06 + rand() * .06, .023, .04 + rand() * .05));
  }

  // Two little pennants at the rear add a restrained hint of club identity.
  for (const [x, z, color, direction] of [[-1.55, -8.15, 0xc16b4d, 1], [3.1, -8.15, 0x4c8292, -1]]) {
    c(0.025, 0.031, 2.85, M.paleSteel, x, groundY + 1.425, z, 7);
    const pivot = new THREE.Group(); pivot.position.set(x, groundY + 2.76, z);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, direction * 0.65, -0.16, 0.04, 0, -0.32, 0], 3));
    geometry.computeVertexNormals();
    const flag = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide }));
    flag.castShadow = true;
    pivot.add(flag); group.add(pivot);
    flags.push({ pivot, phase: direction === 1 ? 0 : 1.6 });
  }

  for (const [material, parts] of bins) {
    const mesh = new THREE.Mesh(merge(parts), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'Batched environmental details';
    group.add(mesh);
  }
  return { trees, flags, group };
}

