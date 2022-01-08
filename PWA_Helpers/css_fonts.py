template = """@font-face {{
    font-family: 'Open Sans';
    src: url('../fonts/OpenSans-{}.ttf') format('ttf'), url('../fonts/OpenSans-{}.woff') format('woff');
    font-weight: {};
    font-display: swap;
}}"""

codes = """Light 300
Regular 400
Medium 500
Semi-bold 600
Bold 700
Extra-bold 800""".split("\n")
codes = [i.split() for i in codes]
for i in codes:
    i[0] = list(map(str.capitalize, i[0].split("-")))
    i[0] = "".join(i[0])

print(codes)

output = [template.format(name, name, weight) for [name,weight] in codes]

from pyperclip import copy

copy("\n\n".join(output))