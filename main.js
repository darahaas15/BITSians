var print = console.log
function * range(start, end) {
    while(start != end) yield start++
}
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
var SORTING = "relevant"
const MAX_RESULT_COUNT = 250

window.onload = ()=>{
    // Setup toggles
    setup_toggles()

    // Setup binary toggles
    setup_binary_toggles()
    // If network first, set that to selected in the binary toggle
    if(localStorage.getItem("fetch-type") == "cache-first") {
        document.getElementById("fetch-type-toggle").classList.add("second")
    }
    else if(localStorage.getItem("fetch-type") == null) {
        localStorage.setItem("fetch-type", "network-first")
    }

    // Setup 'Select all' buttons
    setup_select_all()

    // Store the input element in query_input
    query_input = document.getElementById("query")
    apply_filters()
    // Initial call to show results
    resolve_query()
    // Set key event for query input
    query_input.onkeyup = resolve_query;

    // Set Version Number
    window.caches.keys().then(([version])=>{
        document.getElementById("footer").innerHTML = `${version} • Made by Aryan Pingle`
    })
}

function setup_toggles() {
    [...document.getElementsByClassName("filter-toggle")].forEach(toggle=>{
        toggle.onclick = event=>{
            if(toggle.classList.contains("selected")) toggle.classList.remove("selected")
            else toggle.classList.add("selected")
            apply_filters()
        }
    })
}

function setup_binary_toggles() {
    [...document.getElementsByClassName("binary-toggle-container")].forEach(toggle_container=>{
        [...toggle_container.getElementsByClassName("binary-toggle")].forEach((toggle, index)=>{
            toggle.onclick = event=>{
                let parent = toggle.parentElement
    
                if((index==1 && parent.classList.contains("second")) || (index==0 && !parent.classList.contains("second"))) return
    
                if(index == 0) {
                    parent.classList.remove("second")
                }
                else {
                    parent.classList.add("second")
                }
            }
        })
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

function change_fetch_type(event) {
    let toggle_name = event.target.getAttribute("toggle-name")
    if(toggle_name == "cache") {
        fetch("cache-first")
        localStorage.setItem("fetch-type", "cache-first")
    }
    else {
        fetch("network-first")
        localStorage.setItem("fetch-type", "network-first")
    }
}

function change_sorting(sorting_button) {
    // let toggle_name = event.target.getAttribute("toggle-name")
    // childNodes[2] because the initial newline in the html is a text node
    if(SORTING == "relevant") {
        SORTING = "room"
        sorting_button.childNodes[2].nodeValue = "Sorted by Room Number"
    }
    else {
        SORTING = "relevant"
        sorting_button.childNodes[2].nodeValue = "Sorted by Relevance"
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
    load_filters(); filtered = everyone.filter(person=>filters.filter(([category, queries])=>queries.includes(person[category])).length == filters.length); resolve_query();
}

function close_filters_tab() {
    document.getElementById("filters-tab").classList.add("hidden")
}

function show_filters_tab() {
    document.getElementById("filters-tab").classList.remove("hidden")
}

function resolve_query() {
    let query = query_input.value.replace(/\s+/g, ' ')
    let results = []
    if(/^\d{1,3}$/.test(query)) {
        results = filtered.map(person=>[scorer_room(query, person["room"]), person])
    }
    else if(/\d/.test(query)) {
        results = filtered.map(person=>[scorer_id(query, person["ID"]), person])
    }
    else {
        results = filtered.map(person=>[scorer_name(query, person["name"]), person])
    }
    if(SORTING == "relevant") sort_multiple(results, element=>[-element[0][0], -element[0][1], element[0][2]])
    else sort_multiple(results, element=>[parseFloat(element[1]["room"])])
    results = results.filter(element=>element[0][0]).slice(0, MAX_RESULT_COUNT)
    results = results.map(([score, person])=>person)

    display_results(results)
}

var branch_codes = {'A1': 'B.E. Chemical', 'A3': 'B.E. EEE', 'A4': 'B.E. Mechanical', 'A7': 'B.E. CSE', 'A8': 'B.E. EnI', 'AA': 'B.E. ECE', 'B1': 'M.Sc. Biology', 'B2': 'M.Sc. Chemistry', 'B3': 'M.Sc. Economics', 'B4': 'M.Sc. Maths', 'B5': 'M.Sc. Physics', "PHD": "PHD", "H": "Higher Degree"}

function display_results(results) {
    document.getElementById("results-container").innerHTML = results.map(person=>
    `<div class="student">
        <div class="place">
            <div class="hostel">${person["hostel"]}</div>
            <div class="room">${person["room"]}</div>
        </div>
        <div class="year">${person["year"]}</div>
        <div class="info">
            <div class="name" style="font-size: ${Math.min(1.5, lerp(max(person["name"].split(/\s+/), key=e=>e.length).length, 7, 15, 1.5, 0.925))}em">${person["name"]}</div>
            <div class="branch">${branch_codes[person["B1"]]?branch_codes[person["B1"]]:""}</div>
            <div class="branch">${branch_codes[person["B2"]]?branch_codes[person["B2"]]:""}</div>
            <div class="student-id">${person["ID"]}</div>
        </div>
    </div>`).join("")
}

/**
 * Use this instead of relying on regex
 */

function break_name(name, threshold=9) {
    const temp = name.split(/\s+/).reduce((acc, val) => {
        // Get the number of nested arrays
        const currIndex = acc.length - 1;
        // Join up the last array and get its length
        const currLen = acc[currIndex].join(' ').length;

        // If the length of that content and the new word
        // in the iteration exceeds 20 chars push the new
        // word to a new array
        if (currLen + val.length > threshold) {
            acc.push([val]);
        }
        // otherwise add it to the existing array
        else {
            acc[currIndex].push(val);
        }
        return acc;
    }, [[]]);
    print(temp.map(arr=>arr.join(" ")).join("<br>"))
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
    query = query.toLowerCase()
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
    query = query.toUpperCase()
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