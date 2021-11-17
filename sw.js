const log = (text, color = "white") => console.log(`%c${text}`, `color: black; background-color: ${color};`)

const VERSION = 4
const CURRENT_CACHE = `v${VERSION}`
const cache_files = "/, /index.html, /main.css, /main.js, /everyone.js, /manifest.json, /images/, /images/filter.png, /images/forward.png, /images/logo.png, /images/select-all.png, /fonts/, /fonts/OpenSans-Light.ttf, /fonts/OpenSans-Light.woff, /fonts/OpenSans-Medium.ttf, /fonts/OpenSans-Medium.woff, /fonts/OpenSans-Regular.ttf, /fonts/OpenSans-Regular.woff, ../fonts/OpenSans-SemiBold.ttf, ../fonts/OpenSans-SemiBold.woff, /fonts/OpenSans-Bold.ttf, /fonts/OpenSans-Bold.woff, /fonts/OpenSans-ExtraBold.ttf, /fonts/OpenSans-ExtraBold.woff".split(", ")

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(CURRENT_CACHE)
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
    event.respondWith(get_request(event.request))
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
            log(`Network Request for ${request.url} passed`, "greenyellow")
            return result
        }
        else {
            log(`Network Request Status for ${request.url}: ${result.status}`, "rgb(255, 128, 128)")
        }
    } catch (err) {
        log(`Network Request for ${request.url} failed`, "rgb(255, 128, 128)")
    }

    try {
        log(`Sending Cache Request for ${request.url}`, "yellow")
        let result = await caches.match(request, {ignoreVary: true, cacheName: CURRENT_CACHE})
        log(`Cache Request for ${request.url} passed`, "greenyellow")
        return result
    } catch (err) {
        console.error(err)
        log(`Cache Request for ${request.url} failed`, "rgb(255, 128, 128)")
    }

    return 0
}