///////////////////////////////////
//   The best service worker on  //
//          the planet.          //
//                               //
//       Suck it WorkboxJS.      //
///////////////////////////////////

const APP_VERSION = 4.60

// Document Cache is a cache of document files - html, js, css, etc
const DOCUMENT_CACHE_NAME = `DOC`
var DOCUMENT_CACHE = null
var DOCUMENT_FETCH_TYPE = null // For the user to select
// Resource Cache is a cache of almost always static resources - images, fonts, and everything in the Texts folder
const RESOURCE_VERSION = 4.60
const RESOURCE_CACHE_NAME = `RESv${RESOURCE_VERSION.toFixed(2)}`
var RESOURCE_CACHE = null

// Custom extensions
String.prototype.containsAny = function (substrings=[]) {
    return substrings.some(substring => this.includes(substring))
}

// For Debugging
STOP_CACHING = false // Set to true while testing, false for public builds
var log = (text, color="white") => console.log(`%c${text}`, `color: black; background-color: ${color};`)
log = e => e // Uncomment for public builds

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        let doc_cache = await caches.open(DOCUMENT_CACHE_NAME)
        await doc_cache.put("fetch-type", new Response("network-first"))
        DOCUMENT_FETCH_TYPE = "network-first"
        await self.skipWaiting()
    })())
});

self.addEventListener("activate", event => {
    log("Service Worker activated")
    // Remove obsolete caches
    event.waitUntil((async () => {
        await clients.claim()
        await Promise.allSettled([load_both_caches(), delete_obsolete_caches()])
        DOCUMENT_FETCH_TYPE = await DOCUMENT_CACHE.match("fetch-type").then(response => response.text())
        log(`fetch-type set from cache: ${DOCUMENT_FETCH_TYPE}`, "rgb(128, 128, 255)")
    })())
});

async function load_both_caches() {
    await caches.open(`${APP_VERSION.toFixed(2)}`)
    DOCUMENT_CACHE = await caches.open(DOCUMENT_CACHE_NAME)
    RESOURCE_CACHE = await caches.open(RESOURCE_CACHE_NAME)
}

async function delete_obsolete_caches() {
    let cache_names = await caches.keys()
    await Promise.all(cache_names.map(cache_name => {
        if (![DOCUMENT_CACHE_NAME, RESOURCE_CACHE_NAME, `${APP_VERSION.toFixed(2)}`].includes(cache_name)) {
            log(`Deleting obsolete cache: '${cache_name}'`, "rgb(255, 128, 128)")
            return caches.delete(cache_name)
        }
    }))
}

self.addEventListener("fetch", request_event => {
    request_event.respondWith(STOP_CACHING ? fetch(request_event.request) : get_request(request_event))
});

async function get_request(request_event) {
    let request = request_event.request
    let url = request.url

    if(url.includes("cache-first")) {
        log("Switching to cache first")
        DOCUMENT_FETCH_TYPE = "cache-first"
        DOCUMENT_CACHE.put('fetch-type', new Response(DOCUMENT_FETCH_TYPE))
        return new Response(0)
    }
    if(url.includes("network-first")) {
        log("Switching to network first")
        DOCUMENT_FETCH_TYPE = "network-first"
        DOCUMENT_CACHE.put('fetch-type', new Response(DOCUMENT_FETCH_TYPE))
        return new Response(0)
    }
    
    if(DOCUMENT_CACHE == null || RESOURCE_CACHE == null) {
        await load_both_caches()
    }
    
    // Check if the request is for a document
    if(url.match(/\/$/) || url.containsAny([".html", ".js", ".css"]) && !url.includes(".json") && !url.includes("apis.google.com")) {
        /**
        * So here's the game plan:
        * Check if a cache version exists.
        * | --- If it doesn't, then return a simple fetch request with no timeout
        * | --- If it does
        *           | --- If DOCUMENT_FETCH_TYPE == network-first, call a fetch request that times out after 'x' seconds, defaulting to the cache version
        *           | --- If DOCUMENT_FETCH_TYPE == cache-first, send the cache version
        * This ensures that the user gets the latest possible version, as fast as possible
        * 
        * PS: In all possible cases, cache the request after network-fetching it
        */
        
        // Check if a cache version exists
        let cache_match = await DOCUMENT_CACHE.match(request, { ignoreVary: true })
        if(cache_match == undefined || cache_match == null) {
            // A cached version DOESN'T exist
            log("A cached version DOESN'T exist, performing a network request", "rgb(128, 128, 255)")
            let network_match = await fetch(request).catch(err => null)
            if(network_match) {
                DOCUMENT_CACHE.put(request, network_match.clone())
            }
            return network_match
        }
        else {
            // A cached version DOES exist
            log("A cached version DOES exist", "rgb(128, 128, 255)")

            if(DOCUMENT_FETCH_TYPE == "network-first") {
                log("Since DOCUMENT_FETCH_TYPE == network-first, performing network match")
                const SECONDS_TO_TIMEOUT = 5
            
                const abort_controller = new AbortController()
                const abort_signal = abort_controller.signal
                const timeout_id = setTimeout(() => abort_controller.abort(), SECONDS_TO_TIMEOUT*1000)
                
                // Perform a network request
                let network_match = await fetch(request, {signal: abort_signal}).then(data => {
                    clearTimeout(timeout_id)
                    log("Network match completed before timeout", "rgb(128, 255, 128)")
                    return data
                }).catch(err => {
                    if(err.name == "AbortError") {
                        log("Network request took too long, returning cached version", "rgb(255, 128, 128)")
                        return null
                    }
                    throw err
                }).catch(err => null)
                
                if(network_match == undefined || network_match == null) {
                    // The network request failed, send the cached version
                    return cache_match
                }
                // The network request succeeded 🥵
                // Cache it and send it
                DOCUMENT_CACHE.put(request, network_match.clone())
                return network_match
            }
            else /*if(DOCUMENT_FETCH_TYPE == "cache-first")*/ {
                log("Since DOCUMENT_FETCH_TYPE == cache-first, sending the cached result")
                return cache_match
            }
        }
    }
    // Check if the request is for a resource
    else if(url.containsAny([".json", "fonts/", "images/", "fonts.googleapis.com"])) {
        // Perform a cache request
        let match = await RESOURCE_CACHE.match(request, { ignoreVary: true })
        if (match != undefined && match != null) return match
        // Perform a network request
        match = await fetch(request)
        RESOURCE_CACHE.put(request, match.clone())
        return match
    }
    
    // Doesn't belong to either cache, so perform a network request

    return await fetch(request)
}