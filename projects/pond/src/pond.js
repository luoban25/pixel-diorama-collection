function buildEnvironment() {
  const G=groundY, W=.36, TAU=Math.PI*2;
  const v=(x,y,z)=>new THREE.Vector3(x,y,z);
  const staticRoot=new THREE.Group();scene.add(staticRoot);
  const props=new THREE.Group();props.userData.reflectable=true;staticRoot.add(props);
  const dynamicRoot=new THREE.Group();dynamicRoot.userData.dynamic=true;scene.add(dynamicRoot);
  const anglers=[];
  const M={
    grass:mat(0xa4ad4f,1),grassDark:mat(0x657737,1),grassLight:mat(0xc5c36b,1),
    wood:mat(0x9b7e51,1),woodLight:mat(0xb39865,1),woodDark:mat(0x65553a,1),bark:mat(0x67543c,1),
    leaf:mat(0xc58134,1),leafLight:mat(0xe7b14d,1),leafDark:mat(0x8f4929,1),leafDry:mat(0xc74d30,1),
    rock:mat(0x8e9378,1),rockLight:mat(0xa8ac8b,1),rockDark:mat(0x646b55,1),
    reed:mat(0x667b37,1),reedLight:mat(0x9c9b46,1),reedDark:mat(0x465a31,1),
    metal:mat(0x35433a,.8,.2),sand:mat(0xb2a77b,1),cream:mat(0xe1d9bb),blue:mat(0x4f6b70),
    waterStone:mat(0x656f5a,1),orange:mat(0xcc6a3f),gold:mat(0xc9b96b),boots:mat(0x34403b)
  };
  function b(w,h,d,m,x,y,z,parent=props){return box(w,h,d,m,x,y,z,parent);}
  function c(rt,rb,h,m,x,y,z,n=8,parent=props){return cyl(rt,rb,h,m,x,y,z,n,parent);}
  function r(a,end,radius,m,parent=props,n=5){return beam(a,end,radius,m,parent,n);}
  function s(radius,m,x,y,z,parent=props,detail=0){return sphere(radius,m,x,y,z,parent,detail);}
  function textureCanvas(w,h,paint){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'));const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;return tex;}
  const woodTex=textureCanvas(256,128,ctx=>{
    ctx.fillStyle='#d4c3a1';ctx.fillRect(0,0,256,128);
    for(let i=0;i<2200;i++){ctx.fillStyle=i%3?'rgba(64,45,24,.18)':'rgba(255,240,189,.3)';ctx.fillRect(rand()*256,rand()*128,3+rand()*36,.5+rand());}
    for(let i=0;i<45;i++){ctx.fillStyle='rgba(50,39,23,.32)';ctx.fillRect(rand()*256,rand()*128,10+rand()*60,.7);}
  });
  for(const material of [M.wood,M.woodLight,M.woodDark,M.bark])material.map=woodTex;
  const stoneTex=textureCanvas(96,96,ctx=>{
    ctx.fillStyle='#c8c8ae';ctx.fillRect(0,0,96,96);
    for(let i=0;i<3800;i++){ctx.fillStyle=i%3?'rgba(58,64,45,.17)':'rgba(239,235,199,.27)';ctx.fillRect(rand()*96,rand()*96,1+rand()*2,1+rand()*2);}
    for(let i=0;i<8;i++){ctx.strokeStyle='rgba(62,68,49,.26)';ctx.beginPath();ctx.moveTo(rand()*96,rand()*96);ctx.lineTo(rand()*96,rand()*96);ctx.stroke();}
  });
  for(const material of [M.rock,M.rockLight,M.rockDark,M.waterStone]){material.flatShading=true;material.map=stoneTex;}

  // One shared outline governs the opening, submerged bed and water surface.
  const shoreline=new THREE.CatmullRomCurve3([
    v(-11.45,0,6.25),v(-11.4,0,2.8),v(-10.0,0,-.6),v(-7.8,0,-2.65),v(-4.2,0,-3.5),v(-.8,0,-3.4),
    v(3.2,0,-2.65),v(6.6,0,-1.05),v(9.4,0,1.25),v(10.6,0,4.2),v(9.3,0,7.5),v(5.0,0,8.55),
    v(.4,0,8.65),v(-4.4,0,8.55),v(-8.9,0,7.9)
  ],true,'centripetal');
  const shorePoints=shoreline.getPoints(180);
  const pondShape=new THREE.Shape();shorePoints.forEach((p,i)=>i?pondShape.lineTo(p.x,-p.z):pondShape.moveTo(p.x,-p.z));pondShape.closePath();
  const landShape=new THREE.Shape();landShape.moveTo(-12.5,-9.5);landShape.lineTo(12.5,-9.5);landShape.lineTo(12.5,9.5);landShape.lineTo(-12.5,9.5);landShape.closePath();
  const hole=new THREE.Path();shorePoints.forEach((p,i)=>i?hole.lineTo(p.x,-p.z):hole.moveTo(p.x,-p.z));hole.closePath();landShape.holes.push(hole);
  const soilSide=new THREE.Mesh(new THREE.ExtrudeGeometry(landShape,{depth:.45,bevelEnabled:false,steps:1,curveSegments:2}),mat(0x847951,1));
  soilSide.rotation.x=-Math.PI/2;soilSide.position.y=.05;soilSide.castShadow=true;soilSide.receiveShadow=true;staticRoot.add(soilSide);
  const grassTex=textureCanvas(768,576,ctx=>{
    ctx.fillStyle='#a2ad50';ctx.fillRect(0,0,768,576);
    for(let i=0;i<800;i++){ctx.fillStyle=i%3?'rgba(77,103,35,.12)':'rgba(205,193,96,.20)';ctx.beginPath();ctx.ellipse(rand()*768,rand()*576,3+rand()*14,2+rand()*8,rand()*3,0,TAU);ctx.fill();}
    const colors=['#667d37','#849444','#bfc568','#d7cc82','#a3ac4e'];
    for(let i=0;i<105000;i++){ctx.globalAlpha=.14+rand()*.2;ctx.fillStyle=colors[i%5];ctx.fillRect(rand()*768|0,rand()*576|0,1,1+rand()*2);}
    ctx.globalAlpha=1;
  });
  const landGeo=new THREE.ShapeGeometry(landShape,2);const landPos=landGeo.attributes.position,luv=landGeo.attributes.uv;
  for(let i=0;i<landPos.count;i++)luv.setXY(i,(landPos.getX(i)+12.5)/25,(9.5-landPos.getY(i))/19);
  const grass=new THREE.Mesh(landGeo,new THREE.MeshStandardMaterial({map:grassTex,roughness:1}));grass.rotation.x=-Math.PI/2;grass.position.y=G;grass.receiveShadow=true;staticRoot.add(grass);
  const bedTex=textureCanvas(512,512,ctx=>{
    ctx.fillStyle='#477185';ctx.fillRect(0,0,512,512);
    for(let i=0;i<35000;i++){ctx.fillStyle=i%3?'rgba(37,69,80,.15)':'rgba(137,161,157,.17)';ctx.fillRect(rand()*512,rand()*512,1+rand()*3,1+rand()*3);}
  });
  const bedGeo=new THREE.ShapeGeometry(pondShape,2);const bp=bedGeo.attributes.position,bu=bedGeo.attributes.uv;
  for(let i=0;i<bp.count;i++)bu.setXY(i,(bp.getX(i)+12.5)/25,(9.5-bp.getY(i))/19);
  const bed=new THREE.Mesh(bedGeo,new THREE.MeshStandardMaterial({map:bedTex,roughness:1}));bed.rotation.x=-Math.PI/2;bed.position.y=.055;bed.receiveShadow=true;staticRoot.add(bed);

  function rock(x,z,size,y=G-.02,underwater=false){
    size*=.84;
    const m=s(size,underwater?M.waterStone:[M.rock,M.rockLight,M.rockDark][Math.floor(rand()*3)],x,y+size*.27,z,underwater?staticRoot:props,1);
    m.scale.set(size*(.95+rand()*.45),size*(.48+rand()*.28),size*(.7+rand()*.45));m.rotation.set(rand()*.3,rand()*6,rand()*.25);
    for(let i=0;i<3&&!underwater;i++){const mark=b(.045+rand()*.10,.018,.06,M.grassDark,x+(rand()-.5)*size,y+size*.68,z+(rand()-.5)*size);mark.castShadow=false;}
  }
  // Stones bridge the grass, exposed bank and submerged shelf naturally.
  for(let i=0;i<46;i++){
    const q=i/46,p=shoreline.getPoint(q);if(p.x>-.4&&p.x<6.9&&p.z<.7)continue;
    if(i%3===0){rock(p.x,p.z,.42+rand()*.53);rock(p.x+.35,p.z+.18,.18+rand()*.22);}
    if(i%4===0)rock(p.x*.95,p.z*.95,.18+rand()*.28,.09,true);
  }
  [[-10.3,-.3,.95],[-7.0,-2.8,.65],[-3.4,-3.5,.65],[8.8,1.5,.82],[8.0,6.7,.74],[-8.8,7.2,.7],[5.7,7.7,.52]].forEach(([x,z,a])=>rock(x,z,a));

  // Each reed is a tapered curved ribbon, with warm seed heads on a few stems.
  function blade(x,z,h,angle,m,spread=.4,parent=props){
    const width=.045+rand()*.04,positions=[],uvs=[];
    const side=v(Math.cos(angle),0,Math.sin(angle));const bend=v(-Math.sin(angle),0,Math.cos(angle));
    for(let j=0;j<4;j++){
      const t=j/3,cx=x+bend.x*spread*t*t,cz=z+bend.z*spread*t*t,cy=G+h*(t-.15*t*t);
      const w=width*(1-t*.94);positions.push(cx-side.x*w,cy,cz-side.z*w,cx+side.x*w,cy,cz+side.z*w);uvs.push(0,t,1,t);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6,5,7,6]);geo.computeVertexNormals();
    const leaf=new THREE.Mesh(geo,m);leaf.castShadow=true;leaf.receiveShadow=true;parent.add(leaf);
  }
  for(const m of [M.reed,M.reedLight,M.reedDark])m.side=THREE.DoubleSide;
  function reeds(x,z,radius=.45,n=13,height=1){
    for(let i=0;i<n;i++){
      const a=rand()*TAU,d=Math.sqrt(rand())*radius,px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d,h=(.45+rand()*.95)*height*1.18;
      blade(px,pz,h,a,[M.reed,M.reedLight,M.reedDark][i%3],.12+rand()*.4);
      if(i%5===0){const top=[px+.10,G+h*.92,pz+.05];r([px,G,pz],top,.012,M.reedDark);c(.026,.03,.19,M.woodDark,top[0],top[1]+.05,top[2],5);}
    }
  }
  for(let i=0;i<64;i++){
    const p=shoreline.getPoint(i/64);if(p.x>-.6&&p.x<7.4&&p.z<1.7)continue;
    if(i%5===1)continue;reeds(p.x,p.z,.29+rand()*.24,10+Math.floor(rand()*9),.65+rand()*.4);
  }
  [[-11.2,2.2,1.4],[-10.3,6.7,1.2],[-8.4,-1.8,1.1],[9.1,3.3,1.45],[7.9,6.9,1.15],[-4.3,8.7,.9]].forEach(([x,z,h])=>reeds(x,z,.5,18,h));

  function flower(x,z,y=G+.08,size=.04,parent=props){
    s(size*.6,M.gold,x,y,z,parent);
    for(let j=0;j<5;j++){const a=j/5*TAU;const petal=s(size,M.cream,x+Math.cos(a)*size,y+.003,z+Math.sin(a)*size,parent);petal.scale.y*=.28;}
  }
  for(let i=0;i<130;i++){
    const x=rand()*24-12,z=rand()*18-9;
    if(z< -4.4||Math.abs(x)>11.1||z>8.6){
      const tuft=b(.04,.025,.055,i%4?M.grassLight:M.sand,x,G+.02,z);tuft.castShadow=false;
      if(i%8===0)flower(x,z,G+.08,.04);
    }
  }
  function pad(x,z,radius=.21){
    const sh=new THREE.Shape();sh.moveTo(0,0);for(let j=0;j<=12;j++){const a=.3+j/12*(TAU-.6);sh.lineTo(Math.cos(a)*radius,Math.sin(a)*radius*.8);}sh.lineTo(0,0);
    const lily=new THREE.Mesh(new THREE.ShapeGeometry(sh),[M.grass,M.grassLight,M.reed][Math.floor(rand()*3)]);lily.rotation.x=-Math.PI/2;lily.position.set(x,W+.012,z);lily.receiveShadow=true;staticRoot.add(lily);
    if(rand()>.8)flower(x,z,W+.05,.035,staticRoot);
  }
  for(const [x,z,n] of [[-8.2,-.3,8],[-9.4,3.2,6],[-5.4,6.7,7],[5.7,5.6,5],[6.8,2.5,4]])for(let i=0;i<n;i++)pad(x+(rand()-.5)*1.45,z+(rand()-.5)*1.1,.13+rand()*.14);

  // The garden path threads behind the pier, with a short branch to the deck.
  const pathCurve=new THREE.CatmullRomCurve3([v(-10,G,-5.8),v(-6,G,-5.7),v(-1,G,-5.3),v(4,G,-4.4),v(8.2,G,-3.6),v(10.7,G,-1.8)]);
  for(let i=0;i<100;i++){
    const p=pathCurve.getPoint(i/99),tangent=pathCurve.getTangent(i/99),a=Math.atan2(tangent.x,tangent.z);
    const stone=b(.34+rand()*.19,.025,.28+rand()*.15,i%3?M.sand:M.rockLight,p.x+(rand()-.5)*.25,G+.024,p.z+(rand()-.5)*.38,staticRoot);stone.rotation.y=a+rand()*.35;
  }
  for(let i=0;i<6;i++)for(const side of [-1,1]){const stone=b(.39,.035,.35,i%2?M.sand:M.rockLight,2.3+side*.23,G+.028,-4.3+i*.35,staticRoot);stone.rotation.y=rand()*.14;}
  function fence(a,end){
    const A=v(...a),B=v(...end),count=Math.ceil(A.distanceTo(B)/1.45);
    for(let i=0;i<=count;i++){const p=A.clone().lerp(B,i/count);b(.11,.99,.11,M.woodDark,p.x,G+.48,p.z);b(.145,.07,.145,M.woodLight,p.x,G+1.0,p.z);}
    for(const y of [.40,.79])r([a[0],G+y,a[2]],[end[0],G+y,end[2]],.045,M.wood);
  }
  fence([-11.6,0,-8.3],[-1.2,0,-8.3]);fence([-11.6,0,-8.3],[-11.6,0,-5.1]);fence([7.4,0,-1.0],[11.6,0,-1.0]);fence([11.6,0,-1.0],[11.6,0,1.6]);
  function bench(x,z){
    for(let i=0;i<4;i++)b(2.55,.10,.13,i%2?M.wood:M.woodLight,x,G+.57,z+(i-1.5)*.16);
    for(const side of [-1,1]){b(.10,.57,.46,M.metal,x+side*.95,G+.285,z);b(.07,.85,.07,M.metal,x+side*.95,G+.76,z-.28);}
    for(let i=0;i<3;i++)b(2.55,.13,.08,M.wood,x,G+.85+i*.16,z-.31);
  }
  bench(-4.2,-6.9);

  function tree(x,z,scale,index){
    const at=(px,py,pz)=>v(x+px*scale,G+py*scale,z+pz*scale);
    function branch(a,end,rt,rb){const A=a.toArray(),B=end.toArray();const mesh=r(A,B,(rt+rb)*.5*scale,M.bark,props,7);return mesh;}
    const base=at(0,0,0),fork=at(.08,1.18,-.05),crown=at(-.07,2.25,.04);
    branch(base,fork,.1,.17);branch(fork,crown,.05,.1);
    for(let j=0;j<6;j++){const a=j/6*TAU;branch(at(0,.13,0),at(Math.cos(a)*.48,.025,Math.sin(a)*.48),.014,.065);}
    const endpoints=[];
    for(let j=0;j<11;j++){
      const a=j/11*TAU+index*.7,radius=.65+rand()*.4,height=1.95+rand()*.94;
      const mid=at(Math.cos(a)*radius*.6,height-.35,Math.sin(a)*radius*.6),end=at(Math.cos(a)*radius,height,Math.sin(a)*radius);
      branch(at(0,1.25+j%3*.17,0),mid,.032,.07);branch(mid,end,.012,.032);endpoints.push(end);
      for(const side of [-1,1]){const e=at(Math.cos(a+side*.46)*(radius+.18),height+.13+rand()*.14,Math.sin(a+side*.46)*(radius+.18));branch(mid,e,.009,.025);endpoints.push(e);}
    }
    endpoints.push(at(0,3.1,0),at(.16,2.93,-.24));
    const leaves=index===0?[M.leaf,M.leafLight,M.leafDark,M.leafLight]:index===2?[M.leafDry,M.leaf,M.leafDark,M.leafDry]:index===3?[M.leafLight,M.leaf,M.leafDark,M.leafLight]:[M.leaf,M.leafDry,M.leafLight,M.leafDark];
    for(const center of endpoints)for(let j=0;j<30;j++){
      const a=rand()*TAU,d=Math.sqrt(rand())*.38*scale,sz=(.045+rand()*.055)*scale;
      const leaf=s(1,leaves[j%4],center.x+Math.cos(a)*d,center.y+(rand()-.5)*.40*scale,center.z+Math.sin(a)*d,props);
      leaf.scale.set(sz*(1+rand()*.4),sz*(.42+rand()*.25),sz*.83);leaf.rotation.set(rand()*3,rand()*6,rand()*3);
    }
  }
  tree(-6.5,-7.0,1.88,0);tree(-10.6,-3.7,1.10,1);tree(-.5,-6.9,1.03,2);tree(9.25,-4.7,1.45,3);

  // A slim wooden lantern and a small roofed pond notice board.
  b(.14,3.55,.14,M.woodDark,2.0,G+1.775,-5.25);r([2,G+3.47,-5.25],[2.62,G+3.47,-5.25],.05,M.wood);
  r([2.57,G+3.47,-5.25],[2.57,G+3.13,-5.25],.018,M.metal);
  b(.25,.39,.25,M.metal,2.57,G+2.95,-5.25);b(.17,.25,.26,M.gold,2.57,G+2.95,-5.25);
  b(.29,.06,.29,M.metal,2.57,G+3.16,-5.25);b(.27,.05,.27,M.metal,2.57,G+2.73,-5.25);
  for(const dx of [-.105,.105])b(.025,.34,.28,M.metal,2.57+dx,G+2.95,-5.25);
  const signX=6.0,signZ=-4.3;
  for(const dx of [-.57,.57])b(.10,1.9,.10,M.woodDark,signX+dx,G+.95,signZ);
  b(1.45,1.14,.13,M.woodDark,signX,G+1.62,signZ);
  for(const side of [-1,1]){const roof=b(1.68,.09,.51,M.woodLight,signX,G+2.31,signZ+side*.22);roof.rotation.x=side*.30;}
  const signTex=textureCanvas(320,240,ctx=>{
    ctx.fillStyle='#c8c39e';ctx.fillRect(0,0,320,240);ctx.fillStyle='#405032';ctx.font='bold 27px Georgia';ctx.textAlign='center';ctx.fillText('FISHING POND',160,46);
    ctx.strokeStyle='#7e8961';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(145,137,76,53,-.2,0,TAU);ctx.stroke();
    ctx.fillStyle='#768560';ctx.beginPath();ctx.ellipse(145,137,65,44,-.2,0,TAU);ctx.fill();
    ctx.fillStyle='#465637';for(let i=0;i<13;i++)ctx.fillRect(40+rand()*240,70+rand()*130,4+rand()*8,4+rand()*8);
    ctx.fillStyle='#6b5436';ctx.fillRect(202,109,55,20);ctx.font='16px Arial';ctx.fillText('A QUIET PLACE',160,215);
  });
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.27,.96),new THREE.MeshStandardMaterial({map:signTex,roughness:1}));sign.position.set(signX,G+1.62,signZ+.071);props.add(sign);

  // A plank-built pier: immersed posts, beams, nails, gaps and worn end grain.
  const dockY=G+.29,dockZ=-.35;
  for(let row=0;row<9;row++){
    const z=dockZ+(row-4)*.38,plank=b(6.35,.14,.33,row%2===0?M.woodLight:M.wood,3.05,dockY,z);
    for(const x of [.1,3.05,6.0])for(const dz of [-.11,.11]){const nail=c(.015,.015,.008,M.metal,x,dockY+.075,z+dz,5);nail.castShadow=false;}
    for(let j=0;j<4;j++){const scratch=b(.15+rand()*.45,.004,.012,M.woodDark,.2+rand()*5.8,dockY+.072,z+(rand()-.5)*.27);scratch.castShadow=false;}
  }
  for(const x of [.0,3.05,6.1])for(const z of [-1.93,1.26]){
    b(.20,.99,.20,M.woodDark,x,.48,z);b(.23,.14,.23,M.woodLight,x,G+.64,z);
    if(z>0)b(.24,.14,.24,M.woodDark,x,.18,z,staticRoot);
  }
  for(const z of [-1.77,1.1])b(6.6,.22,.16,M.woodDark,3.05,dockY-.17,z);
  for(const x of [.3,2.9,5.8])b(.17,.20,3.6,M.woodDark,x,dockY-.23,dockZ);
  b(.66,.45,.51,M.grassDark,5.30,dockY+.30,.48);b(.70,.08,.55,M.rockLight,5.30,dockY+.57,.48);
  b(.48,.025,.37,M.grass,5.30,dockY+.62,.48);r([5.16,dockY+.66,.48],[5.44,dockY+.66,.48],.025,M.woodDark);
  for(const x of [5.05,5.55])b(.05,.12,.04,M.metal,x,dockY+.52,.77);
  const bucket=c(.24,.21,.43,M.blue,3.79,dockY+.29,-.53,12);c(.22,.22,.025,M.rockDark,3.79,dockY+.51,-.53,12);
  for(const side of [-1,1])r([3.79+side*.23,dockY+.38,-.53],[3.79+side*.23,dockY+.71,-.53],.012,M.metal);
  r([3.56,dockY+.71,-.53],[4.02,dockY+.71,-.53],.012,M.metal);

  // Two seated articulated figures. Their visible parts are instanced by main.js.
  function angler(x,index){
    const root=new THREE.Group();root.position.set(x,dockY+.03,1.12);root.rotation.y=Math.PI;root.scale.set(1.18,1.35,1.18);root.userData.reflectable=true;dynamicRoot.add(root);
    const skin=mat(index?0xbc9569:0xd0ad7f),shirt=index?mat(0x466661):mat(0xaebaa4),trousers=mat(0x3e5257);
    const hips=new THREE.Group();hips.position.y=.13;root.add(hips);
    c(.20,.18,.15,trousers,0,0,0,8,hips);c(.21,.16,.50,shirt,0,.30,.015,8,hips);
    b(.05,.36,.012,index?M.grassDark:M.cream,0,.30,-.177,hips);
    const headPivot=new THREE.Group();headPivot.position.set(0,.59,0);hips.add(headPivot);
    const head=s(.145,skin,0,.13,-.015,headPivot,1);head.scale.y*=1.12;s(.032,skin,0,.12,-.145,headPivot);
    for(const dx of [-.045,.045])s(.009,M.boots,dx,.17,-.14,headPivot);
    if(index){const cap=s(.154,mat(0x344d58),0,.235,0,headPivot,1);cap.scale.y*=.52;b(.23,.026,.18,mat(0x344d58),0,.205,-.105,headPivot);}
    else {c(.235,.25,.035,M.sand,0,.243,0,12,headPivot);c(.133,.151,.14,M.woodLight,0,.31,0,10,headPivot);c(.153,.153,.035,M.woodDark,0,.267,0,10,headPivot);}
    const arms=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.20,.49,0);arm.rotation.x=.66;arm.rotation.z=side*.12;hips.add(arm);
      c(.066,.058,.23,shirt,0,-.10,0,8,arm);const elbow=new THREE.Group();elbow.position.y=-.22;elbow.rotation.x=.70;arm.add(elbow);
      c(.049,.044,.23,skin,0,-.10,0,7,elbow);s(.05,skin,0,-.23,0,elbow);arms.push({pivot:arm,elbow});
      const thigh=b(.15,.15,.39,trousers,side*.11,-.025,-.19,hips);
      const shin=new THREE.Group();shin.position.set(side*.11,-.03,-.37);shin.rotation.x=.08;hips.add(shin);
      c(.070,.055,.39,trousers,0,-.19,0,7,shin);b(.125,.09,.24,M.boots,0,-.405,-.05,shin);
    }
    // The rod pivots around the hands. Its fine line runs from the actual tip.
    const rodPivot=new THREE.Group();rodPivot.position.set(.15,.43,-.32);root.add(rodPivot);
    const rodCurve=new THREE.CatmullRomCurve3([v(0,0,0),v(.08,.72,-1.05),v(.15,1.23,-2.12),v(.18,1.30,-3.12)]);
    const rod=new THREE.Mesh(new THREE.TubeGeometry(rodCurve,18,.020,5,false),mat(0x4c4b35));rod.castShadow=true;rodPivot.add(rod);
    r([0,-.11,.17],[0,.12,-.14],.035,M.woodDark,rodPivot);c(.061,.061,.07,M.metal,.035,-.03,.02,8,rodPivot);
    const floatX=x+.12,floatZ=index?6.10:5.40;
    const floatRoot=new THREE.Group();floatRoot.position.set(floatX,W+.025,floatZ);floatRoot.userData.dynamic=true;scene.add(floatRoot);
    c(.035,.035,.075,M.cream,0,0,0,8,floatRoot);c(.025,.025,.09,M.orange,0,.066,0,8,floatRoot);c(.012,.012,.08,M.woodDark,0,.145,0,6,floatRoot);
    const lineGeo=new THREE.BufferGeometry().setFromPoints([v(0,0,0),v(0,0,0)]),line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xc7c4a4,transparent:true,opacity:.78}));line.userData.dynamic=true;scene.add(line);
    const rippleRoot=new THREE.Group();rippleRoot.userData.dynamic=true;scene.add(rippleRoot);const rings=[];
    for(let j=0;j<3;j++){
      const material=new THREE.MeshBasicMaterial({color:0x9aab9b,transparent:true,opacity:.15,depthWrite:false});
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.055,3,72),material);ring.rotation.x=-Math.PI/2;ring.position.set(floatX,W+.035+j*.0005,floatZ);rippleRoot.add(ring);rings.push(ring);
    }
    const figure={root,hips,headPivot,arms,rodPivot,floatRoot,line,lineGeo,rings,floatX,floatZ,index};anglers.push(figure);return figure;
  }
  angler(1.42,0);angler(4.08,1);

  // Actual 3D swimmers stay below the transparent surface on closed paths.
  const fishRoot=new THREE.Group();fishRoot.userData.dynamic=true;scene.add(fishRoot);
  const fishMaterials=[0xd8a65b,0xd9774d,0xd6d2b0,0x3c555b].map(color=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.12,roughness:.85,side:THREE.DoubleSide}));
  const fish=[];
  const fishPaths=[[-6.9,1.6,1.65,.80,1,.2],[-4.4,4.8,2,.95,-1,1.1],[-1.4,2.2,1.5,.65,1,2.3],[1.6,6.4,1.6,.7,-1,2],
    [5.4,4.8,1.2,.85,1,3.4],[-7.4,5.1,.85,.6,2,4.7],[-2.8,.1,1,.6,-1,5.6],[3.7,3.3,1.05,.65,1,.9],[-.6,6.9,1.4,.55,1,5.1]];
  fishPaths.forEach(([x,z,rx,rz,speed,offset],index)=>{
    const root=new THREE.Group();root.scale.setScalar(.82+(index%3)*.17);fishRoot.add(root);
    const material=fishMaterials[index%fishMaterials.length];
    const body=s(1,material,0,0,.015,root,1);body.scale.set(.15,.067,.43);body.castShadow=false;
    const head=s(1,material,0,.005,.31,root,1);head.scale.set(.118,.060,.15);head.castShadow=false;
    for(const side of [-1,1]){const eye=s(.014,M.boots,side*.107,.038,.31,root);eye.castShadow=false;}
    const tail=new THREE.Group();tail.position.z=-.36;root.add(tail);
    const tailGeometry=new THREE.BufferGeometry();
    tailGeometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.19,.01,-.28,0,0,-.20,0,0,0,0,0,-.20,.19,.01,-.28],3));tailGeometry.computeVertexNormals();
    tail.add(new THREE.Mesh(tailGeometry,material));
    for(const side of [-1,1]){
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([side*.09,0,.13,side*.26,-.015,-.03,side*.08,0,-.12],3));geometry.computeVertexNormals();root.add(new THREE.Mesh(geometry,material));
    }
    fish.push({root,tail,x,z,rx,rz,speed,offset,index});
  });
  for(let i=0;i<90;i++){
    const x=-10.5+rand()*21,z=-8.4+rand()*3.8;
    const leaf=s(1,[M.leaf,M.leafLight,M.leafDry][i%3],x,G+.023,z,staticRoot);
    leaf.scale.set(.025+rand()*.035,.005,.045+rand()*.035);leaf.rotation.y=rand()*TAU;leaf.castShadow=false;
  }

  // Planar reflection uses the same scene's real trees, timber and moving figures.
  // Only reflected objects are rendered; the pond bed and land are excluded.
  const reflectionTarget=new THREE.WebGLRenderTarget(384,256,{type:THREE.HalfFloatType,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
  const reflectionCamera=new THREE.OrthographicCamera(),reflectionMatrix=new THREE.Matrix4();
  const waterUniforms={reflection:{value:reflectionTarget.texture},reflectionMatrix:{value:reflectionMatrix},phase:{value:0},base:{value:new THREE.Color(0x377d9d)}};
  const waterMaterial=new THREE.ShaderMaterial({
    transparent:true,depthWrite:true,uniforms:waterUniforms,
    vertexShader:`uniform mat4 reflectionMatrix;varying vec3 world;varying vec4 reflectionUV;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;reflectionUV=reflectionMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader:`
      uniform sampler2D reflection;uniform float phase;uniform vec3 base;varying vec3 world;varying vec4 reflectionUV;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec2 uv=reflectionUV.xy/reflectionUV.w;
        uv+=vec2(sin(world.z*1.3+phase*2.)*.0042,cos(world.x*.9-phase*3.)*.0025);
        vec4 reflected=texture2D(reflection,uv);
        float grain=hash(floor(world.xz*19.));
        float waveA=sin(world.x*2.4+world.z*1.6-phase*4.);
        float waveB=sin(world.x*-.8+world.z*3.1+phase*3.);
        float wave=waveA*.65+waveB*.35;
        vec3 color=base*(.98+grain*.045+wave*.09);
        float reflectedLight=dot(reflected.rgb,vec3(.3,.5,.2));
        vec3 blueReflection=base*(.28+reflectedLight*.38);
        color=mix(color,blueReflection,clamp(reflected.a*.43,0.,.48));
        float crest=smoothstep(.80,.99,wave);color+=vec3(.014,.025,.030)*crest;
        float fleck=step(.985,grain)*.008;color+=vec3(fleck*.65,fleck,fleck*.8);
        gl_FragColor=vec4(color,.74);
      }`
  });
  const water=new THREE.Mesh(new THREE.ShapeGeometry(pondShape,2),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=W;water.userData.dynamic=true;water.name='Reflective pond water';scene.add(water);
  const direction=new THREE.Vector3(),target=new THREE.Vector3(),bias=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
  function prepareReflection(renderer,camera){
    const w=Math.min(480,renderer.domElement.width),h=Math.max(1,Math.round(w*renderer.domElement.height/renderer.domElement.width));
    if(reflectionTarget.width!==w||reflectionTarget.height!==h)reflectionTarget.setSize(w,h);
    reflectionCamera.copy(camera,false);reflectionCamera.position.copy(camera.position);reflectionCamera.position.y=W*2-camera.position.y;
    camera.getWorldDirection(direction);target.copy(camera.position).add(direction);target.y=W*2-target.y;
    reflectionCamera.up.set(0,-1,0);reflectionCamera.lookAt(target);reflectionCamera.updateMatrixWorld(true);
    reflectionMatrix.copy(bias).multiply(camera.projectionMatrix).multiply(reflectionCamera.matrixWorldInverse);
    const cache=[];scene.traverse(o=>{
      if(!o.isMesh&&!o.isLine)return;
      let reflect=false;for(let p=o;p;p=p.parent)if(p.userData.reflectable){reflect=true;break;}
      cache.push([o,o.visible]);o.visible=o.visible&&reflect;
    });
    const oldTarget=renderer.getRenderTarget(),shadowEnabled=renderer.shadowMap.enabled;
    try{renderer.shadowMap.enabled=false;renderer.setRenderTarget(reflectionTarget);renderer.clear();renderer.render(scene,reflectionCamera);}
    finally{renderer.setRenderTarget(oldTarget);renderer.shadowMap.enabled=shadowEnabled;for(const [o,visible] of cache)o.visible=visible;}
  }
  const tip=new THREE.Vector3(),linePositions=new Float32Array(6);
  const smooth=(a,b,t)=>{const q=THREE.MathUtils.clamp((t-a)/(b-a),0,1);return q*q*(3-2*q);};
  function update(t){
    const phase=t/12*TAU;waterUniforms.phase.value=phase;
    for(const f of fish){
      const a=phase*f.speed+f.offset,dx=-f.rx*Math.sin(a)*f.speed,dz=f.rz*Math.cos(a)*f.speed;
      f.root.position.set(f.x+Math.cos(a)*f.rx,W-.14+Math.sin(phase*2+f.index)*.017,f.z+Math.sin(a)*f.rz);
      f.root.rotation.y=Math.atan2(dx,dz)+Math.sin(phase*8+f.index)*.025;
      f.tail.rotation.y=Math.sin(phase*8+f.index)*.40;f.root.rotation.z=Math.sin(phase*4+f.index)*.035;
    }
    for(const p of anglers){
      const q=phase+p.index*1.3,cycle=(t+3-p.index*.22)%3;
      const lift=smooth(.05,.34,cycle)*(1-smooth(.75,1.35,cycle)),reel=Math.sin(cycle*23)*lift*.055;
      p.lift=lift;p.cycle=cycle;
      p.hips.rotation.x=-.10+lift*.16+Math.sin(q)*.018;p.hips.scale.y=1+Math.sin(q*2)*.007;
      p.headPivot.rotation.set(.03+Math.sin(q)*.025-lift*.08,Math.sin(q)*.04,0);
      p.arms[0].pivot.rotation.x=.66+lift*.85;p.arms[1].pivot.rotation.x=.66+lift*.78+reel;
      p.arms[0].elbow.rotation.x=.70-lift*.25;p.arms[1].elbow.rotation.x=.70-lift*.22-reel;
      p.rodPivot.position.set(.15,.43+lift*.22,-.32-lift*.10);p.rodPivot.rotation.x=lift*.58+Math.sin(q)*.012;
      p.floatRoot.position.set(p.floatX,W+.025+lift*.28+Math.sin(q*3)*.012,p.floatZ-lift*.55);
      p.floatRoot.rotation.z=Math.sin(q*2)*.055+reel;
      p.root.updateMatrixWorld(true);tip.set(.18,1.30,-3.12).applyMatrix4(p.rodPivot.matrixWorld);
      linePositions.set([tip.x,tip.y,tip.z,p.floatRoot.position.x,p.floatRoot.position.y+.09,p.floatRoot.position.z]);
      p.lineGeo.attributes.position.array.set(linePositions);p.lineGeo.attributes.position.needsUpdate=true;p.lineGeo.computeBoundingSphere();
      for(let j=0;j<p.rings.length;j++){
        const cycle=(t/3+j/3+p.index*.15)%1;const radius=.10+cycle*.76;
        p.rings[j].scale.setScalar(radius);p.rings[j].material.opacity=Math.sin(cycle*Math.PI)*.29;
      }
    }
  }
  return {dynamicRoot,anglers,fish,update,prepareReflection,water,shoreline};
}
