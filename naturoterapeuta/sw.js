// AGENCIA Naturópata: red primero (siempre la versión nueva), copia local si no hay señal + avisos
const C='naturo-v10';
const PUENTE='https://script.google.com/macros/s/AKfycbyO56oCiyngFkMlCS9EG-6pAZiXXV5K4t57om96cgMP-b1weD-_7X5tslPib0DoevJi/exec',LLAVE='cp-naturo-2026';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','icon-192.png','icon-512.png','manifest.json'])))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request)))});
// revisión periódica en segundo plano (Android/Chrome con la app instalada)
async function revisar(){try{const j=await (await fetch(PUENTE+'?accion=mensajes&llave='+LLAVE)).json();if(!j.ok)return;
 const n=j.mensajes.filter(m=>m[1]==='agencia').length;const meta=await caches.open('ag-meta');const r=await meta.match('vistos');const v=r?+(await r.text()):0;
 if(n>v){const ult=j.mensajes.filter(m=>m[1]==='agencia').pop();await self.registration.showNotification('AGENCIA by Valeria',{body:String(ult[2]).slice(0,140),icon:'icon-192.png',badge:'icon-192.png',tag:'agencia',data:{url:'./?tab=agencia'}});if(self.navigator.setAppBadge)self.navigator.setAppBadge(n-v)}}catch(e){}}
self.addEventListener('periodicsync',e=>{if(e.tag==='agencia')e.waitUntil(revisar())});
self.addEventListener('message',e=>{if(e.data&&e.data.vistos!=null)e.waitUntil(caches.open('ag-meta').then(c=>c.put('vistos',new Response(String(e.data.vistos)))))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window'}).then(l=>{for(const c of l){c.focus();c.postMessage({ir:'agencia'});return}return clients.openWindow(e.notification.data&&e.notification.data.url||'./')}))});
