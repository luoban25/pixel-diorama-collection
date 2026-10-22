function buildEnvironment(){
  const TAU=Math.PI*2,G=0;
  const props=new THREE.Group();scene.add(props);
  const dynamicRoot=new THREE.Group();dynamicRoot.userData.dynamic=true;scene.add(dynamicRoot);
  const b=(w,h,d,m,x,y,z,p=props)=>box(w,h,d,m,x,y,z,p);
  const c=(rt,rb,h,m,x,y,z,n=8,p=props)=>cyl(rt,rb,h,m,x,y,z,n,p);
  const r=(a,end,size,m,p=props,n=5)=>beam(a,end,size,m,p,n);
  const s=(size,m,x,y,z,p=props,n=0)=>sphere(size,m,x,y,z,p,n);
  const group=(x=0,y=0,z=0,p=props)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  const M={sand:mat(0xbfb38c,1),paving:mat(0xb8b498,1),pavingLight:mat(0xd7c9a7,1),pavingDark:mat(0x929785,1),mortar:mat(0x8c9382,1),wall:mat(0xb5b39b,1),wallLight:mat(0xcbc3aa,1),wallDark:mat(0x8c9487,1),wood:mat(0x997743,1),woodLight:mat(0xc39a5d,1),woodDark:mat(0x65523b,1),bark:mat(0x705339,1),metal:mat(0x35483f,.84,.17),green:mat(0x376c5d,.9),greenLight:mat(0x62846b),rust:mat(0x8a563b,1),grass:mat(0x697b38,1),grassLight:mat(0x9aa346,1),grassDark:mat(0x435e32,1),cream:mat(0xe7dbb9,1),red:mat(0xb74635,.9),blue:mat(0x4d7d85,.86),gold:mat(0xc7a147,1),dark:mat(0x243238,1),orange:mat(0xd8792f,.86),net:mat(0xc9d0b7,1),white:mat(0xe6dfca,1)};
  function tex(w,h,paint){const cv=document.createElement('canvas');cv.width=w;cv.height=h;paint(cv.getContext('2d'),w,h);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;}
  const grain=tex(128,128,(ctx,w,h)=>{ctx.fillStyle='#ebdfc4';ctx.fillRect(0,0,w,h);for(let i=0;i<3400;i++){ctx.fillStyle=i%3?'#8d967d':'#fff3c8';ctx.globalAlpha=.09+rand()*.17;ctx.fillRect(rand()*w,rand()*h,1+rand()*3,1+rand()*2);}ctx.globalAlpha=1;});
  for(const m of [M.sand,M.paving,M.pavingLight,M.pavingDark,M.wall,M.wallLight,M.wallDark,M.bark])m.map=grain;
  const woodTex=tex(128,64,(ctx,w,h)=>{ctx.fillStyle='#e2d1a5';ctx.fillRect(0,0,w,h);for(let i=0;i<600;i++){ctx.globalAlpha=.22;ctx.fillStyle=i%3?'#625039':'#fff0bf';ctx.fillRect(rand()*w,rand()*h,4+rand()*36,.6);}ctx.globalAlpha=1;});
  for(const m of [M.wood,M.woodLight,M.woodDark])m.map=woodTex;
  function face(w,h,texture,x,y,z,parent=props,rotation=0,emissive=0){const material=new THREE.MeshStandardMaterial({map:texture,roughness:.96,side:THREE.DoubleSide,emissive:0xffffff,emissiveIntensity:emissive});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function arc(cx,cz,rad,y,start,end,material=M.cream,parent=props,width=.025){const segments=Math.max(16,Math.ceil(Math.abs(end-start)*rad*10));for(let i=0;i<segments;i++){const a=start+(end-start)*i/segments,d=start+(end-start)*(i+1)/segments;r([cx+Math.cos(a)*rad,y,cz+Math.sin(a)*rad],[cx+Math.cos(d)*rad,y,cz+Math.sin(d)*rad],width,material,parent,4);}}
  // The interior stays solid; the outer fringe is made from clustered X marks.
  const positions=[],colors=[],normals=[],uv=[];let edgeFlecks=0,solidCells=0;
  const earthColors=[0xa9a178,0xbdb089,0xc8b98f,0xaaa475,0x8e975d,0x747f44,0xa4a165,0xd0bf96];
  function edgeDistance(x,z){const qx=Math.abs(x)-8.15,qz=Math.abs(z+1.7)-12.0;return -(Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-1.05);}
  function appendTile(x,z,size,color){const cc=new THREE.Color(color);const x0=x-size/2,x1=x+size/2,z0=z-size/2,z1=z+size/2;positions.push(x0,0,z0,x0,0,z1,x1,0,z1,x0,0,z0,x1,0,z1,x1,0,z0);for(let j=0;j<6;j++){colors.push(cc.r,cc.g,cc.b);normals.push(0,1,0);uv.push(x*.15,z*.15);}}
  for(let x=-10.5;x<=10.5;x+=.115)for(let z=-16;z<=12.7;z+=.115){const dist=edgeDistance(x,z),noise=Math.sin(x*2.8+Math.sin(z*1.3))*.20+Math.sin(z*3.7+x)*.16;const density=THREE.MathUtils.smoothstep(dist+noise,-.92,.78);if(rand()>density)continue;const xx=x+(rand()-.5)*.025,zz=z+(rand()-.5)*.025,size=dist<.45?.044+rand()*.081:.119;let color=earthColors[Math.floor(rand()*earthColors.length)];if(dist>1.2&&Math.abs(x)<7.5&&z>-10.3)color=earthColors[Math.floor(rand()*4)];if(dist<1.35)color=[0x4e6936,0x74803b,0x929646,0xadb05b,0xb2aa7b][Math.floor(rand()*5)];if(dist<.7){edgeFlecks++;continue;}appendTile(xx,zz,size,color);solidCells++;}
  const groundGeo=new THREE.BufferGeometry();groundGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));groundGeo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));groundGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const ground=new THREE.Mesh(groundGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;props.add(ground);
  // Sidewalk slabs remain a little uneven. The outside row has missing pieces.
  for(let x=-8.7;x<8.7;x+=.91)for(let z=-14.8;z<11.1;z+=.79){if(x>-6.65&&x<6.65&&z>-9.0&&z<9.9)continue;if(z<-11.6&&x>-5.7&&x<5.6)continue;if(edgeDistance(x,z)<.65||rand()<.09)continue;const tile=b(.83,.025,.71,[M.paving,M.pavingLight,M.pavingDark][Math.floor(rand()*3)],x,.017,z);tile.rotation.y=(rand()-.5)*.025;tile.castShadow=false;}
  // The playing surface is one locally generated, weathered paint texture.
  const courtTex=tex(1536,2304,(ctx,W,H)=>{
    const sx=W/12.6,sz=H/18.8,X=x=>(x+6.3)*sx,Z=z=>(z+9.4)*sz;
    ctx.fillStyle='#4e8d9f';ctx.fillRect(0,0,W,H);
    for(let i=0;i<280;i++){ctx.fillStyle=['#397d92','#6299a5','#78a4aa','#4a8393'][i%4];ctx.globalAlpha=.12+rand()*.18;const px=Math.floor(rand()*W/12)*12,py=Math.floor(rand()*H/12)*12;ctx.fillRect(px,py,36+Math.floor(rand()*10)*12,24+Math.floor(rand()*9)*12);}ctx.globalAlpha=1;
    for(let i=0;i<3800;i++){const px=rand()*W,py=rand()*H;ctx.fillStyle=['#629aa6','#367687','#79a7aa','#528b98','#aec0b0'][i%5];ctx.globalAlpha=.16+rand()*.25;ctx.fillRect(px,py,4+rand()*35,3+rand()*25);}ctx.globalAlpha=1;
    ctx.fillStyle='#b8755d';ctx.fillRect(X(-2.35),Z(5.0),4.7*sx,4.0*sz);
    ctx.fillStyle='#4e7e8e';ctx.fillRect(X(-2.35),Z(-9),4.7*sx,4.0*sz);
    for(let i=0;i<23000;i++){const x=rand()*12.6-6.3,z=rand()*18.8-9.4;ctx.fillStyle=z>5&&Math.abs(x)<2.35?['#cb9672','#925955','#dcad80'][i%3]:['#9eb5ae','#2c6679','#77a6ad','#c7bfa3'][i%4];ctx.globalAlpha=.08+rand()*.18;ctx.fillRect(X(x),Z(z),1+rand()*7,1+rand()*6);}ctx.globalAlpha=1;
    ctx.strokeStyle='#e4dab6';ctx.lineWidth=.052*sx;ctx.lineCap='round';
    const line=(x1,z1,x2,z2)=>{ctx.beginPath();ctx.moveTo(X(x1),Z(z1));ctx.lineTo(X(x2),Z(z2));ctx.stroke();};
    const oval=(x,z,rad,a,d)=>{ctx.beginPath();ctx.ellipse(X(x),Z(z),rad*sx,rad*sz,0,a,d);ctx.stroke();};
    ctx.strokeRect(X(-5.98),Z(-9.03),11.96*sx,18.06*sz);line(-5.98,0,5.98,0);oval(0,0,1.57,0,TAU);
    for(const sign of [-1,1]){line(-2.35,sign*9.03,-2.35,sign*5);line(2.35,sign*9.03,2.35,sign*5);line(-2.35,sign*5,2.35,sign*5);oval(0,sign*5,1.62,0,TAU);oval(0,sign*8.15,5.18,sign<0?0:Math.PI,sign<0?Math.PI:TAU);for(let i=0;i<4;i++)for(const side of [-1,1])line(side*2.35,sign*(5.55+i*.78),side*2.58,sign*(5.55+i*.78));}
    // Tiny missing chips interrupt every line, as on old exterior paint.
    for(let i=0;i<1600;i++){ctx.fillStyle=i%3?'#528c98':'#a3b0a1';ctx.globalAlpha=.33;ctx.fillRect(rand()*W,rand()*H,1+rand()*8,1+rand()*6);}ctx.globalAlpha=1;
    for(let i=0;i<13;i++){let x=rand()*12-6,z=rand()*18-9;ctx.strokeStyle='rgba(33,72,78,.38)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(X(x),Z(z));for(let j=0;j<8;j++){x+=(rand()-.5)*.23;z+=.11+rand()*.18;ctx.lineTo(X(x),Z(z));}ctx.stroke();}
    ctx.fillStyle='#365b62';ctx.beginPath();ctx.ellipse(X(-3.7),Z(-3.0),.22*sx,.22*sz,0,0,TAU);ctx.fill();ctx.strokeStyle='#94a9a0';ctx.lineWidth=3;ctx.stroke();
  });
  const court=new THREE.Mesh(new THREE.PlaneGeometry(12.6,18.8),new THREE.MeshStandardMaterial({map:courtTex,roughness:.97}));court.rotation.x=-Math.PI/2;court.position.set(0,.042,.1);court.receiveShadow=true;props.add(court);
  // Dark diamond mesh, with alpha-tested gaps so the fence never becomes a dark sheet.
  const chain=tex(128,128,(ctx,w,h)=>{ctx.clearRect(0,0,w,h);ctx.strokeStyle='#465346';ctx.lineWidth=1.35;for(let i=-w;i<w*2;i+=32){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+w,h);ctx.moveTo(i,0);ctx.lineTo(i-w,h);ctx.stroke();}});chain.wrapS=chain.wrapT=THREE.RepeatWrapping;
  const chainMat=new THREE.MeshStandardMaterial({map:chain,alphaTest:.35,side:THREE.DoubleSide,roughness:.9});
  function fence(x1,z1,x2,z2,h=2.65){const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),n=Math.ceil(len/2.15),mesh=new THREE.Mesh(new THREE.PlaneGeometry(len,h),chainMat);const u=mesh.geometry.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,u.getX(i)*len/1.5,u.getY(i)*h/1.5);mesh.position.set((x1+x2)/2,h/2+.04,(z1+z2)/2);mesh.rotation.y=-Math.atan2(dz,dx);mesh.castShadow=false;mesh.receiveShadow=true;props.add(mesh);for(let i=0;i<=n;i++){const t=i/n,x=x1+dx*t,z=z1+dz*t;c(.042,.048,h+.14,M.metal,x,h/2+.03,z,7);c(.066,.066,.055,M.wallLight,x,h+.105,z,6);b(.11,.12,.12,M.rust,x,.13,z);}for(const y of [.14,h-.03])r([x1,y,z1],[x2,y,z2],.031,M.metal);}
  fence(7.12,-10.7,7.12,10.35);fence(7.12,10.35,9.0,10.35,2.35);fence(-8.4,-14.15,7.9,-14.15,1.95);
  // The low foreground railing leaves the entrance and players unobstructed.
  function lowRail(z1,z2){for(let z=z1;z<=z2;z+=1.25){b(.09,.81,.09,M.metal,-7.75,.40,z);for(const y of [.24,.66])b(.07,.07,z2-z1,M.metal,-7.75,y,(z1+z2)/2);} }
  lowRail(-6.5,-2.3);lowRail(.1,8.6);
  function hoop(z,sign){const frame=group(0,0,z);const postZ=sign*.95;b(.24,.20,.65,M.wallDark,0,.10,postZ,frame);c(.095,.13,2.58,M.green,0,1.42,postZ,9,frame);r([0,2.23,postZ],[0,3.05,.04],.075,M.green,frame,7);r([0,1.86,postZ],[0,2.80,0],.042,M.greenLight,frame,6);b(.22,.42,.28,M.green,0,.47,postZ,frame);b(1.95,1.30,.095,M.wallLight,0,3.19,0,frame);b(1.83,1.18,.025,M.cream,0,3.19,-sign*.06,frame);for(const x of [-.95,.95])b(.055,1.30,.11,M.green,x,3.19,0,frame);for(const y of [2.56,3.82])b(1.95,.055,.11,M.green,0,y,0,frame);
    // The cream face points into the court; the back keeps its visible support bars.
    const front=-sign*.081;b(.065,1.03,.025,M.red,-.83,3.19,front,frame);b(.065,1.03,.025,M.red,.83,3.19,front,frame);for(const y of [2.69,3.69])b(1.73,.052,.025,M.red,0,y,front,frame);
    for(const x of [-.34,.34])b(.035,.39,.028,M.red,x,2.98,front-sign*.005,frame);for(const y of [2.79,3.17])b(.7,.035,.028,M.red,0,y,front-sign*.005,frame);
    b(.28,.075,.16,M.rust,0,2.80,-sign*.16,frame);const rimZ=-sign*.43;arc(0,rimZ,.25,2.80,0,TAU,M.orange,frame,.021);
    for(let i=0;i<12;i++){const a=i/12*TAU,d=a+TAU/12;r([Math.cos(a)*.25,2.79,rimZ+Math.sin(a)*.25],[Math.cos(d)*.16,2.39,rimZ+Math.sin(d)*.16],.009,M.net,frame,3);r([Math.cos(d)*.25,2.79,rimZ+Math.sin(d)*.25],[Math.cos(a)*.16,2.39,rimZ+Math.sin(a)*.16],.009,M.net,frame,3);}arc(0,rimZ,.18,2.48,0,TAU,M.net,frame,.008);
    r([-.65,2.71,sign*.09],[0,2.95,postZ],.025,M.metal,frame,5);r([.65,2.71,sign*.09],[0,2.95,postZ],.025,M.metal,frame,5);
  }
  hoop(-8.60,-1);hoop(8.65,1);
  function bench(x,z,yaw=0,length=2.65){const root=group(x,0,z);root.rotation.y=yaw;for(let j=0;j<4;j++)b(length,.085,.12,j%2?M.wood:M.woodLight,0,.50,(j-1.5)*.14,root);for(const sx of [-1,1]){b(.08,.49,.49,M.metal,sx*length*.36,.25,0,root);b(.06,.77,.07,M.metal,sx*length*.36,.76,-.25,root);}for(let j=0;j<3;j++)b(length,.105,.065,M.wood,0,.74+j*.13,-.28,root);return root;}
  bench(7.82,.0,-Math.PI/2,3.8);bench(-8.03,3.8,Math.PI/2,3.9);bench(-4.5,-9.95,0,2.55);
  function bin(x,z){b(.58,.85,.57,M.metal,x,.43,z);b(.65,.10,.64,M.wallDark,x,.91,z);b(.43,.025,.36,M.dark,x,.97,z);b(.18,.28,.015,M.rust,x,.48,z+.291);for(let i=0;i<5;i++)b(.02,.67,.012,M.wallDark,x-.23+i*.115,.45,z+.29);}
  [[-8.05,8.2],[-8.5,-11.1],[7.8,-6.2],[7.8,-8.9]].forEach(a=>bin(...a));
  function crate(x,z,y=0){b(.51,.43,.48,M.wood,x,y+.22,z);for(const side of [-1,1])for(let j=0;j<3;j++)b(.53,.065,.04,M.woodLight,x,y+.07+j*.14,z+side*.25);r([x-.23,y+.04,z+.28],[x+.23,y+.40,z+.28],.021,M.woodDark);}
  function poster(label,bg='#c9c0a0',ink='#526c69'){return tex(192,256,(ctx,w,h)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=ink;ctx.fillRect(15,17,w-30,22);ctx.font='bold 22px Arial';ctx.textAlign='center';ctx.fillText(label,w/2,77);ctx.lineWidth=5;ctx.strokeStyle=ink;ctx.strokeRect(30,99,132,89);ctx.fillRect(37,113,48,59);for(let j=0;j<4;j++)ctx.fillRect(98,113+j*16,50,7);ctx.fillRect(20,220,152,8);for(let i=0;i<190;i++){ctx.globalAlpha=.15;ctx.fillStyle=i%2?'#4b503e':'#ffffdf';ctx.fillRect(rand()*w,rand()*h,2+rand()*7,1+rand()*3);}ctx.globalAlpha=1;});}
  // Hand-laid masonry behind the shop and on its exposed left return.
  for(let row=0;row<6;row++)for(let j=0;j<18;j++){const x=-8.45+j*.91+(row%2)*.43;if(x>7.65)continue;b(.86,.29,.25,[M.wall,M.wallLight,M.wallDark][Math.floor(rand()*3)],x,.18+row*.31,-13.85);}
  for(let row=0;row<6;row++)for(let j=0;j<5;j++)b(.25,.29,.77,[M.wall,M.wallLight,M.wallDark][(row+j)%3],-8.45,.18+row*.31,-13.5+j*.81);
  face(.60,.88,poster('PLAY'),-8.2,1.12,-10.15,props,Math.PI/2);face(.66,.95,poster('COURT','#d5b288','#9a593f'),-6.55,1.18,-13.68);
  // A patched corrugated-roof corner shop, with a shallow upper utility room.
  b(10.45,2.64,2.35,M.wall,0,1.33,-12.47);b(10.7,.13,2.66,M.metal,0,2.70,-12.47);
  const roofColors=[mat(0x5d8193,1),mat(0x6f8b94,1),mat(0x465f70,1)];
  for(let j=0;j<16;j++){const panel=b(.64,.055,2.57,roofColors[j%3],-4.91+j*.66,2.805+(j%3)*.009,-12.49);panel.rotation.z=(j%4-1.5)*.004;for(let k=0;k<4;k++)b(.016,.024,2.60,M.metal,-5.16+j*.66+k*.13,2.843,-12.49);}
  b(3.1,1.28,1.85,M.wallDark,3.1,3.42,-12.85);for(let j=0;j<4;j++)b(.72,.055,2.02,[M.blue,M.pavingDark][j%2],1.98+j*.76,4.1,-12.85);b(1.0,.65,.03,M.metal,3.25,3.41,-11.90);for(let j=0;j<6;j++)b(.90,.025,.035,M.wallLight,3.25,3.15+j*.09,-11.865);
  const warm=new THREE.MeshStandardMaterial({color:0xffd47b,emissive:0xe8a14f,emissiveIntensity:.9,roughness:1});
  b(3.46,1.50,.08,M.woodDark,-.95,1.42,-11.25);b(3.18,1.30,.06,warm,-.95,1.48,-11.19);for(const x of [-2.49,.56])b(.12,1.55,.14,M.wood,x,1.42,-11.12);b(3.5,.10,.50,M.woodLight,-.95,.77,-10.95);
  const counterLight=new THREE.PointLight(0xffce83,2.5,4.1,2);counterLight.position.set(-.95,1.85,-10.35);scene.add(counterLight);
  for(let j=0;j<3;j++){const xx=-2.0+j*.87;b(.64,.045,.36,M.wallLight,xx,.86,-10.75);for(let k=0;k<5;k++){const bun=s(.065,M.cream,xx-.24+k*.11,.94,-10.72);bun.scale.y*=.7;}c(.035,.05,.25,j%2?M.red:M.gold,xx,.99,-10.97,7);}
  for(const xx of [-1.9,.05]){r([xx,2.35,-10.7],[xx,2.08,-10.7],.012,M.dark);c(.11,.08,.08,M.woodDark,xx,2.10,-10.7,9);s(.065,warm,xx,2.03,-10.7);}
  for(let j=0;j<3;j++)b(3.10,.04,.08,M.wood,-.95,1.13+j*.38,-11.10);
  for(let j=0;j<18;j++){const xx=-2.35+rand()*2.8,yy=.95+Math.floor(j/6)*.38;const bottle=c(.034,.048,.18+rand()*.10,[M.red,M.green,M.gold,M.cream][j%4],xx,yy,-11.02,6);b(.065,.045,.07,M.cream,xx,yy+.02,-10.975);}
  for(const x of [-4.15,2.25]){b(1.50,2.18,.06,M.metal,x,1.16,-11.24);b(1.28,1.98,.035,M.blue,x,1.16,-11.19);for(let j=0;j<7;j++)b(1.28,.026,.02,M.wallDark,x,.34+j*.26,-11.16);}
  for(let j=0;j<15;j++){const roof=b(.71,.07,1.75,[roofColors[0],roofColors[1],roofColors[2],M.rust][j%4],-4.92+j*.70,2.43,-10.47);roof.rotation.x=-.10;for(let k=0;k<3;k++)b(.017,.026,1.77,M.metal,-5.15+j*.70+k*.21,2.47,-10.47);}
  for(const x of [-4.9,4.9])r([x,.10,-9.68],[x,2.34,-9.68],.032,M.woodDark);
  const shopSign=tex(256,64,(ctx,w,h)=>{ctx.fillStyle='#b39358';ctx.fillRect(0,0,w,h);ctx.fillStyle='#eee0b5';ctx.font='bold 29px monospace';ctx.textAlign='center';ctx.fillText('CORNER STORE',w/2,43);});face(2.35,.47,shopSign,-.85,2.15,-9.54,props,0,.04);
  // Product rectangles, coin slots and weathered labels make the vending machines readable.
  function vending(x,z,color,index){const root=group(x,0,z);b(.94,1.98,.76,color,0,1.01,0,root);b(.91,.09,.77,M.metal,0,.06,0,root);b(.76,1.18,.025,M.metal,-.015,1.22,.395,root);
    const display=tex(192,256,(ctx,w,h)=>{ctx.fillStyle='#46666d';ctx.fillRect(0,0,w,h);for(let row=0;row<5;row++){ctx.fillStyle='#d5d1ad';ctx.fillRect(8,42+row*43,w-16,4);for(let col=0;col<4;col++){ctx.fillStyle=['#d9ad5e','#c65a43','#d8d9b4','#72928a','#d3b999'][(row+col+index)%5];ctx.fillRect(15+col*43,11+row*43,23,29);ctx.fillStyle='#eee3bd';ctx.fillRect(18+col*43,20+row*43,18,9);}}ctx.fillStyle='#d6d7bd';ctx.fillRect(12,231,168,8);});face(.62,1.10,display,-.055,1.23,.416,root);
    b(.11,.42,.035,M.cream,.37,.77,.416,root);b(.06,.05,.045,M.dark,.37,.86,.44,root);for(let j=0;j<3;j++)c(.018,.018,.025,M.gold,.37,.72-j*.06,.446,6,root).rotation.x=Math.PI/2;b(.53,.17,.035,M.dark,-.06,.30,.413,root);b(.57,.05,.065,M.metal,-.06,.20,.43,root);
    const label=tex(128,32,(ctx,w,h)=>{ctx.fillStyle=index===0?'#b94532':'#447982';ctx.fillRect(0,0,w,h);ctx.fillStyle='#f6e6bf';ctx.font='bold 20px Arial';ctx.textAlign='center';ctx.fillText(index===0?'SODA':'DRINKS',w/2,24);});face(.75,.19,label,0,1.84,.412,root);
  }
  vending(-3.80,-9.95,M.red,0);vending(.98,-10.0,M.blue,1);vending(3.72,-10.04,M.gold,2);crate(2.05,-10.1);crate(2.05,-10.1,.43);crate(2.65,-10.3);
  face(.42,.64,poster('OPEN','#e2c178','#a05735'),-1.65,1.76,-11.065,props,0,.03);
  // Bicycle, maintenance objects, small towels and loose basketballs.
  function bicycle(x,z){const root=group(x,.0,z);root.rotation.y=.13;for(const xx of [-.55,.55]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.36,.032,5,22),M.dark);wheel.position.set(xx,.40,0);root.add(wheel);const rim=new THREE.Mesh(new THREE.TorusGeometry(.31,.009,4,22),M.pavingLight);rim.position.set(xx,.40,0);root.add(rim);for(let k=0;k<10;k++){const a=k/10*TAU;r([xx,.40,.0],[xx+Math.cos(a)*.31,.40+Math.sin(a)*.31,0],.006,M.wallDark,root,3);}}
    for(const [a,d]of[[[-.55,.40,0],[-.1,.85,0]],[[-.1,.85,0],[.08,.40,0]],[[.08,.40,0],[-.55,.40,0]],[[-.1,.85,0],[.44,.86,0]],[[.44,.86,0],[.08,.40,0]],[[.44,.86,0],[.55,.40,0]]])r(a,d,.024,M.metal,root,5);r([-.1,.85,0],[-.14,1.02,0],.025,M.metal,root);b(.24,.055,.15,M.dark,-.15,1.04,0,root);r([.44,.86,0],[.4,1.14,0],.022,M.metal,root);r([.4,1.14,-.19],[.4,1.14,.19],.022,M.dark,root);b(.17,.03,.10,M.metal,.05,.34,.12,root);
  }
  bicycle(-6.7,-11.1);b(.58,.035,.62,M.white,-7.78,.80,2.1);b(.17,.54,.62,M.white,-7.82,.54,2.1);b(.33,.12,.24,M.blue,-7.85,.57,4.65);b(.43,.27,.29,M.dark,7.8,.65,-.85);
  function cone(x,z){b(.29,.06,.29,M.metal,x,.035,z);c(.035,.125,.42,M.orange,x,.27,z,9);c(.066,.078,.09,M.cream,x,.29,z,9);}
  cone(-8.75,-11.8);cone(8.5,8.7);
  // Two wooden utility poles and slack wires continue the street beyond the crop.
  function pole(x,z,h){c(.071,.11,h,M.wood,x,h/2,z,8);for(const y of [h-.45,h-.86]){b(.68,.07,.07,M.woodDark,x,y,z);for(const sx of [-1,1]){c(.04,.043,.10,M.cream,x+sx*.28,y+.09,z,6);}}b(.14,.24,.13,M.metal,x,h*.4,z);}
  pole(-8.35,-12.6,5.7);pole(8.55,10.45,4.4);pole(7.7,-14.15,4.8);
  function cable(A,B,sag){let previous=A;for(let i=1;i<=30;i++){const t=i/30,next=[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t-Math.sin(Math.PI*t)*sag,A[2]+(B[2]-A[2])*t];r(previous,next,.012,M.dark,props,4);previous=next;}}
  for(const off of [-.18,.18]){cable([-8.35+off,5.2,-12.6],[7.7+off,4.36,-14.15],.55);cable([7.7+off,4.36,-14.15],[8.55+off,3.95,10.45],.90);}
  // An airy mature tree: small opaque leaves and visible branch forks, with a porous silhouette.
  const leaves=[0x365538,0x496437,0x5c7537,0x78873b,0x979b40,0xb7ad4e,0xcabb59].map(color=>mat(color,1));
  const tx=7.25,tz=-9.4;
  const treeStart=props.children.length;
  r([tx,0,tz],[tx-.1,2.8,tz+.08],.23,M.bark,props,8);r([tx-.1,2.65,tz+.08],[tx+.35,5.3,tz-.1],.16,M.bark,props,7);
  const crowns=[[0,6.35,0,2.1,1.6,1.7],[-1.55,5.5,.5,1.55,1.24,1.4],[1.45,5.55,.7,1.7,1.3,1.5],[-1.0,7.05,-.8,1.7,1.4,1.5],[1.45,7.1,-.7,1.5,1.35,1.4],[.05,7.7,.2,1.35,.9,1.20]];
  for(let k=0;k<crowns.length;k++){const [cx,cy,cz,rx,ry,rz]=crowns[k];r([tx,2.3+k*.23,tz],[tx+cx*.65,cy-1.0,tz+cz*.7],.08+(.04*(k%2)),M.bark,props,6);r([tx+cx*.65,cy-1.0,tz+cz*.7],[tx+cx,cy+.3,tz+cz],.045,M.bark,props,5);
    for(let j=0;j<1500;j++){const a=rand()*TAU,v=rand()*2-1,rr=Math.cbrt(rand()),rad=Math.sqrt(1-v*v),x=tx+cx+Math.cos(a)*rad*rr*rx,y=cy+v*rr*ry,z=tz+cz+Math.sin(a)*rad*rr*rz;const index=Math.min(6,Math.max(0,Math.floor((y-4.1)*1.2+rand()*2-(z-tz)*.28)));const size=.045+rand()*.08;const leaf=b(size*(1+rand()*.6),.024+rand()*.025,size,leaves[index],x,y,z);leaf.rotation.y=rand()*TAU;leaf.rotation.z=(rand()-.5)*.4;leaf.castShadow=j%3===0;}
  }
  const treeParts=props.children.slice(treeStart),treeRoot=group(tx,0,tz);
  for(const part of treeParts)treeRoot.attach(part);
  treeRoot.scale.set(1.22,.76,1.14);
  // Herbs and ivy carry the green boundary into the path, fence and masonry cracks.
  function tuft(x,z,scale=1,y=.025){const start=props.children.length;for(let i=0;i<5;i++){const a=rand()*TAU,h=(.09+rand()*.22)*scale;const blade=b(.026,h,.035,[M.grass,M.grassLight,M.grassDark][i%3],x+Math.cos(a)*.07*scale,y+h/2,z+Math.sin(a)*.07*scale);blade.rotation.z=(rand()-.5)*.6;blade.castShadow=false;}for(let j=0;j<3;j++){const leaf=b(.10*scale,.025,.065*scale,M.grassLight,x+(rand()-.5)*.2*scale,y+.04+rand()*.13*scale,z+(rand()-.5)*.2*scale);leaf.rotation.y=rand()*TAU;leaf.castShadow=false;}if(edgeDistance(x,z)<.7)for(const piece of props.children.slice(start))piece.removeFromParent();}
  for(let i=0;i<840;i++){const x=(rand()-.5)*20,z=rand()*28-15.5,d=edgeDistance(x,z);if(d<-.72||d>1.65||rand()>THREE.MathUtils.smoothstep(d,-.9,.2))continue;tuft(x,z,.4+rand()*.85);}
  for(let i=0;i<170;i++){const x=(rand()-.5)*17.6,z=rand()*25-14.2;if(Math.abs(x)<6.6&&z>-9.4)continue;if(z<-11.5&&x>-5.8&&x<5.5)continue;tuft(x,z,.5+rand()*.55);}
  for(let i=0;i<270;i++){const z=-10+rand()*20,x=7.12+(rand()-.5)*.17,y=.08+Math.pow(rand(),2.0)*2.75;const leaf=b(.085+rand()*.12,.06,.09,[M.grass,M.grassLight,M.grassDark][i%3],x,y,z);leaf.rotation.y=rand()*TAU;}
  for(let i=0;i<140;i++){const x=-8.2+rand()*4.9,y=.1+Math.pow(rand(),1.8)*2.4;const leaf=b(.10,.07,.10,leaves[i%5],x,y,-13.60+(rand()-.5)*.15);leaf.rotation.z=rand()*2;}
  for(let i=0;i<800;i++){const x=(rand()-.5)*19.5,z=rand()*27-15,d=edgeDistance(x,z);if(d<-.65||Math.abs(x)<6.4&&z>-9.3&&z<9.6)continue;const pebble=b(.025+rand()*.065,.018,.035+rand()*.07,[M.cream,M.grassLight,M.wallDark][i%3],x,.03,z);pebble.rotation.y=rand()*TAU;pebble.castShadow=false;if(d<.7)pebble.removeFromParent();}
  // Every X uses the same coarse pixel grid: four corner squares and one center square.
  // A separate seed preserves all existing court, tree and figure randomization.
  const crossPositions=[],crossNormals=[],crossColors=[],crossUV=[];
  const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion),front=new THREE.Vector3(0,0,1).applyQuaternion(camera.quaternion);
  const crossPalette=[0x516b34,0x6d7e38,0x8c9341,0xa5a44c,0xbcb061].map(color=>new THREE.Color(color));
  let crossSeed=74219,crossCount=0,crossClusters=0;
  const crossRand=()=>{crossSeed=(1664525*crossSeed+1013904223)>>>0;return crossSeed/4294967296;};
  function appendCross(x,z,size,color){
    const center=new THREE.Vector3(x,.037+crossRand()*.018,z),cell=size*1.23/3;
    for(const [px,py] of [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]]){
      const x0=(px-.5)*cell,x1=(px+.5)*cell,y0=(py-.5)*cell,y1=(py+.5)*cell;
      const corners=[[x0,y0],[x0,y1],[x1,y1],[x1,y0]];
      for(const i of [0,1,2,0,2,3]){const q=corners[i],point=center.clone().addScaledVector(right,q[0]).addScaledVector(up,q[1]);crossPositions.push(point.x,point.y,point.z);crossNormals.push(front.x,front.y,front.z);crossColors.push(color.r,color.g,color.b);crossUV.push(0,0);}
    }
    crossCount++;
  }
  for(let x=-10.2;x<=10.2;x+=.42)for(let z=-15.9;z<=12.5;z+=.42){
    const d=edgeDistance(x,z);if(d<-.85||d>1.0)continue;
    const pockets=.5+.25*Math.sin(x*2.3+z*.8)+.25*Math.sin(z*2.5-x*.6),fade=THREE.MathUtils.smoothstep(d,-.90,.40);
    if(crossRand()>(.18+.70*pockets)*fade)continue;
    const cx=x+(crossRand()-.5)*.25,cz=z+(crossRand()-.5)*.25,count=d<-.25?3+Math.floor(crossRand()*3):7+Math.floor(crossRand()*7),radius=.18+crossRand()*.17;
    crossClusters++;
    for(let j=0;j<count;j++){const a=crossRand()*TAU,rr=Math.sqrt(crossRand())*radius,px=cx+Math.cos(a)*rr,pz=cz+Math.sin(a)*rr;if(edgeDistance(px,pz)<-.95)continue;appendCross(px,pz,.095+crossRand()*.055,crossPalette[Math.floor(crossRand()*crossPalette.length)]);}
  }
  const crossGeo=new THREE.BufferGeometry();crossGeo.setAttribute('position',new THREE.Float32BufferAttribute(crossPositions,3));crossGeo.setAttribute('normal',new THREE.Float32BufferAttribute(crossNormals,3));crossGeo.setAttribute('color',new THREE.Float32BufferAttribute(crossColors,3));crossGeo.setAttribute('uv',new THREE.Float32BufferAttribute(crossUV,2));
  const crossMesh=new THREE.Mesh(crossGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));crossMesh.castShadow=false;crossMesh.receiveShadow=false;props.add(crossMesh);
  // Articulated people, built with shoulders, elbows, knees, socks and shoes.
  const athletes=[],people=[],balls=[];
  const skinMats=[mat(0xc59466),mat(0xe0b385),mat(0xb38159),mat(0xd5a375)];
  const navy=mat(0x263c48),jerseyWhite=mat(0xe7e4cc),shortGrey=mat(0x4a5b5f),hair=mat(0x292c25),sole=mat(0xcdd0bb);
  function ellipsoid(parent,x,y,z,sx,sy,sz,material){const obj=s(1,material,x,y,z,parent,1);obj.scale.set(sx,sy,sz);return obj;}
  function person(x,z,index,shirt,shorts,mode='athlete',yaw=0){const root=group(x,.045,z,dynamicRoot);root.rotation.y=yaw;const skin=skinMats[index%4],torso=group(0,.98,0,root);
    const top=c(.185,.15,.43,shirt,0,.24,0,7,torso);top.scale.z*=.72;ellipsoid(torso,0,.50,0,.12,.065,.105,skin);c(.055,.063,.12,skin,0,.56,0,7,torso);
    const head=group(0,.71,.005,torso);ellipsoid(head,0,0,0,.125,.154,.12,skin);ellipsoid(head,0,.105,-.012,.132,.076,.126,hair);b(.16,.075,.06,hair,0,.102,.097,head);b(.045,.044,.043,skin,0,-.016,.129,head);for(const side of [-1,1]){b(.018,.018,.015,M.dark,side*.049,.018,.115,head);ellipsoid(head,side*.12,-.015,0,.023,.036,.022,skin);}
    const arms=[];for(const side of [-1,1]){const upper=group(side*.204,.416,0,torso);ellipsoid(upper,0,-.055,0,.061,.092,.065,skin);r([0,-.04,0],[0,-.265,0],.046,skin,upper,7);const lower=group(0,-.28,0,upper);r([0,0,0],[0,-.26,0],.038,skin,lower,7);ellipsoid(lower,0,-.287,0,.042,.058,.043,skin);arms.push({upper,lower,side});}
    const legs=[];for(const side of [-1,1]){const upper=group(side*.105,.92,0,root);b(.19,.22,.23,shorts,0,-.09,0,upper);r([0,-.17,0],[0,-.38,0],.061,skin,upper,7);const lower=group(0,-.39,0,upper);r([0,0,0],[0,-.28,0],.046,skin,lower,7);c(.047,.05,.15,M.white,0,-.29,0,7,lower);b(.133,.089,.25,index%3?M.dark:M.white,0,-.40,.058,lower);b(.14,.025,.255,sole,0,-.445,.058,lower);legs.push({upper,lower,side});}
    if(mode==='athlete'){const number=tex(64,64,(ctx,w,h)=>{ctx.clearRect(0,0,w,h);ctx.fillStyle=shirt===jerseyWhite?'#3d5252':'#ddd7b8';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.fillText(String([7,11,3,8,21,5][index%6]),32,51);});const numberMat=new THREE.MeshStandardMaterial({map:number,transparent:true,alphaTest:.25,roughness:1,side:THREE.DoubleSide});for(const sign of [-1,1]){const n=new THREE.Mesh(new THREE.PlaneGeometry(.15,.17),numberMat);n.position.set(0,.28,sign*.146);if(sign<0)n.rotation.y=Math.PI;torso.add(n);} }
    const record={root,torso,head,arms,legs,x,z,index,mode,yaw};people.push(record);if(mode==='athlete')athletes.push(record);return record;
  }
  const playerData=[[-2.25,-2.3,jerseyWhite,navy,.8],[-2.6,1.7,jerseyWhite,shortGrey,.8],[.05,1.5,navy,navy,-1.2],[1.15,5.4,navy,navy,.3],[-1.6,5.1,navy,shortGrey,1.2],[2.6,-1.3,jerseyWhite,navy,-1.8]];
  playerData.forEach(([x,z,shirt,shorts,yaw],i)=>person(x,z,i,shirt,shorts,'athlete',yaw));
  const bystanders=[person(-2.0,-8.7,6,jerseyWhite,navy,'standing',Math.PI),person(-.70,-8.8,7,M.red,navy,'standing',Math.PI-.35),person(7.60,-.75,8,jerseyWhite,navy,'seated',-Math.PI/2),person(7.60,.80,9,navy,shortGrey,'seated',-Math.PI/2)];
  for(const p of bystanders)if(p.mode==='seated'){p.root.position.y=-.33;for(const leg of p.legs){leg.upper.rotation.x=-Math.PI/2;leg.lower.rotation.x=Math.PI/2;}}
  function ball(parent){const root=group(0,0,0,parent);const leather=mat(0xd47a32,.9);s(.155,leather,0,0,0,root,2);for(let j=0;j<3;j++){const seam=new THREE.Mesh(new THREE.TorusGeometry(.156,.005,4,26),M.dark);if(j===1)seam.rotation.x=Math.PI/2;if(j===2)seam.rotation.y=Math.PI/2;root.add(seam);}return root;}
  for(const index of [1,3]){const obj=ball(athletes[index].root);obj.userData.player=index;balls.push(obj);}
  const spare=ball(props);spare.position.set(7.76,.17,2.12);
  // All motion uses integer harmonics of the same twelve-second clock.
  function update(t){const p=t/12*TAU;
    for(const a of athletes){const q=p*6+a.index*1.2,amplitude=a.index===1||a.index===3?.28:.43;a.root.position.set(a.x+Math.sin(p*2+a.index)*amplitude,.045,a.z+Math.sin(p*2+a.index*.7)*.30);a.root.rotation.y=a.yaw+Math.sin(p*2+a.index)*.17;a.torso.rotation.x=.12+Math.sin(q)*.055;a.torso.rotation.z=Math.sin(q)*.035;let lowest=10;for(const leg of a.legs){const gait=q+leg.side*Math.PI*.5;leg.upper.rotation.x=Math.sin(gait)*.50;leg.lower.rotation.x=.13+Math.max(0,-Math.sin(gait))*.68;const u=leg.upper.rotation.x,d=u+leg.lower.rotation.x;lowest=Math.min(lowest,.92-.39*Math.cos(u)-.4575*Math.cos(d)-.058*Math.sin(d)-.12*Math.abs(Math.sin(d)));}a.root.position.y=.047-lowest;for(const arm of a.arms){arm.upper.rotation.z=arm.side*.20;arm.upper.rotation.x=-.24+Math.sin(q+arm.side*Math.PI*.5)*.38;arm.lower.rotation.x=-.48-Math.sin(q)*.16;if(a.index===2||a.index===4){arm.upper.rotation.x=-.60+Math.sin(p*3+a.index)*.14;arm.upper.rotation.z=arm.side*.86;arm.lower.rotation.x=-.75;}if((a.index===1||a.index===3)&&arm.side>0){arm.upper.rotation.x=-.14;arm.upper.rotation.z=-.12;arm.lower.rotation.x=-.77+Math.cos(p*10+a.index)*.10;}}}
    balls.forEach(obj=>{const index=obj.userData.player;obj.position.set(.34,.166+Math.abs(Math.sin(p*10+index))*.70,.30);obj.rotation.set(p*4,p*8,p*2);});
    for(const a of bystanders){a.head.rotation.y=Math.sin(p*2+a.index)*.10;a.torso.rotation.z=Math.sin(p+a.index)*.014;for(const arm of a.arms){arm.upper.rotation.x=a.mode==='seated'?-.65:-.12;arm.upper.rotation.z=arm.side*.13;arm.lower.rotation.x=-.60+Math.sin(p*2+a.index+arm.side)*.08;}if(a.mode==='seated')for(const leg of a.legs)leg.lower.rotation.x=Math.PI/2+Math.sin(p*3+a.index+leg.side)*.08;}
  }
  update(0);
  return{dynamicRoot,anglers:people,people,athletes,balls,edgeStats:{featherWidth:1.7,flecks:crossCount,clusters:crossClusters,shape:'pixel-grid X',pixelGrid:'3x3',pixelsPerMark:5,solidCells,raisedSlab:false,looseSquareFragments:0},update,prepareReflection(){}};
}
