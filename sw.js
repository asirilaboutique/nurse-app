// Nurse App · service worker. Subir CACHE_NAME en cada despliegue.
const CACHE_NAME = 'nurse-app-v10';
const SHELL = ['./','./index.html','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.pathname.includes('/director/') || u.pathname.includes('/naturoterapeuta/')) return; // director de rodaje: siempre red, fuera de la app
  if (u.origin !== location.origin) return; // fuentes de Google: red directa, la app funciona sin ellas
  // red primero para el HTML (siempre la última versión) y caché si no hay señal
  if (r.mode === 'navigate' || u.pathname.endsWith('/index.html')) {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE_NAME).then(c => c.put('./index.html', cp)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE_NAME).then(c => c.put(r, cp)); return res; })));
});
