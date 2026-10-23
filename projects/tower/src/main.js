import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPixelatedPass} from 'three/addons/postprocessing/RenderPixelatedPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import stoneColorData from './projects/tower/assets/stone-color.jpg';
import stoneBumpData from './projects/tower/assets/stone-bump.jpg';
import stoneRoughnessData from './projects/tower/assets/stone-roughness.jpg';

(async()=>{
  const stage=document.getElementById('stage'),loading=document.getElementById('loading');
  let raf=0;
  try{
    let seed=24379;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
    const renderer=new THREE.WebGLRenderer({antialias:false,alpha:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.info.autoReset=false;stage.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-30,30,40,-40,.1,400);
    const direction=new THREE.Vector3(20,11.5,38).normalize();camera.position.copy(direction).multiplyScalar(150);camera.lookAt(0,0,0);
    const materials=new Map(),signs=new Map(),cylinders=new Map(),spheres=new Map(),geoBox=new THREE.BoxGeometry(1,1,1),yAxis=new THREE.Vector3(0,1,0);
    function mat(color,roughness=.92,metalness=0){const key=color+'/'+roughness+'/'+metalness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);}
    function mesh(geo,material,x,y,z,sx,sy,sz,parent=scene){const o=new THREE.Mesh(geo,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
    function box(w,h,d,material,x,y,z,parent=scene){return mesh(geoBox,material,x,y,z,w,h,d,parent);}
    function cyl(rt,rb,h,material,x,y,z,n=8,parent=scene){const key=(rt/rb)+'/'+n;if(!cylinders.has(key))cylinders.set(key,new THREE.CylinderGeometry(rt/rb,1,1,n));return mesh(cylinders.get(key),material,x,y,z,rb,h,rb,parent);}
    function sphere(radius,material,x,y,z,parent=scene,detail=0){if(!spheres.has(detail))spheres.set(detail,new THREE.IcosahedronGeometry(1,detail));return mesh(spheres.get(detail),material,x,y,z,radius,radius,radius,parent);}
    function beam(a,end,radius,material,parent=scene,n=5){a=new THREE.Vector3(...a);end=new THREE.Vector3(...end);const middle=a.clone().add(end).multiplyScalar(.5),o=cyl(radius,radius,a.distanceTo(end),material,middle.x,middle.y,middle.z,n,parent);o.quaternion.setFromUnitVectors(yAxis,end.sub(a).normalize());return o;}
    const primitives={box,cyl,sphere,beam},projectCamera=camera;
    const stoneLoader=new THREE.TextureLoader();
    const stoneImages=await Promise.all([stoneColorData,stoneBumpData,stoneRoughnessData].map(data=>stoneLoader.loadAsync(data)));
    for(const texture of stoneImages){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}
    stoneImages[0].colorSpace=THREE.SRGBColorSpace;
    const stoneTextureSet={color:stoneImages[0],bump:stoneImages[1],roughness:stoneImages[2]};
    function canvasTexture(w,h,paint){const cv=document.createElement('canvas');cv.width=w;cv.height=h;paint(cv.getContext('2d'),w,h);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;}
    const grain=canvasTexture(64,64,ctx=>{ctx.fillStyle='#eeeade';ctx.fillRect(0,0,64,64);for(let j=0;j<1700;j++){ctx.globalAlpha=.055+rand()*.09;ctx.fillStyle=j%4?'#7d8072':'#ffffff';ctx.fillRect(rand()*64,rand()*64,1+rand()*3,1);}ctx.globalAlpha=1;});
    const batchMaterials=new Map();let bakedMeshes=0,bakedTriangles=0;
    const isDynamic=o=>{for(let p=o;p;p=p.parent)if(p.userData.dynamic)return true;return false;};
    function batchGroup(parent){
      parent.updateWorldMatrix(true,true);const inverse=parent.matrixWorld.clone().invert(),buckets=new Map(),remove=[];
      parent.traverse(o=>{
        if(!o.isMesh||Array.isArray(o.material)||isDynamic(o)||o.material.isShaderMaterial)return;
        const source=o.material,map=source.map||grain,glow=source.emissiveIntensity>0&&source.emissive?.getHex()>0;
        let reflectable=false;for(let p=o;p;p=p.parent)if(p.userData.reflectable){reflectable=true;break;}
        const key=source.type+'/'+map.uuid+'/'+glow+'/'+(source.alphaTest||0)+'/'+source.transparent+'/'+source.side+'/'+reflectable;
        if(!buckets.has(key))buckets.set(key,{source,map,glow,reflectable,geos:[],cast:false,receive:true});const bucket=buckets.get(key);
        let geo=o.geometry.clone();if(geo.index){const old=geo;geo=geo.toNonIndexed();old.dispose();}geo.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
        for(const name of Object.keys(geo.attributes))if(!['position','normal','uv','color'].includes(name))geo.deleteAttribute(name);
        if(!geo.getAttribute('uv'))geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
        if(source.userData.worldStone){const pos=geo.attributes.position,norm=geo.attributes.normal,uv=geo.attributes.uv,tile=source.userData.tileSize||1.65;for(let j=0;j<pos.count;j++){const nx=Math.abs(norm.getX(j)),ny=Math.abs(norm.getY(j)),nz=Math.abs(norm.getZ(j));if(ny>=nx&&ny>=nz)uv.setXY(j,pos.getX(j)/tile,pos.getZ(j)/tile);else if(nx>=nz)uv.setXY(j,pos.getZ(j)/tile,pos.getY(j)/tile);else uv.setXY(j,pos.getX(j)/tile,pos.getY(j)/tile);}}
        const count=geo.attributes.position.count,colors=new Float32Array(count*3),original=geo.getAttribute('color');
        for(let j=0;j<count;j++){colors[j*3]=source.color.r*(original?original.getX(j):1);colors[j*3+1]=source.color.g*(original?original.getY(j):1);colors[j*3+2]=source.color.b*(original?original.getZ(j):1);}
        geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));bucket.geos.push(geo);bucket.cast||=o.castShadow;remove.push(o);bakedTriangles+=count/3;
      });
      for(const o of remove)o.removeFromParent();
      for(const [key,bucket]of buckets){
        if(!batchMaterials.has(key)){const m=bucket.source.clone();m.color.set(0xffffff);m.vertexColors=true;m.map=bucket.map;m.roughness=.94;if(bucket.glow){m.emissive.set(0xffc578);m.emissiveIntensity=.23;}batchMaterials.set(key,m);}
        const geo=mergeGeometries(bucket.geos,false);if(!geo)throw Error('Floor batching failed');const o=new THREE.Mesh(geo,batchMaterials.get(key));o.castShadow=bucket.cast;o.receiveShadow=true;o.userData.reflectable=bucket.reflectable;parent.add(o);bakedMeshes++;for(const fragment of bucket.geos)fragment.dispose();
      }
    }
    const instanceBuckets=new Map(),hiddenMatrix=new THREE.Matrix4().makeScale(0,0,0);
    function createInstances(){scene.updateMatrixWorld(true);scene.traverse(o=>{
      if(!o.isMesh||Array.isArray(o.material)||!isDynamic(o)||o.material.isShaderMaterial||o.material.transparent)return;
      const m=o.material,key=o.geometry.uuid+'/'+(m.map?.uuid||'plain')+'/'+m.side+'/'+m.transparent+'/'+(m.alphaTest||0)+'/'+o.castShadow+'/'+o.receiveShadow;
      if(!instanceBuckets.has(key)){const material=m.clone();material.color.set(0xffffff);instanceBuckets.set(key,{geo:o.geometry,material,parts:[],cast:o.castShadow,receive:o.receiveShadow});}instanceBuckets.get(key).parts.push(o);o.layers.set(31);
    });
      for(const bucket of instanceBuckets.values()){const o=new THREE.InstancedMesh(bucket.geo,bucket.material,bucket.parts.length);o.instanceMatrix.setUsage(THREE.DynamicDrawUsage);o.frustumCulled=false;o.castShadow=bucket.cast;o.receiveShadow=bucket.receive;scene.add(o);bucket.instanced=o;for(let i=0;i<bucket.parts.length;i++)o.setColorAt(i,bucket.parts[i].material.color);}
    }
    function updateInstances(){scene.updateMatrixWorld(true);for(const bucket of instanceBuckets.values()){for(let i=0;i<bucket.parts.length;i++){const part=bucket.parts[i];let visible=true;for(let p=part;p;p=p.parent)if(!p.visible){visible=false;break;}bucket.instanced.setMatrixAt(i,visible?part.matrixWorld:hiddenMatrix);}bucket.instanced.instanceMatrix.needsUpdate=true;}}
    scene.add(new THREE.HemisphereLight(0xe8efe7,0x68604a,2.0));
    const sun=new THREE.DirectionalLight(0xffe1ae,3.1);sun.position.set(-26,48,32);sun.target.position.set(0,12,0);scene.add(sun.target);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:25,bottom:-25,near:1,far:100});sun.shadow.normalBias=.015;sun.shadow.bias=-.00008;scene.add(sun);
    const fill=new THREE.DirectionalLight(0xd7e9ef,1.05);fill.position.set(30,40,20);scene.add(fill);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.ShadowMaterial({color:0x6c6e62,opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.14;ground.receiveShadow=true;scene.add(ground);
    /* ENVIRONMENT_SOURCE */
    const tower=buildTower();createInstances();
    const overviewBounds=new THREE.Box3().setFromObject(tower.root),viewRight=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),viewUp=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
    let minViewX=Infinity,maxViewX=-Infinity,minViewY=Infinity,maxViewY=-Infinity;
    for(const x of [overviewBounds.min.x,overviewBounds.max.x])for(const y of [overviewBounds.min.y,overviewBounds.max.y])for(const z of [overviewBounds.min.z,overviewBounds.max.z]){const point=new THREE.Vector3(x,y,z),vx=point.dot(viewRight),vy=point.dot(viewUp);minViewX=Math.min(minViewX,vx);maxViewX=Math.max(maxViewX,vx);minViewY=Math.min(minViewY,vy);maxViewY=Math.max(maxViewY,vy);}
    const overviewY=((minViewY+maxViewY)/2-viewUp.x*.8)/viewUp.y,overviewHeight=maxViewY-minViewY,overviewWidth=maxViewX-minViewX;
    const composer=new EffectComposer(renderer),pixelPass=new RenderPixelatedPass(1,scene,camera,{normalEdgeStrength:.018,depthEdgeStrength:.045});
    pixelPass.pixelatedMaterial.fragmentShader=pixelPass.pixelatedMaterial.fragmentShader.replace('gl_FragColor = texel * Strength;','gl_FragColor = vec4(texel.rgb * Strength, texel.a);');composer.addPass(pixelPass);
    const ao=new SSAOPass(scene,camera,1,1,8);ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA=0;ao.depthRenderMaterial.defines.PERSPECTIVE_CAMERA=0;ao.kernelRadius=.24;ao.minDistance=.00005;ao.maxDistance=.0016;
    const aoResize=ao.setSize.bind(ao);ao.setSize=(w,h)=>aoResize(Math.ceil(w*.65),Math.ceil(h*.65));composer.addPass(ao);composer.addPass(new OutputPass());
    const motion=matchMedia('(prefers-reduced-motion: reduce)');let reduced=motion.matches,active=true,visible=true,contextLost=false,last=0,clock=0,budget=0;
    const totalLevels=tower.floors+1;
    let view='overview',structural=false,selectedFloor=0,buildRunning=false,buildProgress=totalLevels,targetY=tower.height*.48,currentY=targetY,targetSpan=tower.height*1.13,currentSpan=targetSpan,aspect=1,width=0,height=0;
    const floorRange=document.getElementById('floor-range'),floorOutput=document.getElementById('floor-output'),assembly=document.getElementById('assembly'),assemblyRange=document.getElementById('assembly-range'),buildButton=document.getElementById('build-view'),detailButton=document.getElementById('detail-view'),structureButton=document.getElementById('structure-view'),overviewButton=document.getElementById('overview-view');
    floorRange.max=String(tower.floors);assemblyRange.max=String(totalLevels);
    function targetCamera(){if(view==='overview'){targetY=overviewY;targetSpan=Math.max(overviewHeight*Math.max(1.10,height/Math.max(150,height-200)),overviewWidth/(aspect*.86));}else if(view==='build'){targetY=Math.max(3.0,Math.min(tower.height-3,buildProgress*tower.spacing-tower.spacing*.40));targetSpan=Math.max(15,19.5/aspect);}else{targetY=selectedFloor*tower.spacing+tower.spacing*.30+(structural?selectedFloor*.132:0);targetSpan=Math.max(12.5,19.5/aspect);}}
    function updateCamera(snap=false,dt=.016){targetCamera();const t=snap||reduced?1:1-Math.exp(-dt*6);currentY=THREE.MathUtils.lerp(currentY,targetY,t);currentSpan=THREE.MathUtils.lerp(currentSpan,targetSpan,t);const focus=new THREE.Vector3(.8,currentY,0);camera.position.copy(focus).addScaledVector(direction,150);camera.lookAt(focus);camera.top=currentSpan/2;camera.bottom=-currentSpan/2;camera.left=-currentSpan*aspect/2;camera.right=currentSpan*aspect/2;camera.updateProjectionMatrix();}
    function controls(){overviewButton.setAttribute('aria-pressed',String(view==='overview'));detailButton.setAttribute('aria-pressed',String(view==='detail'));structureButton.setAttribute('aria-pressed',String(structural));buildButton.setAttribute('aria-pressed',String(view==='build'));buildButton.textContent=view==='build'?(buildRunning?'暂停搭建':'继续搭建'):'搭建';floorRange.value=String(selectedFloor);const l=tower.layers[selectedFloor];floorOutput.textContent=(selectedFloor===tower.floors?'RF':String(selectedFloor+1).padStart(2,'0')+'F')+' · '+l.label;floorRange.setAttribute('aria-valuetext',floorOutput.textContent);floorOutput.hidden=view==='overview';document.getElementById('floor-control').hidden=view==='build';assembly.hidden=view!=='build';assemblyRange.value=String(buildProgress);document.getElementById('assembly-output').textContent=Math.min(tower.floors,Math.floor(buildProgress))+' / '+tower.floors;}
    function apply(){tower.setState({mode:structural?'structure':'complete',progress:view==='build'?buildProgress:totalLevels,explode:structural?.24:0});updateInstances();renderer.shadowMap.needsUpdate=true;controls();updateCamera(reduced);render();ensureFrame();}
    function overview(){view='overview';buildRunning=false;structural=false;apply();}
    function detail(level=selectedFloor){selectedFloor=THREE.MathUtils.clamp(Math.round(level),0,tower.floors);view='detail';buildRunning=false;apply();}
    overviewButton.addEventListener('click',overview);detailButton.addEventListener('click',()=>detail());structureButton.addEventListener('click',()=>{structural=!structural;buildRunning=false;if(view==='build')view='overview';apply();});
    buildButton.addEventListener('click',()=>{if(view==='build'){buildRunning=!buildRunning;}else{view='build';structural=false;buildProgress=.02;buildRunning=!reduced;}apply();});
    floorRange.addEventListener('input',()=>detail(Number(floorRange.value)));assemblyRange.addEventListener('input',()=>{buildProgress=Number(assemblyRange.value);buildRunning=false;apply();});
    let wheel=0;stage.addEventListener('wheel',e=>{e.preventDefault();if(view!=='detail'){view='detail';buildRunning=false;}wheel+=e.deltaY;const steps=Math.trunc(wheel/75);if(steps){wheel-=steps*75;selectedFloor=THREE.MathUtils.clamp(selectedFloor-steps,0,tower.floors);}apply();},{passive:false});
    let drag=null;stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={y:e.clientY,floor:selectedFloor};stage.setPointerCapture(e.pointerId);});stage.addEventListener('pointermove',e=>{if(!drag)return;if(Math.abs(e.clientY-drag.y)>6){view='detail';selectedFloor=THREE.MathUtils.clamp(Math.round(drag.floor+(e.clientY-drag.y)/65),0,tower.floors);buildRunning=false;apply();}});stage.addEventListener('pointerup',()=>{drag=null;});stage.addEventListener('pointercancel',()=>{drag=null;});
    document.addEventListener('keydown',e=>{if(/INPUT|BUTTON/.test(document.activeElement.tagName))return;if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();detail(selectedFloor+(e.key==='ArrowUp'?1:-1));}if(e.key==='Home')overview();});
    function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;width=w;height=h;aspect=w/h;const px=w<600?1:1.25;renderer.setSize(Math.round(w/px),Math.round(h/px),false);composer.setSize(Math.round(w/px),Math.round(h/px));updateCamera(true);render();}
    let frames=0;
    function render(){if(contextLost)return;renderer.info.reset();tower.prepareReflection(renderer,camera);composer.render();frames++;if(window.__TOWER__)Object.assign(window.__TOWER__,{frames,time:clock%12,view,selectedFloor,structural,buildProgress,buildRunning,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});}
    function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
    function ensureFrame(){if(!raf&&active&&visible&&!document.hidden&&!contextLost)raf=requestAnimationFrame(frame);}
    function frame(now){raf=0;if(!active||!visible||document.hidden||contextLost)return;const dt=last?Math.min((now-last)/1000,.08):0;last=now;budget+=dt;
      const movingCamera=Math.abs(currentY-targetY)>.003||Math.abs(currentSpan-targetSpan)>.003;
      if(!reduced||movingCamera||buildRunning){if(budget>=1/30||!dt){const elapsed=Math.max(budget,1/60);budget%=1/30;if(!reduced)clock+=elapsed;
        if(buildRunning){buildProgress=Math.min(totalLevels,buildProgress+elapsed*.48);tower.setState({progress:buildProgress});controls();renderer.shadowMap.needsUpdate=true;if(buildProgress>=totalLevels){buildRunning=false;view='overview';controls();}}
        updateCamera(false,elapsed);tower.update(clock);render();}
        ensureFrame();
      }else last=0;
    }
    window.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='diorama:active')return;active=e.data.active===true;if(active){resize();ensureFrame();}else stop();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else ensureFrame();});new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)ensureFrame();else stop();}).observe(stage);
    motion.addEventListener('change',e=>{reduced=e.matches;if(reduced)buildRunning=false;controls();ensureFrame();});window.addEventListener('pagehide',stop);window.addEventListener('pageshow',ensureFrame);window.addEventListener('resize',resize,{passive:true});
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;stop();loading.hidden=false;loading.textContent='图形暂时中断，等待恢复';});renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;loading.hidden=true;resize();ensureFrame();});
    window.__TOWER__={ready:false,floors:tower.floors,camera:'fixed orthographic',bakedMeshes,bakedTriangles,offline:true,inspect:()=>tower.inspect(),selectFloor:detail,setStructure:value=>{structural=value;apply();},overview,inspectBuild:p=>{view='build';buildRunning=false;buildProgress=p;apply();updateCamera(true);tower.update(0);render();return tower.inspect();},inspectAt:(t,draw=true)=>{stop();clock=t;tower.update(t);if(draw)render();return tower.inspect();}};
    tower.update(0);controls();resize();window.__TOWER__.ready=true;loading.hidden=true;parent.postMessage({type:'diorama:ready',scene:'tower'},'*');ensureFrame();
  }catch(error){cancelAnimationFrame(raf);console.error(error);window.__TOWER__={ready:false,error:String(error)};loading.hidden=false;loading.textContent='场景暂时无法显示，请用支持 WebGL 2 的浏览器打开。';}
})();
