import json

BPGC_EVERYONE = json.load(open("everyone.json"))

def bpgc_get(name:str="", id:str="", year:str="", b1:str="", b2:str="", hostel:str="", room:str="") -> list:
    """
    Returns a list of people in everyone.json that fit the criteria given in the params
    A param set to an empty string (default) will automatically match the criterion
    """
    tags = "name, id, year, b1, b2, hostel, room".split(", ")
    results = []
    for person in BPGC_EVERYONE:
        matched_tags = 0
        for tag in tags:
            if eval(tag).lower() in person[tag].lower():
                matched_tags += 1
            else:
                break
        if matched_tags == len(tags):
            results.append(person)
    return results