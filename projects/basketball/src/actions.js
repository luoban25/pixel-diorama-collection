// Two practice possessions are staggered by three seconds. Figure anchors and
// ballistics sample the same pose function, including the shooter's jump.
const playDuration=6;
const phase=(t,offset=0)=>((t+offset)%playDuration+playDuration)%playDuration;
const smooth=(value)=>{const u=THREE.MathUtils.clamp(value,0,1);return u*u*(3-2*u);};
const ramp=(q,a,end)=>smooth((q-a)/(end-a));
const mix=THREE.MathUtils.lerp;
const angleMix=(a,end,u)=>a+Math.atan2(Math.sin(end-a),Math.cos(end-a))*u;
const plays=[
  {shooter:3,receiver:4,sign:1,offset:0,rim:new THREE.Vector3(0,2.80,8.22),ball:balls[0]},
  {shooter:1,receiver:0,sign:-1,offset:3,rim:new THREE.Vector3(0,2.80,-8.17),ball:balls[1]}
];
function sampleAthletePose(index,q){
  const a=athletes[index],play=plays.find(p=>p.shooter===index||p.receiver===index);
  const f=q/playDuration*TAU;
  let x=a.x,z=a.z,yaw=a.yaw,jump=0,crouch=.12,lean=.08,stride=.12,travel=0;
  if(play?.shooter===index){
    x+=Math.sin(f)*.13;z+=Math.sin(f*2)*.08;
    yaw=Math.atan2(play.rim.x-x,play.rim.z-z);
    const load=ramp(q,1.15,1.62)*(1-ramp(q,1.68,2.02));
    crouch=.15+load*.65;
    if(q>1.68&&q<2.58)jump=.44*Math.sin(Math.PI*(q-1.68)/.90);
    lean=.12-load*.04-ramp(q,1.70,2)*.10*(1-ramp(q,2.70,3.2));
    stride=.10*(1-ramp(q,1.25,1.6))+.10*ramp(q,2.8,3.3);
  }else if(play){
    const approach=ramp(q,1.45,2.95)*(1-ramp(q,4.05,5.65));
    x=mix(a.x,-.18,approach);z=mix(a.z,play.rim.z-play.sign*.20,approach);
    const shooter=athletes[play.shooter];
    const toShooter=Math.atan2(shooter.x-x,shooter.z-z);
    const toRim=Math.atan2(play.rim.x-x,play.rim.z-z);
    yaw=angleMix(toShooter,toRim,ramp(q,1.40,2.05)*(1-ramp(q,3.28,3.72)));
    travel=(q>1.45&&q<2.95?Math.sin(Math.PI*(q-1.45)/1.5):0)+(q>4.05&&q<5.65?Math.sin(Math.PI*(q-4.05)/1.6):0);
    stride=.10+travel*.46;lean=.07+travel*.12;
    crouch=.10+.24*ramp(q,3.0,3.28)*(1-ramp(q,3.50,3.8));
  }else{
    // The two free players cut and shuffle on opposing halves of the court.
    const side=index===2?1:-1;
    x=a.x+Math.sin(f)*1.05;z=a.z+Math.sin(f*2+.45)*.68;
    const vx=Math.cos(f)*1.05,vz=Math.cos(f*2+.45)*1.36;
    const running=Math.atan2(vx,vz),guarding=Math.atan2(-x,side*4.9-z);
    yaw=angleMix(guarding,running,.22);
    stride=.40;travel=.85;lean=.13;crouch=.27;
  }
  const gait=f*6+index*.73;
  const legs=[-1,1].map(side=>{
    const swing=Math.sin(gait+side*Math.PI/2)*stride;
    return {upper:-.10-crouch*.40+swing,lower:.18+crouch*.84+Math.max(0,-Math.sin(gait+side*Math.PI/2))*stride*.85};
  });
  // Keep the lowest shoe sole against the painted court, then add jump height.
  let lowest=Infinity;
  for(const leg of legs){const u=leg.upper,d=u+leg.lower;
    const soleCenter=.92-.39*Math.cos(u)-.445*Math.cos(d)-.058*Math.sin(d);
    lowest=Math.min(lowest,soleCenter-.0125*Math.abs(Math.cos(d))-.1275*Math.abs(Math.sin(d)));
  }
  return {x,z,y:.047-lowest+jump,yaw,jump,lean,legs,travel,gait};
}
function rootPoint(index,q,x,y,z){
  const pose=sampleAthletePose(index,q),co=Math.cos(pose.yaw),si=Math.sin(pose.yaw);
  return new THREE.Vector3(pose.x+co*x+si*z,pose.y+y,pose.z-si*x+co*z);
}
for(const play of plays){play.anchors={
  rim:play.rim,sign:play.sign,
  shooter:(q,x,y,z)=>rootPoint(play.shooter,q,x,y,z),
  receiver:(q,x,y,z)=>rootPoint(play.receiver,q,x,y,z)
};}

