const http=require('http'),fs=require('fs'),path=require('path');
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(__dirname,p);
 if(!f.startsWith(__dirname)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end('no')}
 r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(f).pipe(r)}).listen(5173,()=>console.log('http://localhost:5173'));
