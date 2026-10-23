// Compile the preserved projects into isolated scene modules, not screenshots.
module.exports=(id,source,fs,path,root)=>{
  if(id==='cricket'){
    const at=marker=>{const i=source.indexOf(marker);if(i<0)throw Error('Cricket source marker missing: '+marker);return i;};
    let geometry=source.slice(at('    // Worn soil strata'),at('    // Static props share'));
    geometry=geometry.replace('/* ENVIRONMENT_SOURCE */',()=>fs.readFileSync(path.join(root,'projects/cricket/src/environment.js'),'utf8'));
    const animation=source.slice(at('    // All keyframes evaluate'),at('    let paused=')).replace('      updateInstances();','').replace('      window.__CRICKET__.time=t;','');
    return geometry+animation+`\nreturn {root:scene,update:animate,players,ball,inspect:()=>({players:players.map(p=>({role:p.role,position:p.root.position.toArray(),arm:p.arms[1].pivot.quaternion.toArray()})),ball:ball.position.toArray(),ballVisible:ball.visible})};\n`;
  }
  if(id==='pond'){
    return source
      .replace('  const waterMaterial=new THREE.ShaderMaterial({','  waterUniforms.projectWorldInverse={value:new THREE.Matrix4()};\n  const waterMaterial=new THREE.ShaderMaterial({')
      .replace('vertexShader:`uniform mat4 reflectionMatrix;','vertexShader:`uniform mat4 projectWorldInverse;uniform mat4 reflectionMatrix;')
      .replace('world=p.xyz;reflectionUV','world=(projectWorldInverse*p).xyz;reflectionUV')
      .replace('reflectionCamera.copy(camera,false);','reflectionCamera.copy(camera,false);reflectionCamera.layers.enable(31);reflectionCamera.layers.enable(2);')
      .replace('return {dynamicRoot,anglers,fish,update,prepareReflection,water,shoreline};','return {dynamicRoot,anglers,fish,update,prepareReflection,water,shoreline,waterUniforms};');
  }
  return source;
};
