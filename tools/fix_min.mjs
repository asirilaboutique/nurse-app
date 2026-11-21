import fs from 'node:fs';let s=fs.readFileSync('index.html','utf8');
const r=(a,b)=>{if(!s.includes(a))throw new Error('no: '+a);s=s.replace(a,()=>b)};
r("rr(x,70,y,940,Math.max(200,bodyBottom-y),30);","const minB=kk?140:200;rr(x,70,y,940,Math.max(minB,bodyBottom-y),30);");
r("y=Math.max(y+200,bodyBottom)+22;","y=Math.max(y+minB,bodyBottom)+22;");
fs.writeFileSync('index.html',s);let w=fs.readFileSync('sw.js','utf8');console.log('ok',w.includes('v15'))
