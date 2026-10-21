function buildEnvironment(){
  const TAU=Math.PI*2,G=.52;
  const props=new THREE.Group();scene.add(props);
  const dynamicRoot=new THREE.Group();dynamicRoot.userData.dynamic=true;scene.add(dynamicRoot);
  const M={sand:mat(0xe6a04a,1),light:mat(0xf2b65b,1),sandDark:mat(0xb7652e,1),rock:mat(0xd26b30,1),rockLight:mat(0xe48536,1),rockDark:mat(0x8d3e27,1),wood:mat(0xaa713b,1),woodLight:mat(0xba7b3f,1),woodDark:mat(0x513b2c,1),iron:mat(0x343a3a,.7,.28),roof:mat(0x667077,.85,.12),black:mat(0x303637,.8,.18),brass:mat(0xc89745,.48,.4),red:mat(0xba542b,.8),redLight:mat(0xce7039,.85),cream:mat(0xf1ce87),cactus:mat(0x6b7733,1),cactusLight:mat(0xa69b48,1),shrub:mat(0xb58e2f,1),skin:mat(0xba8b58),denim:mat(0x3e5660),smoke:mat(0xf0dbc0,1),dust:mat(0xf4c781,1)};
  const b=(w,h,d,m,x,y,z,p=props)=>box(w,h,d,m,x,y,z,p);
  const c=(rt,rb,h,m,x,y,z,n=10,p=props)=>cyl(rt,rb,h,m,x,y,z,n,p);
  const r=(a,end,size,m,p=props,n=6)=>beam(a,end,size,m,p,n);
  const s=(size,m,x,y,z,p=props,detail=0)=>sphere(size,m,x,y,z,p,detail);
  const group=(x=0,y=0,z=0,p=props)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  function texture(w,h,paint){const cv=document.createElement('canvas');cv.width=w;cv.height=h;paint(cv.getContext('2d'));const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;}
  const grain=texture(128,128,ctx=>{ctx.fillStyle='#f6d5a1';ctx.fillRect(0,0,128,128);for(let i=0;i<4200;i++){ctx.fillStyle=i%3?'#ce9c65':'#ffecbf';ctx.globalAlpha=.15+rand()*.25;ctx.fillRect(rand()*128,rand()*128,1+rand()*3,1);}ctx.globalAlpha=1;});
  for(const m of [M.sand,M.light,M.sandDark,M.rock,M.rockDark,M.rockLight]){m.map=grain;m.flatShading=true;}
  const woodGrain=texture(128,64,ctx=>{ctx.fillStyle='#edd5a7';ctx.fillRect(0,0,128,64);for(let i=0;i<650;i++){ctx.fillStyle=i%2?'#694b31':'#ffdd9c';ctx.globalAlpha=.25;ctx.fillRect(rand()*128,rand()*64,8+rand()*35,.5+rand());}ctx.globalAlpha=1;});
  for(const m of [M.wood,M.woodLight,M.woodDark,M.red,M.redLight])m.map=woodGrain;
  /* WESTERN_LANDSCAPE */
  const landscape=buildWesternLandscape();
  const {rock,cactus,bush,ripples}=landscape;
  // Timber trestle spanning the stream, with transverse ties and diagonals.
  const trackZ=2.05,railY=.91,railTop=railY+.0875;
  for(let x=-.35;x<7;x+=1.16){for(const z of [trackZ-.76,trackZ+.76]){b(.22,2.58,.22,M.woodDark,x,-.54,z);r([x-.5,-1.80,z],[x+.5,.75,z],.085,M.wood);r([x+.5,-1.80,z],[x-.5,.75,z],.085,M.wood);b(.38,.14,.38,M.woodLight,x,-1.82,z);b(.35,.15,.35,M.woodLight,x,.46,z);}b(.32,.20,2.26,M.woodLight,x,.70,trackZ);r([x,-1.76,trackZ-.76],[x,.65,trackZ+.76],.055,M.wood);r([x,-1.76,trackZ+.76],[x,.65,trackZ-.76],.055,M.wood);}
  for(const z of [trackZ-.73,trackZ+.73]){b(7.5,.23,.21,M.woodDark,3.15,.66,z);b(30,.12,.085,M.iron,0,railY,z);b(30,.035,.14,M.brass,0,railY+.07,z);}
  const ballast=mat(0xc39c69,1);
  b(14.5,.18,2.08,ballast,-8.05,G+.09,trackZ);b(8.0,.18,2.08,ballast,11.15,G+.09,trackZ);
  for(let x=-14.8;x<=14.9;x+=.34){b(.19,.13,2.0,M.wood,x,.73,trackZ);for(const z of [trackZ-.73,trackZ+.73]){b(.20,.055,.17,M.iron,x,.8225,z);b(.07,.025,.07,M.brass,x,.865,z);}if(x<-.7||x>7.1)for(const side of [-1,1]){const chip=s(.07,ballast,x,G+.1,trackZ+side*(.85+rand()*.18));chip.scale.y*=.5;}}
  // Train components are animated as rigid miniature mechanisms.
  const train=group(0,0,trackZ,dynamicRoot),wheels=[],rods=[],axles=[];
  function axle(x,y,radius,parent){
    y=railTop+radius-parent.position.y;axles.push({x,y,radius,parent});
    for(const sign of [-1,1]){
      const wh=group(x,y,sign*.69,parent);wh.rotation.x=Math.PI/2;
      c(radius,radius,.13,M.iron,0,0,0,18,wh);c(radius*.80,radius*.80,.15,M.red,0,0,0,16,wh);c(radius*.66,radius*.66,.16,M.black,0,0,0,16,wh);
      for(let i=0;i<10;i++){const a=i/10*TAU;r([0,0,0],[Math.cos(a)*radius*.77,0,Math.sin(a)*radius*.77],.025,M.brass,wh,5);}c(.085,.085,.21,M.brass,0,0,0,10,wh);wheels.push(wh);
    }
    r([x,y,-.8],[x,y,.8],.06,M.iron,parent);
  }
  function xCylinder(rad,length,m,x,y,z,parent){const obj=c(rad,rad,length,m,x,y,z,18,parent);obj.rotation.z=Math.PI/2;return obj;}
  // Negative X is the leading end: the engine faces the lower-left of the image.
  const engine=group(-7.3,.18,0,train);
  b(4.7,.20,1.25,M.black,0,1.28,0,engine);xCylinder(.57,2.9,M.black,-.45,2.12,0,engine);
  xCylinder(.59,.12,M.brass,-1.96,2.12,0,engine);xCylinder(.47,.14,M.iron,-2.05,2.12,0,engine);xCylinder(.13,.19,M.brass,-2.16,2.12,0,engine);
  for(const x of [-1.52,-.74,.06,.76]){const ring=xCylinder(.58,.045,M.brass,x,2.12,0,engine);}
  for(const z of [-.60,.60]){r([-1.8,2.48,z],[.8,2.48,z],.025,M.brass,engine);r([-1.8,1.43,z],[1.9,1.43,z],.035,M.brass,engine);}
  for(const xx of [-1.9,-.9,.1,.75])for(let j=0;j<12;j++){const a=j/12*TAU;s(.022,M.brass,xx,2.12+Math.sin(a)*.575,Math.cos(a)*.575,engine);}
  for(const side of [-1,1]){r([-1.4,1.63,side*.61],[.7,1.63,side*.61],.036,M.brass,engine);for(const xx of [-1.7,-1.3,-.9,-.5,-.1,.3,.7])b(.08,.04,.08,M.brass,xx,1.43,side*.66,engine);}
  c(.30,.13,.55,M.iron,-1.34,2.86,0,10,engine);c(.34,.30,.10,M.brass,-1.34,3.16,0,10,engine);
  for(const x of [-.45,.20]){c(.17,.21,.32,M.brass,x,2.8,0,12,engine);s(.18,M.brass,x,2.98,0,engine,1);}
  b(1.37,1.38,1.47,M.red,1.35,2.12,0,engine);b(1.62,.12,1.67,M.black,1.35,2.86,0,engine);
  const windowMat=new THREE.MeshStandardMaterial({color:0xf4b850,emissive:0xf28c26,emissiveIntensity:.42,roughness:.4});
  for(const sign of [-1,1]){b(.62,.60,.035,M.woodDark,1.35,2.39,sign*.75,engine);b(.47,.43,.042,windowMat,1.35,2.40,sign*.77,engine);b(.045,.52,.055,M.brass,1.35,2.4,sign*.80,engine);b(.78,.07,.06,M.brass,1.35,2.09,sign*.79,engine);b(.62,.34,.045,M.redLight,1.35,1.76,sign*.76,engine);}
  for(const x of [-1.10,-.17,.76])axle(x,1.19,.47,engine);axle(-2.03,1.07,.21,engine);
  for(const sign of [-1,1]){const rod=b(2.05,.07,.07,M.brass,-.20,1.29,sign*.85,engine);rods.push({rod,sign});xCylinder(.15,.42,M.iron,-1.65,1.45,sign*.53,engine);}
  b(.16,.16,1.66,M.red,-2.70,1.00,0,engine);
  for(let i=0;i<13;i++){const z=(i-6)*.135;r([-2.16,1.46,z*.66],[-3.02,.88,z],.040,M.brass,engine);}
  r([-3.02,.89,-.84],[-3.02,.89,.84],.045,M.redLight,engine);
  const lamp=c(.16,.16,.24,M.brass,-2.12,2.7,0,10,engine);lamp.rotation.z=Math.PI/2;xCylinder(.11,.02,windowMat,-2.26,2.7,0,engine);
  const tender=group(-3.22,.18,0,train);b(2.9,.20,1.5,M.black,0,1.22,0,tender);b(2.7,.88,1.32,M.red,0,1.81,0,tender);
  for(const sign of [-1,1]){b(2.5,.05,.05,M.brass,0,1.43,sign*.68,tender);b(2.5,.05,.05,M.brass,0,2.22,sign*.68,tender);b(.49,.25,.025,M.brass,0,1.83,sign*.68,tender);b(.34,.17,.03,M.redLight,0,1.83,sign*.70,tender);}
  for(let i=0;i<85;i++)s(.07+rand()*.06,M.black,(rand()-.5)*2.5,2.27+rand()*.14,(rand()-.5)*1.17,tender);
  axle(-.90,1.08,.29,tender);axle(.90,1.08,.29,tender);
  function coach(x,index){
    const roof=mat([0x737467,0x82735b,0x967448][index],.9,.08);
    const g=group(x,.18,0,train);b(3.47,.18,1.65,M.black,0,1.24,0,g);b(3.24,1.44,1.52,index===0?M.red:M.wood,0,2.13,0,g);
    for(const sign of [-1,1]){
      for(let j=0;j<6;j++){const xx=-1.30+j*.52;b(.40,.64,.04,M.woodDark,xx,2.35,sign*.78,g);b(.31,.49,.05,windowMat,xx,2.37,sign*.81,g);b(.027,.52,.05,M.brass,xx,2.37,sign*.85,g);b(.34,.03,.05,M.brass,xx,2.36,sign*.85,g);}
      for(const y of [1.52,1.63,1.74,1.85,2.77])b(3.26,.025,.025,M.brass,0,y,sign*.78,g);
      for(let j=0;j<9;j++)b(.022,1.34,.035,M.woodDark,-1.5+j*.375,2.1,sign*.79,g);
      for(const xx of [-1.8,1.8]){b(.28,.08,.23,M.woodDark,xx,1.38,sign*.61,g);r([xx,1.4,sign*.70],[xx,2.2,sign*.70],.025,M.brass,g);}
    }
    for(const xx of [-1.62,1.62]){b(.06,.95,.65,M.woodDark,xx,2.05,0,g);b(.08,.49,.32,windowMat,xx*1.01,2.27,0,g);}
    b(3.48,.12,1.72,roof,0,2.89,0,g);b(3.46,.15,1.48,roof,0,2.99,0,g);b(3.42,.10,1.12,roof,0,3.10,0,g);
    for(let j=0;j<10;j++)b(.025,.025,1.56,M.brass,-1.62+j*.36,3.085,0,g);
    for(const xx of [-.85,.85]){b(.44,.11,.56,M.woodDark,xx,3.2,0,g);for(let j=0;j<4;j++)b(.035,.025,.48,M.brass,xx-.15+j*.1,3.265,0,g);}
    for(const side of [-1,1])for(const xx of [-.9,.9]){b(.65,.14,.13,M.iron,xx,1.15,side*.71,g);for(let j=0;j<4;j++)b(.46-j*.07,.03,.07,M.brass,xx,1.25+j*.036,side*.74,g);}
    for(const xx of [-1.08,-.71,.71,1.08])axle(xx,1.08,.26,g);
    return g;
  }
  const coaches=[coach(.34,0),coach(4.44,1),coach(8.54,2)];
  for(const x of [-4.95,-1.35,2.39,6.49])b(.62,.09,.10,M.iron,x,1.48,0,train);
  // Tower wind pump and stave-built water tank.
  const towerX=13.1,towerZ=-4.4;
  for(const sx of [-1,1])for(const sz of [-1,1])r([towerX+sx*.57,G,towerZ+sz*.57],[towerX+sx*.24,4.80,towerZ+sz*.24],.08,M.woodDark);
  for(let j=0;j<4;j++){const y=G+j*1.03,w=.57-j*.075;for(const sz of [-1,1]){r([towerX-w,y,towerZ+sz*w],[towerX+w,y+1.03,towerZ+sz*(w-.075)],.04,M.wood);r([towerX+w,y,towerZ+sz*w],[towerX-w,y+1.03,towerZ+sz*(w-.075)],.04,M.wood);}b(w*2+.12,.09,w*2+.12,M.woodLight,towerX,y,towerZ);}
  r([towerX,4.65,towerZ],[towerX,5.55,towerZ],.065,M.iron);
  const rotor=group(towerX,5.4,towerZ,dynamicRoot);rotor.rotation.y=.1;
  for(let i=0;i<12;i++){const a=i/12*TAU;r([0,0,0],[Math.cos(a)*.85,Math.sin(a)*.85,0],.018,M.iron,rotor);const blade=b(.22,.51,.035,i%2?M.woodLight:M.brass,Math.cos(a)*.69,Math.sin(a)*.69,0,rotor);blade.rotation.z=a-Math.PI/2+.2;}
  const hub=c(.11,.11,.20,M.iron,0,0,0,10,rotor);hub.rotation.x=Math.PI/2;
  r([towerX,5.4,towerZ],[towerX+1.1,5.4,towerZ],.035,M.iron);b(.46,.35,.07,M.woodDark,towerX+1.12,5.4,towerZ);
  const tankX=14,tankZ=-2.1;
  for(const sx of [-1,1])for(const sz of [-1,1])r([tankX+sx*.48,G,tankZ+sz*.48],[tankX+sx*.48,2.08,tankZ+sz*.48],.065,M.woodDark);
  c(.60,.60,1.10,M.wood,tankX,2.47,tankZ,18);c(.64,.64,.08,M.woodDark,tankX,3.06,tankZ,18);
  for(const y of [2.0,2.35,2.80,3])c(.615,.615,.045,M.iron,tankX,y,tankZ,18);
  for(let i=0;i<18;i++){const a=i/18*TAU;r([tankX+Math.cos(a)*.605,1.95,tankZ+Math.sin(a)*.605],[tankX+Math.cos(a)*.605,3.03,tankZ+Math.sin(a)*.605],.012,M.woodDark);}
  function crate(x,z,size=.5,ground=G){b(size,size,size,M.wood,x,ground+size/2,z);for(const sign of [-1,1]){for(const y of [.05,size-.05])b(size,.055,.03,M.woodLight,x,ground+y,z+sign*size*.51);r([x-size*.4,ground+.05,z+sign*size*.52],[x+size*.4,ground+size-.05,z+sign*size*.52],.035,M.woodDark);} }
  crate(7.4,8.8);crate(6.8,9.1,.42);crate(11.5,8.65,.55,G+2.1);crate(12.1,-.3,.43);
  /* WESTERN_RIDERS */
  const riders=buildWesternRiders();
  // Opaque faceted puffs batch with the moving parts, without sorting artifacts.
  const smoke=[];for(let i=0;i<43;i++){const puff=s(1,M.smoke,0,0,0,dynamicRoot,1);puff.castShadow=false;smoke.push(puff);}
  const dust=[];for(let i=0;i<132;i++){const puff=s(1,i%4?M.dust:M.smoke,0,0,0,dynamicRoot,i%3?0:1);puff.castShadow=false;dust.push(puff);}
  function update(t){
    const phase=t/12*TAU;
    // Positive spin rolls toward the leading negative-X end of the locomotive.
    for(const w of wheels)w.rotation.y=phase*12;
    for(const {rod,sign}of rods){rod.position.x=-.2+Math.cos(phase*12)*.12;rod.position.y=railTop+.47-engine.position.y+Math.sin(phase*12)*.12;}
    train.position.y=0;
    rotor.rotation.z=-phase*3;
    riders.forEach(p=>p.update(t));
    smoke.forEach((p,i)=>{const u=((t/4+i/43)%1+1)%1;const size=(.10+Math.sin(Math.PI*u)*(.29+(i%3)*.05));p.position.set(-8.64+u*4.7+Math.sin(i*8)*.16,3.39+u*1.95,trackZ+u*.95+Math.sin(u*7+i)*.21);p.scale.setScalar(size*Math.sin(Math.PI*u)**.35);});
    dust.forEach((p,i)=>{const rider=riders[i%6],u=((t/3+i/132)%1+1)%1,heading=rider.heading;const size=Math.sin(u*Math.PI)*(.13+(i%7)*.041),spread=Math.sin(i*7)*(.14+u*.53),trail=.6+u*2.7;p.position.set(rider.root.position.x-heading.x*trail+heading.z*spread,G+.08+u*(.18+(i%4)*.035),rider.root.position.z-heading.z*trail-heading.x*spread);p.scale.set(size*(1.05+(i%3)*.13),size*(.65+(i%5)*.13),size);});
    ripples.forEach(p=>{p.mesh.position.z=p.z+Math.sin(phase*2+p.offset)*.13;p.mesh.scale.x=.8+Math.sin(phase*3+p.offset)*.25;});
  }
  return {dynamicRoot,anglers:riders,riders,train,wheels,axles,coaches,railTop,smoke,dust,update,prepareReflection(){}};
}
