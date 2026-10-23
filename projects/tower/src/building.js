/* TOWER_PROPS */
/* TOWER_ARCHITECTURE */
/* TOWER_PROJECTS */
function buildTower(){
  const P=towerProps(),{M,g,b,c,r,s,tor,text,plant,planter,tree}=P,N=3,H=6.4,root=new THREE.Group();scene.add(root);
  const A={W:12.65,D:9.80,innerW:11.90,innerD:9.044,column:.76,H,surface:.35,wallX:6.28,wallThickness:.48,doorZ:3.25};
  const architecture=buildingArchitecture(P,A),{sb,slab,rail,stairs,wall,mossLevel,pipeLevel,foundationDetails,roofAccess}=architecture;
  const layers=[],modules=[],types=['basketball','pond','cricket'],names={basketball:'街头篮球',pond:'秋日钓鱼池塘',cricket:'板球场'};
  const foundation=g(root);sb(foundation,1.25,-.32,0,17.2,.65,11.5,true);sb(foundation,1.25,.035,0,17.4,.13,11.7);
  for(const x of [-6.0,0,6.0])for(const z of [-4.45,4.45]){sb(foundation,x,-.79,z,1.16,.54,1.16);sb(foundation,x,-1.10,z,1.52,.10,1.52,true);}
  for(let x=-6.65;x<9.5;x+=.75)for(let z=-5.45;z<5.6;z+=.75){const tile=b(foundation,x,.12,z,.71,.035,.71,(Math.floor(x*3+z*2)%3)?M.light:M.concrete);tile.castShadow=false;}
  planter(foundation,-5.2,5.1,1.8,.48);planter(foundation,5.4,5.1,1.8,.48);plant(foundation,-6.4,-4.8,.9);plant(foundation,7.7,-4.8,.9);
  foundationDetails(foundation);
  for(let i=0;i<N;i++){
    const parent=g(root,0,.19+i*H,0),structure=g(parent),interior=g(parent),exterior=g(parent),stairsRoot=g(parent),walls=g(parent);
    slab(structure);
    for(const x of [-6.0,0,6.0])for(const z of [-4.45,4.45]){sb(structure,x,H/2,z,A.column,H,A.column);sb(structure,x,.18,z,.94,.32,.94);sb(structure,x,H-.37,z,.94,.32,.94);}
    for(const z of [-4.45,4.45])sb(structure,0,H-.35,z,12.76,.70,.76);for(const x of [-6.0,0,6.0])sb(structure,x,H-.35,0,.76,.70,9.66);
    const imported=installProject(interior,types[i],H,{width:A.innerW,depth:A.innerD,surface:A.surface});modules.push(imported);
    rail(exterior,-6.15,4.78,-4.8,4.78,.70,M.iron,.32);rail(exterior,4.8,4.78,6.15,4.78,.70,M.iron,.32);rail(exterior,-6.19,-4.66,-6.19,4.78,.74,M.iron,.32);
    for(const x of [-5.8,5.8])plant(exterior,x,4.57,.62,.32,i);
    mossLevel(exterior,i);wall(walls,i);pipeLevel(exterior,i);
    text(exterior,String(i+1).padStart(2,'0')+' / '+['BASKETBALL','FISHING POND','CRICKET'][i],-2.8,-.055,4.92,2.5,.18,'#c7c4b3','#455b50');
    stairs(stairsRoot,i,i===N-1);layers.push({parent,structure,interior,exterior,walls,stairs:stairsRoot,type:types[i],label:names[types[i]],index:i,baseY:parent.position.y,project:imported});
  }
  const roof=g(root,0,N*H+.19,0),roofStructure=g(roof),roofInterior=g(roof),roofWalls=g(roof),roofExterior=g(roof);
  sb(roofStructure,0,0,0,A.W,.64,A.D);for(const z of [-4.78,4.78])rail(roofInterior,-6.15,z,6.15,z,.75,M.iron,.32);rail(roofInterior,-6.19,-4.78,-6.19,4.78,.75,M.iron,.32);
  for(const x of [-4.9,-2.5,.0,2.5])planter(roofInterior,x,3.9,1.6,.48);
  b(roofInterior,4.45,.77,-2.8,2.0,1.54,2.0,M.light);b(roofInterior,4.45,1.58,-2.8,2.15,.12,2.15,M.oak);c(roofInterior,4.45,2.25,-2.8,.58,.58,1.27,M.blue,16);c(roofInterior,4.45,2.93,-2.8,.48,.58,.12,M.blue,16);for(const y of [1.70,2.0,2.52,2.85])tor(roofInterior,4.45,y,-2.8,.59,.02,M.iron,Math.PI/2);
  for(const x of [-4.0,-1.5])for(const z of [-2.2,.4])b(roofInterior,x,.65,z,1.9,.12,1.7,M.navy);for(const x of [-4.0,-1.5])for(let j=0;j<5;j++)b(roofInterior,x-.8+j*.4,.72,-2.2, .016,.01,1.62,M.blue);
  b(roofInterior,5.45,2.0,-3.8,.045,2.8,.045,M.iron);for(const x of [5.2,5.7]){r(roofInterior,[5.45,2.65,-3.8],[x,2.65,-3.8],.015,M.iron);b(roofInterior,x,2.96,-3.8,.055,.68,.08,M.light);}
  roofAccess(roofWalls,N);mossLevel(roofExterior,N);
  layers.push({parent:roof,structure:roofStructure,interior:roofInterior,walls:roofWalls,exterior:roofExterior,stairs:new THREE.Group(),type:'roof',label:'屋顶平台',index:N,baseY:roof.position.y});
  batchGroup(foundation);
  for(const layer of layers){batchGroup(layer.structure);batchGroup(layer.exterior);batchGroup(layer.walls);batchGroup(layer.stairs);if(layer.project)batchGroup(layer.project.root);else batchGroup(layer.interior);}
  let mode='complete',progress=N+1,explode=0;
  function setState(next={}){if(next.mode)mode=next.mode;if(next.progress!==undefined)progress=next.progress;if(next.explode!==undefined)explode=next.explode;
    for(const l of layers){const q=THREE.MathUtils.clamp(progress-l.index,0,1),u=q*q*(3-2*q);l.parent.visible=q>0;l.parent.position.y=l.baseY+(1-u)*1.2+explode*l.index*.55;l.interior.visible=mode!=='structure'&&q>.67;l.exterior.visible=mode!=='structure'&&q>.84;l.walls.visible=mode!=='structure'&&q>.57;l.stairs.visible=q>.35;}
  }
  function update(t){for(const module of modules)module.update(t);updateInstances();}
  function prepareReflection(renderer,camera){for(const module of modules)module.prepareReflection(renderer,camera);}
  function inspect(){const projects=modules.map(m=>m.inspect());return{floors:N,levels:N+1,spacing:H,height:N*H+3.8,architecture:architecture.stats,mode,progress,visibleLevels:layers.filter(l=>l.parent.visible).length,visibleInteriors:layers.filter(l=>l.parent.visible&&l.interior.visible).length,visibleWalls:layers.filter(l=>l.parent.visible&&l.walls.visible).length,stairFlights:N*2,columnBays:6,reusedProjects:types,types:layers.map(l=>l.type),projects,athletes:projects[0].animation.players.length,basketball:projects[0].animation};}
  setState();return{root,layers,foundation,height:N*H+3.8,floors:N,spacing:H,modules,setState,update,prepareReflection,inspect};
}
