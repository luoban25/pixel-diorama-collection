const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),out=path.join(root,'_site');
fs.mkdirSync(out,{recursive:true});
for(const name of ['index.html','.nojekyll'])fs.copyFileSync(path.join(root,name),path.join(out,name));
fs.cpSync(path.join(root,'scenes'),path.join(out,'scenes'),{recursive:true});
console.log('Pages artifact ready: _site/');
