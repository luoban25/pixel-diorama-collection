/* Read-only geometry audit. No renderer, product files or generated pages are changed. */
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
let THREE;try{THREE=require('three');}catch{THREE=require(path.join(root,'../lunar-resin/node_modules/three'));}

function buildRig(){
  // CanvasTexture only needs an image object for this geometry-only inspection.
  global.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({measureText:()=>({width:1})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)})})};
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera();
  camera.position.set(-40,33,29);camera.lookAt(0,1,-1.5);
  let seed=8317;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const mats=new Map(),boxes=new THREE.BoxGeometry(1,1,1),cylinders=new Map(),spheres=new Map();
  function mat(color,roughness=.85,metalness=0){const key=color+'/'+roughness+'/'+metalness;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return mats.get(key);}
  function mesh(geo,material,x,y,z,sx,sy,sz,parent=scene){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,m,x,y,z,p=scene){return mesh(boxes,m,x,y,z,w,h,d,p);}
  function cyl(rt,rb,h,m,x,y,z,n=10,p=scene){const key=rt/rb+'/'+n;if(!cylinders.has(key))cylinders.set(key,new THREE.CylinderGeometry(rt/rb,1,1,n));return mesh(cylinders.get(key),m,x,y,z,rb,h,rb,p);}
  function sphere(radius,m,x,y,z,p=scene,n=1){if(!spheres.has(n))spheres.set(n,new THREE.IcosahedronGeometry(1,n));return mesh(spheres.get(n),m,x,y,z,radius,radius,radius,p);}
  function beam(a,b,rad,m,p=scene,n=6){a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);const mid=a.clone().add(b).multiplyScalar(.5),obj=cyl(rad,rad,a.distanceTo(b),m,mid.x,mid.y,mid.z,n,p);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());return obj;}
  let code=fs.readFileSync(path.join(root,'projects/basketball/src/basketball.js'),'utf8');
  for(const [mark,file]of Object.entries({BASKETBALL_OUTFITS:'outfits',BASKETBALL_PLAY:'play',BASKETBALL_ACTIONS:'actions'}))code=code.replace('/* '+mark+' */',fs.readFileSync(path.join(root,'projects/basketball/src/'+file+'.js'),'utf8'));
  return Function('THREE','scene','camera','rand','mat','box','cyl','sphere','beam',code+'\nreturn buildEnvironment();')(THREE,scene,camera,rand,mat,box,cyl,sphere,beam);
}

const planeCache=new Map();
function localPlanes(geo){
  if(planeCache.has(geo))return planeCache.get(geo);
  const attr=geo.getAttribute('position'),indices=geo.index,planes=[];
  const vertex=i=>new THREE.Vector3().fromBufferAttribute(attr,indices?indices.getX(i):i);
  geo.computeBoundingBox();const center=geo.boundingBox.getCenter(new THREE.Vector3());
  for(let i=0;i<(indices?indices.count:attr.count);i+=3){
    const a=vertex(i),b=vertex(i+1),c=vertex(i+2),normal=b.clone().sub(a).cross(c.clone().sub(a));
    if(normal.lengthSq()<1e-16)continue;
    const plane=new THREE.Plane().setFromCoplanarPoints(a,b,c);
    if(plane.distanceToPoint(center)>0)plane.negate();
    if(!planes.some(p=>p.normal.distanceToSquared(plane.normal)<1e-10&&Math.abs(p.constant-plane.constant)<1e-8))planes.push(plane);
  }
  planeCache.set(geo,planes);return planes;
}
function worldPlanes(mesh){return localPlanes(mesh.geometry).map(plane=>plane.clone().applyMatrix4(mesh.matrixWorld));}
function signedInterior(point,planes){let distance=-Infinity;for(const plane of planes)distance=Math.max(distance,plane.distanceToPoint(point));return distance;}
function rounded(value){return Math.round(value*1e6)/1e6;}
function worldVertices(mesh){const attr=mesh.geometry.getAttribute('position'),points=[],seen=new Set();for(let i=0;i<attr.count;i++){const point=new THREE.Vector3().fromBufferAttribute(attr,i),key=point.toArray().join('/');if(seen.has(key))continue;seen.add(key);points.push(point.applyMatrix4(mesh.matrixWorld));}return points;}
function bottomWithinX(mesh,minX,maxX){
  const vertices=worldVertices(mesh),candidates=vertices.filter(p=>p.x>=minX&&p.x<=maxX);
  // A convex box clipped against vertical seat boundaries reaches its lowest
  // retained point at a vertex or an edge-plane intersection. All vertex pairs
  // are harmless extra interior samples and avoid relying on BoxGeometry order.
  for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++)for(const x of [minX,maxX]){
    const a=vertices[i],b=vertices[j];if(Math.abs(b.x-a.x)<1e-10)continue;
    const t=(x-a.x)/(b.x-a.x);if(t>=0&&t<=1)candidates.push(a.clone().lerp(b,t));
  }
  return candidates.length?Math.min(...candidates.map(p=>p.y)):Infinity;
}

