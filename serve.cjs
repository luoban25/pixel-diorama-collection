const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT)||5319;
function serve({liveReload=false}={}){
  const clients=new Set(),host=process.env.HOST||'127.0.0.1';
  const server=http.createServer((req,res)=>{
    let relative;try{relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
    if(liveReload&&relative==='/__reload'){
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;
    }
    if(relative.split('/').some(segment=>segment.startsWith('.')||segment==='node_modules')){res.writeHead(404).end();return;}
    const file=path.resolve(root,'.'+(relative.endsWith('/')?relative+'index.html':relative));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(err,body)=>{
      if(err){res.writeHead(404).end('Not found');return;}
      const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.json':'application/json; charset=utf-8'};
      if(liveReload&&path.extname(file)==='.html')body=Buffer.from(body.toString().replace('</body>','<script>new EventSource("/__reload").onmessage=()=>location.reload();</script></body>'));
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
    });
  });
  server.on('error',error=>{console.error(error.message);process.exitCode=1;});
  server.listen(port,host,()=>console.log(`Preview: http://localhost:${port}/?scene=tower`));
  return{server,reload(){for(const client of clients)client.write('data: reload\n\n');}};
}
if(require.main===module)serve();
module.exports=serve;
