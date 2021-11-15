const log = (text, color = "white") => console.log(`%c${text}`, `color: black; background-color: ${color};`)

const VERSION = 2
const CURRENT_CACHE = `v${VERSION}`
const cache_files = "/index.html, /main.css, /main.js, /everyone.js".split(", ")

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(CURRENT_CACHE)
            .then(cache => cache.addAll(cache_files))
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
    event.respondWith(get_request(event.request))
    // event.respondWith(get_basic(event.request).catch(err => caches.match(event.request)))
    // event.respondWith(fetch(event.request).catch(err => caches.match(event.request)))
});

function get_basic(request) {
    console.log(`Requesting ${request.url}`)
    return fetch(request)
}

async function get_request(request) {
    try {
        log(`Sending Network Request for ${request.url}`, "rgb(0, 128, 255)")
        let result = await fetch(request)
        if (result.status == 200 || result.ok) {
            log(`Request for ${request.url} passed`, "greenyellow")
            return result
        }
        else {
            log(`Network Request Status for ${request.url}: ${result.status}`, "rgb(255, 128, 128)")
        }
    } catch (err) {
        log(`Network Request for ${request.url} failed`, "rgb(255, 128, 128)")
    }

    log(`Sending Cache Request for ${request.url}`, "yellow")
    let result = await caches.match(request)
    if(result.ok) {
        log(`Request for '${request.url}' passed`, "greenyellow")
        return result
    }

    log("Cache Request Failed", "rgb(255, 128, 128)")
    log("Sending 'Not Found' Page", "yellow")
    return await Promise()
}