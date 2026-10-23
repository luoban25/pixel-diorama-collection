/* Each project builds independently; the gallery embeds the finished pages. */
const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const esbuild=require('esbuild');
const configs=[
  {id:'tower',title:'四层场景楼',source:'projects/tower/src/main.js',environment:'projects/tower/src/building.js',shell:'projects/tower/shell.html',nativeGallery:true,fragments:{TOWER_PROPS:'projects/tower/src/props.js',TOWER_ARCHITECTURE:'projects/tower/src/architecture.js',TOWER_ROOFTOP:'projects/tower/src/rooftop.js',TOWER_CONCERT:'projects/tower/src/concert.js',TOWER_PROJECTS:'projects/tower/src/projects.js',PROJECT_BASKETBALL:'projects/basketball/src/basketball.js',BASKETBALL_OUTFITS:'projects/basketball/src/outfits.js',BASKETBALL_PLAY:'projects/basketball/src/play.js',BASKETBALL_ACTIONS:'projects/basketball/src/actions.js',PROJECT_POND:'projects/pond/src/pond.js',PROJECT_CRICKET:'projects/cricket/src/main.js'}},
  {id:'cricket',title:'板球场',source:'projects/cricket/src/main.js',environment:'projects/cricket/src/environment.js'},
  {id:'pond',title:'钓鱼池塘',source:'projects/pond/src/main.js',environment:'projects/pond/src/pond.js'},
  {id:'basketball',title:'街头篮球',source:'projects/basketball/src/main.js',environment:'projects/basketball/src/basketball.js',fragments:{BASKETBALL_OUTFITS:'projects/basketball/src/outfits.js',BASKETBALL_PLAY:'projects/basketball/src/play.js',BASKETBALL_ACTIONS:'projects/basketball/src/actions.js'}},
  {id:'western',title:'西部列车',source:'projects/western/src/main.js',environment:'projects/western/src/western.js',fragments:{WESTERN_LANDSCAPE:'projects/western/src/landscape.js',WESTERN_RIDERS:'projects/western/src/riders.js'}}
];
function adaptToGallery(source,id){
  if(!source.includes('    let paused='))throw new Error(`${id}: animation lifecycle marker missing`);
  source=source.replace('    let paused=','    let galleryActive=true;\n    let paused=');
  source=source.replace('if(paused||document.hidden||!isVisible||contextLost)return;','if(paused||document.hidden||!isVisible||contextLost||!galleryActive)return;');
  source=source.replace('if(!raf&&!paused&&!document.hidden&&isVisible&&!contextLost)','if(!raf&&!paused&&!document.hidden&&isVisible&&!contextLost&&galleryActive)');
  const marker="    const pauseButton=document.getElementById('pause')";
  const listener=`    window.addEventListener('message',event=>{
      if(event.source!==window.parent||event.data?.type!=='diorama:active')return;
      galleryActive=event.data.active===true;
      if(galleryActive){resize();start();}else stop();
    });
`;
  if(!source.includes(marker))throw new Error(`${id}: controls lifecycle marker missing`);
  source=source.replace(marker,listener+marker);
  source=source.replace('    window.__CRICKET__.ready=true;',`    window.__CRICKET__.ready=true;
    window.parent.postMessage({type:'diorama:ready',scene:'${id}'},'*');`);
  source=source.replace('window.__CRICKET__.frames++;','window.__CRICKET__.frames++;window.__CRICKET__.galleryActive=galleryActive;');
  return source;
}
async function build(){
  const license=fs.readFileSync(path.resolve(path.dirname(require.resolve('three')),'../LICENSE'),'utf8');
  const shell=fs.readFileSync(path.join(root,'src/scene-shell.html'),'utf8'),payload={};
  for(const config of configs){
    let environmentSource=fs.readFileSync(path.join(root,config.environment),'utf8');
    for(const [marker,file] of Object.entries(config.fragments||{})){
      let fragment=fs.readFileSync(path.join(root,file),'utf8');
      if(config.id==='tower'&&['PROJECT_CRICKET','PROJECT_POND'].includes(marker))fragment=require('./projects/tower/project-source.cjs')(marker.slice(8).toLowerCase(),fragment,fs,path,root);
      environmentSource=environmentSource.replace(`/* ${marker} */`,()=>fragment);
    }
    const mainSource=fs.readFileSync(path.join(root,config.source),'utf8');
    const source=(config.nativeGallery?mainSource:adaptToGallery(mainSource,config.id))
      .replace('/* ENVIRONMENT_SOURCE */',()=>environmentSource);
    const result=await esbuild.build({stdin:{contents:source,resolveDir:root,sourcefile:config.id+'.js'},bundle:true,minify:true,write:false,legalComments:'inline',format:'iife',target:['es2020'],loader:{'.jpg':'dataurl'},nodePaths:[path.join(root,'node_modules')]});
    const code=`/* Three.js MIT License\n${license.replace(/\*\//g,'* /')}\n*/\n${result.outputFiles[0].text}`;
    const sceneShell=config.shell?fs.readFileSync(path.join(root,config.shell),'utf8'):shell;
    const page=sceneShell.replaceAll('SCENE_TITLE',config.title).replace('/* EMBEDDED_APP */',()=>code.replace(/<\/script/gi,'<\\/script'));
    const out=path.join(root,'scenes',config.id);fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'index.html'),page);
    payload[config.id]=Buffer.from(page,'utf8').toString('base64');
    console.log(`${config.id}: ${(Buffer.byteLength(page)/1024).toFixed(1)} KiB`);
  }
  const gallery=fs.readFileSync(path.join(root,'src/gallery.html'),'utf8').replace('/* EMBEDDED_SCENES */',()=>`const scenePages=${JSON.stringify(payload)};`);
  fs.writeFileSync(path.join(root,'index.html'),gallery);
  console.log(`Self-contained gallery: ${(Buffer.byteLength(gallery)/1024/1024).toFixed(2)} MiB`);
}
if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});
module.exports=build;
