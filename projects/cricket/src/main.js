import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

(() => {
  'use strict';
  const stage = document.getElementById('stage');
  const loading = document.getElementById('loading');
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    // Native low-resolution rendering, enlarged by nearest-neighbor CSS sampling.
    // This keeps the pixel grid stable and all post-processing inexpensive.
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.info.autoReset = false;
    stage.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 150);
    camera.position.set(29, 27, 34);
    camera.lookAt(0, 1.0, 0);
    const groundY = .52;
    let seed = 8317;
    const rand = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    const materials = new Map();
    function mat(color, roughness = .85, metalness = 0) {
      const key = `${color}/${roughness}/${metalness}`;
      if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
      return materials.get(key);
    }
    const geoBox = new THREE.BoxGeometry(1, 1, 1);
    const cylinders = new Map(), spheres = new Map();
    function mesh(geo, material, x, y, z, sx, sy, sz, parent = scene) {
      const m = new THREE.Mesh(geo, material);
      m.position.set(x, y, z); m.scale.set(sx, sy, sz);
      m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    }
    function box(w, h, d, material, x, y, z, parent = scene) { return mesh(geoBox, material, x, y, z, w, h, d, parent); }
    function cyl(rt, rb, h, material, x, y, z, segments = 10, parent = scene) {
      const ratio = rb ? rt / rb : 0, key = `${ratio}/${segments}`;
      if (!cylinders.has(key)) cylinders.set(key, new THREE.CylinderGeometry(ratio, 1, 1, segments));
      return mesh(cylinders.get(key), material, x, y, z, rb, h, rb, parent);
    }
    function sphere(radius, material, x, y, z, parent = scene, detail = 1) {
      if (!spheres.has(detail)) spheres.set(detail, new THREE.IcosahedronGeometry(1, detail));
      return mesh(spheres.get(detail), material, x, y, z, radius, radius, radius, parent);
    }
    const yAxis = new THREE.Vector3(0, 1, 0);
    function beam(a, b, radius, material, parent = scene, segments = 6) {
      a = new THREE.Vector3(...a); b = new THREE.Vector3(...b);
      const mid = a.clone().add(b).multiplyScalar(.5);
      const m = cyl(radius, radius, a.distanceTo(b), material, mid.x, mid.y, mid.z, segments, parent);
      m.quaternion.setFromUnitVectors(yAxis, b.sub(a).normalize()); return m;
    }
    function roundedSlab(w, d, h, radius, material, y) {
      const shape = new THREE.Shape();
      const x = -w / 2, z = -d / 2, r = radius;
      shape.moveTo(x+r,z); shape.lineTo(x+w-r,z); shape.quadraticCurveTo(x+w,z,x+w,z+r);
      shape.lineTo(x+w,z+d-r); shape.quadraticCurveTo(x+w,z+d,x+w-r,z+d);
      shape.lineTo(x+r,z+d); shape.quadraticCurveTo(x,z+d,x,z+d-r);
      shape.lineTo(x,z+r); shape.quadraticCurveTo(x,z,x+r,z);
      const geo = new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.055,bevelThickness:.035,curveSegments:5});
      geo.rotateX(-Math.PI/2);
      const m = new THREE.Mesh(geo,material); m.position.y=y; m.castShadow=true; m.receiveShadow=true; scene.add(m);return m;
    }

    // Low, warm afternoon sun and cool fill produce the reference's long blue shadows.
    scene.add(new THREE.HemisphereLight(0xdde5ef, 0x333b29, 1.22));
    const sun = new THREE.DirectionalLight(0xffe4b7, 3.5);
    sun.position.set(-14, 16, 11); sun.castShadow = true;
    sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-20;sun.shadow.camera.right=20;
    sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.camera.near=.5;sun.shadow.camera.far=65;
    sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=1.3;scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc2d4ec, .28);fill.position.set(9,9,-12);scene.add(fill);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x445260,opacity:.14}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.62;floor.receiveShadow=true;scene.add(floor);

    // Worn soil strata form a narrow, irregular miniature cutaway.
    roundedSlab(25.15,19.15,.18,.12,mat(0x665b3f),-.49);
    roundedSlab(25,19,.48,.10,mat(0x98815a),-.30);
    roundedSlab(25,19,.10,.10,mat(0x525a2e),.18);
    roundedSlab(25,19,.19,.10,mat(0x4d602f),.29);
    // Soil inclusions and strata sit in the visible cutaway only.
    const strata=mat(0xd0b585), stone=mat(0xa38b67);
    for(let i=0;i<330;i++){
      const side=i%2, x=side ? 12.51 : rand()*24.6-12.3, z=side ? rand()*18.5-9.25 : 9.51;
      const bit=box(.035+rand()*.16,.014+rand()*.045,.025+rand()*.05,i%3?stone:strata,x,-.12+rand()*.30,z);
      if(side)bit.rotation.y=Math.PI/2;
    }
    // All surface detail is generated locally; no texture image is downloaded.
    function grassTexture(){
      const c=document.createElement('canvas');c.width=768;c.height=576;const ctx=c.getContext('2d');
      for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#687740':'#77874a';ctx.fillRect(i*64,0,65,576);}
      // Broad worn patches are baked into the surface rather than screen noise.
      for(let i=0;i<420;i++){
        ctx.fillStyle=i%3?'rgba(39,53,26,.09)':'rgba(170,153,97,.15)';
        ctx.beginPath();ctx.ellipse(rand()*768,rand()*576,3+rand()*22,2+rand()*10,rand()*Math.PI,0,Math.PI*2);ctx.fill();
      }
      const grain=['#3c4a28','#49582e','#63713c','#9b9e5e','#b7ac73'];
      for(let i=0;i<115000;i++){
        const x=rand()*768,y=rand()*576;ctx.globalAlpha=.09+rand()*.22;ctx.fillStyle=grain[i%grain.length];
        ctx.fillRect(x|0,y|0,1+(rand()>.91?1:0),1+(rand()>.82?1:0));
      }
      ctx.globalAlpha=1;
      // A slightly dry sideline introduces age while leaving the mowing pattern clear.
      for(let i=0;i<950;i++){
        const side=i%4,x=side===0?rand()*17:side===1?751+rand()*17:rand()*768;
        const y=side===2?rand()*14:side===3?562+rand()*14:rand()*576;
        ctx.fillStyle=i%3?'rgba(159,139,83,.29)':'rgba(42,52,28,.35)';ctx.fillRect(x,y,2+rand()*7,1+rand()*3);
      }
      const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.NearestFilter;tex.magFilter=THREE.NearestFilter;tex.generateMipmaps=false;return tex;
    }
    const turfMat=new THREE.MeshStandardMaterial({map:grassTexture(),roughness:1});
    const turf=new THREE.Mesh(new THREE.PlaneGeometry(24.98,18.98),turfMat);turf.rotation.x=-Math.PI/2;turf.position.y=groundY;turf.receiveShadow=true;scene.add(turf);
    // Hand-laid boundary rope, slightly raised over the striped outfield.
    const boundaryPoints=[];
    for(let i=0;i<=180;i++){const a=i/180*Math.PI*2;boundaryPoints.push(new THREE.Vector3(Math.cos(a)*10.95,groundY+.027,Math.sin(a)*7.18));}
    const boundary=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(boundaryPoints),180,.034,5,false),mat(0xd4d0af));boundary.receiveShadow=true;scene.add(boundary);
    const boundaryPeg=mat(0xe8e2c5);
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;cyl(.035,.035,.08,boundaryPeg,11.02*Math.cos(a),groundY+.025,7.22*Math.sin(a),6);}

    function pitchTexture(){
      const c=document.createElement('canvas');c.width=512;c.height=1024;const ctx=c.getContext('2d');
      ctx.fillStyle='#b8a477';ctx.fillRect(0,0,512,1024);
      for(let i=0;i<75000;i++){ctx.fillStyle=rand()>.5?'rgba(78,65,40,.18)':'rgba(234,219,172,.27)';const x=rand()*512,y=rand()*1024;ctx.fillRect(x|0,y|0,1+rand()*3,1+rand()*4);}
      for(const y of [210,810]){const g=ctx.createRadialGradient(256,y,5,256,y,160);g.addColorStop(0,'rgba(112,87,52,.38)');g.addColorStop(1,'rgba(112,87,52,0)');ctx.fillStyle=g;ctx.fillRect(0,y-165,512,330);}
      ctx.strokeStyle='rgba(79,65,42,.34)';ctx.lineWidth=1.4;
      for(let i=0;i<65;i++){let x=rand()*470+20,y=rand()*980;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<4;j++){x+=rand()*16-8;y+=rand()*18;ctx.lineTo(x,y);}ctx.stroke();}
      // Shoe scuffs and roller streaks are surface marks, not moving overlays.
      for(let i=0;i<80;i++){ctx.fillStyle='rgba(82,67,43,.13)';ctx.fillRect(130+rand()*260,rand()>.5?130+rand()*100:780+rand()*100,3+rand()*7,6+rand()*13);}
      const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.NearestFilter;tex.magFilter=THREE.NearestFilter;tex.generateMipmaps=false;return tex;
    }
    box(3.25,.026,10.5,mat(0xb4a376),0,groundY+.009,0);
    const pitchMat=new THREE.MeshStandardMaterial({map:pitchTexture(),roughness:1});
    box(2.82,.038,10.08,pitchMat,0,groundY+.028,0);
    // Fine grass tufts trace the worn pitch edge.
    const tuftMat=mat(0x536432);
    for(let i=0;i<170;i++){
      const x=(i%2?1:-1)*(1.52+rand()*.08),z=rand()*10.2-5.1;
      const tuft=box(.025,.025+rand()*.055,.07,tuftMat,x,groundY+.025,z);tuft.rotation.z=rand()*.5-.25;
    }
    const chalk=mat(0xf6f1dc), wicketWood=mat(0xe3c591), red=mat(0xb84837);
    function chalkLine(x,z,w,d){const m=box(w,.008,d,chalk,x,groundY+.057,z);m.castShadow=false;}
    for(const end of [-1,1]){
      chalkLine(0,end*3.78,2.55,.04);chalkLine(0,end*2.99,2.65,.055);
      for(const x of [-1.12,1.12])chalkLine(x,end*4.0,.04,1.94);
      for(let i=-1;i<=1;i++){
        cyl(.036,.043,.61,wicketWood,i*.17,groundY+.35,end*3.78,8);
        cyl(.04,.04,.04,red,i*.17,groundY+.58,end*3.78,8);
      }
      for(const x of [-.085,.085])beam([x-.08,groundY+.663,end*3.78],[x+.08,groundY+.663,end*3.78],.024,wicketWood,scene,6);
    }
    /* ENVIRONMENT_SOURCE */
    const environment=buildEnvironment();

    // Articulated miniature players. Their meshes are batched into instanced parts below.
    const dynamicRoot=new THREE.Group();dynamicRoot.userData.dynamic=true;scene.add(dynamicRoot);
    const skinTones=[0xc88b5d,0xb2754b,0xdfac7a,0x925c3d];
    const navy=mat(0x263c54), blue=mat(0x3a718d), blueTrim=mat(0x9bb8ba), coral=mat(0xb54b2f), cream=mat(0xe2dac2), white=mat(0xe4e1d2), soles=mat(0x343c39), hair=mat(0x36312a), dark=mat(0x233640);
    const players=[];
    function player(x,z,team='blue',role='fielder',facing=0,index=0){
      const floorOffset=role==='batter'||role==='nonStriker'||role==='bowler'?-.005:-.045;
      const root=new THREE.Group();root.position.set(x,groundY+floorOffset,z);root.rotation.y=facing;dynamicRoot.add(root);
      root.scale.set(1.12,1.28,1.12);
      const skin=mat(skinTones[index%skinTones.length]);
      const shirt=team==='coral'?coral:blue,pants=team==='coral'?navy:navy;
      const hips=new THREE.Group();hips.position.y=.58;root.add(hips);
      const torso=cyl(.19,.15,.40,shirt,0,.21,0,8,hips);
      box(.035,.28,.012,team==='coral'?cream:blueTrim,0,.23,-.162,hips);
      // Collar and small chest crest.
      cyl(.087,.1,.035,team==='coral'?cream:navy,0,.418,0,8,hips);
      box(.042,.045,.014,cream,-.092,.30,-.164,hips);
      const headPivot=new THREE.Group();headPivot.position.y=.46;hips.add(headPivot);
      headPivot.scale.setScalar(.85);
      const head=sphere(.14,skin,0,.135,0,headPivot,1);head.scale.y*=1.13;
      sphere(.035,skin,0,.14,-.133,headPivot,0);
      for(const ex of [-.052,.052])sphere(.012,dark,ex,.176,-.119,headPivot,0);
      sphere(.042,skin,-.133,.143,0,headPivot,0);sphere(.042,skin,.133,.143,0,headPivot,0);
      if(role==='batter'||role==='nonStriker'){
        const helmet=sphere(.153,navy,0,.21,.007,headPivot,1);helmet.scale.y*=.82;
        box(.30,.025,.14,navy,0,.18,-.116,headPivot);
        const grille=mat(0x828f8c,.5,.35);
        beam([-.12,.13,-.17],[.12,.13,-.17],.008,grille,headPivot);
        beam([-.12,.08,-.17],[.12,.08,-.17],.008,grille,headPivot);
        for(const gx of [-.11,.11])beam([gx,.075,-.17],[gx,.18,-.16],.009,grille,headPivot);
      }else if(role==='umpire'){
        cyl(.22,.22,.028,cream,0,.23,0,12,headPivot);cyl(.12,.16,.115,cream,0,.27,0,12,headPivot);
      }else{
        const cap=sphere(.146,navy,0,.225,.01,headPivot,1);cap.scale.y*=.55;
        box(.20,.026,.15,navy,0,.204,-.105,headPivot);
      }
      const arms=[],legs=[];
      for(const side of [-1,1]){
        const arm=new THREE.Group();arm.position.set(side*.185,.35,0);hips.add(arm);
        cyl(.07,.067,.17,shirt,0,-.065,0,8,arm);
        const elbow=new THREE.Group();elbow.position.y=-.15;arm.add(elbow);
        cyl(.054,.048,.18,skin,0,-.08,0,7,elbow);
        sphere(role==='keeper'?.083:.058,role==='batter'||role==='nonStriker'||role==='keeper'?cream:skin,0,-.19,0,elbow,0);
        arms.push({pivot:arm,elbow});
        const leg=new THREE.Group();leg.position.set(side*.096,0,0);hips.add(leg);
        cyl(.087,.071,.25,pants,0,-.105,0,8,leg);
        const knee=new THREE.Group();knee.position.y=-.23;leg.add(knee);
        cyl(.069,.055,.25,pants,0,-.105,0,8,knee);
        box(.12,.09,.24,white,0,-.26,-.045,knee);box(.122,.025,.24,soles,0,-.30,-.045,knee);
        if(role==='batter'||role==='nonStriker'||role==='keeper'){
          box(.129,.29,.075,cream,0,-.11,-.07,knee);
          for(let j=0;j<3;j++)box(.014,.235,.016,white,(j-1)*.035,-.11,-.115,knee);
        }
        legs.push({pivot:leg,knee});
      }
      let bat=null;
      if(role==='batter'||role==='nonStriker'){
        bat=new THREE.Group();arms[1].elbow.add(bat);bat.position.set(0,-.2,0);
        cyl(.025,.025,.22,mat(0x43534d),0,-.075,0,8,bat);
        box(.135,.43,.065,mat(0xe4c084),0,-.39,0,bat);
        box(.105,.10,.068,coral,0,-.34,-.004,bat);
        box(.04,.24,.008,mat(0xf2d8a0),0,-.47,-.037,bat);
      }
      // A thin, local contact shadow stays attached to every moving figure.
      const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.75,.65),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,opacity:.34,depthWrite:false}));
      shadow.rotation.x=-Math.PI/2;shadow.position.y=(role==='batter'||role==='nonStriker'||role==='bowler'?.058:.01)-floorOffset;shadow.castShadow=false;root.add(shadow);
      const p={root,hips,headPivot,arms,legs,bat,x,z,role,index,facing,floorOffset};players.push(p);return p;
    }
    const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=64;
    const cctx=contactCanvas.getContext('2d'),cg=cctx.createRadialGradient(32,32,3,32,32,31);
    cg.addColorStop(0,'rgba(31,45,17,.48)');cg.addColorStop(1,'rgba(31,45,17,0)');cctx.fillStyle=cg;cctx.fillRect(0,0,64,64);
    const contactTexture=new THREE.CanvasTexture(contactCanvas);
    const batter=player(.26,3.25,'coral','batter',0,0);
    const bowler=player(-.12,-4.48,'blue','bowler',Math.PI,1);
    const keeper=player(.04,4.57,'blue','keeper',0,2);
    const nonStriker=player(1.02,-3.3,'coral','nonStriker',Math.PI,3);
    const umpire=player(.40,-5.0,'coral','umpire',Math.PI,0);
    // Distinct positions leave both batting creases readable in the isometric view.
    const fielderPositions=[[-3.2,4.2],[-5.8,1.6],[5.5,2.9],[7.7,-.9],[-7.0,-2.5],[3.6,-4.8],[-3.6,-5.4]];
    fielderPositions.forEach(([x,z],i)=>player(x,z,'blue','fielder',Math.atan2(-x,-z)+Math.PI,i+1));
    // Correct the umpire's jersey to a quiet cream shade.
    umpire.root.traverse(o=>{if(o.isMesh&&o.material===coral)o.material=cream;});
    const ballRoot=new THREE.Group();ballRoot.userData.dynamic=true;scene.add(ballRoot);
    const ball=sphere(.076,mat(0xb94030,.58),0,groundY+.55,-3,ballRoot,2);
    const seam=new THREE.Mesh(new THREE.TorusGeometry(1,.055,4,20),cream);ball.add(seam);

    // Static props share a few merged meshes; articulated figures share instanced geometry.
    function batchStatic(){
      scene.updateMatrixWorld(true);const buckets=new Map(),remove=[];
      scene.traverse(o=>{
        if(!o.isMesh||Array.isArray(o.material)||o===floor)return;
        for(let p=o;p;p=p.parent)if(p.userData.dynamic)return;
        const key=`${o.material.uuid}/${o.castShadow}/${o.receiveShadow}`;
        if(!buckets.has(key))buckets.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,geos:[]});
        const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.deleteAttribute('tangent');geo.deleteAttribute('uv1');
        if(geo.index)geo.copy(geo.toNonIndexed());
        // Instanced primitives and extruded pieces use the same compact attribute layout.
        if(!geo.getAttribute('uv'))geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count*2),2));
        buckets.get(key).geos.push(geo);remove.push(o);
      });
      for(const o of remove)o.removeFromParent();
      for(const b of buckets.values()){
        const geo=mergeGeometries(b.geos,false);
        if(!geo)throw new Error('Unable to batch scene geometry.');
        const m=new THREE.Mesh(geo,b.material);m.castShadow=b.cast;m.receiveShadow=b.receive;scene.add(m);
        for(const g of b.geos)g.dispose();
      }
    }
    batchStatic();
    const instanceBuckets=new Map();
    dynamicRoot.traverse(o=>{
      if(!o.isMesh||o.material.transparent)return;
      const key=o.geometry.uuid+'/'+o.material.uuid;
      if(!instanceBuckets.has(key))instanceBuckets.set(key,{geo:o.geometry,material:o.material,parts:[]});
      instanceBuckets.get(key).parts.push(o);o.visible=false;
    });
    for(const b of instanceBuckets.values()){
      b.instanced=new THREE.InstancedMesh(b.geo,b.material,b.parts.length);
      b.instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);b.instanced.castShadow=true;b.instanced.receiveShadow=true;
      b.instanced.frustumCulled=false;scene.add(b.instanced);
    }
    function updateInstances(){
      dynamicRoot.updateMatrixWorld(true);
      for(const b of instanceBuckets.values()){for(let i=0;i<b.parts.length;i++)b.instanced.setMatrixAt(i,b.parts[i].matrixWorld);b.instanced.instanceMatrix.needsUpdate=true;}
    }

    // MIT-licensed official Three.js pixel-art renderer: depth silhouettes and
    // normal edge highlights are evaluated on the same native pixel grid.
    // https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/RenderPixelatedPass.js
    const composer=new EffectComposer(renderer);
    const pixelPass=new RenderPixelatedPass(1,scene,camera,{normalEdgeStrength:.08,depthEdgeStrength:.22});
    pixelPass.pixelatedMaterial.fragmentShader=pixelPass.pixelatedMaterial.fragmentShader.replace('gl_FragColor = texel * Strength;','gl_FragColor = vec4(texel.rgb * Strength, texel.a);');
    composer.addPass(pixelPass);
    const ao=new SSAOPass(scene,camera,1,1,16);
    ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA=0;
    ao.depthRenderMaterial.defines.PERSPECTIVE_CAMERA=0;
    ao.kernelRadius=1.0;ao.minDistance=.0005;ao.maxDistance=.018;
    // Half-resolution ambient occlusion retains contact detail without a full-size extra pass.
    const setAOSize=ao.setSize.bind(ao);ao.setSize=(w,h)=>setAOSize(Math.ceil(w*.8),Math.ceil(h*.8));
    composer.addPass(ao);composer.addPass(new OutputPass());
    // A deliberately authored palette preserves warm soil, olive leaves and
    // cool shadow ramps. Bayer dithering is anchored to output pixels, not time.
    // Algorithm references: https://github.com/WoodNeck/three-pixelate-showcase
    const paletteHex=[
      0x18232b,0x24323a,0x34434a,0x475451,0x58625b,0x6a7468,0x828a7a,0x9ba28d,0xb9baa0,0xd4d1b7,0xe6e2cd,0xf4efdf,0xffffff,
      0x29351e,0x354323,0x414e28,0x4c5b2d,0x586633,0x657339,0x737f41,0x818b48,0x939852,0xa5a45f,0xb7b170,0xc6bf87,
      0x514832,0x64563a,0x776540,0x8d784e,0x9e895b,0xb29c6c,0xc0ad80,0xd2c29a,0xe0d1ae,
      0x493726,0x60442b,0x785136,0x8b6242,0xa37950,0xb68b5c,0xc59e70,0xd7b386,0xe4caa2,
      0x233148,0x2c4058,0x39536c,0x486e85,0x60889b,0x7aa2af,0x9bbcc3,0xb9d0cc,
      0x6c342a,0x88402b,0x9f4b30,0xb65c3a,0xca7148,0xd78b60,0xe4a77b,
      0x4c4944,0x65645b,0x818075,0x9a9a8e,0xb7b7a9,0xd0d0c2
    ];
    const palette=paletteHex.map(c=>new THREE.Vector3(((c>>16)&255)/255,((c>>8)&255)/255,(c&255)/255));
    const palettePass=new ShaderPass({
      uniforms:{tDiffuse:{value:null},palette:{value:palette},ditherAmount:{value:.016}},
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader:`
        uniform sampler2D tDiffuse;uniform vec3 palette[${palette.length}];uniform float ditherAmount;varying vec2 vUv;
        float bayer2(vec2 p){return mod(p.x,2.0)*2.0+mod(p.y,2.0)*3.0-mod(p.x,2.0)*mod(p.y,2.0)*4.0;}
        float bayer4(vec2 p){return (bayer2(mod(p,2.0))*4.0+bayer2(floor(mod(p,4.0)/2.0))+.5)/16.0-.5;}
        void main(){
          vec4 source=texture2D(tDiffuse,vUv);
          if(source.a<.002){gl_FragColor=vec4(1.,1.,1.,0.);return;}
          vec3 target=clamp(source.rgb+vec3(bayer4(gl_FragCoord.xy)*ditherAmount),0.,1.);
          vec3 nearest=source.rgb;float best=100.;
          for(int i=0;i<${palette.length};i++){
            vec3 delta=target-palette[i];float distance=dot(delta*delta,vec3(.30,.52,.18));
            if(distance<best){best=distance;nearest=palette[i];}
          }
          // The final canvas uses premultiplied alpha. Associate RGB here so
          // translucent ground shadows composite neutrally against the white page.
          gl_FragColor=vec4(nearest*source.a,source.a);
        }`
    });
    composer.addPass(palettePass);
    let renderWidth=0,renderHeight=0,coarsePixels=false;
    function resize(){
      const w=stage.clientWidth,h=stage.clientHeight;if(w===renderWidth&&h===renderHeight)return;
      renderWidth=w;renderHeight=h;
      const pixelSize=w<640?(coarsePixels?1.5:1):(coarsePixels?3:2);
      const nativeW=Math.max(1,Math.round(w/pixelSize)),nativeH=Math.max(1,Math.round(h/pixelSize));
      renderer.setSize(nativeW,nativeH,false);
      const aspect=w/h;
      // A fixed camera pose; only its orthographic frustum adapts to the viewport.
      const frameW=37.8,frameH=aspect<.95?43.5:29.8;
      const halfH=Math.max(frameH/2,frameW/(2*aspect));
      camera.left=-halfH*aspect;camera.right=halfH*aspect;
      camera.top=halfH;camera.bottom=-halfH;
      // Keep the small world slightly below the editorial heading, with breathing room.
      camera.setViewOffset(w,h,0,-Math.round(h*(aspect<.95?.012:.017)),w,h);
      camera.updateProjectionMatrix();
      composer.setSize(nativeW,nativeH);
      if(window.__CRICKET__){window.__CRICKET__.resolution=[nativeW,nativeH];window.__CRICKET__.palette=palette.length;window.__CRICKET__.style='weathered pixel art';}
      render();
    }

    // All keyframes evaluate a periodic timeline, so no accumulating physics drift occurs.
    const TAU=Math.PI*2, DURATION=12;
    const clamp=THREE.MathUtils.clamp;
    const smooth=(a,b,t)=>{const q=clamp((t-a)/(b-a),0,1);return q*q*(3-2*q);};
    const pulse=(a,b,c,t)=>smooth(a,b,t)*(1-smooth(b,c,t));
    const mix=THREE.MathUtils.lerp;
    const ballPosition=new THREE.Vector3();
    function animate(time){
      const t=((time%DURATION)+DURATION)%DURATION,phase=t/DURATION*TAU;
      for(const p of players){
        p.root.position.set(p.x,groundY+p.floorOffset,p.z);p.root.rotation.y=p.facing;
        p.hips.position.y=.58;p.hips.rotation.set(0,0,0);
        p.headPivot.rotation.set(0,.055*Math.sin(phase+p.index),0);
        for(let i=0;i<2;i++){
          p.arms[i].pivot.rotation.set(-.10,0,(i?-.11:.11));p.arms[i].elbow.rotation.x=-.13;
          p.legs[i].pivot.rotation.set(0,0,(i?-.045:.045));p.legs[i].knee.rotation.x=.04;
        }
        const breathe=Math.sin(phase*2+p.index*.7)*.007;
        p.hips.scale.y=1+breathe;
        if(p.role==='fielder'){
          const react=pulse(3.4,4.4,7.6,t), idle=Math.sin(phase+p.index*.83);
          p.root.position.x+=idle*.10+(p.index===2?-.26:Math.sign(-p.x)*.30)*react;
          p.root.position.z+=Math.cos(phase+p.index*.83)*.07;
          p.hips.rotation.x=-.10-react*.14;
          for(let i=0;i<2;i++){
            p.legs[i].pivot.rotation.x=Math.sin(phase*2+i*Math.PI+p.index)*.07;
            p.arms[i].pivot.rotation.x=-.28-react*.35;
            p.arms[i].elbow.rotation.x=-.45;
          }
          if(p.index===2){
            const pickup=pulse(4.7,5.65,6.45,t),throwing=pulse(6.2,6.6,7.35,t);
            p.hips.rotation.x-=pickup*.55;p.hips.position.y-=pickup*.10;
            p.arms[1].pivot.rotation.x=-.2-pickup*.4-throwing*2.4;
          }
        }else if(p.role==='bowler'){
          const run=pulse(.25,1.7,5.6,t), delivery=pulse(1.65,2.2,2.85,t);
          p.root.position.z+=run*.94;
          const stride=Math.sin((t-.25)*TAU*2.5)*pulse(.25,.8,2.0,t)*.44;
          p.legs[0].pivot.rotation.x=stride;p.legs[1].pivot.rotation.x=-stride;
          p.arms[0].pivot.rotation.x=-stride*.7;
          const armSweep=smooth(1.2,2.0,t)*Math.PI+smooth(2.0,2.55,t)*Math.PI;
          p.arms[1].pivot.rotation.x=-armSweep;
          // The full overarm turn ends at 2π, visually identical to its resting pose.
          p.arms[1].pivot.rotation.x+=smooth(5.9,8.6,t)*TAU;
          p.hips.rotation.x=-.1-delivery*.18;
          p.arms[1].elbow.rotation.x=-.08;
        }else if(p.role==='batter'){
          const prep=pulse(1.5,2.65,4.9,t),hit=pulse(2.8,3.25,4.7,t);
          p.root.rotation.y=-.30-hit*.75;p.hips.rotation.x=-.10;
          p.arms[0].pivot.rotation.x=-.58-hit*.9;p.arms[0].pivot.rotation.z=.10;
          p.arms[1].pivot.rotation.x=-.35-prep*.6-hit*1.12;p.arms[1].pivot.rotation.z=-.48+hit*.12;
          p.arms[0].elbow.rotation.x=-.65;p.arms[1].elbow.rotation.x=-.43;
          p.legs[0].pivot.rotation.x=-.08-hit*.16;p.legs[1].pivot.rotation.x=.10;
          p.bat.rotation.set(.15+prep*.2-hit*1.2,0,-.16);
        }else if(p.role==='keeper'){
          const ready=pulse(1.2,2.8,5.6,t);
          p.hips.position.y=.49-ready*.08;p.hips.rotation.x=-.27;
          for(let i=0;i<2;i++){
            p.arms[i].pivot.rotation.x=-.66-ready*.20;p.arms[i].elbow.rotation.x=-.37;
            p.legs[i].pivot.rotation.x=-.24;p.legs[i].knee.rotation.x=.4;
          }
        }else if(p.role==='nonStriker'){
          p.arms[1].pivot.rotation.x=-.28+Math.sin(phase)*.04;p.bat.rotation.z=-.18;
          p.root.position.x+=Math.sin(phase)*.04;p.headPivot.rotation.y=-.14;
        }else if(p.role==='umpire'){
          p.arms[0].pivot.rotation.x=.12;p.arms[1].pivot.rotation.x=.12;
        }
      }
      // A delivery, a low cover drive, and a gentle return to the bowler.
      const start=[-.1,1.45,-3.53],bounce=[-.10,.13,1.7],contact=[.18,.42,2.96],field=[-6.15,.13,1.57];
      if(t<2.05){
        ball.visible=false;ballPosition.set(...start);
      }else if(t<2.86){
        const q=(t-2.05)/.81;ball.visible=true;
        ballPosition.set(mix(start[0],bounce[0],q),mix(start[1],bounce[1],q)+Math.sin(q*Math.PI)*.10,mix(start[2],bounce[2],q));
      }else if(t<3.18){
        const q=(t-2.86)/.32;ball.visible=true;ballPosition.set(mix(bounce[0],contact[0],q),mix(bounce[1],contact[1],q)+Math.sin(q*Math.PI)*.11,mix(bounce[2],contact[2],q));
      }else if(t<5.15){
        const q=smooth(3.18,5.15,t);ball.visible=true;
        ballPosition.set(mix(contact[0],field[0],q),mix(contact[1],field[1],q)+Math.sin(q*Math.PI)*.48,mix(contact[2],field[2],q));
      }else if(t<6.5){ball.visible=true;ballPosition.set(field[0],mix(.13,1.03,smooth(5.85,6.5,t)),field[2]);}
      else if(t<8.5){
        const q=smooth(6.5,8.5,t);ball.visible=true;
        ballPosition.set(mix(field[0],start[0],q),mix(1.03,start[1],q)+Math.sin(q*Math.PI)*1.35,mix(field[2],start[2],q));
      }else{ball.visible=false;ballPosition.set(...start);}
      ball.position.set(ballPosition.x,groundY+ballPosition.y,ballPosition.z);ball.rotation.set(phase*3,phase*4,0);
      updateInstances();
      // Diagnostics are intentionally small and contain no objects or renderer handles.
      window.__CRICKET__.time=t;
    }
    let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let time=0,speed=1,last=0,frameBudget=0,raf=0,isVisible=true,contextLost=false;
    window.__CRICKET__={ready:false,time:0,players:players.length,camera:'fixed orthographic',duration:DURATION,offline:true,frames:0};
    function render(){if(!contextLost){renderer.info.reset();renderer.shadowMap.needsUpdate=true;composer.render();if(window.__CRICKET__){window.__CRICKET__.drawCalls=renderer.info.render.calls;window.__CRICKET__.triangles=renderer.info.render.triangles;window.__CRICKET__.frames++;}}}
    function frame(now){
      raf=0;if(paused||document.hidden||!isVisible||contextLost)return;
      const delta=last?Math.min((now-last)/1000,.05):0;last=now;
      time+=delta*speed;frameBudget+=delta;
      // Render at most 60 times per second, even on high-refresh displays.
      if(frameBudget>=1/60||delta===0){frameBudget%=1/60;animate(time);render();}
      raf=requestAnimationFrame(frame);
    }
    function start(){if(!raf&&!paused&&!document.hidden&&isVisible&&!contextLost){last=0;raf=requestAnimationFrame(frame);}}
    function stop(){cancelAnimationFrame(raf);raf=0;last=0;frameBudget=0;}
    const pauseButton=document.getElementById('pause'),pauseLabel=document.getElementById('pause-label'),activity=document.getElementById('activity'),announcement=document.getElementById('announcement');
    function updateControls(announce=true){
      pauseButton.classList.toggle('is-paused',paused);pauseButton.setAttribute('aria-pressed',String(paused));
      pauseButton.setAttribute('aria-label',paused?'继续动画':'暂停动画');pauseLabel.textContent=paused?'继续':'暂停';
      activity.textContent=paused?'静静欣赏':'比赛进行中';
      if(announce)announcement.textContent=paused?'动画已暂停':'动画已继续';
    }
    function togglePause(){paused=!paused;updateControls();if(paused){stop();render();}else start();}
    pauseButton.addEventListener('click',togglePause);
    document.getElementById('speed').addEventListener('click',e=>{
      speed=speed===1?.5:speed===.5?1.5:1;e.currentTarget.textContent=`${speed}× 速度`;
      e.currentTarget.setAttribute('aria-label',`动画速度：${speed} 倍，点击切换`);announcement.textContent=`动画速度 ${speed} 倍`;
    });
    document.getElementById('pixels').addEventListener('click',e=>{
      coarsePixels=!coarsePixels;e.currentTarget.textContent=coarsePixels?'经典像素':'细腻像素';
      e.currentTarget.setAttribute('aria-pressed',String(coarsePixels));
      e.currentTarget.setAttribute('aria-label',`切换像素颗粒：当前为${coarsePixels?'经典':'细腻'}`);
      renderWidth=0;resize();announcement.textContent=coarsePixels?'已切换为经典像素颗粒':'已切换为细腻像素颗粒';
    });
    document.getElementById('replay').addEventListener('click',()=>{time=0;last=0;animate(time);render();announcement.textContent='已回到本次投球开始';start();});
    document.addEventListener('keydown',e=>{if(e.code==='Space'&&!/BUTTON|INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();togglePause();}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
    new IntersectionObserver(([entry])=>{isVisible=entry.isIntersecting;if(isVisible)start();else stop();},{threshold:0}).observe(stage);
    const motion=matchMedia('(prefers-reduced-motion: reduce)');motion.addEventListener('change',e=>{if(e.matches&&!paused){paused=true;stop();updateControls();render();}});
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;stop();loading.hidden=false;loading.className='loading error';loading.textContent='图形上下文暂时中断，正在等待浏览器恢复…';});
    renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;loading.className='loading is-ready';loading.hidden=true;resize();render();start();});
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('pagehide',()=>{stop();},{once:true});
    window.addEventListener('pageshow',()=>{start();});
    animate(0);resize();updateControls(false);
    window.__CRICKET__.ready=true;
    window.__CRICKET__.drawCalls=renderer.info.render.calls;
    window.__CRICKET__.triangles=renderer.info.render.triangles;
    loading.classList.add('is-ready');setTimeout(()=>{loading.hidden=true;},300);start();
  } catch(error) {
    console.error(error);
    loading.className='loading error';loading.textContent='三维场景暂时无法显示。请使用支持 WebGL 2 的现代浏览器，并开启浏览器硬件加速。';
    document.querySelector('.toolbar').hidden=true;
    window.__CRICKET__={ready:false,error:String(error)};
  }
})();
