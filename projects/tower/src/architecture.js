function buildingArchitecture(P,A){
  const {M,g,b,c,r,s,tor,text}=P,stoneCache=new Map();
  const stone=new THREE.MeshStandardMaterial({color:0xeee8dc,map:stoneTextureSet.color,bumpMap:stoneTextureSet.bump,bumpScale:.065,roughnessMap:stoneTextureSet.roughness,roughness:.96});
  stone.userData={worldStone:true,tileSize:1.65};
  const stoneDark=stone.clone();stoneDark.color.set(0xbabdb1);stoneDark.userData={...stone.userData};
  const stairRed=new THREE.MeshStandardMaterial({color:0xb43b30,roughness:.77,metalness:.32}),stairEdge=new THREE.MeshStandardMaterial({color:0xd65b44,roughness:.75,metalness:.27});
  const blue=new THREE.MeshStandardMaterial({color:0x2d80b3,roughness:.48,metalness:.40}),red=new THREE.MeshStandardMaterial({color:0xbf3b32,roughness:.59,metalness:.42}),steel=new THREE.MeshStandardMaterial({color:0x7b8580,roughness:.60,metalness:.65});
  const doorPaint=canvasTexture(128,256,ctx=>{ctx.fillStyle='#bdc3bd';ctx.fillRect(0,0,128,256);for(let j=0;j<2200;j++){ctx.globalAlpha=.05+rand()*.16;ctx.fillStyle=j%4?'#596364':'#e9e8d9';ctx.fillRect(rand()*128,rand()*256,.4+rand()*1.1,2+rand()*8);}ctx.globalAlpha=1;});
  const doorIron=new THREE.MeshStandardMaterial({color:0x58676c,map:doorPaint,roughness:.68,metalness:.57});
  const stats={columnThickness:A.column,beamDepth:.70,slabDepth:.64,stoneTexture:'Poly Haven Rock 04',stoneMaps:['color','bump','roughness'],stoneWorldUV:true,mossPatches:0,doors:[],walls:[],pipes:[],drains:[],landings:[],roofLandingGuarded:false,stairColor:'#b43b30',surface:A.surface,opening:{width:A.innerW,depth:A.innerD}};
  function sb(p,x,y,z,w,h,d,dark=false){
    const radius=Math.min(.045,w*.14,h*.14,d*.14),key=[w,h,d,radius].join('/');if(!stoneCache.has(key))stoneCache.set(key,new RoundedBoxGeometry(w,h,d,2,radius));
    const o=new THREE.Mesh(stoneCache.get(key),dark?stoneDark:stone);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;
  }
  function slab(p){
    // Keep an opening under the terrain, so the recessed pond is never covered by stone.
    sb(p,0,-.265,0,A.W,.15,A.D,true);
    const front=(A.D-A.innerD)/2,side=(A.W-A.innerW)/2;
    for(const sign of [-1,1]){sb(p,0,0,sign*(A.innerD/2+front/2),A.W,.64,front);sb(p,sign*(A.innerW/2+side/2),0,0,side,.64,A.innerD);}
    sb(p,6.32,0,0,.80,.64,A.D);
    for(const z of [-A.D/2+.05,A.D/2-.05])sb(p,0,-.24,z,A.W+.10,.14,.17,true);
  }
  function rail(p,x1,z1,x2,z2,h=.75,material=M.iron,y0=0){
    const steps=Math.ceil(Math.hypot(x2-x1,z2-z1)/.75);
    for(let j=0;j<=steps;j++){const t=j/steps;b(p,x1+(x2-x1)*t,y0+h/2,z1+(z2-z1)*t,.041,h,.041,material);}
    for(const yy of [.15,h])r(p,[x1,y0+yy,z1],[x2,y0+yy,z2],.023,material);
    for(let j=1;j<steps*3;j++){const t=j/(steps*3);b(p,x1+(x2-x1)*t,y0+h/2,z1+(z2-z1)*t,.016,h-.10,.016,material);}
  }
  function stairs(p,index,last=false){const half=A.H/2,xs=[7.25,8.25],za=A.doorZ,zb=-2.75,S=A.surface;
    for(const[y,z]of[[S,za],[S+half,zb-.22],[S+A.H,za]]){if(index>0&&y===S)continue;const front=z===za,x=front?7.50:7.85,w=front?3.40:2.70;b(p,x,y-.07,z,w,.14,front?1.50:1.06,stairRed);b(p,x,y+.004,z,w-.1,.015,front?1.43:1.00,stairEdge);stats.landings.push({owner:index,center:[x,.19+index*A.H+y,z],width:w,depth:front?1.50:1.06});}
    for(let run=0;run<2;run++){const x=xs[run],a=run?zb:za,end=run?za:zb,y0=S+run*half;
      for(let j=0;j<20;j++){const t=(j+1)/20,y=y0+half*t,z=a+(end-a)*t;b(p,x,y-.04,z,.76,.08,.335,stairRed);b(p,x,y+.003,z+.125,.76,.012,.045,stairEdge);
        for(const side of [-1,1]){c(p,x+side*.29,y+.012,z-.06,.018,.018,.015,steel,6);if(j%4===0)b(p,x+side*.40,y+.39,z,.035,.78,.035,stairRed);}
      }
      for(const side of [-1,1]){r(p,[x+side*.40,y0-.045,a],[x+side*.40,y0+half-.045,end],.060,stairRed);r(p,[x+side*.40,y0+.79,a],[x+side*.40,y0+half+.79,end],.030,stairRed);}
    }
    rail(p,9.18,za-.73,9.18,za+.73,.81,stairRed,S);rail(p,9.18,za+.73,6.55,za+.73,.81,stairRed,S);rail(p,6.55,zb-.73,9.18,zb-.73,.81,stairRed,S+half);
    if(last){rail(p,9.18,za-.73,9.18,za+.73,.81,stairRed,S+A.H);rail(p,9.18,za+.73,6.55,za+.73,.81,stairRed,S+A.H);stats.roofLandingGuarded=true;}
    for(const x of [6.55,9.16]){const height=last?half+S:A.H;b(p,x,height/2,zb-.72,.09,height,.09,stairRed);if(index===0)sb(p,x,-.17,zb-.72,.30,.20,.30,true);}
  }
  function door(p,index,roof=false,options={}){
    const x=options.x??A.wallX+A.wallThickness/2+.025,z=options.z??A.doorZ,q=g(p,x,A.surface,z);q.rotation.y=options.yaw??Math.PI/2;const w=1.28,h=2.45;
    b(q,0,h/2,0,w,h,.09,doorIron);
    for(const xx of [-w/2-.085,w/2+.085])b(q,xx,h/2,0,.12,h+.13,.20,steel);b(q,0,h+.06,0,w+.29,.13,.20,steel);b(q,0,.02,.055,w+.30,.055,.33,steel);
    for(const yy of [.60,1.48]){b(q,0,yy,.054,w-.20,.65,.025,doorIron);for(const xx of [-w*.39,w*.39])b(q,xx,yy,.073,.018,.55,.014,steel);}
    for(let j=0;j<5;j++)b(q,0,2.09+j*.047,.065,.60,.020,.022,M.black);
    for(const yy of [.28,1.21,2.16]){c(q,w/2,yy,.12,.027,.027,.13,steel,8);for(const xx of [-w/2+.08,w/2-.08])s(q,xx,yy,.070,.018,steel,1);}
    b(q,-.43,1.10,.105,.07,.23,.045,steel);b(q,-.34,1.14,.147,.23,.041,.055,steel);c(q,-.43,1.00,.134,.022,.022,.018,M.black,8).rotation.x=Math.PI/2;
    text(q,roof?'ROOF':String(index+1).padStart(2,'0'),0,h+.32,.11,.56,.22,'#c3c6bb','#38494a');
    stats.doors.push({floor:index,roof,center:[x,A.surface,z],width:w,height:h,landingHeight:A.surface,opening:true,material:'painted iron'});
  }
  function wall(p,index){
    const low=A.surface-.05,top=A.H-.32,openHalf=.79,doorTop=A.surface+2.60,z0=-A.D/2,z1=A.doorZ-openHalf,z2=A.doorZ+openHalf,z3=A.D/2;
    sb(p,A.wallX,(low+top)/2,(z0+z1)/2,A.wallThickness,top-low,z1-z0);
    sb(p,A.wallX,(low+top)/2,(z2+z3)/2,A.wallThickness,top-low,z3-z2);
    sb(p,A.wallX,(doorTop+top)/2,A.doorZ,A.wallThickness,top-doorTop,openHalf*2);
    sb(p,A.wallX,low-.06,A.doorZ,A.wallThickness,.12,openHalf*2,true);
    door(p,index);stats.walls.push({floor:index,x:A.wallX,thickness:A.wallThickness,doorOpening:[z1,z2,low,doorTop],height:top-low});
  }
  const mossTexture=canvasTexture(256,256,ctx=>{
    const image=ctx.createImageData(256,256),hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
    const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy,u=a*a*(3-2*a),v=b*b*(3-2*b);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);};
    for(let y=0;y<256;y++)for(let x=0;x<256;x++){let n=0,amp=.55,freq=5;for(let j=0;j<5;j++){n+=noise(x/256*freq+17,y/256*freq+31)*amp;amp*=.5;freq*=2.1;}const px=(x-128)/128,py=(y-128)/128,rad=Math.sqrt(px*px*.8+py*py*1.15),edge=1-THREE.MathUtils.smoothstep(rad,.15+n*.55,.96),grain=noise(x*.19,y*.19),a=THREE.MathUtils.clamp((n-.43)*7,0,1)*edge*(grain>.32?1:.15),i=(y*256+x)*4;image.data[i]=39+n*59;image.data[i+1]=53+n*73;image.data[i+2]=22+n*40;image.data[i+3]=a*255;}ctx.putImageData(image,0,0);
  });
  const mossMaterial=new THREE.MeshStandardMaterial({map:mossTexture,roughness:1,alphaTest:.15,side:THREE.DoubleSide,depthWrite:true});
  function moss(p,x,y,z,w,h,orientation='top',angle=0){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mossMaterial);o.position.set(x,y,z);if(orientation==='top')o.rotation.set(-Math.PI/2,0,angle);else if(orientation==='side')o.rotation.set(0,Math.PI/2,angle);else o.rotation.z=angle;o.receiveShadow=true;o.castShadow=false;p.add(o);stats.mossPatches++;}
  function mossLevel(p,index){
    for(let j=0;j<21;j++){const x=-5.8+rand()*11.6,z=A.D/2+.012;moss(p,x,-.10+rand()*.24,z,.35+rand()*1.1,.12+rand()*.24,'front',rand()*2-.8);if(j%3===0)moss(p,x,.328,z-.19,.40+rand()*.65,.34,'top',rand()*6.28);}
    for(const x of [-6.0,0,6.0]){const dx=(rand()-.5)*.24;moss(p,x,.331,4.45,.92,.70,'top',rand()*6.28);moss(p,x+dx,.53,4.45+A.column/2+.014,.55,.65,'front',rand()*2-.8);moss(p,x-dx,.95+rand()*.5,4.45+A.column/2+.014,.28+rand()*.18,.70,'front',rand()*2-.8);}
    for(let j=0;j<12;j++){const z=-4.4+j*.78;moss(p,-6.12,.33,z,.41,.66,'top',rand()*3);}
    for(const z of [-3.85,1.60]){moss(p,A.wallX+A.wallThickness/2+.014,.75,z,.65,.85,'side');moss(p,A.wallX+A.wallThickness/2+.014,2.0,z,.34,.90,'side',.06);}
  }
  function pipeCurve(p,points,radius,material){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)),false,'centripetal'),o=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*5),radius,10,false),material);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
  function pipeLevel(p,index){const x=A.wallX+A.wallThickness/2+.16;
    for(const[z,material,color]of[[-3.85,blue,'blue'],[1.60,red,'red']]){
      const bottom=index===0?.48:0;c(p,x,(A.H+bottom)/2,z,.095,.095,A.H-bottom,material,12);
      for(const y of [.68,A.H*.5,A.H-.38]){c(p,x,y,z,.128,.128,.10,steel,12);b(p,A.wallX+A.wallThickness/2+.06,y,z,.15,.16,.32,steel);for(const side of [-1,1])s(p,x-.07,y,z+side*.13,.025,steel,1);}
      stats.pipes.push({floor:index,color,x,z,start:bottom,end:A.H});
      if(index===0){
        pipeCurve(p,[[x,.48,z],[x,.30,z],[x+.10,.17,z],[x+.31,.15,z],[x+.60,.15,z]],.095,material);
        const mouth=tor(p,x+.61,.15,z,.102,.023,steel);mouth.rotation.y=Math.PI/2;const hole=c(p,x+.617,.15,z,.082,.082,.012,M.black,12);hole.rotation.z=Math.PI/2;
        stats.drains.push({color,position:[x+.61,.15,z],openMouth:true});
      }
    }
  }
  function foundationDetails(p){
    const x=A.wallX+A.wallThickness/2+.16;
    for(const z of [-3.85,1.60]){b(p,x+.62,.148,z,.73,.09,.66,M.iron);b(p,x+.62,.20,z,.58,.018,.52,M.black);for(let j=0;j<8;j++)b(p,x+.37+j*.07,.218,z,.025,.025,.50,steel);moss(p,x+.65,.145,z,.95,.88,'top');}
    for(let j=0;j<3;j++)sb(p,7.55,.14+(j+1)*.13/2,A.doorZ+1.27-j*.26,1.64,(j+1)*.13,.38);
  }
  function roofAccess(p,roofIndex){
    const low=A.surface,h=2.95,z=A.doorZ,x=A.wallX-1.0;
    sb(p,x,low+h/2,z-1.18,2.5,h,.34);sb(p,x-1.17,low+h/2,z,.32,h,2.7);
    sb(p,x,low+h/2,z+1.18,2.5,h,.34);sb(p,x,low+h+.08,z,2.85,.26,2.95);
    const edge=A.doorZ-.79,end=A.doorZ+.79;sb(p,A.wallX,low+h/2,(A.doorZ-1.18+edge)/2,A.wallThickness,h,.39);sb(p,A.wallX,low+h/2,(end+A.doorZ+1.18)/2,A.wallThickness,h,.39);sb(p,A.wallX,low+2.78,A.doorZ,A.wallThickness,.34,1.58);door(p,roofIndex,true);
    const px=A.wallX+A.wallThickness/2+.16;
    pipeCurve(p,[[px,0,-3.85],[px,1.80,-3.85],[px-.12,2.02,-3.85],[4.45,2.02,-3.85],[4.45,2.02,-3.37]],.095,blue);
    pipeCurve(p,[[px,0,1.60],[px,.87,1.60],[px-.15,1.10,1.60],[5.1,1.10,1.60],[5.1,1.10,A.doorZ-1.38]],.095,red);
    c(p,px,.28,-3.85,.126,.126,.10,steel);c(p,px,.28,1.60,.126,.126,.10,steel);
    moss(p,4.45,.33,-3.95,1.1,.75,'top');moss(p,A.wallX+.25,.70,A.doorZ+1.36,.55,.70,'side');
  }
  return{sb,slab,rail,stairs,wall,door,moss,mossLevel,pipeLevel,foundationDetails,roofAccess,pipeCurve,stats,stone,stoneDark,stairRed};
}
