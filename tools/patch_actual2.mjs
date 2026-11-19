import fs from 'node:fs';
let s = fs.readFileSync('tools/record_actual.mjs', 'utf8');
const rep = (a, b, n) => { if (!s.includes(a)) throw new Error('no encontré: ' + n); s = s.split(a).join(b); };
rep("patientId:S.patients[1].id,type:'Curación avanzada',date:N.today(),start:'08:00'", "patientId:(S.patients[3]||S.patients[2]).id,type:'Curación avanzada',date:N.today(),start:'08:00'", 'ma paciente');
rep("zone:S.patients[1].zone,record:{start:N.today()+'T08:00'", "zone:(S.patients[3]||S.patients[2]).zone,record:{start:N.today()+'T08:00'", 'ma zona');
// la visita dura de verdad (35 min) para que el informe no diga "09:00 a 09:01"
const fix = "await ev(`(()=>{const a=window.NURSE.A('hoyvisita');if(a&&a.record){a.record.start=new Date(Date.now()-35*60000).toISOString();window.NURSE.saveNow();window.NURSE.route()}return 1})()`); await sleep(500);";
rep("await tap('[data-act=start]', 1400);\nawait ev(INJECT);", "await tap('[data-act=start]', 1400);\n" + fix + "\nawait ev(INJECT);", 'duracion stills');
rep("await tap('[data-act=start]', 1100);", "await tap('[data-act=start]', 1100);\n  " + fix, 'duracion clip');
fs.writeFileSync('tools/record_actual.mjs', s); console.log('ok');
