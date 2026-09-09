import urllib.request

images = {
    "ajrakh.jpg": "https://upload.wikimedia.org/wikipedia/commons/8/89/Ajrak_Sindh.jpg",
    "madhubani.jpg": "https://upload.wikimedia.org/wikipedia/commons/4/47/Madhubani_Painting.jpg",
}

for filename, url in images.items():
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp, open(filename, "wb") as out:
        out.write(resp.read())
    print("saved", filename)
    