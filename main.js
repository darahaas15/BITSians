const print = console.log
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

const CRITERIA = {
    NAME: 0,
    ROOM: 1,
    BRANCH: 2
}
var CRITERION = 0

var query_input = null

window.onload = ()=>{
    // Setup toggles
    setup_toggles()
    // Setup 'Select all' buttons
    setup_select_all()

    query_input = gid("query")
    // Initial call to show results
    resolve_query()
    // Set key event for query input
    query_input.onkeyup = resolve_query;
}

function setup_toggles() {
    [...document.getElementsByClassName("filter-toggle")].forEach(toggle=>{
        toggle.onclick = event=>{
            if(toggle.classList.contains("selected")) toggle.classList.remove("selected")
            else toggle.classList.add("selected")
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
        }
    })
}

var filters = []

function load_filters() {
    filters = []
    for(const filter_section of document.getElementsByClassName("filter-section")) {
        if(filter_section.getElementsByClassName("selected").length != 0) {
            filters.push([filter_section.getAttribute("category"), [...filter_section.getElementsByClassName("selected")].map(ele=>ele.getAttribute("value"))])
        }
    }
    // print("Filters:")
    // print(filters)
}

function apply_filters() {
    let stime = new Date()
    load_filters()
    let output = everyone.filter(person=>{
        let matches = filters.filter(([category, queries])=>{
            return queries.includes(person[category])
        }).length
        return matches == filters.length
    })
    print(`Query completed in ${new Date()-stime}ms`)
    return output
}

function close_filters_tab() {
    gid("filters-tab").classList.add("hidden")
}

function resolve_query() {
    let query = query_input.value.replace(/\s+/g, ' ')
    results = Object.entries(everyone).map(person=>{
        let [room, [name, branch, phone]] = person
        let score = scorer(query, [name, room, branch, phone][CRITERION])
        return [score, room, name, branch, phone]
    })
    sort_multiple(results, element=>[-element[0][0], -element[0][1], element[0][2]])
    results = results.filter(element=>element[0][0])
    gid("results").innerHTML = results.map(ele=>`<div class="student">
    <div class="student-room">
    ${ele[1]}
    </div>
    <div class="student-info">
    <div class="student-name">${ele[2].replace(/(?<=.{9,})\s+/g, "<br>").replace(/\s+(?=[a-zA-Z\.]{9,})/g, "<br>")}</div> 
    <div class="student-branch">${ele[3].replace(" + ", "<br>")}</div>
    <div class="student-phone">+91 ${ele[4]}</div>
    </div>
    </div>
    `).join("")
    
    enable_copier()
}

function enable_copier() {
    [...document.getElementsByClassName("student")].forEach(ele=>{
        ele.onclick = event=>window.open("tel:"+ele.getElementsByClassName("student-phone")[0].innerHTML)
    })
}

function scorer(query, text) {
    if(query.length == 0) {
        return [1, 0, 0]
    }
    text = text.toLowerCase()
    query = query.toLowerCase()
    let j = 0
    let max_consec = [0,0]
    let consec = 0
    for(let i = 0; i < text.length; ++i) {
        if(text.charAt(i) == query.charAt(j)) {
            consec = [1,i]
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