import fs from 'node:fs';
let s = fs.readFileSync('index.html', 'utf8');
const rep = (a, b, n) => { if (!s.includes(a)) throw new Error('no encontré: ' + n); s = s.replace(a, () => b); };
rep("T(x,q.lb.toUpperCase(),X+26,Y+42", "T(x,q.lb.replace(' (sistólica)','').toUpperCase(),X+26,Y+42", 'label');
rep("d===0?'#7A869F':TER);else T(x,'primer registro'", "'#4C5A7A');else T(x,'primer registro'", 'delta neutro');
rep('gx=X+pw-250,gw=220,gy=Y+40,gh=100', 'gx=X+pw-230,gw=200,gy=Y+64,gh=84', 'grafico');
rep("<span class=\"pill ${d===0?'p-mut':'p-warn'}\">${dShort(d)}</span>", "<span class=\"pill p-mut\">${dShort(d)}</span>", 'pill neutro');
// tarjeta informe: cuando sobra espacio en el recuadro del texto, mostrar mini evolución
rep("bl.forEach((l,i)=>T(x,l,110,y+66+i*48,'400 32px \"DM Sans\", sans-serif','#26324F'));",
"bl.forEach((l,i)=>T(x,l,110,y+66+i*48,'400 32px \"DM Sans\", sans-serif','#26324F'));\n {const bh=Math.max(200,bodyBottom-y),tb=y+66+(bl.length-1)*48+24,spare=y+bh-tb;if(spare>=210&&ser0.length>=2){const cols=VDEF.map(([k,lb])=>({lb:lb.replace(' (sistólica)','').replace('Saturación O₂','Sat. O₂'),vals:ser0.map(q=>vitOf(q)[k]).filter(z=>z!==null)})).filter(q=>q.vals.length>=2);if(cols.length){const top=y+bh-190;x.strokeStyle='#E5DACA';x.lineWidth=2;x.beginPath();x.moveTo(110,top-8);x.lineTo(970,top-8);x.stroke();T(x,'EVOLUCIÓN · ÚLTIMAS '+ser0.length+' VISITAS',110,top+26,'700 18px \"DM Sans\", sans-serif',TQ,'left',3);const cw=(860-(cols.length-1)*20)/cols.length;cols.forEach((q,i)=>{const X=110+i*(cw+20),mn=Math.min(...q.vals),mx=Math.max(...q.vals),rg=(mx-mn)||1;T(x,q.lb.toUpperCase(),X,top+66,'700 16px \"DM Sans\", sans-serif','#7A869F','left',2);x.save();x.strokeStyle=TQ;x.lineWidth=4;x.lineCap='round';x.lineJoin='round';x.beginPath();q.vals.forEach((val,j)=>{const px=X+4+j*(cw-12)/(q.vals.length-1),py=top+150-(val-mn)/rg*56;j?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();x.fillStyle=TQ;x.beginPath();x.arc(X+cw-8,top+150-(q.vals[q.vals.length-1]-mn)/rg*56,7,0,7);x.fill();x.restore()})}}}",
 'mini evolucion');
fs.writeFileSync('index.html', s);
console.log('ok');
