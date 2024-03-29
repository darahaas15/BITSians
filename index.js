var print = console.log
const lerp = (val,lb,ub,lv,uv)=>lv + (val-lb)*(uv-lv)/(ub-lb)
const sort = (arr, key=e=>e)=>{arr.sort((a,b)=>key(a)-key(b)); return arr;}
const sort_multiple = (arr, key=e=>e)=>{arr.sort((a,b)=>{
    a = key(a)
    b = key(b)
    if(a.length != b.length) return a.length - b.length
    for(let i = 0; i < a.length; ++i) {
        let score = a[i] - b[i]
        if(score != 0) return score
    }
    return 0
}); return arr;}
const max = (iterable, key=e=>e)=>iterable.reduce((acc,val)=>key(acc)>key(val)?acc:val, iterable[0])
const min = (iterable, key=e=>e)=>iterable.reduce((acc,val)=>key(acc)<key(val)?acc:val, iterable[0])
const gid = id=>document.getElementById(id)
const logtime = (stime, process, color="greenyellow")=>print(`%c${process}%c completed in %c${new Date()-stime}ms%c`, "background-color: white; color: black; font-weight: 700;", "", `color: ${color};`, "")

var filtered = []
var results = []
var SORTING = "relevant"
var everyone = []
const MAX_RESULT_COUNT = 50
let current_result_count = 0

setup();

async function setup() {
    // Setup sign in
    if(localStorage.getItem("signed-in") != "true") {
        document.body.classList.add("not-signed-in")
        gapi.load("auth2", function () {
            let auth2 = gapi.auth2.init({
                client_id: '1091212712262-c8ci56h65a3hsra7l55p2amtq7rue5ja.apps.googleusercontent.com',
                cookiepolicy: 'single_host_origin',
                scope: 'profile'
            });
            auth2.attachClickHandler(document.querySelector("#sign-in-button"), {}, on_signin, function(error) {
                print(error)
            })
        })
    }
    else {
        on_signin()
    }

    // Get the json data
    everyone = fetch("everyone.json").then(data => data.json())

    // Setup toggles
    setup_toggles()

    // Setup 'Select all' buttons
    setup_select_all()

    // Store the input element in query_input
    query_input = document.getElementById("query")
    // Set key event for query input
    query_input.addEventListener("keyup", resolve_query, {passive: true})
    // query_input.onkeyup = resolve_query

    // Set Version Number
    window.caches.keys().then(cache_names => {
        document.getElementById("version").innerHTML = `v${cache_names.filter(name => name.match(/^\d/))[0]}`
    })

    everyone = await everyone
    // Apply all the filters i.e. none
    apply_filters()
}

function setup_toggles() {
    [...document.getElementsByClassName("filter-toggle")].forEach(toggle=>{
        toggle.onclick = event=>{
            if("vibrate" in navigator) navigator.vibrate(50)
            if(toggle.classList.contains("selected")) toggle.classList.remove("selected")
            else toggle.classList.add("selected")
            apply_filters()
        }
    })
}

function setup_select_all() {
    [...document.getElementsByClassName("select-all-button")].forEach(button=>{
        button.onclick = event=>{
            let container = button.parentElement.nextElementSibling
            if(container.getElementsByClassName("selected").length == container.children.length) {
                // Deselect all
                [...container.children].forEach(child=>child.classList.remove("selected"))
            }
            else {
                // Select all
                [...container.children].forEach(child=>child.classList.add("selected"))
            }
            apply_filters()
        }
    })
}

function change_sorting(sorting_button) {
    // let toggle_name = event.target.getAttribute("toggle-name")
    // childNodes[2] because the initial newline in the html is a text node
    if(SORTING == "relevant") {
        SORTING = "room"
        sorting_button.childNodes[2].nodeValue = "Sort by Relevance"
    }
    else {
        SORTING = "relevant"
        sorting_button.childNodes[2].nodeValue = "Sort by Room Number"
    }
    resolve_query()
}

var filters = []

/**
 * Create the list of filters from the filters tab, loads it into the global `filters` variable, and returns it
 */

function load_filters() {
    filters = []
    for(const filter_section of document.getElementsByClassName("filter-section")) {
        let selected = filter_section.getElementsByClassName("selected")
        filter_section.getElementsByClassName("selected")
        if(selected.length != 0) {
            filters.push([filter_section.getAttribute("category"), [...selected].map(ele=>ele.getAttribute("value"))])
        }
    }
    return filters
}

/**
 * Loads the filters by calling `load_filters()` and returns the filtered list of ALL BITSians
 * @returns List of all BITSians that match the filters
 */

function apply_filters() {
    load_filters()
    filtered = []
    for(let person_index = 0; person_index < everyone.length; ++person_index) {
        if(filters.filter(([category, queries])=>queries.includes(everyone[person_index][category])).length == filters.length) {
            filtered.push(everyone[person_index])
        }
    }
    resolve_query()
}

function close_filters_tab(event) {
    if("vibrate" in navigator) navigator.vibrate(100)
    document.getElementById("filters-tab").classList.add("hidden")
}

function show_filters_tab(event) {
    if("vibrate" in navigator) navigator.vibrate(100)
    document.getElementById("filters-tab").classList.remove("hidden")
}

