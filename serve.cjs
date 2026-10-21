const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT)||5319;
http.createServer((req,res)=>{let relative;try{relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
const file=path.resolve(root,'.'+(relative.endsWith('/')?relative+'index.html':relative));
if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
fs.readFile(file,(err,body)=>{if(err){res.writeHead(404).end('Not found');return;}const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8'};res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);});
}).listen(port,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+port+'/?scene=western'));
