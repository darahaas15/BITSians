const VERSION = 2
const CURRENT_CACHE = `v${VERSION}`
const cache_files = "/index.html, /main.css, /main.js, /everyone.js".split(", ")

self.addEventListener("install", event=>{
    event.waitUntil(
        caches
            .open(CURRENT_CACHE)
            .then(cache=>cache.addAll(cache_files))
            .then(self.skipWaiting())
    )
});

self.addEventListener("activate", event => {
    // Remove other caches
    event.waitUntil(
        caches.keys().then(cache_names => {
            return Promise.all(
                cache_names.map(cache_name => {
                    if (cache_name != CURRENT_CACHE) {
                        caches.delete(cache_name)
                    }
                })
            )
        })
    )
})

self.addEventListener("fetch", event=>{
    event.respondWith(
        fetch(event.request).catch(err => caches.match(event.request))
    )
});