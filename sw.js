const CACHE='notaup-v2',SHELL=['./','index.html','app.js','style.css','manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);
    if(q.method!=='GET'||!/^https?:$/.test(u.protocol)||u.origin!==location.origin)return;
    e.respondWith(fetch(q).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(k=>k.put(q,c)).catch(()=>{})}return r}).catch(()=>caches.match(q).then(m=>m||(q.mode==='navigate'?caches.match('index.html'):undefined)).then(m=>m||Response.error())))});