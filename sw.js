const CACHE='notaup-v5',
    SHELL=['./','index.html','app.js','style.css','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','logo.png','logo-dark.png'],
    FONTS=/^(fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const q=e.request,u=new URL(q.url);
    if(q.method!=='GET'||!/^https?:$/.test(u.protocol))return;
    if(q.cache==='only-if-cached'&&q.mode!=='same-origin')return;
    if(q.headers.has('range'))return;
    // fontes do Google: usa o que já está guardado e atualiza em segundo plano (app abre com a fonte certa offline)
    if(FONTS.test(u.hostname)){e.respondWith(caches.open(CACHE).then(c=>c.match(q).then(m=>{const n=fetch(q).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(q,r.clone()).catch(()=>{});return r}).catch(()=>m||Response.error());return m||n})));return}
    if(u.origin!==location.origin)return;
    // arquivos do app: rede primeiro (sempre a versão nova); sem internet ou rede lenta, usa o guardado
    e.respondWith((async()=>{const c=await caches.open(CACHE),nav=q.mode==='navigate',
        cached=await c.match(q,{ignoreSearch:nav})||(nav?(await c.match('index.html'))||(await c.match('./')):null);
        try{const net=fetch(q),r=await (cached?Promise.race([net,new Promise((_,no)=>setTimeout(()=>no(new Error('lento')),6000))]):net);
            if(r&&r.status===200&&r.type==='basic')c.put(q,r.clone()).catch(()=>{});return r}
        catch(err){return cached||Response.error()}})())});