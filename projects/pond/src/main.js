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

    // The raised frame and scene footprint stay unchanged.
    roundedSlab(25.15,19.15,.18,.12,mat(0x665b3f),-.49);
    roundedSlab(25,19,.32,.10,mat(0x98815a),-.30);
    /* ENVIRONMENT_SOURCE */
    const environment=buildEnvironment();
    const dynamicRoot=environment.dynamicRoot;
    const players=environment.anglers;

    // Static props share a few merged meshes; articulated figures share instanced geometry.
    function batchStatic(){
      scene.updateMatrixWorld(true);const buckets=new Map(),remove=[];
      scene.traverse(o=>{
        if(!o.isMesh||Array.isArray(o.material)||o===floor)return;
        for(let p=o;p;p=p.parent)if(p.userData.dynamic)return;
        let reflect=false;for(let p=o;p;p=p.parent)if(p.userData.reflectable){reflect=true;break;}
        const key=`${o.material.uuid}/${o.castShadow}/${o.receiveShadow}/${reflect}`;
        if(!buckets.has(key))buckets.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,reflect,geos:[]});
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
        const m=new THREE.Mesh(geo,b.material);m.castShadow=b.cast;m.receiveShadow=b.receive;m.userData.reflectable=b.reflect;scene.add(m);
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
      b.instanced.frustumCulled=false;b.instanced.userData.reflectable=true;scene.add(b.instanced);
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
      0x18232b,0x24323a,0x34434a,0x475451,0x58625b,0x6a7468,0x828a7a,0x9ba28d,0xb9baa0,0xd4d1b7,0xe6e2cd,0xffffff,
      0x2f3c22,0x41532b,0x566b32,0x6b813b,0x819346,0x9ba64d,0xb0b35a,0xc0c16c,0xced083,0xdeda9f,
      0x493726,0x60442b,0x785136,0x8b6242,0xa37950,0xb68b5c,0xc59e70,0xd7b386,0xe4caa2,0x776540,0x9e895b,0xc0ad80,
      0x61342a,0x7d3d2a,0x98462b,0xb2572b,0xc86b30,0xd78438,0xe6a04a,0xefb85c,0xf0cb78,0xf2dc9b,
      0x234753,0x2d596a,0x356a80,0x3f7c92,0x4c8c9e,0x5d9cad,0x78afb8,0x98c3c8,0xaccfc9,0xc5d9cf,
      0x7a382f,0xb14a35,0xd56a4a,0xe48e68,
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

    // Water, breathing, float movement and rings all share the original loop.
    const DURATION=12;
    function animate(time){
      const t=((time%DURATION)+DURATION)%DURATION;
      environment.update(t);
      updateInstances();
      window.__CRICKET__.time=t;
      window.__CRICKET__.fishingLifts=environment.anglers.map(p=>p.lift);
      window.__CRICKET__.fishPositions=environment.fish.map(f=>[f.root.position.x,f.root.position.y,f.root.position.z]);
    }
    let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let time=0,speed=1,last=0,frameBudget=0,raf=0,isVisible=true,contextLost=false;
    window.__CRICKET__={ready:false,time:0,players:players.length,camera:'fixed orthographic',duration:DURATION,offline:true,frames:0,scene:'autumn fishing pond',reflections:true,fishCount:environment.fish.length,fishingInterval:3};
    function render(){if(!contextLost){renderer.info.reset();environment.prepareReflection(renderer,camera);renderer.shadowMap.needsUpdate=true;composer.render();if(window.__CRICKET__){window.__CRICKET__.drawCalls=renderer.info.render.calls;window.__CRICKET__.triangles=renderer.info.render.triangles;window.__CRICKET__.frames++;}}}
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
      activity.textContent=paused?'静静欣赏':'正在垂钓';
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
    document.getElementById('replay').addEventListener('click',()=>{time=0;last=0;animate(time);render();announcement.textContent='已回到垂钓动画起点';start();});
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
