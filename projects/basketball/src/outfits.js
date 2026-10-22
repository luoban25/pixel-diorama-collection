// Shared wardrobe materials keep the small figures legible in the scene's pixel palette.
const basketballWardrobe={
  red:M.red,teal:M.green,cream:jerseyWhite,gold:M.gold,blue:M.blue,navy,
  slate:shortGrey,dark:M.dark,ivory:M.cream,
  pale:mat(0xb7c3b4,.98),ink:mat(0x354b55,.98),rust:mat(0x9f6347,.98)
};

function basketballOutfit(index,mode='athlete'){
  const W=basketballWardrobe;
  const wardrobe=[
    {shirt:W.red,shorts:W.navy,accent:W.ivory,shoes:W.ivory,socks:W.cream,numberInk:'#e6dfca',style:'jersey',description:'砖红球衣、奶油色镶边、深蓝短裤与白鞋'},
    {shirt:W.teal,shorts:W.cream,accent:W.gold,shoes:W.dark,socks:W.cream,numberInk:'#e7dbb9',style:'jersey',description:'蓝绿背心、金色侧条、浅色短裤与黑鞋'},
    {shirt:W.cream,shorts:W.blue,accent:W.red,shoes:W.red,socks:W.cream,numberInk:'#b74635',style:'raglan',description:'奶白球衣、砖红肩袖、蓝灰短裤与红鞋'},
    {shirt:W.gold,shorts:W.dark,accent:W.navy,shoes:W.cream,socks:W.pale,numberInk:'#263c48',style:'jersey',description:'芥末金背心、深色镶边与短裤、奶白鞋'},
    {shirt:W.blue,shorts:W.rust,accent:W.cream,shoes:W.dark,socks:W.cream,numberInk:'#e7dbb9',style:'tee',description:'旧蓝短袖、暖棕短裤、黑鞋白袜'},
    {shirt:W.navy,shorts:W.pale,accent:W.gold,shoes:W.blue,socks:W.pale,numberInk:'#c7a147',style:'jersey',description:'深蓝球衣、金色滚边、浅灰绿短裤与蓝鞋'},
    {shirt:W.rust,shorts:W.slate,accent:W.cream,shoes:W.dark,socks:W.pale,numberInk:'#e7dbb9',style:'open-shirt',description:'暖棕开襟衫、奶白内搭与灰色短裤'},
    {shirt:W.pale,shorts:W.navy,accent:W.teal,shoes:W.cream,socks:W.cream,numberInk:'#376c5d',style:'striped-tee',description:'浅灰绿条纹短袖、深蓝短裤与浅色鞋'},
    {shirt:W.gold,shorts:W.blue,accent:W.ivory,shoes:W.dark,socks:W.pale,numberInk:'#263c48',style:'polo',description:'金黄翻领衫、蓝灰短裤与深色鞋'},
    {shirt:W.teal,shorts:W.rust,accent:W.pale,shoes:W.ivory,socks:W.cream,numberInk:'#e7dbb9',style:'tee',description:'蓝绿短袖、暖棕短裤与奶白鞋'}
  ];
  const slot=mode==='athlete'?index%6:6+((index-6)%4+4)%4;
  return {...wardrobe[slot],index,mode};
}

function decorateBasketballPerson(person,outfit){
  const {torso,arms,legs}=person,{accent,shirt,style}=outfit,W=basketballWardrobe;
  const detail=(w,h,d,m,x,y,z,parent)=>{
    const mesh=b(w,h,d,m,x,y,z,parent);
    // The tiny stitch bands read as color accents without adding noisy shadows.
    mesh.castShadow=false;
    return mesh;
  };
  const collar=c(.072,.079,.025,accent,0,.466,0,8,torso);
  collar.scale.z*=.86;collar.castShadow=false;
  // A lower waist band and two narrow side panels fit around the jersey number.
  if(person.mode==='athlete'){
    for(const side of [-1,1]){
      detail(.022,.32,.125,accent,side*.154,.215,.025,torso);
      detail(.024,.16,.237,accent,side*.087,-.080,0,legs.find(leg=>leg.side===side).upper);
    }
    detail(.25,.022,.235,accent,0,.050,0,torso);
  }
  if(style==='jersey'){
    // Sleeveless shoulder trim stays on the torso; the bare upper arms can swing freely.
    for(const side of [-1,1]){
      const trim=detail(.024,.078,.145,accent,side*.156,.421,0,torso);
      trim.rotation.z=side*.19;
    }
    for(const sign of [-1,1]){
      detail(.10,.016,.012,accent,0,.390,sign*.149,torso);
    }
  }else{
    // Short sleeves live on the shoulder rig, never on the fixed torso.
    for(const arm of arms){
      const sleeve=c(.073,.068,.145,style==='raglan'?accent:shirt,0,-.060,0,7,arm.upper);
      sleeve.castShadow=true;
      const cuff=c(.071,.071,.018,style==='open-shirt'?W.ivory:accent,0,-.132,0,7,arm.upper);
      cuff.castShadow=false;
    }
  }
  if(style==='open-shirt'){
    detail(.10,.325,.017,W.cream,0,.243,.148,torso);
    for(const side of [-1,1]){
      const lapel=detail(.042,.16,.023,accent,side*.067,.376,.152,torso);
      lapel.rotation.z=side*-.22;
    }
    detail(.056,.054,.012,accent,-.108,.315,.145,torso);
  }
  if(style==='striped-tee'){
    for(const sign of [-1,1])for(const y of [.14,.25,.36]){
      detail(.268,.028,.012,accent,0,y,sign*.144,torso);
    }
  }
  if(style==='polo'){
    for(const side of [-1,1]){
      const point=detail(.067,.055,.024,accent,side*.041,.427,.113,torso);
      point.rotation.z=side*-.28;
    }
    detail(.025,.075,.015,accent,0,.374,.149,torso);
  }
  // One restrained sock ring and a shoe stripe tie each outfit together.
  for(const leg of legs){
    const ring=c(.049,.051,.023,accent,0,-.232,0,7,leg.lower);
    ring.castShadow=false;
    detail(.138,.020,.062,accent,0,-.392,.102,leg.lower);
    if(person.mode!=='athlete')detail(.19,.025,.237,accent,0,-.185,0,leg.upper);
  }
  person.outfit=outfit;
}
