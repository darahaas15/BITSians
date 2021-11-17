from PIL import Image

img = Image.open("images/logo.png").convert("RGBA")

def apply_padding(img, new_width, new_height):
    data = list(img.getdata())
    color_frequencies = {}
    for i in data:
        color_frequencies[i] = color_frequencies[i] + 1 if i in color_frequencies else 1
    bkg_color = max(color_frequencies, key=color_frequencies.get)
    w,h = img.width,img.height
    new_img = Image.new(img.mode, (new_width, new_height), bkg_color)
    region = (new_width//2 - w//2, new_height//2 - h//2, new_width//2 - w//2 + w, new_height//2 - h//2 + h)
    new_img.paste(img, region)

    return new_img

def remove_transparency(img, bkg_color=[0, 0, 0, 255])->None:
    newdata = img.getdata()
    newdata = list(map(lambda rgba: tuple(bkg_color) if rgba[-1] < 128 else rgba, newdata))
    img.putdata(newdata)

# img = apply_padding(img, 1400, 1400)

sizes = (72, 96, 144, 192, 256, 384, 512)

for i in sizes:
    img.resize((i,i)).save(f"images/logo{i}.png")

remove_transparency(img)
img.resize((192,192)).save("images/apple-touch-icon.png")