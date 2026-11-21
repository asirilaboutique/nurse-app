import fs from 'node:fs';
let s=fs.readFileSync('index.html','utf8');
const a="kk.acts.slice(0,6).forEach(s=>{const w=x.measureText(s).width+40;";
const b="kk.acts.slice(0,6).forEach(s=>{x.font='600 26px \"DM Sans\", sans-serif';const w=x.measureText(s).width+40;";
if(!s.includes(a))throw new Error('no encontré');
s=s.replace(a,()=>b);
fs.writeFileSync('index.html',s);
let w=fs.readFileSync('sw.js','utf8');w=w.replace('nurse-app-v14','nurse-app-v15');fs.writeFileSync('sw.js',w);console.log('ok');
