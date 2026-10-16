const C='bju-v21',A=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
// свежая версия из сети, но не дольше 3 с: при плохой связи сразу берём кэш
const cached=r=>caches.match(r,{ignoreSearch:true});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
const net=fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.status===200){const x=r.clone();caches.open(C).then(c=>c.put(e.request,x))}return r});
const lim=new Promise((_,no)=>setTimeout(no,3000));
e.respondWith(Promise.race([net,lim]).catch(()=>cached(e.request).then(c=>c||net)))});
