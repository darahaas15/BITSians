const log = (text, color = "white") => console.log(`%c${text}`, `color: black; background-color: ${color};`)

const VERSION = 2.61
const CURRENT_CACHE = `v${VERSION.toFixed(2)}`
const cache_files = "/, /index.html, /main.css, /main.js, /everyone.js, /manifest.json, /images/, /images/filter.png, /images/forward.png, /images/refresh.png, /images/thunder.png, /images/relevant.png, /images/sort.png, /images/logo.png, /images/logo72.png, /images/logo96.png, /images/logo144.png, /images/logo192.png, /images/logo256.png, /images/logo384.png, /images/logo720.png, /images/select-all.png".split(", ")
var FETCH_TYPE = null

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(CURRENT_CACHE)
            .then(cache => {
                cache.put("fetch-type", new Response("network-first"))
                return cache
            })
            .then(cache => {
                let promises = cache_files.map(cache_file=>cache.add(cache_file))
                return Promise.allSettled(promises)
            })
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

self.addEventListener("fetch", event => {
    event.respondWith(get_request(event))
});

function get_basic(request) {
    console.log(`Requesting ${request.url}`)
    return fetch(request)
}

async function get_request(request_event) {
    if(!FETCH_TYPE) {
        FETCH_TYPE = await caches.match("fetch-type").then(response=>response.text())
        console.log(`FETCH_TYPE set from cache: ${FETCH_TYPE}`)
    }

    if(request_event.request.url.includes("cache-first")) {
        console.log("Switching to cache first")
        FETCH_TYPE = "cache-first"
        caches.open(CURRENT_CACHE).then(cache=>cache.put('fetch-type', new Response(FETCH_TYPE)))
        return new Response(0)
    }
    else if(request_event.request.url.includes("network-first")) {
        console.log("Switching to network first")
        FETCH_TYPE = "network-first"
        caches.open(CURRENT_CACHE).then(cache=>cache.put('fetch-type', new Response(FETCH_TYPE)))
        return new Response(0)
    }

    if(FETCH_TYPE == "network-first") {
        log("Performing Network Request", "cyan")
        return get_network_request(request_event).catch(err => {
            log("Network request failed, attempting Cache request", "rgb(255, 128, 0)")
            return get_cache_request(request_event)
        })
    }
    log("Performing Cache Request", "greenyellow")
    return get_cache_request(request_event).catch(err => {
        log("Cache request failed, attempting Network request", "rgb(255, 128, 0)")
        return get_network_request(request_event)
    })
}

async function get_cache_request(request_event) {
    return caches.match(request_event.request, {ignoreVary: true, cacheName: CURRENT_CACHE}).then(data => {
        if(!data) throw "match not found in cache"
        return data
    })
}

async function get_network_request(request_event) {
    return fetch(request_event.request).then(response => {
        let response_clone = response.clone()
        caches.open(CURRENT_CACHE).then(cache=>cache.put(request_event.request, response))
        return response_clone
    })
}