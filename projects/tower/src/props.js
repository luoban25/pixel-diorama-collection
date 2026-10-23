function towerProps(){
  const M={concrete:mat(0xb7b4a4),light:mat(0xd7cfb9),edge:mat(0x969b90),wood:mat(0x9a7046),oak:mat(0xc29860),darkwood:mat(0x654c36),iron:mat(0x354a45),rust:mat(0x97563c),blue:mat(0x537b82),teal:mat(0x54756a),navy:mat(0x354b58),ivory:mat(0xeee3c8),orange:mat(0xbf763d),red:mat(0xad4f38),gold:mat(0xc4a45a),leaf:mat(0x55723c),leaf2:mat(0x829345),leaf3:mat(0xa8ab51),soil:mat(0x4e4938),black:mat(0x263532),skin:mat(0xd5a16e),skin2:mat(0xb7835d),hair:mat(0x30362a),glass:mat(0x688d88),cloth:mat(0xc5bba1)};
  M.glow=new THREE.MeshStandardMaterial({color:0xffdc9c,emissive:0xffbe69,emissiveIntensity:.36,roughness:.9});
  const g=(parent,x=0,y=0,z=0)=>{const o=new THREE.Group();o.position.set(x,y,z);parent.add(o);return o;};
  const b=(p,x,y,z,w,h,d,m)=>box(w,h,d,m,x,y,z,p);
  const c=(p,x,y,z,rt,rb,h,m,n=8)=>cyl(rt,rb,h,m,x,y,z,n,p);
  const r=(p,a,end,size,m)=>beam(a,end,size,m,p,5);
  const s=(p,x,y,z,size,m,detail=0)=>sphere(size,m,x,y,z,p,detail);
  const tor=(p,x,y,z,rad,tube,m,rx=0)=>{const o=new THREE.Mesh(new THREE.TorusGeometry(rad,tube,4,20),m);o.position.set(x,y,z);o.rotation.x=rx;o.castShadow=true;p.add(o);return o;};
  function text(p,label,x,y,z,w=.9,h=.28,bg='#c3ad7d',ink='#354940'){
    const key=label+'/'+bg+'/'+ink;let texture=signs.get(key);
    if(!texture){texture=canvasTexture(256,80,ctx=>{ctx.fillStyle=bg;ctx.fillRect(0,0,256,80);ctx.fillStyle=ink;ctx.font='bold 31px Arial';ctx.textAlign='center';ctx.fillText(label,128,53);ctx.globalAlpha=.16;for(let i=0;i<80;i++)ctx.fillRect(rand()*256,rand()*80,2,1);});signs.set(key,texture);}
    const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide}));o.position.set(x,y,z);p.add(o);return o;
  }
  function plant(p,x,z,scale=1,y=0,kind=0){
    const root=g(p,x,y,z);root.rotation.y=rand()*6.28;
    c(root,0,.17*scale,0,.21*scale,.15*scale,.34*scale,kind%2?M.teal:M.rust);
    c(root,0,.35*scale,0,.192*scale,.192*scale,.025*scale,M.soil);
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2+rand()*.3,len=(.24+rand()*.28)*scale;
      const leaf=b(root,Math.sin(a)*len*.35,(.45+rand()*.19)*scale,Math.cos(a)*len*.35,.08*scale,len,.05*scale,[M.leaf,M.leaf2,M.leaf3][i%3]);leaf.rotation.set(Math.cos(a)*.7,a,Math.sin(a)*.7);
    }
    return root;
  }
  function planter(p,x,z,w=1.5,d=.55,y=0){
    b(p,x,y+.2,z,w,.4,d,M.darkwood);b(p,x,y+.42,z,w+.07,.08,d+.07,M.oak);b(p,x,y+.46,z,w-.08,.02,d-.08,M.soil);
    for(let i=0;i<Math.ceil(w*5);i++){const px=x+(rand()-.5)*(w-.12),pz=z+(rand()-.5)*(d-.12);for(let j=0;j<4;j++){const a=rand()*6.28;const leaf=b(p,px+Math.sin(a)*.08,y+.57+rand()*.14,pz+Math.cos(a)*.08,.10,.18,.055,[M.leaf,M.leaf2,M.leaf3][j%3]);leaf.rotation.z=(rand()-.5)*.8;}}
  }
  function chair(p,x,z,yaw=0,color=M.wood){const q=g(p,x,0,z);q.rotation.y=yaw;
    b(q,0,.48,0,.47,.10,.47,color);b(q,0,.87,-.22,.45,.55,.06,color);
    for(const xx of [-.18,.18])for(const zz of [-.18,.18])b(q,xx,.24,zz,.045,.48,.045,M.iron);
    return q;
  }
  function table(p,x,z,w=1.7,d=.95,round=false){const q=g(p,x,0,z);
    if(round)c(q,0,.79,0,w/2,w/2,.10,M.oak,14);else b(q,0,.79,0,w,.10,d,M.oak);
    for(const xx of [-w*.37,w*.37])for(const zz of [-d*.32,d*.32])b(q,xx,.39,zz,.055,.74,.055,M.darkwood);
    for(let i=0;i<3;i++){const px=(rand()-.5)*w*.65,pz=(rand()-.5)*d*.6;c(q,px,.88,pz,.075,.075,.035,M.ivory,10);c(q,px+.12,.95,pz,.037,.035,.13,[M.red,M.blue,M.ivory][i]);}
    return q;
  }
  function sofa(p,x,z,yaw=0,color=M.teal){const q=g(p,x,0,z);q.rotation.y=yaw;
    b(q,0,.40,0,2.22,.42,.83,color);b(q,0,.85,-.36,2.24,.73,.18,color);
    for(const side of [-1,1]){b(q,side*1.08,.67,0,.20,.48,.9,color);b(q,side*.82,.12,.23,.10,.24,.10,M.darkwood);b(q,side*.82,.12,-.23,.10,.24,.10,M.darkwood);}
    for(const side of [-1,0,1]){b(q,side*.65,.64,.035,.60,.10,.63,M.cloth);const pillow=b(q,side*.65,.83,-.12,.38,.34,.12,side?M.oak:M.ivory);pillow.rotation.z=side*.12;}
    return q;
  }
  function shelf(p,x,z,w=1.6,height=1.85,kind=0){const q=g(p,x,0,z);
    for(const xx of [-w/2,w/2])b(q,xx,height/2,0,.08,height,.45,M.darkwood);
    for(let row=0;row<4;row++){const yy=.16+row*(height-.25)/3;b(q,0,yy,0,w,.065,.46,M.oak);
      for(let j=0;j<Math.floor(w*6);j++){const px=-w*.43+j*.16;if(kind===1){c(q,px,yy+.15,0,.045,.06,.23,[M.red,M.gold,M.teal,M.ivory][j%4]);b(q,px,yy+.15,.055,.07,.08,.015,M.ivory);}else{const h=.19+rand()*.18;b(q,px,yy+h/2+.04,0,.095,h,.24,[M.blue,M.red,M.gold,M.ivory,M.teal][(row+j)%5]);}}}
    return q;
  }
  function bed(p,x,z,yaw=0){const q=g(p,x,0,z);q.rotation.y=yaw;
    b(q,0,.27,0,2.1,.4,2.65,M.oak);b(q,0,.53,.03,2.0,.20,2.55,M.ivory);b(q,0,.68,.47,2.01,.14,1.60,M.blue);b(q,0,.80,-1.24,2.14,1.16,.13,M.darkwood);
    for(const xx of [-.51,.51])b(q,xx,.73,-.73,.76,.18,.49,M.ivory);b(q,-1.32,.48,-.85,.49,.95,.52,M.wood);lamp(q,-1.32,-.85,.98);
  }
  function lamp(p,x,z,y=.0){c(p,x,y+.30,z,.035,.035,.6,M.iron);c(p,x,y+.63,z,.17,.26,.32,M.gold);c(p,x,y+.46,z,.18,.18,.04,M.glow);}
  function pendant(p,x,z,y=2.9){r(p,[x,y,z],[x,y-.42,z],.012,M.iron);c(p,x,y-.48,z,.065,.22,.14,M.teal);c(p,x,y-.57,z,.14,.14,.035,M.glow);}
  function resident(p,x,z,index=0,sitting=false,yaw=0){const q=g(p,x,sitting?-.05:0,z);q.rotation.y=yaw;
    const skin=index%3?M.skin:M.skin2,shirt=[M.ivory,M.blue,M.red,M.teal,M.oak,M.navy][index%6];
    const hip=sitting?.59:.87;b(q,0,hip+.24,0,.39,.48,.24,shirt);c(q,0,hip+.56,0,.05,.05,.12,skin);s(q,0,hip+.77,.015,.155,skin,1);const hair=s(q,0,hip+.86,-.015,.16,M.hair,1);hair.scale.y*=.58;b(q,0,hip+.75,.15,.055,.04,.05,skin);
    for(const side of [-1,1]){const xx=side*.10;
      if(sitting){r(q,[xx,hip,0],[xx,.48,.34],.064,M.navy);r(q,[xx,.48,.34],[xx,.12,.35],.05,M.navy);b(q,xx,.075,.42,.14,.10,.25,M.iron);}
      else{r(q,[xx,hip,0],[xx,.13,0],.065,M.navy);b(q,xx,.075,.06,.14,.11,.27,M.iron);}
      r(q,[side*.22,hip+.40,0],[side*.27,hip+.18,.10],.046,shirt);r(q,[side*.27,hip+.18,.10],[side*.19,hip+.06,.28],.037,skin);
    }
    return q;
  }
  function vending(p,x,z,type=0){const q=g(p,x,0,z),color=type%2?M.blue:M.red;
    b(q,0,1,0,.90,2,.73,color);b(q,-.08,1.20,.38,.61,1.2,.04,M.iron);
    for(let row=0;row<4;row++){b(q,-.08,.76+row*.28,.42,.56,.024,.02,M.ivory);for(let j=0;j<3;j++)c(q,-.25+j*.17,.88+row*.28,.43,.045,.045,.17,[M.gold,M.ivory,M.red][(row+j)%3],6);}
    b(q,.32,.79,.40,.095,.35,.03,M.ivory);b(q,-.08,.3,.40,.54,.15,.025,M.black);text(q,type?'DRINKS':'SODA',0,1.84,.39,.76,.16);
  }
  function arcade(p,x,z,index=0){const q=g(p,x,0,z);b(q,0,.55,0,.83,1.1,.74,[M.blue,M.red,M.wood][index%3]);b(q,0,1.36,-.16,.82,.95,.44,M.navy);
    b(q,0,1.37,.08,.63,.56,.025,M.black);for(let i=0;i<15;i++)b(q,(rand()-.5)*.48,1.18+rand()*.40,.103,.025+rand()*.05,.025,.005,[M.blue,M.gold,M.leaf2,M.ivory][i%4]);b(q,0,1.88,-.1,.9,.22,.56,M.gold);text(q,['PLAY','PIXEL','GAME'][index%3],0,1.87,.19,.73,.17);b(q,0,1.02,.20,.85,.11,.41,M.iron);c(q,-.17,1.15,.26,.025,.025,.16,M.rust);s(q,-.17,1.24,.26,.05,M.red);for(let j=0;j<3;j++)c(q,.1+j*.1,1.09,.30,.035,.035,.035,M.gold);
  }
  function bicycle(p,x,z,yaw=0){const q=g(p,x,0,z);q.rotation.y=yaw;
    for(const xx of [-.54,.54]){tor(q,xx,.40,0,.35,.026,M.black);tor(q,xx,.40,0,.29,.008,M.edge);for(let j=0;j<8;j++){const a=j/8*6.28;r(q,[xx,.4,0],[xx+Math.cos(a)*.30,.4+Math.sin(a)*.30,0],.005,M.edge);}}
    for(const[a,end]of[[[-.54,.4,0],[-.12,.88,0]],[[-.12,.88,0],[.07,.4,0]],[[.07,.4,0],[-.54,.4,0]],[[-.12,.88,0],[.40,.88,0]],[[.40,.88,0],[.07,.4,0]],[[.40,.88,0],[.54,.4,0]]])r(q,a,end,.025,M.teal);
    b(q,-.15,1.02,0,.25,.06,.16,M.black);r(q,[.40,.88,0],[.36,1.15,0],.022,M.iron);r(q,[.36,1.15,-.17],[.36,1.15,.17],.022,M.black);
  }
  function washing(p,x,z){b(p,x,.53,z,.85,1.06,.74,M.ivory);tor(p,x,.51,z+.39,.255,.04,M.iron);const drum=c(p,x,.51,z+.39,.21,.21,.03,M.glass,16);drum.rotation.x=Math.PI/2;b(p,x,.91,z+.39,.64,.10,.03,M.edge);}
  function easel(p,x,z){for(const side of [-1,1])r(p,[x+side*.35,0,z+.18],[x+side*.18,1.74,z-.08],.035,M.oak);b(p,x,1.20,z,.88,1.10,.08,M.ivory);for(let i=0;i<28;i++)b(p,x+(rand()-.5)*.72,.78+rand()*.87,z+.046,.04+rand()*.17,.04+rand()*.14,.01,[M.blue,M.gold,M.rust,M.teal][i%4]);b(p,x,.68,z+.04,1.0,.06,.19,M.wood);}
  function windowFrame(p,x,y,z,w=1.4,h=1.4,side=false){const q=g(p,x,y,z);if(side)q.rotation.y=Math.PI/2;
    b(q,0,0,0,w+.15,h+.15,.09,M.darkwood);b(q,0,0,.053,w,h,.025,M.glow);
    for(const xx of [-w/2,0,w/2])b(q,xx,0,.08,.045,h+.1,.035,M.iron);for(const yy of [-h/2,h/2])b(q,0,yy,.08,w+.10,.045,.035,M.iron);b(q,0,-h/2-.08,.11,w+.27,.10,.27,M.light);
  }
  function tree(p,x,z,scale=1){const q=g(p,x,0,z);planter(q,0,0,1.4*scale,1.3*scale);
    r(q,[0,.4,0],[.06,2.5*scale,0],.11*scale,M.darkwood);
    for(let k=0;k<5;k++){const a=k/5*6.28,cx=Math.sin(a)*.65*scale,cz=Math.cos(a)*.55*scale,cy=(2.4+(k%3)*.4)*scale;r(q,[.04,1.4*scale,0],[cx,cy,cz],.05*scale,M.wood);
      for(let j=0;j<95;j++){const az=rand()*6.28,v=rand()*2-1,rr=Math.cbrt(rand()),rad=Math.sqrt(1-v*v),sz=(.07+rand()*.10)*scale;const leaf=b(q,cx+Math.cos(az)*rad*rr*.85*scale,cy+v*rr*.65*scale,cz+Math.sin(az)*rad*rr*.75*scale,sz,.04*scale,sz,[M.leaf,M.leaf2,M.leaf3][(j+k)%3]);leaf.rotation.y=az;}}
  }
  return{M,g,b,c,r,s,tor,text,plant,planter,chair,table,sofa,shelf,bed,lamp,pendant,resident,vending,arcade,bicycle,washing,easel,windowFrame,tree};
}
