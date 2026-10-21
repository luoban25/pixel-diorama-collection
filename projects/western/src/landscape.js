// The whole landscape is an independent layer so the train and riders keep their own scale.
function buildWesternLandscape(){
  const TAU=Math.PI*2, X=15.5,Z=12.5;
  const grain=M.rock.map;
  const makeRock=(color)=>new THREE.MeshStandardMaterial({color,map:grain,roughness:1,flatShading:true});
  const L={ochre:makeRock(0xc96b2e),orange:makeRock(0xe78333),rim:makeRock(0xf49a42),deep:makeRock(0x9c4427),rust:makeRock(0xb9572a),pale:makeRock(0xf6bf67),sage:makeRock(0x8d8b43),earth:makeRock(0x885234),stratum:makeRock(0xb27c42),bed:makeRock(0x69796b)};
  const rockMats=[L.ochre,L.orange,L.rust,M.rock,M.rockLight,L.rim];
  const horsePlaces=[[-9,-5.6],[-6,-6.1],[-4,-2.9],[-.8,-4.8],[2,-2.2],[5,-2.7]];
  const riverX=z=>3.05+Math.sin((z+.4)*.36)*.27;
  // Half-width; a broad opening exposes the trestle, narrowing to a stony creek mouth.
  const riverWidth=z=>z<1.6?2.7*Math.sqrt(Math.max(0,1-((z-1.6)/2)**2)):2.7-(Math.min(12.5,z)-1.6)/10.9*1.4;
  function inRavine(x,z,pad=0){return z>-.4&&Math.abs(x-riverX(z))<riverWidth(z)+pad;}
  function crowded(x,z,pad=0){
    if(Math.abs(z-2.05)<1.35+pad||inRavine(x,z,.30+pad))return true;
    if(horsePlaces.some(([px,pz])=>(x-px)**2+(z-pz)**2<(1.55+pad)**2))return true;
    if((x-13.1)**2+(z+4.4)**2<(1.1+pad)**2||(x-14)**2+(z+2.1)**2<(1.0+pad)**2)return true;
    return false;
  }
  function shaped(points,y,material,parent=props){
    const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function groundContour(pad=0){
    const points=[[-X,-Z],[-X,Z],[riverX(Z)-riverWidth(Z)-pad,Z]];
    for(let z=Z-.25;z>=-.40;z-=.25)points.push([riverX(z)-riverWidth(z)-pad*Math.min(1,(z+.4)),z]);
    points.push([riverX(-.4),-.4]);
    for(let z=-.25;z<=Z;z+=.25)points.push([riverX(z)+riverWidth(z)+pad*Math.min(1,(z+.4)),z]);
    points.push([X,Z],[X,-Z]);return points;
  }
  // Four broad strata produce a readable, continuous specimen cut along the outer base.
  b(31.05,.22,25.05,M.woodDark,0,-2.12,0);
  const levels=[[-2.0,.44,L.earth],[-1.56,.51,L.stratum],[-1.05,.63,L.ochre],[-.42,.94,M.sand]];
  levels.forEach(([y,h,side],index)=>{
    const points=groundContour(index*.04),shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1,curveSegments:1});geo.rotateX(-Math.PI/2);
    const mesh=new THREE.Mesh(geo,[index===3?M.sand:side,side]);mesh.position.y=y;mesh.castShadow=true;mesh.receiveShadow=true;props.add(mesh);
  });
  function rock(x,y,z,size=1,material){
    const mesh=s(size,material||rockMats[Math.floor(rand()*rockMats.length)],x,y+size*.27,z,props,0);
    mesh.scale.multiply(new THREE.Vector3(.70+rand()*.4,.40+rand()*.32,.60+rand()*.5));
    mesh.rotation.set((rand()-.5)*.28,rand()*TAU,(rand()-.5)*.28);return mesh;
  }
  // A muted blue creek and slender pale current lines at the very bottom of the canyon.
  const waterPoints=[];
  for(let z=-.35;z<=12.5;z+=.25)waterPoints.push([riverX(z)-Math.max(.04,riverWidth(z)-.45),z]);
  for(let z=12.5;z>=-.35;z-=.25)waterPoints.push([riverX(z)+Math.max(.04,riverWidth(z)-.45),z]);
  const waterMat=new THREE.MeshStandardMaterial({color:0x558b8b,roughness:.4,metalness:.12});
  shaped(waterPoints,-1.57,waterMat);
  const ripples=[],glintMat=new THREE.MeshStandardMaterial({color:0xc2ddd0,roughness:.55});
  for(let i=0;i<56;i++){
    const z=.0+rand()*12.4,w=Math.max(.05,riverWidth(z)-.58);
    const mesh=b(.035+rand()*.045,.014,.13+rand()*.31,glintMat,riverX(z)+(rand()-.5)*w*1.65,-1.55,z,dynamicRoot);mesh.castShadow=false;
    mesh.rotation.y=(rand()-.5)*.3;ripples.push({mesh,z,offset:rand()*TAU});
  }
  // Broken bedding along the gorge: vertical faults, shelves and loose rubble below.
  for(let z=-.10;z<12.5;z+=.37){
    for(const sign of [-1,1]){
      const edge=riverX(z)+sign*riverWidth(z),width=.32+rand()*.27;
      for(let j=0;j<4;j++){
        const yy=-1.55+j*.50,offset=(3-j)*.07;
        const stone=b(width,.36+rand()*.20,.36+rand()*.22,[L.deep,L.rust,M.rock,L.orange][j],edge+sign*offset,yy+.22,z+(rand()-.5)*.15);stone.rotation.y=(rand()-.5)*.35;
      }
      if(rand()>.45)rock(edge-sign*(.28+rand()*.25),-1.55,z,.23+rand()*.30,L.pale);
      if(rand()>.3)rock(edge+sign*(.22+rand()*.25),G-.02,z,.22+rand()*.35);
    }
  }
  // A custom angular profile makes long geological surfaces instead of stacked uniform bricks.
  function angularLayer(cx,cz,rx,rz,y,h,profile,taper,material){
    const count=profile.length,positions=[];
    const pt=(i,upper)=>{const a=i/count*TAU,rr=profile[i%count],t=upper?taper:1;return[cx+Math.cos(a)*rx*rr*t,y+(upper?h:0),cz+Math.sin(a)*rz*rr*t];};
    const tri=(a,b,c)=>positions.push(...a,...b,...c);
    for(let i=0;i<count;i++){
      const a=pt(i,false),bb=pt((i+1)%count,false),cc=pt((i+1)%count,true),d=pt(i,true);
      tri(a,cc,bb);tri(a,d,cc);tri([cx,y+h,cz],cc,d);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();
    const uv=new Float32Array(positions.length/3*2);for(let i=0;i<positions.length/3;i++){uv[i*2]=positions[i*3]*.25;uv[i*2+1]=(positions[i*3+1]+positions[i*3+2])*.25;}geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;props.add(mesh);return mesh;
  }
  function mesa(x,z,w,d,height,seedOffset=0){
    const profile=Array.from({length:13},(_,i)=>height>4?([1.03,.72,1.04,.90,1.1,.98,.70,1.02,.90,1.04,.68,.96,1.07][i]+rand()*.06):.88+rand()*.20+(i%4===1?.1:0));
    const cuts=[0,.13,.31,.49,.66,.83,.95,1];
    const widths=height>4?[1.12,1.04,.95,.90,.83,.76,.63]:[1.12,1.02,.91,.83,.74,.68,.61];
    for(let j=0;j<cuts.length-1;j++){
      const y=G+height*cuts[j],h=height*(cuts[j+1]-cuts[j]),scale=widths[j];
      angularLayer(x+(j%2)*.04,z,w*.5*scale,d*.5*scale,y,h*.86,profile,.96,rockMats[(j+seedOffset)%rockMats.length]);
      angularLayer(x+(j%2)*.04,z,w*.5*scale*.96,d*.5*scale*.96,y+h*.86,h*.14,profile,.985,j%3?L.orange:L.rim);
      // Unequal, long vertical splinters stop at ledges and catch small contact shadows.
      for(let k=0;k<8;k++){
        const a=(k+.16*(j%3))/8*TAU,rr=profile[Math.floor(k/8*13)],xx=x+Math.cos(a)*w*.5*scale*rr,zz=z+Math.sin(a)*d*.5*scale*rr;
        const len=h*(.85+rand()*.45),ww=.28+rand()*.37;
        const chip=b(ww,len,.20+rand()*.30,k%4===0?L.deep:rockMats[(j+k+seedOffset)%rockMats.length],xx,y+len*.49,zz);chip.rotation.y=-a;chip.rotation.z=(rand()-.5)*.10;
      }
    }
    for(let i=0;i<22;i++){const a=rand()*TAU;rock(x+Math.cos(a)*w*(.49+rand()*.17),G,z+Math.sin(a)*d*(.49+rand()*.17),.22+rand()*.58);}
    for(let i=0;i<8;i++){const a=rand()*TAU,rr=rand()*.35;rock(x+Math.cos(a)*w*rr,G+height,z+Math.sin(a)*d*rr,.15+rand()*.22,L.rim);}
  }
  // One connected amphitheater, with the tallest mesa behind the chase rather than floating alone.
  mesa(7.8,-9.7,5.1,4.3,7.6,0);
  mesa(4.55,-9.45,3.8,3.6,4.5,2);
  mesa(10.65,-9.2,3.7,3.8,3.4,1);
  mesa(2.95,-10.25,3.2,2.8,2.1,0);
  mesa(12.75,-10.0,2.8,3.0,1.7,2);
  // Broad foothill fans connect the buttes to the valley without crossing the riders' corridor.
  for(let i=0;i<31;i++){
    const x=2+rand()*12.5,z=-8.6+rand()*2.0;if(crowded(x,z,.28))continue;
    rock(x,G,z,.45+rand()*.65,rockMats[i%rockMats.length]);
  }
  // Foreground cliffs have lower terraces, rim overhangs and distinct exposed vertical joints.
  mesa(11.8,8.8,6.2,4.3,2.1,0);
  mesa(13.8,5.7,3.2,4.0,1.4,1);
  mesa(8.5,10.9,3.7,2.5,.95,2);
  mesa(-11.9,10.9,3.7,2.8,.72,1);
  mesa(-8.6,10.5,4.0,2.5,.85,2);
  mesa(-4.7,11.1,3.0,2.0,.55,0);
  mesa(-.4,10.9,2.4,2.5,.65,1);
  // The arch has irregular buttresses and a single sandstone lintel, leaving its opening clear.
  const ax=-12.0,az=-4.1;
  const archStart=props.children.length;
  mesa(ax-2.28,az,1.85,1.9,3.2,1);
  mesa(ax+2.28,az+.08,1.85,1.85,3.15,2);
  const lintelProfile=[1,.96,1.04,.91,1.03,.96,1.08,.96,1.02,.93,1.02,.94];
  angularLayer(ax,az,3.12,.72,G+3.08,.68,lintelProfile,.92,L.orange);
  angularLayer(ax-.1,az,2.82,.66,G+3.76,.19,lintelProfile,.94,L.rim);
  for(let i=0;i<15;i++)rock(ax-2.6+rand()*5.2,G+3.97,az+(rand()-.5)*1.25,.18+rand()*.29,rockMats[i%6]);
  // The portal faces the fixed camera; its thick piers must not eclipse the opening.
  const archPieces=props.children.slice(archStart),arch=group(ax,0,az);
  for(const piece of archPieces)arch.attach(piece);
  arch.rotation.y=-.70;
  // Raked sand patches and muted dusty trails enrich the open land without filling every gap.
  for(let i=0;i<95;i++){
    const x=(rand()-.5)*30,z=(rand()-.5)*24;if(inRavine(x,z,.4))continue;
    const radius=.24+rand()*.95,points=[];for(let j=0;j<7;j++){const a=j/7*TAU,rr=radius*(.6+rand()*.5);points.push([x+Math.cos(a)*rr,z+Math.sin(a)*rr*.45]);}
    shaped(points,G+.008,i%3?M.light:L.pale).material= i%3?M.light:L.pale;
  }
  // Fine gravel and angular flakes are tiny enough to read as ground texture after pixel rendering.
  for(let i=0;i<1450;i++){
    const x=(rand()-.5)*30.75,z=(rand()-.5)*24.75;if(inRavine(x,z,.12))continue;
    if(Math.abs(z-2.05)<1.08)continue;
    const size=.025+rand()*.105,chip=b(size*(1+rand()),.012+rand()*.042,size,[M.light,L.pale,M.rockLight,L.rust,M.sandDark][i%5],x,G+.025,z);chip.rotation.y=rand()*TAU;
  }
  // Small irregular interruptions on the exposed specimen sides break up perfectly straight strata.
  for(let i=0;i<110;i++){
    const onX=i%2===0,side=i%4<2?-1:1,px=onX?side*(X-.06):(rand()-.5)*30,pz=onX?(rand()-.5)*24:side*(Z-.06);
    if(!onX&&side>0&&inRavine(px,pz,.25))continue;
    const h=.12+rand()*.45,yy=-.25+rand()*.53;
    const part=b(.28+rand()*.38,h,.26+rand()*.38,rockMats[i%6],px,yy,pz);part.rotation.y=rand()*.4;
  }
  function cactus(x,z,height=2.1,y=G){
    const root=group(x,y,z);root.rotation.y=rand()*TAU;
    c(.105,.145,height,M.cactus,0,height*.5,0,9,root);s(.11,M.cactusLight,0,height,0,root,1);
    for(let k=0;k<7;k++){
      const a=k/7*TAU;r([Math.cos(a)*.143,.12,Math.sin(a)*.143],[Math.cos(a)*.105,height-.03,Math.sin(a)*.105],.013,k%2?M.cactusLight:M.woodDark,root,4);
    }
    for(const sign of [-1,1]){
      const yy=height*(sign===1?.53:.40),len=.23+height*.10,up=height*(sign===1?.29:.38);
      r([0,yy,0],[sign*(len-.10),yy,0],.085,M.cactus,root,7);
      const bend=s(.095,M.cactus,sign*(len-.10),yy+.08,0,root,1);bend.scale.y*=1.55;
      c(.066,.085,up,M.cactus,sign*len,yy+.09+up*.5,0,7,root);s(.067,M.cactusLight,sign*len,yy+.09+up,0,root,1);
      for(const off of [-.042,.042])r([sign*len+off,yy+.15,.054],[sign*len+off,yy+up,.046],.009,M.cactusLight,root,4);
    }
    // Discrete spine glints avoid costly alpha textures.
    for(let k=0;k<5;k++)r([-.13,.25+k*height*.15,.04],[-.19,.27+k*height*.15,.04],.008,L.pale,root,3);
    return root;
  }
  const cactusPlaces=[[-13.6,5.3,2.7],[-8.9,-9.7,2.45],[-1.5,-8.3,2.65],[11.5,-6.1,2.5],[13.8,.15,2.35],[8.1,6.2,3.3],[-1.8,10.1,3.3],[-6,8.7,1.6],[14.4,10.8,1.45],[-14.2,-7.3,1.5],[.2,-11.5,1.6]];
  cactusPlaces.forEach(a=>{if(!crowded(a[0],a[1],.22))cactus(...a);});
  function bush(x,z,size=.55,y=G){
    const root=group(x,y,z),count=5+Math.floor(rand()*3);
    for(let i=0;i<count;i++){
      const a=rand()*TAU,h=size*(.45+rand()*.63),dx=Math.cos(a)*size*.45,dz=Math.sin(a)*size*.45;
      r([0,.015,0],[dx,h,dz],.018,M.woodDark,root,4);
      r([dx*.48,h*.52,dz*.48],[dx*1.4,h*.82,dz*1.4],.012,M.wood,root,4);
      for(let j=0;j<3;j++){const tip=s(.042+size*.025,i%3?M.shrub:L.sage,dx+(rand()-.5)*size*.13,h-j*.075,dz,root,0);tip.scale.y*=1.3;}
    }return root;
  }
  // The track, riders and utility towers retain clear silhouettes.
  for(let i=0;i<170;i++){
    const x=(rand()-.5)*30,z=(rand()-.5)*24;if(crowded(x,z,.18))continue;
    if(x>1.3&&x<14.5&&z<-7.3)continue;
    if(x>7.2&&z>5.3)continue;
    if((x-ax)**2+(z-az)**2<11)continue;
    bush(x,z,.22+rand()*.50);
  }
  for(let i=0;i<95;i++){
    const x=(rand()-.5)*30,z=(rand()-.5)*24;if(crowded(x,z,.25))continue;
    if(x>1.3&&x<14.5&&z<-7.3)continue;
    if(x>7.2&&z>5.3)continue;
    rock(x,G,z,.12+rand()*.32);
  }
  // Exposed high terraces have their own tiny shrubs rather than vegetation buried inside rock.
  [[7.4,-9.6,7.6,.26],[10.8,-9.0,3.4,.37],[11.5,8.65,2.1,.43],[12.5,9.2,2.1,.33],[8.6,10.9,.95,.36],[-12.1,10.8,.72,.37]].forEach(([x,z,h,size])=>bush(x,z,size,G+h));
  function fence(x1,x2,z){
    for(let x=x1;x<=x2+.01;x+=1.0){const post=b(.12,.79,.12,M.woodDark,x,G+.385,z);post.rotation.z=(rand()-.5)*.10;b(.16,.07,.16,M.woodLight,x,G+.81,z);}
    for(const y of [.27,.57])b(x2-x1,.09,.085,M.wood,x1+(x2-x1)/2,G+y,z);
  }
  fence(6.7,11.7,-5.15);fence(-.8,1.2,10.4);fence(-12.2,-9.2,8.4);
  return {riverX,riverWidth,rock,cactus,bush,ripples};
}
