import os

folders = ["fonts"]

result = []
for folder in folders:
    for path,_,files in os.walk(folder):
        result.extend([f"/{path}/{file}" for file in files])

result = ", ".join(result)
print(result)
import pyperclip
pyperclip.copy(result)