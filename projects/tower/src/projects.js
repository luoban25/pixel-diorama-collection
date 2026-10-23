function projectContext(scene,rotation=0){
  let seed=8317;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},materials=new Map();
  const mat=(color,roughness=.85,metalness=0)=>{const key=color+'/'+roughness+'/'+metalness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);};
  const box=(w,h,d,m,x,y,z,parent=scene)=>primitives.box(w,h,d,m,x,y,z,parent);
  const cyl=(rt,rb,h,m,x,y,z,n=10,parent=scene)=>primitives.cyl(rt,rb,h,m,x,y,z,n,parent);
  const sphere=(radius,m,x,y,z,parent=scene,detail=1)=>primitives.sphere(radius,m,x,y,z,parent,detail);
  const beam=(a,end,radius,m,parent=scene,n=6)=>primitives.beam(a,end,radius,m,parent,n);
  const camera=projectCamera.clone();camera.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-rotation));
  function roundedSlab(w,d,h,radius,m,y){
    const shape=new THREE.Shape(),x=-w/2,z=-d/2,r=radius;shape.moveTo(x+r,z);shape.lineTo(x+w-r,z);shape.quadraticCurveTo(x+w,z,x+w,z+r);shape.lineTo(x+w,z+d-r);shape.quadraticCurveTo(x+w,z+d,x+w-r,z+d);shape.lineTo(x+r,z+d);shape.quadraticCurveTo(x,z+d,x,z+d-r);shape.lineTo(x,z+r);shape.quadraticCurveTo(x,z,x+r,z);
    const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.055,bevelThickness:.035,curveSegments:5});geo.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geo,m);mesh.position.y=y;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;
  }
  return{mat,rand,box,cyl,sphere,beam,camera,roundedSlab};
}
function originalBasketball(){
  const scene=new THREE.Scene(),{mat,rand,box,cyl,sphere,beam,camera}=projectContext(scene,Math.PI/2);
  /* PROJECT_BASKETBALL */
  const env=buildEnvironment();
  return{root:scene,...env,inspect:()=>env.actionReview()};
}
function originalPond(){
  const scene=new THREE.Scene(),groundY=.52,{mat,rand,box,cyl,sphere,beam,camera,roundedSlab}=projectContext(scene);
  /* PROJECT_POND */
  const env=buildEnvironment();
  const ambient=new THREE.HemisphereLight(0xe9e6da,0x60543c,2.2);ambient.layers.set(2);scene.add(ambient);
  const light=new THREE.DirectionalLight(0xffe2b0,2.4);light.layers.set(2);light.position.set(-8,15,8);scene.add(light);
  env.dynamicRoot.userData.reflectable=true;
  return{root:scene,...env,inspect:()=>({anglers:env.anglers.map(p=>({lift:p.lift,cycle:p.cycle,head:p.headPivot.quaternion.toArray()})),fish:env.fish.map(f=>f.root.position.toArray()),waterPhase:env.waterUniforms.phase.value,fishingInterval:3})};
}
function originalCricket(){
  const scene=new THREE.Scene(),groundY=.52,{mat,rand,box,cyl,sphere,beam,camera,roundedSlab}=projectContext(scene);
  /* PROJECT_CRICKET */
}
function installProject(parent,id,availableHeight,opening={width:11.90,depth:9.044,surface:.35}){
  const factories={basketball:originalBasketball,pond:originalPond,cricket:originalCricket},project=factories[id](),root=project.root;
  project.update(0);root.rotation.y=id==='basketball'?Math.PI/2:0;root.updateWorldMatrix(true,true);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  // Fit the actual terrain edge to the floor opening, independently of trees and poles.
  const scale=id==='basketball'?opening.width/size.x:opening.width/25,sourceGround=id==='basketball'?0:.52;
  const originX=id==='basketball'?-center.x*scale:0,originZ=id==='basketball'?-center.z*scale:0;
  root.scale.setScalar(scale);root.position.set(originX,opening.surface-sourceGround*scale,originZ);root.updateMatrix();
  if(id==='basketball'){
    const filler=canvasTexture(256,192,ctx=>{ctx.fillStyle='#a4a284';ctx.fillRect(0,0,256,192);for(let j=0;j<4000;j++){ctx.globalAlpha=.10+rand()*.15;ctx.fillStyle=['#66764f','#dad2ae','#7e8960','#b7ae8e'][j%4];ctx.fillRect(rand()*256,rand()*192,1+rand()*4,1+rand()*3);}ctx.globalAlpha=1;});
    const backing=new THREE.Mesh(new THREE.PlaneGeometry(opening.width,opening.depth),new THREE.MeshStandardMaterial({map:filler,roughness:1}));backing.rotation.x=-Math.PI/2;backing.position.y=opening.surface-.012;backing.receiveShadow=true;backing.name='Terrain extended to stone floor opening';const backingRoot=new THREE.Group();parent.add(backingRoot);backingRoot.add(backing);batchGroup(backingRoot);
  }
  const placement=root.matrix.clone(),projectInverse=new THREE.Matrix4(),localCamera=projectCamera.clone(),reflectionReview={dynamicMeshes:0,localLighting:false,dynamicLayer:false};parent.add(root);
  const withIdentity=callback=>{const savedParent=root.parent;root.parent=null;root.matrixAutoUpdate=false;root.matrix.identity();root.matrixWorld.identity();try{return callback();}finally{root.parent=savedParent;root.matrix.copy(placement);root.matrixAutoUpdate=true;root.updateWorldMatrix(true,true);}};
  function update(t){withIdentity(()=>project.update(((t%12)+12)%12));}
  function prepareReflection(renderer,camera){
    if(id!=='pond')return;for(let p=root;p;p=p.parent)if(!p.visible)return;
    root.updateWorldMatrix(true,true);projectInverse.copy(root.matrixWorld).invert();
    localCamera.copy(camera,false);localCamera.layers.enable(2);localCamera.layers.enable(31);localCamera.position.copy(camera.position).applyMatrix4(projectInverse);
    const worldQ=root.getWorldQuaternion(new THREE.Quaternion()).invert();localCamera.quaternion.copy(camera.quaternion).premultiply(worldQ);
    localCamera.left=camera.left/scale;localCamera.right=camera.right/scale;localCamera.top=camera.top/scale;localCamera.bottom=camera.bottom/scale;localCamera.near=.01;localCamera.far=1000;localCamera.updateProjectionMatrix();localCamera.updateMatrixWorld(true);
    reflectionReview.dynamicMeshes=0;root.traverse(o=>{if(!o.isMesh||!o.layers.isEnabled(31)||!localCamera.layers.test(o.layers))return;for(let p=o;p;p=p.parent)if(p.userData.reflectable){reflectionReview.dynamicMeshes++;break;}});reflectionReview.localLighting=localCamera.layers.isEnabled(2);reflectionReview.dynamicLayer=localCamera.layers.isEnabled(31);
    withIdentity(()=>project.prepareReflection(renderer,localCamera));
    project.waterUniforms.reflectionMatrix.value.multiply(projectInverse);project.waterUniforms.projectWorldInverse.value.copy(projectInverse);
  }
  const placementInfo={scale,rotationY:root.rotation.y,position:root.position.toArray(),sourceSize:size.toArray(),sourceGround,floorSurface:opening.surface,footprint:{width:opening.width,depth:opening.depth},terrainMatchesFloor:true};
  function inspect(){
    root.updateWorldMatrix(true,true);const current=new THREE.Box3().setFromObject(root),data=project.inspect();
    if(id==='basketball')for(const play of data.plays)play.rim=root.localToWorld(new THREE.Vector3(...play.rim)).toArray();
    return{id,reusedOriginal:true,placement:placementInfo,bounds:{min:current.min.toArray(),max:current.max.toArray()},...(id==='pond'?{reflection:{...reflectionReview}}:{}),animation:data};
  }
  return{id,root,project,update,prepareReflection,inspect};
}
