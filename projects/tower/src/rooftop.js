function rooftopTerrace(P,A,architecture,interior,walls,exterior){
  const {M,g,b,c,r,s,tor,text}=P,S=A.surface,{door,moss,pipeCurve}=architecture;
  // Local seed: roof edits cannot move or recolor the three original scenes.
  let seed=72941;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const plasterMap=canvasTexture(256,256,ctx=>{
    ctx.fillStyle='#d8d0b9';ctx.fillRect(0,0,256,256);
    for(let i=0;i<12000;i++){ctx.globalAlpha=.025+random()*.09;ctx.fillStyle=i%3?'#716f63':'#fff8e3';ctx.fillRect(random()*256,random()*256,1+random()*3,1+random()*3);}
    for(let i=0;i<90;i++){const x=random()*256;ctx.globalAlpha=.025+random()*.05;ctx.fillStyle='#6b7161';ctx.fillRect(x,0,.5+random()*2,25+random()*150);}ctx.globalAlpha=1;
  });
  const cement=new THREE.MeshStandardMaterial({map:plasterMap,color:0xe5dfcf,roughness:.98});cement.userData={worldStone:true,tileSize:2.8};
  const cap=mat(0xc0b7a0),metal=mat(0x68736d,.73,.38),dark=mat(0x404c49,.8,.4),rust=mat(0x9c704b),wood=mat(0xc99552),woodDark=mat(0x705239),blue=mat(0x428898),orange=mat(0xc9782c),white=mat(0xe4ddc9);
  const stats={type:'lived-in rooftop terrace',clothes:0,flowerPots:0,trailingVines:0,chairs:3,table:true,waterTank:true,ladder:true,airConditioner:true,cat:true,solarPanels:0,entry:{x:6.18,z:A.doorZ,width:1.58},floorY:S,room:{min:[2.10,S,-3.60],max:[6.28,3.55,.35]},clothAngles:[]};
  const fixed=g(interior,0,S,0),garden=g(exterior,0,S,0),equipment=g(walls),clothes=[],moving=g(interior);moving.userData.dynamic=true;
  const leafMaterials=[mat(0x47673b),mat(0x718845),mat(0x94a148),mat(0xb0af4c)],flowerMaterials=[mat(0xd59c38),mat(0xc76338),mat(0xe0c578),mat(0xb34d35)];
  function foliage(p,x,y,z,scale=1,flowers=false){
    for(let k=0;k<11;k++){const a=random()*Math.PI*2,reach=(.10+random()*.24)*scale,h=(.20+random()*.45)*scale,tx=x+Math.sin(a)*reach,tz=z+Math.cos(a)*reach;
      r(p,[x,y,z],[tx,y+h,tz],.009*scale,leafMaterials[0]);
    for(let j=0;j<6;j++){const t=.25+j*.125,px=x+(tx-x)*t,pz=z+(tz-z)*t,sz=(.070+random()*.055)*scale,leaf=b(p,px+Math.cos(a)*sz*.65,y+h*t,pz+Math.sin(a)*sz*.65,sz*1.5,sz*.32,sz,leafMaterials[(k+j)%4]);leaf.rotation.set(random()*.4,a,random()*.6-.3);}
      if(flowers){const material=flowerMaterials[k%4];for(let j=0;j<5;j++){const a2=j/5*6.28;b(p,tx+Math.cos(a2)*.045*scale,y+h,tz+Math.sin(a2)*.045*scale,.055*scale,.038*scale,.055*scale,material);}b(p,tx,y+h+.018*scale,tz,.032*scale,.02*scale,.032*scale,M.gold);}
    }
  }
  function pot(p,x,z,scale=1,flowers=false){const q=g(p,x,0,z),height=.36*scale,rad=.22*scale,material=stats.flowerPots%3===0?cement:stats.flowerPots%3===1?rust:dark;
    c(q,0,height/2,0,rad,rad*.74,height,material,12);tor(q,0,height-.014,0,rad,.023*scale,material,Math.PI/2);c(q,0,height-.012,0,rad*.87,rad*.87,.018,M.soil,12);foliage(q,0,height,0,scale,flowers);stats.flowerPots++;
  }
  function bed(x,z,w,d){b(garden,x,.20,z,w,.40,d,cement);b(garden,x,.405,z,w-.10,.026,d-.10,M.soil);for(let j=0;j<Math.ceil(w*3);j++)foliage(garden,x+(random()-.5)*(w-.2),.42,z+(random()-.5)*(d-.2),.75,j%3===0);}
  function vine(p,x,z,length,side=false){const sign=side?-1:1,points=[];for(let j=0;j<12;j++){const t=j/11,xx=x+(side?Math.sin(t*5)*.05:Math.sin(t*7)*.11),zz=z+(side?Math.sin(t*7)*.11:Math.sin(t*5)*.05);points.push([xx,.26-length*t,zz]);if(j){r(p,points[j-1],points[j],.011,leafMaterials[0]);}for(const direction of [-1,1]){const lx=xx+(side?.025:direction*.08),lz=zz+(side?direction*.08:.025);const leaf=b(p,lx,.26-length*t,lz,.11,.055,.09,leafMaterials[(j+1)%4]);leaf.rotation.set(.1,j*.8,sign*.4);if(j%3===0){b(p,lx+direction*.05,.30-length*t,lz,.06,.035,.06,leafMaterials[2]);}}}stats.trailingVines++;}
  // Weathered, individually laid pavers with sparse cool blue repair tiles.
  const paving=[mat(0xc8bea1),mat(0xd8ceb3),mat(0xb6b6a5),mat(0xb4bdba),mat(0x8da5ac),mat(0xd0c8b4)];
  b(fixed,0,-.012,0,A.W,.045,A.D,cement);
  for(let ix=0;ix<17;ix++)for(let iz=0;iz<13;iz++){const x=-5.95+ix*.735,z=-4.48+iz*.735;if(x>1.96&&z<.47&&z>-3.77)continue;const material=paving[random()<.13?4:Math.floor(random()*4)];b(fixed,x,.028+(random()-.5)*.009,z,.712,.045,.712,material);if(random()<.07)r(fixed,[x-.30,.055,z-.22],[x+.05,.056,z+.17],.005,M.edge);}
  // Concrete edge skin and coping leave the thick structural roof below intact.
  for(const z of [-4.91,4.91]){b(exterior,0,-.015,z,A.W,.58,.075,cement);b(fixed,0,.14,z,A.W+.06,.28,.24,cement);b(fixed,0,.30,z,A.W+.15,.07,.32,cap);}
  b(exterior,-6.35,-.015,0,.075,.58,A.D,cement);b(fixed,-6.25,.14,0,.24,.28,A.D,cement);b(fixed,-6.25,.30,0,.32,.07,A.D+.1,cap);
  for(const [z,d]of[[-1.22,6.90],[4.52,.76]]){b(fixed,6.25,.14,z,.24,.28,d,cement);b(fixed,6.25,.30,z,.32,.07,d,cap);}
  // Fine diamond chain-link wire is cut out of an alpha canvas, not a solid sheet.
  const wireMap=canvasTexture(128,128,ctx=>{ctx.clearRect(0,0,128,128);ctx.strokeStyle='#59645d';ctx.lineWidth=3.2;for(let j=-128;j<256;j+=64){ctx.beginPath();ctx.moveTo(j,0);ctx.lineTo(j+128,128);ctx.stroke();ctx.beginPath();ctx.moveTo(j,128);ctx.lineTo(j+128,0);ctx.stroke();}});wireMap.wrapS=wireMap.wrapT=THREE.RepeatWrapping;
  const wireMaterial=new THREE.MeshStandardMaterial({map:wireMap,side:THREE.DoubleSide,alphaTest:.45,roughness:.9});
  function fence(x1,z1,x2,z2){const length=Math.hypot(x2-x1,z2-z1),height=1.52,y=.36,n=Math.ceil(length/1.75);
    for(let j=0;j<=n;j++){const t=j/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;c(fixed,x,y+height/2,z,.036,.043,height,metal,8);s(fixed,x,y+height+.035,z,.052,cap);b(fixed,x,y+.025,z,.14,.055,.14,dark);}
    for(const h of [.03,height])r(fixed,[x1,y+h,z1],[x2,y+h,z2],.025,metal);
    const geometry=new THREE.PlaneGeometry(length,height-.06),uv=geometry.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,uv.getX(j)*length/.48,uv.getY(j)*(height-.06)/.48);
    const mesh=new THREE.Mesh(geometry,wireMaterial);mesh.position.set((x1+x2)/2,y+height/2,(z1+z2)/2);mesh.rotation.y=-Math.atan2(z2-z1,x2-x1);mesh.castShadow=false;mesh.receiveShadow=true;fixed.add(mesh);
  }
  fence(-6.18,4.77,6.18,4.77);fence(-6.18,-4.77,6.18,-4.77);fence(-6.18,-4.77,-6.18,4.77);fence(6.18,-4.77,6.18,2.45);fence(6.18,4.05,6.18,4.77);
  // The door faces the terrace; a clear path connects it to the existing stair landing.
  const roomTop=3.55,roomLow=S,wallHeight=roomTop-roomLow;
  b(equipment,2.10,(roomTop+roomLow)/2,-1.63,.25,wallHeight,3.94,cement);b(equipment,6.28,(roomTop+roomLow)/2,-1.63,.30,wallHeight,3.94,cement);b(equipment,4.19,(roomTop+roomLow)/2,-3.60,4.43,wallHeight,.25,cement);
  for(const [x,w]of[[2.71,1.22],[5.57,1.68]])b(equipment,x,(roomTop+roomLow)/2,.35,w,wallHeight,.26,cement);
  b(equipment,4.05,(2.95+roomTop)/2,.35,1.58,roomTop-2.95,.26,cement);b(equipment,4.19,3.64,-1.63,4.68,.18,4.22,cement);
  door(equipment,3,true,{x:4.05,z:.51,yaw:0});
  for(const x of [2.15,3.10,5.1,6.2])r(equipment,[x,roomLow,.49],[x,roomTop,.49],.009,cap);
  for(let j=0;j<32;j++){const x=2.25+random()*3.9,z=-3.44+random()*3.45;b(equipment,x,3.743,z,.40+random()*.26,.025,.40+random()*.22,j%5===0?paving[4]:paving[j%3]);}
  for(const z of [-3.68,.46])b(equipment,4.18,3.81,z,4.61,.17,.13,cap);for(const x of [1.93,6.44])b(equipment,x,3.81,-1.61,.13,.17,4.28,cap);
  const stainMap=canvasTexture(128,256,ctx=>{ctx.clearRect(0,0,128,256);for(let j=0;j<130;j++){const x=random()*128,y=random()*160,h=20+random()*85;const fade=ctx.createLinearGradient(0,y,0,y+h);fade.addColorStop(0,'rgba(75,81,64,.22)');fade.addColorStop(1,'rgba(75,81,64,0)');ctx.fillStyle=fade;ctx.fillRect(x,y,1+random()*4,h);}}),stainMaterial=new THREE.MeshStandardMaterial({map:stainMap,transparent:true,opacity:.5,depthWrite:false,roughness:1});
  for(const [x,w]of[[2.72,1.1],[5.61,1.35]]){const patch=new THREE.Mesh(new THREE.PlaneGeometry(w,2.8),stainMaterial);patch.position.set(x,1.95,.485);equipment.add(patch);}
  for(const z of [-2.8,-.5]){const patch=new THREE.Mesh(new THREE.PlaneGeometry(1.5,2.9),stainMaterial);patch.position.set(6.438,1.95,z);patch.rotation.y=Math.PI/2;equipment.add(patch);}
  for(const points of [[[2.45,3.4,.49],[2.49,3.04,.49],[2.43,2.86,.49],[2.52,2.66,.49]],[[5.8,1.03,.49],[5.64,1.20,.49],[5.70,1.48,.49]],[[6.44,2.5,-3],[6.44,2.32,-2.85],[6.44,2.1,-2.90]]])for(let j=1;j<points.length;j++)r(equipment,points[j-1],points[j],.005,cap);
  // Outdoor AC: grille, circular fan, brackets and surface-mounted conduit.
  const ac=g(equipment,2.79,.86,.73);b(ac,0,.12,0,1.03,.77,.48,white);b(ac,0,.12,.252,.86,.62,.023,dark);tor(ac,-.13,.12,.28,.25,.028,metal);const rotor=g(moving,2.66,.98,1.02);for(let j=0;j<5;j++){const blade=b(rotor,0,.105,0,.075,.24,.012,metal);blade.rotation.z=j*6.28/5;blade.position.set(Math.sin(j*6.28/5)*.11,Math.cos(j*6.28/5)*.11,0);}for(let j=0;j<10;j++)b(ac,0,-.14+j*.058,.30,.83,.011,.014,white);for(const x of [-.37,.37]){b(ac,x,-.33,0,.06,.13,.65,dark);r(ac,[x,-.38,-.22],[x,-.07,-.22],.025,metal);}pipeCurve(equipment,[[3.23,.82,.70],[3.42,.82,.70],[3.42,.65,.46],[5.95,.65,.46]],.023,cap);
  text(equipment,'ROOF ACCESS',2.65,2.65,.493,.58,.30,'#d9d6c6','#637067');
  // Exposed ladder, tank rings, roof plumbing and a small vent.
  for(const z of [-1.56,-.95]){r(equipment,[6.51,.42,z],[6.51,4.02,z],.026,dark);pipeCurve(equipment,[[6.51,3.85,z],[6.51,4.03,z],[6.33,4.13,z],[6.18,3.96,z]],.026,dark);}
  for(let j=0;j<12;j++)r(equipment,[6.54,.55+j*.285,-1.56],[6.54,.55+j*.285,-.95],.022,metal);
  for(const y of [.65,2.10,3.45])for(const z of [-1.56,-.95])r(equipment,[6.32,y,z],[6.52,y,z],.022,metal);
  const tank=g(equipment,5.38,3.76,-2.48),tankMetal=new THREE.MeshStandardMaterial({color:0x879493,map:plasterMap,roughness:.63,metalness:.68});
  for(const x of [-.32,.32])for(const z of [-.32,.32])b(tank,x,.16,z,.07,.32,.07,dark);c(tank,0,.84,0,.53,.53,1.10,tankMetal,24);c(tank,0,1.41,0,.48,.54,.10,tankMetal,24);for(const y of [.32,.61,1.10,1.36])tor(tank,0,y,0,.54,.019,metal,Math.PI/2);c(tank,0,1.49,0,.12,.16,.08,dark,12);r(tank,[.23,1.52,0],[.23,1.72,0],.015,metal);
  const px=A.wallX+A.wallThickness/2+.16;
  pipeCurve(equipment,[[px,0,-3.85],[px,3.95,-3.85],[px-.18,4.13,-3.85],[5.38,4.13,-3.85],[5.38,4.13,-3.0]],.095,mat(0x2d80b3,.5,.4));
  pipeCurve(equipment,[[px,0,1.60],[px,1.15,1.60],[px-.14,1.33,1.60],[6.0,1.33,1.60],[6.0,1.33,.48]],.095,mat(0xbf3b32,.6,.4));
  pipeCurve(equipment,[[2.58,3.78,-2.95],[2.58,4.25,-2.95],[2.58,4.33,-2.82]],.045,metal);c(equipment,2.58,4.37,-2.82,.095,.095,.04,cap,10);
  // Slatted picnic table and three light folding chairs.
  const table=g(fixed,-1.70,.02,.65);for(let j=0;j<7;j++)b(table,0,1.05,-.59+j*.19,2.46,.085,.17,wood);for(const x of [-.84,.84]){r(table,[x,.04,-.57],[x,.99,.48],.045,woodDark);r(table,[x,.04,.57],[x,.99,-.48],.045,woodDark);c(table,x,.48,0,.065,.065,.06,metal,8).rotation.z=Math.PI/2;}r(table,[-.85,.38,0],[.85,.38,0],.035,woodDark);
  function chair(x,z,yaw){const q=g(fixed,x,0,z);q.rotation.y=yaw;for(const side of [-1,1]){r(q,[side*.29,.03,.31],[side*.29,1.08,-.26],.025,woodDark);r(q,[side*.29,.03,-.31],[side*.29,.62,.31],.025,woodDark);s(q,side*.29,.49,0,.043,metal);}
    for(let j=0;j<4;j++)b(q,0,.59,-.22+j*.14,.66,.055,.12,wood);for(let j=0;j<3;j++)b(q,0,.88+j*.14,-.23,.66,.10,.055,wood);
  }
  chair(-3.40,.54,-Math.PI/2);chair(.02,.54,Math.PI/2);chair(-1.65,2.0,0);
  c(table,-.47,1.14,-.10,.10,.10,.10,white,12);tor(table,-.36,1.16,-.1,.045,.012,white);c(table,.28,1.12,.15,.11,.11,.04,blue,12);b(table,.70,1.115,-.17,.35,.025,.28,M.ivory);
  // Two sagging clotheslines; each garment moves gently about its pegged top.
  const fabrics=[mat(0xdedecf),mat(0x688fa0),mat(0xece3ce),mat(0x4b6973),mat(0x819388)];fabrics.forEach(m=>m.side=THREE.DoubleSide);
  function garment(p,x,y,z,width,height,type,index){const q=g(p,x,y,z);q.userData.dynamic=true;const shape=new THREE.Shape();let points;
    if(type==='shirt')points=[[-.25,0],[-.47,-.15],[-.37,-.37],[-.25,-.29],[-.25,-.90],[.25,-.90],[.25,-.29],[.37,-.37],[.47,-.15],[.25,0],[.11,-.08],[-.11,-.08]];
    else if(type==='pants')points=[[-.34,0],[-.31,-1],[0,-1],[.02,-.34],[.08,-1],[.38,-1],[.34,0]];
    else points=[[-.5,0],[-.5,-1],[.5,-1],[.5,0]];
    points.forEach((v,i)=>i?shape.lineTo(v[0]*width,v[1]*height):shape.moveTo(v[0]*width,v[1]*height));shape.closePath();const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),fabrics[index%fabrics.length]);mesh.castShadow=mesh.receiveShadow=true;q.add(mesh);
    for(const xx of [-width*.22,width*.22])b(p,x+xx,y+.025,z,.038,.09,.038,woodDark);clothes.push({q,index,base:y});stats.clothes++;
  }
  for(const z of [-3.85,-2.72]){for(const x of [-5.35,.50]){c(fixed,x,1.30,z,.025,.03,2.60,dark,8);r(fixed,[x,2.55,z-.15],[x,2.55,z+.15],.020,metal);}const pts=[];for(let j=0;j<13;j++)pts.push([-5.35+j*5.85/12,2.52-Math.sin(j/12*Math.PI)*.16,z]);pipeCurve(fixed,pts,.009,M.darkwood);
    for(let j=0;j<4;j++){const x=-4.72+j*1.35,y=S+2.52-Math.sin((x+5.35)/5.85*Math.PI)*.16;garment(moving,x,y,z,.73,.85+random()*.17,j%3===0?'pants':j%3===1?'shirt':'towel',j+(z===-2.72?2:0));}
  }
  bed(-4.55,-4.15,2.0,.66);bed(-1.50,-4.15,1.30,.66);bed(-5.45,1.85,.60,1.70);bed(2.65,4.15,1.6,.57);
  for(const [x,z,sc,flowers]of[[-5.4,-1.35,1.2,true],[-5.5,3.65,1.15,true],[-4.35,4.18,.9,false],[-3.62,4.18,.8,true],[.8,-3.94,1.15,true],[1.2,-2.86,.75,false],[1.35,-1.2,.9,true],[1.1,.35,.85,false],[2.0,1.20,.8,true],[5.4,4.12,.9,true],[4.35,4.18,1.0,false],[-.1,4.18,.85,true]])pot(garden,x,z,sc,flowers);
  for(const x of [-5.7,-4.7,-3.7,-.4,1.4,2.6,3.6,5.6]){foliage(garden,x,.28,4.65,.75,x>1);vine(garden,x,4.95,.8+random()*1.10);}
  for(const z of [-3.65,-1.0,1.4,3.75]){foliage(garden,-6.0,.32,z,.8,true);vine(garden,-6.42,z,.6+random(),true);}
  for(const x of [-4.8,-1.1,3.4,5.6])moss(exterior,x,-.12,4.96,1.2,.32,'front');moss(exterior,-6.4,-.05,1.5,1.0,.46,'side');
  // Watering can, pail, hose and drainage complete the usable terrace.
  const can=g(fixed,1.22,.05,1.38);c(can,0,.19,0,.16,.19,.37,blue,12);tor(can,-.11,.24,0,.21,.025,blue);pipeCurve(can,[[.08,.12,0],[.28,.26,0],[.36,.36,0]],.034,blue);s(can,.38,.39,0,.06,metal);c(fixed,.72,.18,1.48,.16,.12,.36,dark,12);tor(fixed,.72,.37,1.48,.16,.018,metal,Math.PI/2);
  for(let j=0;j<3;j++){const hose=tor(fixed,1.30,.09+j*.035,2.75,.40-j*.04,.028,mat(0x526d50),Math.PI/2);hose.scale.x=1.2;}pipeCurve(fixed,[[1.72,.08,2.75],[2.2,.08,3.1],[2.15,.08,3.8]],.026,leafMaterials[0]);b(fixed,5.45,.065,2.14,.44,.025,.44,dark);for(let j=0;j<6;j++)b(fixed,5.27+j*.071,.084,2.14,.02,.015,.39,metal);
  // Small ginger-and-white cat with ears, paws, face and a slowly moving tail.
  const cat=g(moving,3.05,3.78,-1.55);cat.rotation.y=-.25;const body=s(cat,0,.23,0,.25,orange,1);body.scale.set(.37,.1625,.1625);s(cat,.30,.32,.04,.145,orange,1);s(cat,.37,.28,.12,.08,white,1);
  for(const x of [-.23,.23])for(const z of [-.11,.11]){b(cat,x,.09,z,.085,.18,.085,x>.1?white:orange);b(cat,x+.025,.025,z,.12,.05,.09,white);}
  for(const z of [-.065,.09]){const ear=c(cat,.31,.48,z,0,.065,.15,orange,3);ear.rotation.z=-.12;s(cat,.416,.345,z,.016,M.black,1);}s(cat,.45,.285,.10,.018,rust,1);
  for(const x of [-.19,-.05,.09])b(cat,x,.36,.03,.035,.06,.24,rust);const tail=g(cat,-.32,.25,0);pipeCurve(tail,[[0,0,0],[-.16,.15,0],[-.22,.38,.03],[-.17,.53,.06]],.038,orange);b(cat,.19,.25,.13,.10,.12,.035,white);
  function update(t){const phase=t*Math.PI/6;for(const cloth of clothes){cloth.q.rotation.x=.028*Math.sin(phase*2+cloth.index*.73);cloth.q.rotation.z=.018*Math.sin(phase+cloth.index*.51);}tail.rotation.x=.14*Math.sin(phase);tail.rotation.z=.10*Math.sin(phase*2);body.scale.y=.1625+.00225*Math.sin(phase*2);rotor.rotation.z=phase*12;stats.clothAngles=clothes.map(o=>[o.q.rotation.x,o.q.rotation.z]);stats.catTail=[tail.rotation.x,tail.rotation.z];}
  function inspect(){return{...stats,clothAngles:stats.clothAngles.map(a=>a.slice()),catTail:stats.catTail.slice()};}
  update(0);return{stats,update,inspect};
}
