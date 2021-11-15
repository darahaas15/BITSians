import re

data = open("swd-source.txt").read()

data = re.findall(r'<tr>(.*?)</tr>', data)
data = list(map(lambda x: re.findall(r'<td[^>]*?>(.*?)</td>', x), data))
data = list(map(lambda x: x[1:], data))

people = {}
for i in data:
    if (i[0].startswith("2020") and "FD-FirstYear" in i) or int(i[0][:4]) < 2015 or i[-1] == "Permanent Withd" or "withdrawal" in i[-1].lower() or "Temp Withd".lower() in i[-1].lower() or "TS" in i[0] or "aspirant" in i[-1].lower() or "HD" in i[0]:
        # De-registered or updated, so ignore them
        pass
    else:
        if any(ex.lower() in i[-1].lower() for ex in ["Registered", "PS2:", "Thesis", "Graduate", "Part time", "full time", "faculty"]) or "0.0" in i[-1]:
            del i[-1]
        people[i[0]] = i

print(len(data))
print(len(people))
data = list(people.values())
data.sort(key=lambda x:x[0])

def camel_case(name)->str:
    return " ".join(word.capitalize() for word in name.split())

def branch(id:str)->list:
    if "PH" in id:
        return ["PHD", ""]
    if "H" in id:
        return ["H", ""]
    codes = {'A1': 'B.E. Chemical', 'A3': 'B.E. EEE', 'A4': 'B.E. Mechanical', 'A7': 'B.E. CSE', 'A8': 'B.E. EnI', 'AA': 'B.E. ECE', 'B1': 'M.Sc. Biology', 'B2': 'M.Sc. Chemistry', 'B3': 'M.Sc. Economics', 'B4': 'M.Sc. Maths', 'B5': 'M.Sc. Physics'}
    output = ["", ""]
    if "B" in id and "A" in id:
        output[0] = id[6:8]
        output[1] = id[4:6]
    elif "B" in id:
        output[0] = ""
        output[1] = id[4:6]
    else:
        output[0] = id[4:6]
        output[1] = ""
    return output

for i in data:
    i[1] = camel_case(i[1]).strip(".").strip()
    for j in reversed(branch(i[0])):
        i.insert(2, j)
    i.insert(1, i[0][:4])

sep = "\t"

m = len(max(data, key=lambda x:len(x)))
for i in data:
    i += [""]*(m-len(i))

for i in range(len(data)):
    data[i] = {title:value for (title, value) in list(zip("ID,year,name,B1,B2,hostel,room".split(","), data[i]))}

import json
open("../everyone.js", 'w').write(f"var everyone = {json.dumps(data, separators=(',', ':'))}")