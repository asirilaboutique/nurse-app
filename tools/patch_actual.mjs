import fs from 'node:fs';
let s = fs.readFileSync('tools/record_actual.mjs', 'utf8');
const rep = (a, b, n) => { if (!s.includes(a)) throw new Error('no encontré: ' + n); s = s.replace(a, () => b); };
// agenda limpia: solo la visita de hoy de la paciente y la de mañana, sin choques ni visitas de otras pacientes
rep("S.appts.filter(x=>x.patientId===p.id&&x.status!=='hecha').forEach(x=>x.status='prog');", "S.appts=S.appts.filter(x=>x.status==='hecha'&&x.patientId===p.id);", 'agenda limpia');
// visitas de la agenda de hoy para que Hoy se vea llena pero sin choques: otras pacientes en horas distintas
rep("S.appts.push(cur);", "S.appts.push(cur);S.patients.slice(1,3).forEach((q,i)=>S.appts.push({id:'ot'+i,patientId:q.id,type:i?'Control de signos vitales':'Curación avanzada',date:N.today(),start:i?'11:30':'10:15',dur:i?30:45,travel:15,price:0,status:'prog',zone:q.zone,record:null,report:null}));S.appts.push({id:'ma',patientId:S.patients[1].id,type:'Curación avanzada',date:N.today(),start:'08:00',dur:30,travel:10,price:0,status:'hecha',zone:S.patients[1].zone,record:{start:N.today()+'T08:00',end:N.today()+'T08:35',vit:{pa:'118/74',fc:'70',temp:'36.5',sat:'98'},vig:['Sin dolor']},report:{family:'Curación realizada sin inconvenientes.',obs:'',clinical:'x',approved:true,sent:true}});", 'agenda hoy');
// toasts fuera de las capturas
rep("const still = async name => { await check(name);", "const still = async name => { await ev(`(()=>{let s=document.getElementById('nots');if(!s){s=document.createElement('style');s.id='nots';s.textContent='.toast{display:none!important}';document.head.appendChild(s)}return 1})()`); await sleep(150); await check(name);", 'toasts');
// en los clips los toasts sí se ven (natural), así que se retiran antes de grabar
rep("async function record(name, fn, maxS = 10.5) {", "async function record(name, fn, maxS = 10.5) {\n  await ev(`(()=>{const s=document.getElementById('nots');if(s)s.remove();return 1})()`);", 'toasts clips');
fs.writeFileSync('tools/record_actual.mjs', s); console.log('ok');
