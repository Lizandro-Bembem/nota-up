self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!='GET'||!q.url.startsWith('http'))return;e.respondWith(fetch(q).then(r=>{const c=r.clone();caches.open('notaup').then(k=>k.put(q,c)).catch(()=>{});return r}).catch(()=>caches.match(q)))});