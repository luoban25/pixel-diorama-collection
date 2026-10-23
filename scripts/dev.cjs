const fs=require('node:fs'),path=require('node:path'),build=require('../build.cjs');
const root=path.resolve(__dirname,'..');
(async()=>{
  await build();const preview=require('../serve.cjs')({liveReload:true});
  let timer,busy=false,pending=false;
  async function rebuild(){if(busy){pending=true;return;}busy=true;try{await build();preview.reload();}catch(error){console.error(error);}finally{busy=false;if(pending){pending=false;rebuild();}}}
  const changed=()=>{clearTimeout(timer);timer=setTimeout(rebuild,250);};
  for(const directory of ['projects','src'])fs.watch(path.join(root,directory),{recursive:true},changed);
  fs.watch(path.join(root,'build.cjs'),()=>console.log('Build configuration changed; restart npm run dev to apply it.'));
  console.log('Watching projects/ and src/. Saved changes rebuild and refresh the preview.');
})().catch(error=>{console.error(error);process.exitCode=1;});
