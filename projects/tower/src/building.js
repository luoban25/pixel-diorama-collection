/* TOWER_PROPS */
/* TOWER_ARCHITECTURE */
/* TOWER_ROOFTOP */
/* TOWER_CONCERT */
/* TOWER_PROJECTS */
function buildTower(){
  const P=towerProps(),{M,g,b,c,r,s,tor,text,plant,planter,tree}=P,N=4,H=6.4,root=new THREE.Group();scene.add(root);
  const A={W:12.65,D:9.80,innerW:11.90,innerD:9.044,column:.76,H,surface:.35,wallX:6.28,wallThickness:.48,doorZ:3.25,floorCount:N};
  const architecture=buildingArchitecture(P,A),{sb,slab,rail,stairs,wall,mossLevel,pipeLevel,foundationDetails,roofAccess}=architecture;
  const layers=[],modules=[],types=['basketball','pond','cricket','concert'],names={basketball:'街头篮球',pond:'秋日钓鱼池塘',cricket:'板球场',concert:'现场演出'};
  const foundation=g(root);sb(foundation,1.25,-.32,0,17.2,.65,11.5,true);sb(foundation,1.25,.035,0,17.4,.13,11.7);
  for(const x of [-6.0,0,6.0])for(const z of [-4.45,4.45]){sb(foundation,x,-.79,z,1.16,.54,1.16);sb(foundation,x,-1.10,z,1.52,.10,1.52,true);}
  for(let x=-6.65;x<9.5;x+=.75)for(let z=-5.45;z<5.6;z+=.75){const tile=b(foundation,x,.12,z,.71,.035,.71,(Math.floor(x*3+z*2)%3)?M.light:M.concrete);tile.castShadow=false;}
  planter(foundation,-5.2,5.1,1.8,.48);planter(foundation,5.4,5.1,1.8,.48);plant(foundation,-6.4,-4.8,.9);plant(foundation,7.7,-4.8,.9);
  foundationDetails(foundation);
  for(let i=0;i<N;i++){
    const parent=g(root,0,.19+i*H,0),structure=g(parent),interior=g(parent),exterior=g(parent),stairsRoot=g(parent),walls=g(parent),cover=g(structure);cover.userData.batchBoundary=true;
    slab(structure);
    for(const x of [-6.0,0,6.0])for(const z of [-4.45,4.45]){const p=i===3?cover:structure;sb(p,x,H/2,z,A.column,H,A.column);sb(p,x,.18,z,.94,.32,.94);sb(p,x,H-.37,z,.94,.32,.94);}
    for(const z of [-4.45,4.45])sb(i===3?cover:structure,0,H-.35,z,12.76,.70,.76);for(const x of [-6.0,0,6.0])sb(i===3?cover:structure,x,H-.35,0,.76,.70,9.66);
    const imported=types[i]==='concert'?concertFloor(P,A,interior):installProject(interior,types[i],H,{width:A.innerW,depth:A.innerD,surface:A.surface});modules.push(imported);
    rail(exterior,-6.15,4.78,-4.8,4.78,.70,M.iron,.32);rail(exterior,4.8,4.78,6.15,4.78,.70,M.iron,.32);rail(exterior,-6.19,-4.66,-6.19,4.78,.74,M.iron,.32);
    for(const x of [-5.8,5.8])plant(exterior,x,4.57,.62,.32,i);
    mossLevel(exterior,i);wall(walls,i);pipeLevel(exterior,i);
    text(exterior,String(i+1).padStart(2,'0')+' / '+['BASKETBALL','FISHING POND','CRICKET','LIVE STAGE'][i],-2.8,-.055,4.92,2.5,.18,'#c7c4b3','#455b50');
    stairs(stairsRoot,i,i===N-1);layers.push({parent,structure,cover,interior,exterior,walls,stairs:stairsRoot,type:types[i],label:names[types[i]],index:i,baseY:parent.position.y,project:imported});
  }
  const roof=g(root,0,N*H+.19,0),roofStructure=g(roof),roofInterior=g(roof),roofWalls=g(roof),roofExterior=g(roof);
  sb(roofStructure,0,0,0,A.W,.64,A.D);
  const rooftop=rooftopTerrace(P,A,architecture,roofInterior,roofWalls,roofExterior);
  layers.push({parent:roof,structure:roofStructure,interior:roofInterior,walls:roofWalls,exterior:roofExterior,stairs:new THREE.Group(),type:'roof',label:'生活屋顶露台',index:N,baseY:roof.position.y});
  batchGroup(foundation);
  for(const layer of layers){if(layer.cover)batchGroup(layer.cover);batchGroup(layer.structure);batchGroup(layer.exterior);batchGroup(layer.walls);batchGroup(layer.stairs);if(layer.project)batchGroup(layer.project.root);else batchGroup(layer.interior);}
  let mode='complete',progress=N+1,explode=0,cutaway=null;
  function setState(next={}){if(next.mode)mode=next.mode;if(next.progress!==undefined)progress=next.progress;if(next.explode!==undefined)explode=next.explode;if(next.cutaway!==undefined)cutaway=next.cutaway;
    for(const l of layers){const q=THREE.MathUtils.clamp(progress-l.index,0,1),u=q*q*(3-2*q),opened=cutaway===l.index&&mode!=='structure';l.parent.visible=q>0&&(cutaway===null||l.index<=cutaway);l.parent.position.y=l.baseY+(1-u)*1.2+explode*l.index*.55;l.interior.visible=mode!=='structure'&&q>.67;l.exterior.visible=mode!=='structure'&&q>.84&&!opened;l.walls.visible=mode!=='structure'&&q>.57&&!opened;l.stairs.visible=q>.35&&!opened;if(l.cover)l.cover.visible=!opened;}
  }
  function update(t){for(const module of modules)module.update(t);rooftop.update(t);updateInstances();}
  function prepareReflection(renderer,camera){for(const module of modules)module.prepareReflection(renderer,camera);}
  function inspect(){const projects=modules.map(m=>m.inspect());return{floors:N,levels:N+1,spacing:H,height:N*H+6,architecture:architecture.stats,rooftop:rooftop.inspect(),mode,progress,roofVisible:roof.visible,visibleLevels:layers.filter(l=>l.parent.visible).length,visibleInteriors:layers.filter(l=>l.parent.visible&&l.interior.visible).length,visibleWalls:layers.filter(l=>l.parent.visible&&l.walls.visible).length,stairFlights:N*2,columnBays:6,reusedProjects:types.filter(id=>id!=='concert'),types:layers.map(l=>l.type),levelPositions:layers.map(l=>({type:l.type,y:l.parent.position.y})),projects,athletes:projects[0].animation.players.length,basketball:projects[0].animation};}
  setState();return{root,layers,foundation,height:N*H+6,floors:N,spacing:H,modules,setState,update,prepareReflection,inspect};
}
