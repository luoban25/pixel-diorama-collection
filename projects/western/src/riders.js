  function buildWesternRiders(){
    // All horses are built along local -X. This heading reads as a shallow
    // rightward pursuit across the plateau in the fixed orthographic camera.
    const heading=2.68,forward=new THREE.Vector3(-Math.cos(heading),0,Math.sin(heading));
    const riders=[],horseColors=[0x9b572b,0xc18a4b,0x49382c,0x92613e,0x6a432d,0xb17740];
    const leather=mat(0x493122),leatherLight=mat(0x986332),maneMat=mat(0x292820),ivory=mat(0xe9d3a7);
    const hoofMat=mat(0x35312a),ropeMat=mat(0xb8975e),hatDark=mat(0x423b2a),hatTan=mat(0xb2915b);
    const shirts=[mat(0x425e64),mat(0x9a4b2e),mat(0x81908b),mat(0x424d48),mat(0xb58a55),mat(0x5e6e67)];
    const pants=[mat(0x3e5059),mat(0x4b514a),mat(0x4e4841)];
    const skinTones=[mat(0xc69664),mat(0xa8784d),mat(0xd4ad7e)];
    const reinVectorA=new THREE.Vector3(),reinVectorB=new THREE.Vector3(),reinDirection=new THREE.Vector3(),reinY=new THREE.Vector3(0,1,0);
    function ellipsoid(parent,x,y,z,sx,sy,sz,material){const part=s(1,material,x,y,z,parent,1);part.scale.set(sx,sy,sz);return part;}
    function setSegment(mesh,a,end){
      reinVectorA.set(...a);reinVectorB.set(...end);reinDirection.subVectors(reinVectorB,reinVectorA);
      mesh.position.copy(reinVectorA).add(reinVectorB).multiplyScalar(.5);
      mesh.scale.y=reinDirection.length();mesh.quaternion.setFromUnitVectors(reinY,reinDirection.normalize());
    }
    // Smooth joint poses describe extension, contact, push-off and recovery.
    // A leading pair offset gives a gallop instead of a diagonal walking gait.
    function samplePose(poses,t){const q=((t%1)+1)%1*poses.length,i=Math.floor(q),f=q-i,u=f*f*(3-2*f),a=poses[i],end=poses[(i+1)%poses.length];return a+(end-a)*u;}
    const foreUpper=[-.80,-.12,.77,-.16],foreLower=[.08,.12,.28,1.40];
    const hindUpper=[.77,.35,-.83,-.20],hindLower=[-.10,-1.18,-.64,-.15];
    const positions=[[-9,-5.6],[-6,-6.1],[-4,-2.9],[-.8,-4.8],[2,-2.2],[5,-2.7]];
    positions.forEach(([x,z],index)=>{
      const root=group(x,G,z,dynamicRoot);root.rotation.y=heading;root.scale.setScalar(1.10);
      root.userData.forward=forward.clone();
      const horseMat=mat(horseColors[index]),horseHighlight=mat(new THREE.Color(horseColors[index]).multiplyScalar(1.12).getHex());
      const body=group(0,0,0,root);
      ellipsoid(body,.02,1.12,0,.68,.285,.285,horseMat);
      ellipsoid(body,-.43,1.15,0,.30,.355,.31,horseMat);
      ellipsoid(body,.47,1.16,0,.325,.345,.305,horseMat);
      // Chest and raised neck have separate mass and a continuous topline.
      ellipsoid(body,-.56,1.39,0,.21,.30,.235,horseMat).rotation.z=.28;
      ellipsoid(body,-.64,1.57,0,.185,.39,.175,horseHighlight).rotation.z=.44;
      const head=group(-.83,1.82,0,body);head.rotation.z=.20;
      ellipsoid(head,-.025,0,0,.22,.17,.145,horseMat);
      ellipsoid(head,-.235,-.11,0,.265,.115,.125,horseMat);
      ellipsoid(head,-.205,-.19,0,.22,.074,.116,horseHighlight);
      ellipsoid(head,-.43,-.12,0,.073,.096,.116,index===1?ivory:leatherLight);
      for(const sign of [-1,1]){
        // Small eyes, forward ears and a long muzzle preserve an equine profile.
        ellipsoid(head,-.075,.052,sign*.141,.032,.024,.018,hoofMat);
        ellipsoid(head,-.084,.059,sign*.157,.009,.009,.007,ivory);
        ellipsoid(head,-.448,-.087,sign*.092,.028,.018,.011,hoofMat);
        const ear=c(.016,.050,.215,horseMat,.09,.205,sign*.100,5,head);ear.rotation.z=.21;
        const inside=b(.017,.116,.031,leatherLight,.064,.220,sign*.101,head);inside.rotation.z=.21;
        // Bridle follows the cheeks, passes behind the ears and crosses the nose.
        r([.09,.10,sign*.148],[-.25,-.16,sign*.129],.014,leather,head,5);
        r([-.35,-.055,sign*.123],[-.35,-.19,sign*.119],.013,leather,head,5);
        const bit=c(.027,.027,.025,M.brass,-.34,-.178,sign*.141,7,head);bit.rotation.x=Math.PI/2;
      }
      r([-.35,-.06,-.123],[-.35,-.06,.123],.012,leather,head,5);
      r([.12,.12,-.125],[.12,.12,.125],.013,leather,head,5);
      if(index===0||index===3||index===5){
        const blaze=ellipsoid(head,-.177,.026,0,.10,.022,.041,ivory);blaze.rotation.z=-.42;
        ellipsoid(head,-.285,-.038,0,.085,.019,.035,ivory).rotation.z=-.45;
      }
      // Broken mane facets sit against the back of the sloping neck.
      for(let j=0;j<8;j++){
        const a=j/7,part=b(.105,.15,.105,maneMat,-.43-a*.33,1.39+a*.61,0,body);
        part.rotation.z=.37+(j%2)*.13;
      }
      for(let j=0;j<3;j++)r([-.80+j*.035,1.99,0],[-.97+j*.027,1.92,(j-1)*.025],.025,maneMat,body,4);
      const legs=[];
      for(const front of [true,false])for(const sign of [-1,1]){
        const hip=group(front?-.43:.47,1.04,sign*.235,body);
        const upperLength=front?.385:.365,lowerLength=front?.415:.425;
        const thigh=ellipsoid(hip,0,-upperLength*.35,0,front?.095:.125,upperLength*.58,front?.087:.108,horseMat);
        r([0,-.05,0],[0,-upperLength,0],front?.064:.069,horseMat,hip,7);
        const lower=group(0,-upperLength,0,hip);
        ellipsoid(lower,0,0,0,.074,.073,.070,horseHighlight);
        r([0,-.015,0],[0,-lowerLength,0],.046,horseMat,lower,6);
        const sock=(index+sign+(front?1:2))%3===0;
        if(sock)r([0,-lowerLength*.58,0],[0,-lowerLength*.95,0],.049,ivory,lower,6);
        const hoof=group(0,-lowerLength,0,lower);
        b(.17,.102,.133,hoofMat,-.025,-.035,0,hoof);
        b(.14,.025,.137,index%2?leatherLight:ivory,-.024,.021,0,hoof);
        legs.push({hip,lower,hoof,front,side:sign,phase:(sign<0?.11:0)+(front?0:.43),thigh});
      }
      const tail=group(.69,1.25,0,body);
      r([0,0,0],[.29,-.035,.015],.073,maneMat,tail,6);
      r([.25,-.035,.015],[.57,-.16,.03],.065,maneMat,tail,6);
      for(let j=0;j<4;j++)r([.43,-.10,(j-1.5)*.035],[.79+j*.025,-.23-j*.05,(j-1.5)*.055],.027,maneMat,tail,5);
      // Saddle blanket, leather seat, pommel, cantle and hanging saddle bags.
      b(.72,.07,.75,index%2?M.red:M.denim,.11,1.398,0,body);
      for(const sign of [-1,1]){
        b(.72,.15,.045,index%2?M.red:M.denim,.11,1.315,sign*.367,body);
        b(.72,.023,.052,ivory,.11,1.244,sign*.369,body);
        r([-.21,1.34,sign*.31],[.14,.91,sign*.33],.022,leather,body,5);
        b(.24,.28,.115,leatherLight,.45,1.15,sign*.33,body);
        b(.265,.085,.135,leather,.45,1.285,sign*.335,body);
        b(.047,.064,.014,M.brass,.46,1.19,sign*.402,body);
      }
      ellipsoid(body,.085,1.465,0,.32,.073,.28,leather);
      ellipsoid(body,.33,1.505,0,.075,.10,.27,leather);
      ellipsoid(body,-.20,1.51,0,.075,.085,.25,leatherLight);
      c(.035,.045,.105,leatherLight,-.24,1.59,0,6,body);c(.063,.063,.025,leather,-.24,1.65,0,7,body);
      const rolled=c(.09,.09,.55,index%2?M.cream:M.denim,.47,1.49,0,8,body);rolled.rotation.x=Math.PI/2;
      for(const zz of [-.16,.16])r([.47,1.58,zz],[.47,1.43,zz],.018,leather,body,5);
      const rider=group(.08,1.43,0,body),shirt=shirts[index],denim=pants[index%3],skin=skinTones[index%3];
      // Bent thighs and booted shins hang down the flanks into stirrups.
      for(const sign of [-1,1]){
        r([.04,.105,sign*.12],[-.19,-.14,sign*.34],.078,denim,rider,7);
        r([-.19,-.14,sign*.34],[-.025,-.48,sign*.365],.061,denim,rider,7);
        b(.095,.20,.13,leather,-.025,-.43,sign*.37,rider);
        b(.23,.095,.15,leather,-.085,-.535,sign*.38,rider);
        for(const sx of [-1,1])r([-.07+sx*.10,-.35,sign*.39],[-.07+sx*.10,-.58,sign*.39],.011,M.brass,rider,5);
        r([-.17,-.58,sign*.39],[.03,-.58,sign*.39],.013,M.brass,rider,5);
      }
      const torso=group(-.015,.18,0,rider);torso.rotation.z=.10;
      b(.29,.43,.29,shirt,0,.32,0,torso);
      b(.305,.06,.315,leather,0,.11,0,torso);b(.034,.055,.055,M.brass,-.166,.11,0,torso);
      for(const sign of [-1,1]){
        b(.245,.33,.037,index%2?leather:hatTan,.015,.35,sign*.161,torso);
        b(.065,.075,.014,leatherLight,-.065,.31,sign*.184,torso);
      }
      const bandana=mat(index%2?0xd8c28f:0xb64f2e);
      c(.11,.12,.052,bandana,-.015,.57,0,7,torso);
      const kerchief=b(.13,.13,.037,bandana,-.12,.515,-.16,torso);kerchief.rotation.z=.42;
      c(.068,.069,.11,skin,-.025,.64,0,7,torso);
      ellipsoid(torso,-.035,.765,0,.119,.153,.111,skin);
      b(.047,.05,.075,skin,-.148,.748,0,torso);
      for(const sign of [-1,1]){
        ellipsoid(torso,-.10,.788,sign*.088,.018,.009,.007,hatDark);
        ellipsoid(torso,.017,.753,sign*.112,.024,.038,.016,skin);
      }
      const hat=index===1||index===4?hatTan:hatDark;
      const brim=c(.233,.233,.035,hat,-.015,.925,0,12,torso);brim.scale.x*=1.22;brim.scale.z*=.88;
      c(.12,.15,.17,hat,-.003,1.025,0,8,torso);
      c(.146,.15,.035,leather,-.003,.968,0,8,torso);
      b(.15,.022,.16,hat,-.003,1.115,0,torso);
      const waving=index===0||index===3;
      let arm;
      const reinHands=[];
      for(const sign of [-1,1]){
        const shoulder=group(-.035,.49,sign*.17,torso);
        if(waving&&sign===-1){
          arm=shoulder;
          r([0,0,0],[-.16,.31,-.045],.049,shirt,shoulder,7);
          r([-.16,.31,-.045],[-.09,.56,-.005],.038,skin,shoulder,7);
          ellipsoid(shoulder,-.09,.57,-.005,.047,.052,.041,skin);
          const hoopRoot=group(-.11,.96,-.005,shoulder);
          const hoop=new THREE.Mesh(new THREE.TorusGeometry(.36,.008,4,36),ropeMat);hoop.scale.set(1.35,.79,1);hoop.rotation.z=.22;hoopRoot.add(hoop);
          r([-.09,.58,-.005],[-.20,.74,-.005],.009,ropeMat,shoulder,5);
          r([-.20,.74,-.005],[-.25,.74,-.005],.009,ropeMat,shoulder,5);
          arm.userData.hoop=hoopRoot;
        }else{
          r([0,0,0],[-.21,-.17,sign*.05],.049,shirt,shoulder,7);
          r([-.21,-.17,sign*.05],[-.49,-.015,-sign*.035],.036,skin,shoulder,7);
          ellipsoid(shoulder,-.49,-.015,-sign*.035,.046,.043,.038,skin);
          reinHands.push({sign,hand:[-.53,.70,sign*.135]});
          if(!arm)arm=shoulder;
        }
      }
      const reins=[];
      for(const sign of [-1,1]){
        const a=[-1.14,1.59,sign*.155],mid=[-.87,1.73,sign*.19],end=[-.47,1.96,sign*.15];
        reins.push({first:r(a,mid,.010,leather,body,5),second:r(mid,end,.010,leather,body,5),a,mid,end});
      }
      const record={root,rider,legs,tail,arm,x,z,index,heading:forward.clone(),body,head,waving};
      record.update=function(t){
        // Ten gait cycles and whole-number secondary motions close at 12 s.
        const loop=t/12*TAU,gait=t/1.2+index*.19,a=gait*TAU;
        root.position.set(x+Math.sin(loop+index*.77)*.075,G+.055+Math.sin(a)*.045,z+Math.sin(loop+index)*.045);
        body.rotation.z=.022*Math.sin(a+.5);head.rotation.z=.20+.025*Math.sin(a+.8);
        rider.position.y=1.43+Math.sin(a+.45)*.025;rider.rotation.z=.035*Math.sin(a+.6);
        torso.rotation.z=.10+.033*Math.sin(a+.9);
        for(const leg of legs){
          const cycle=gait+leg.phase;
          leg.hip.rotation.z=samplePose(leg.front?foreUpper:hindUpper,cycle);
          leg.lower.rotation.z=samplePose(leg.front?foreLower:hindLower,cycle);
          leg.hoof.rotation.z=-leg.hip.rotation.z*.30-leg.lower.rotation.z*.28;
        }
        tail.rotation.y=Math.sin(loop*10+index)*.12;tail.rotation.z=.08+Math.sin(a+.7)*.095;
        if(waving){arm.rotation.z=Math.sin(loop*4+index)*.07;arm.rotation.y=Math.sin(loop*4+index)*.13;arm.userData.hoop.rotation.y=Math.sin(loop*6+index)*.24;arm.userData.hoop.rotation.z=Math.sin(loop*6+index)*.11;}
        for(const rein of reins){
          rein.end[1]=1.96+Math.sin(a+.45)*.025;
          rein.mid[1]=1.73+Math.sin(a+.9)*.018;
          setSegment(rein.first,rein.a,rein.mid);setSegment(rein.second,rein.mid,rein.end);
        }
      };
      record.update(0);riders.push(record);
    });
    return riders;
  }