function audit(){
  const env=buildRig(),worst=new Map(),centerWorst=new Map(),seated=new Map(),ballWorst=new Map();
  const collars=env.people.map(person=>{
    const collar=person.torso.children.find(o=>o.isMesh&&o.geometry.type==='CylinderGeometry'&&Math.abs(o.position.y-.466)<1e-8);
    collar.geometry.computeBoundingBox();return {person:person.index,localDepth:rounded(collar.geometry.boundingBox.getSize(new THREE.Vector3()).z*collar.scale.z)};
  });
  let sampledVertices=0,frames=0;
  const note=(map,key,distance,person,arm,t,part,point,detail={})=>{
    if(!map.has(key)||distance<map.get(key).signedClearance)map.set(key,{person:person.index,arm:arm.side<0?'left':'right',time:t,part,signedClearance:distance,point:point.toArray(),...detail});
  };
  for(let frame=0;frame<=720;frame++){
    const t=frame/60;frames++;env.update(t);env.dynamicRoot.updateMatrixWorld(true);
    for(const person of env.people){
      const colliders={head:worldPlanes(person.head.children[0]),torso:worldPlanes(person.torso.children[0])};
      for(const arm of person.arms){
        const shoulder=arm.upper.getWorldPosition(new THREE.Vector3());
        for(const [part,node,length]of [['upper',arm.upper,.28],['forearm',arm.lower,.287]]){
          // Centerline tests prove deep penetration independent of limb thickness.
          for(let i=0;i<=24;i++){
            const point=new THREE.Vector3(0,-length*i/24,0).applyMatrix4(node.matrixWorld);
            for(const [kind,planes]of Object.entries(colliders)){
              if(kind==='torso'&&part==='upper'&&point.distanceTo(shoulder)<.082)continue;
              const d=signedInterior(point,planes);
              note(centerWorst,person.index+'/'+arm.side+'/'+kind,d,person,arm,t,part,point);
            }
          }
          // Actual skin and sleeve vertices catch intersections missed by a thin axis.
          for(const object of node.children){
            if(!object.isMesh)continue;
            const attr=object.geometry.getAttribute('position');
            for(let i=0;i<attr.count;i++){
              const point=new THREE.Vector3().fromBufferAttribute(attr,i).applyMatrix4(object.matrixWorld);
              sampledVertices++;
              for(const [kind,planes]of Object.entries(colliders)){
                // Small shoulder seams belong inside the body; hands and elbows do not.
                if(kind==='torso'&&part==='upper'&&point.distanceTo(shoulder)<.095)continue;
                const d=signedInterior(point,planes);
                const local=node.worldToLocal(point.clone());
                const isGarment=object.material!==arm.upper.children.find(o=>o.isMesh).material;
                note(worst,person.index+'/'+arm.side+'/'+kind,d,person,arm,t,part,point,{isGarment,nodeLocal:local.toArray().map(rounded),shoulderDistance:rounded(point.distanceTo(shoulder))});
              }
            }
          }
        }
      }
      for(let ballIndex=0;ballIndex<env.balls.length;ballIndex++){
        const ball=env.balls[ballIndex],shell=ball.children.find(o=>o.isMesh),ballCenter=ball.getWorldPosition(new THREE.Vector3());
        for(const [kind,collider]of [['head',person.head.children[0]],['torso',person.torso.children[0]]]){
          if(ballCenter.distanceTo(collider.getWorldPosition(new THREE.Vector3()))>.8)continue;
          const planes=colliders[kind];
          for(const point of worldVertices(shell)){
            const distance=signedInterior(point,planes),key=ballIndex+'/'+person.index+'/'+kind;
            if(!ballWorst.has(key)||distance<ballWorst.get(key).signedClearance)ballWorst.set(key,{ball:ballIndex,person:person.index,collider:kind,time:t,signedClearance:distance,point:point.toArray()});
          }
        }
      }
      if(person.mode==='seated'){
        if(!seated.has(person.index))seated.set(person.index,{index:person.index,shoeBottomMin:Infinity,shoeBottomMax:-Infinity,shoeFenceClearance:Infinity,pantsBottom:Infinity,pantsSeatClearance:Infinity});
        const entry=seated.get(person.index);
        for(const leg of person.legs){
          const pants=leg.upper.children.find(o=>o.isMesh&&o.geometry.type==='BoxGeometry');
          const bounds=new THREE.Box3().setFromObject(pants);
          entry.pantsBottom=Math.min(entry.pantsBottom,bounds.min.y);
          // Check only pants above a real seat plank; low corners outside the
          // front edge do not penetrate the seat even if their AABBs overlap.
          for(let j=0;j<4;j++){const center=7.82-(j-1.5)*.14;entry.pantsSeatClearance=Math.min(entry.pantsSeatClearance,bottomWithinX(pants,center-.06,center+.06)-.5425);}
          const soles=leg.lower.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry'&&o.scale.y<.035&&o.scale.z>.20);
          for(const sole of soles){const soleBounds=new THREE.Box3().setFromObject(sole);entry.shoeBottomMin=Math.min(entry.shoeBottomMin,soleBounds.min.y);entry.shoeBottomMax=Math.max(entry.shoeBottomMax,soleBounds.min.y);entry.shoeFenceClearance=Math.min(entry.shoeFenceClearance,soleBounds.min.x-7.12);}
        }
      }
    }
  }
  const format=record=>({...record,time:rounded(record.time),signedClearance:rounded(record.signedClearance),point:record.point.map(rounded)});
  const deepCenterPenetrations=[...centerWorst.entries()].filter(([key,r])=>r.signedClearance<-.003).map(([key,r])=>({collider:key.split('/')[2],...format(r)}));
  const isAllowedSeam=(key,r)=>key.endsWith('/torso')&&r.isGarment&&r.part==='upper'&&r.nodeLocal[1]>=-.15&&r.shoulderDistance<.17&&r.signedClearance>=-.012;
  const meshPenetrations=[...worst.entries()].filter(([key,r])=>r.signedClearance<-.003&&!isAllowedSeam(key,r)).map(([key,r])=>({collider:key.split('/')[2],...format(r)}));
  const allowedClothSeams=[...worst.entries()].filter(([key,r])=>r.signedClearance<0&&isAllowedSeam(key,r)).map(([key,r])=>({collider:'torso',...format(r)}));
  const closestHead=[...worst.entries()].filter(([key])=>key.endsWith('/head')).sort((a,b)=>a[1].signedClearance-b[1].signedClearance).slice(0,4).map(([key,r])=>format(r));
  const ballPenetrations=[...ballWorst.values()].filter(r=>r.signedClearance<-.003).map(format);
  const closestBall=[...ballWorst.values()].sort((a,b)=>a.signedClearance-b.signedClearance).slice(0,4).map(format);
  const seating=[...seated.values()].map(r=>Object.fromEntries(Object.entries({...r,shoeGroundClearanceMin:r.shoeBottomMin-.042}).map(([key,value])=>[key,typeof value==='number'?rounded(value):value])));
  const seatSafe=seating.every(r=>r.shoeGroundClearanceMin>=-.003&&r.shoeFenceClearance>=0&&r.pantsSeatClearance>=-.003);
  const report={passed:deepCenterPenetrations.length===0&&meshPenetrations.length===0&&ballPenetrations.length===0&&seatSafe&&collars.every(c=>c.localDepth<.16),frames,duration:12,fps:60,sampledVertices,normalJointSeamExclusion:.095,allowedGarmentSeamDepth:.012,collars,deepCenterPenetrations,meshPenetrations,ballPenetrations,allowedClothSeams,closestHead,closestBall,seating};
  console.log(JSON.stringify(report,null,2));
  if(!report.passed)process.exitCode=1;
  return report;
}
if(require.main===module){const report=audit();fs.mkdirSync(path.join(root,'previews'),{recursive:true});fs.writeFileSync(path.join(root,'previews/basketball-clipping-qa.json'),JSON.stringify(report,null,2));}
module.exports={audit,buildRig};