const downAxis=new THREE.Vector3(0,-1,0);
function reachHand(person,arm,target){
  // Solve a two-bone chain in torso space. Elbows bend outward, and target
  // clamping prevents the limbs from stretching during the follow-through.
  const local=person.torso.worldToLocal(target.clone());
  const shoulder=arm.upper.position.clone(),direction=local.clone().sub(shoulder);
  const l1=.28,l2=.287,distance=THREE.MathUtils.clamp(direction.length(),.025,l1+l2-.002);
  direction.normalize();
  const projection=(l1*l1-l2*l2+distance*distance)/(2*distance);
  const height=Math.sqrt(Math.max(0,l1*l1-projection*projection));
  const bend=new THREE.Vector3(arm.side*.85,-.25,-.65);
  bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  const elbow=shoulder.clone().addScaledVector(direction,projection).addScaledVector(bend,height);
  const end=shoulder.clone().addScaledVector(direction,distance);
  const upperQ=new THREE.Quaternion().setFromUnitVectors(downAxis,elbow.clone().sub(shoulder).normalize());
  const forearmQ=new THREE.Quaternion().setFromUnitVectors(downAxis,end.sub(elbow).normalize());
  arm.upper.quaternion.copy(upperQ);
  arm.lower.quaternion.copy(upperQ.clone().invert().multiply(forearmQ));
}
function holdBall(person,position,offsets,weight=1){
  const yaw=person.root.rotation.y,co=Math.cos(yaw),si=Math.sin(yaw);
  person.torso.updateWorldMatrix(true,false);
  person.arms.forEach((arm,i)=>{
    const off=offsets[i];if(!off)return;
    const upper=arm.upper.quaternion.clone(),lower=arm.lower.quaternion.clone();
    reachHand(person,arm,position.clone().add(new THREE.Vector3(co*off[0]+si*off[2],off[1],-si*off[0]+co*off[2])));
    arm.upper.quaternion.slerpQuaternions(upper,arm.upper.quaternion.clone(),weight);
    arm.lower.quaternion.slerpQuaternions(lower,arm.lower.quaternion.clone(),weight);
  });
}
function update(t){
  const p=t/12*TAU;
  for(const a of athletes){
    const play=plays.find(s=>s.shooter===a.index||s.receiver===a.index),q=phase(t,play?.offset||0),pose=sampleAthletePose(a.index,q);
    a.pose=pose;a.root.position.set(pose.x,pose.y,pose.z);a.root.rotation.set(0,pose.yaw,0);
    a.torso.rotation.set(pose.lean,0,Math.sin(q/6*TAU*2+a.index)*.017);
    a.head.rotation.set(-pose.lean*.35,Math.sin(q/6*TAU+a.index)*.05,0);
    a.legs.forEach((leg,i)=>{leg.upper.rotation.set(pose.legs[i].upper,0,leg.side*.035);leg.lower.rotation.set(pose.legs[i].lower,0,0);});
    for(const arm of a.arms){
      arm.upper.rotation.set(-.20-Math.sin(pose.gait+arm.side*Math.PI/2)*(.16+pose.travel*.42),0,arm.side*.17);
      arm.lower.rotation.set(-.70,0,0);
      if(!play){
        const contest=ramp(q,1.5,1.95)*(1-ramp(q,2.5,3.1));
        arm.upper.rotation.set(-.65-contest*.95,0,arm.side*(.5+contest*.4));arm.lower.rotation.x=-.7;
      }
    }
  }
  dynamicRoot.updateMatrixWorld(true);
  for(const play of plays){
    const q=phase(t,play.offset),sample=sampleBasketballPlay(q,play.anchors);
    play.sample={...sample,q};play.ball.position.copy(sample.position);
    play.ball.rotation.set(q/6*TAU*4,q/6*TAU*8,q/6*TAU*2);
    const shooter=athletes[play.shooter],receiver=athletes[play.receiver];
    if(sample.stage==='dribble'||sample.stage==='receive'){
      const target=sample.position.clone();target.y=Math.max(target.y,.78+shooter.pose.y);
      holdBall(shooter,target,[null,[0,.12,0]]);
      if(q>=4.85&&q<5.03)holdBall(shooter,sample.position,[[-.13,.02,0],null],1-ramp(q,4.85,5.03));
    }else if(sample.stage==='gather'||sample.stage==='raise'){
      const grip=ramp(q,1.2,1.38);
      holdBall(shooter,sample.position,[null,[.055*grip,mix(.12,-.12,grip),0]]);
      holdBall(shooter,sample.position,[[-.13,-.015,0],null],grip);
    }else if(q>=2&&q<3.25){
      const follow=1-ramp(q,2.45,3.15),point=rootPoint(play.shooter,q,0,mix(1.26,1.92,follow),mix(.35,.10,follow));
      holdBall(shooter,point,[[-.13,-.015,0],[.055,-.12,0]],1-ramp(q,2.6,3.25));
    }else if(sample.stage==='pass'&&q>4.45){
      const anticipation=ramp(q,4.45,4.85),point=rootPoint(play.shooter,q,.34,.86,.30);
      holdBall(shooter,point,[[-.13,.02,0],[0,.12,0]],anticipation);
    }
    if(q>=2.60&&q<3.28){
      const ready=rootPoint(play.receiver,q,0,1.61,.25).lerp(new THREE.Vector3(play.rim.x,1.75,play.rim.z),ramp(q,3.05,3.28));
      holdBall(receiver,ready,[[-.13,-.025,0],[.13,-.025,0]],ramp(q,2.60,2.90));
    }else if(sample.stage==='catch'){
      holdBall(receiver,sample.position,[[-.13,-.025,0],[.13,-.025,0]]);
    }else if(sample.stage==='pass'&&sample.progress<.40){
      const push=smooth(sample.progress/.30),point=rootPoint(play.receiver,q,0,1.22,.30+push*.24);
      holdBall(receiver,point,[[-.13,-.025,0],[.13,-.025,0]],1-smooth(sample.progress/.40));
    }
  }
  for(const a of bystanders){
    a.head.rotation.y=Math.sin(p*2+a.index)*.10;a.torso.rotation.z=Math.sin(p+a.index)*.014;
    for(const arm of a.arms){arm.upper.rotation.set(a.mode==='seated'?-.65:-.12,0,arm.side*.13);arm.lower.rotation.set(-.60+Math.sin(p*2+a.index+arm.side)*.08,0,0);}
    if(a.mode==='seated')for(const leg of a.legs)leg.lower.rotation.x=Math.PI/2+Math.sin(p*3+a.index+leg.side)*.08;
  }
}
function actionReview(){
  dynamicRoot.updateMatrixWorld(true);
  return {
    possessionDuration:playDuration,
    outfits:people.map(a=>({index:a.index,mode:a.mode,shirt:a.outfit.shirt.color.getHexString(),shorts:a.outfit.shorts.color.getHexString(),style:a.outfit.style})),
    players:athletes.map(a=>({index:a.index,position:a.root.getWorldPosition(new THREE.Vector3()).toArray(),jump:a.pose.jump,upperArm:a.arms[1].upper.quaternion.toArray(),hand:a.arms[1].lower.localToWorld(new THREE.Vector3(0,-.287,0)).toArray()})),
    plays:plays.map(play=>({shooter:play.shooter,receiver:play.receiver,q:play.sample.q,stage:play.sample.stage,progress:play.sample.progress,rim:play.rim.toArray(),ball:play.ball.getWorldPosition(new THREE.Vector3()).toArray()}))
  };
}
