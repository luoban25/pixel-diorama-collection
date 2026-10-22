// One continuous six-second possession. All anchor samples use the same local
// clock as the figures, so a ball in a hand follows their movement and jump.
function sampleBasketballPlay(q,anchors){
  const duration=6,g=9.8;
  q=((q%duration)+duration)%duration;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
  const mixLocal=(from,to,t)=>from.map((value,index)=>value+(to[index]-value)*t);
  const fromShooter=local=>anchors.shooter(q,...local);
  const hand=[.34,.86,.30],chest=[0,1.34,.32],release=[0,1.92,.10];
  const result=(position,stage,progress)=>({position,stage,progress:clamp(progress)});
  // The bounce contacts the world-space court even when foot planting or a jump
  // shifts the player's root. Its upper endpoint stays attached to the hand.
  const dribble=u=>{
    const position=fromShooter(hand);
    position.y=.20+(position.y-.20)*Math.abs(Math.cos(3*Math.PI*u));
    return position;
  };
  if(q<1.20){const u=q/1.20;return result(dribble(u),'dribble',u);}
  if(q<1.65){const u=(q-1.20)/.45;return result(fromShooter(mixLocal(hand,chest,ease(u))),'gather',u);}
  if(q<2.0){const u=(q-1.65)/.35;return result(fromShooter(mixLocal(chest,release,ease(u))),'raise',u);}

  const rim=anchors.rim.clone();
  // Analytic ballistics: horizontal velocity is constant, gravity is vertical.
  // Sampling release at t=2 avoids attaching the airborne ball to a moving root.
  const launch=anchors.shooter(2,...release),flightTime=1.10;
  const launchVy=(rim.y-launch.y+.5*g*flightTime*flightTime)/flightTime;
  if(q<3.10){
    const elapsed=q-2,u=elapsed/flightTime,position=launch.clone().lerp(rim,u);
    position.y=launch.y+launchVy*elapsed-.5*g*elapsed*elapsed;
    return result(position,'flight',u);
  }

  const catchPoint=new THREE.Vector3(rim.x,1.75,rim.z);
  if(q<3.28){
    const u=(q-3.10)/.18,position=rim.clone().lerp(catchPoint,u);
    // The net slightly redirects the falling ball. A Hermite vertical segment
    // retains its flight arrival velocity and comes down to the rebounder's hand.
    const arrivalVy=launchVy-g*flightTime;
    const h00=2*u*u*u-3*u*u+1,h10=u*u*u-2*u*u+u;
    const h01=-2*u*u*u+3*u*u,h11=u*u*u-u*u;
    position.y=h00*rim.y+h10*.18*arrivalVy+h01*catchPoint.y+h11*.18*(-5.6);
    return result(position,'net',u);
  }
  if(q<3.75){
    const u=(q-3.28)/.47;
    const movingHand=anchors.receiver(q,0,1.22,.30);
    return result(catchPoint.clone().lerp(movingHand,ease(u)),'catch',u);
  }

  // A chest-height bounce pass travels to one floor contact and back up. Both
  // flights use ordinary gravity; horizontal travel has one constant velocity.
  if(q<4.85){
    const elapsed=q-3.75,passTime=1.10,halfTime=passTime/2,u=elapsed/passTime;
    const start=anchors.receiver(3.75,0,1.22,.30);
    const end=anchors.shooter(4.85,...hand);
    const position=start.clone().lerp(end,u),floorY=.20;
    if(elapsed<halfTime){
      const vy=(floorY-start.y+.5*g*halfTime*halfTime)/halfTime;
      position.y=start.y+vy*elapsed-.5*g*elapsed*elapsed;
    }else{
      const t=elapsed-halfTime,vy=(end.y-floorY+.5*g*halfTime*halfTime)/halfTime;
      position.y=floorY+vy*t-.5*g*t*t;
    }
    return result(position,'pass',u);
  }
  const u=(q-4.85)/1.15;
  return result(dribble(u),q<4.93?'receive':'dribble',u);
}
