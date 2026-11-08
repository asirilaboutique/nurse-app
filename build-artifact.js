// Genera artifact/nurse-app.html desde index.html (sin doctype/head; título "Nurse App")
const fs = require('fs');
const h = fs.readFileSync(__dirname + '/index.html', 'utf8');
const font = h.match(/<link href="https:\/\/fonts\.googleapis[^>]*>/)[0];
const style = h.match(/<style>[\s\S]*?<\/style>/)[0];
const body = h.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
fs.writeFileSync(__dirname + '/artifact/nurse-app.html', '<title>Nurse App</title>\n' + font + '\n' + style + '\n' + body.trim() + '\n');
console.log('ok', fs.statSync(__dirname + '/artifact/nurse-app.html').size);