function resolve_query() {
    let query = query_input.value.replace(/\s+/g, ' ')
    query = query.toLowerCase()
    results = new Array(filtered.length).fill(0)
    if(/^\d{1,3}$/.test(query)) {
        for(let i = 0; i < results.length; ++i) {
            let person = filtered[i]
            results[i] = [scorer_room(query, person["room"]), i]
        }
    }
    else if(/\d/.test(query)) {
        for(let i = 0; i < results.length; ++i) {
            let person = filtered[i]
            results[i] = [scorer_id(query, person["ID"]), i]
        }
    }
    else {
        for(let i = 0; i < results.length; ++i) {
            let person = filtered[i]
            results[i] = [scorer_name(query, person["name"]), i]
        }
    }
    
    if(SORTING == "relevant") sort_multiple(results, element=>[-element[0][0], -element[0][1], element[0][2]])
    else sort_multiple(results, element=>[parseFloat(filtered[element[1]]["room"])])

    // Filter out results with 0 score
    fast_filter(results, element => element[0][0])
    for(let i = 0; i < results.length; ++i) {
        // [score, person_index] => person
        results[i] = filtered[results[i][1]]
    }

    display_results(results)
}

/**
 * Performs the same way as Array.filter, just much more quickly
 */

function fast_filter(iterable, condition) {
    let ci = 0
    for(let i = 0; i < iterable.length; ++i) {
        if(condition(iterable[i])) {
            iterable[ci++] = iterable[i]
        }
    }
    iterable.splice(ci)
}

const branch_codes = {'A1': 'B.E. Chemical', 'A3': 'B.E. EEE', 'A4': 'B.E. Mechanical', 'A7': 'B.E. CSE', 'A8': 'B.E. EnI', 'AA': 'B.E. ECE', 'B1': 'M.Sc. Biology', 'B2': 'M.Sc. Chemistry', 'B3': 'M.Sc. Economics', 'B4': 'M.Sc. Maths', 'B5': 'M.Sc. Physics', "PHD": "PHD", "H": "Higher Degree", "": ""}

function get_student_element_html(person) {
    return `<div class="student">
        <div class="student-child student-place">
            <div class="student-place__hostel">${person["hostel"]}</div>
            <div class="student-place__room">${person["room"]}</div>
        </div>
        <div class="student-child student-year">${person["year"]}</div>
        <div class="student-child student-info">
            <div class="student-info__name" style="font-size: ${Math.min(1.5, lerp(max(person["name"].split(/\s+/), key = e => e.length).length, 7, 15, 1.5, 0.925))}em">${person["name"]}</div>
            <div class="student-info__branch">${person["b1"].toUpperCase() ? branch_codes[person["b1"].toUpperCase()] : ""}</div>
            <div class="student-info__branch">${branch_codes[person["b2"].toUpperCase()] ? branch_codes[person["b2"].toUpperCase()] : ""}</div>
            <div class="student-info__id">${person["id"]}</div>
        </div>
    </div>`
}

function display_results() {
    current_result_count = 0
    document.getElementById("results-container").innerHTML = results.slice(0, MAX_RESULT_COUNT).map(get_student_element_html).join("") + (current_result_count + MAX_RESULT_COUNT >= results.length ? "" : get_load_more_button_html())
    current_result_count = Math.min(MAX_RESULT_COUNT, results.length)
}

function get_load_more_button_html() {
    return "<div id='load-more' onclick='load_more_results()'>More Results</div>"
}

function load_more_results() {
    if (current_result_count == results.length) return

    const results_container = document.getElementById("results-container")

    // Remove the load more button
    results_container.lastElementChild.remove()

    let new_text = results.slice(current_result_count, current_result_count + MAX_RESULT_COUNT).map(get_student_element_html).join("") + (current_result_count + MAX_RESULT_COUNT >= results.length ? "" : get_load_more_button_html())
    let buffer_parent = document.createElement("div")
    buffer_parent.innerHTML = new_text
    results_container.append(...buffer_parent.children)
    current_result_count = Math.min(current_result_count + MAX_RESULT_COUNT, results.length)
}

/**
 * Matches a query to the given text and returns its score
 * @returns List of 3 scores - [number of character matches, longest common substring, start index of LCS]
 */

function scorer_name(query, text) {
    if(query.length == 0) {
        return [1, 0, 0]
    }
    text = text.toLowerCase()
    let j = 0
    let max_consec = [0, 0]
    let consec = [0, 0]
    for(let i = 0; i < text.length; ++i) {
        if(text.charAt(i) == query.charAt(j)) {
            consec = [1, i]
            // Loop behind to see how consecutive this is
            let k = i-1
            while(k >= 0 && text.charAt(k) == query.charAt(j - (i-k))) {
                ++consec[0]
                consec[1] = k
                --k
            }
            ++j // Advance the query index
            // Maximise consectutive length first, then minimize the starting position
            if(max_consec[0] < consec[0] || (max_consec[0] == consec[0] && max_consec[1] > consec[1])) {
                max_consec = consec
            }
            if(j==query.length) break
        }
    }
    
    if(j == query.length) {
        return [j, ...max_consec]
    }
    else return [0, 0, 0]
}

function scorer_id(query, text) {
    if(text.includes(query)) {
        return [query.length, query.length, text.indexOf(query)]
    }
    return [0, 0, 0]
}

function scorer_room(query, text) {
    if(text == query) {
        return [3, 3, 0]
    }
    return [0, 0, 0]
}

// Download the data

function download_results() {
    let csv_content = "data:text/csv;charset=utf-8,"
    let titles = ["Year", "ID", "Name", "Primary Degree", "Secondary Degree", "Hostel", "Room No"]
    csv_content += titles.join(",") + "\n"
    csv_content += results.map(person => [person["year"], person["id"], person["name"], branch_codes[person["b1"].toUpperCase()], branch_codes[person["b2"].toUpperCase()], person["hostel"], person["room"]].join(",")).join("\n")
    let encoded_uri = encodeURI(csv_content)
    window.open(encoded_uri)
}

// Signin Functions

function on_signin(google_user) {
    document.body.classList.remove("not-signed-in")
    document.body.classList.add("signed-in")
    localStorage.setItem("signed-in", "true")
}