# test_enhance_api.py
import requests, base64

with open("image_1.jpg", "rb") as f:
    resp = requests.post("http://localhost:8000/v1/vision/enhance", files={"image": f})

data = resp.json()
print("background:", data["background"])

with open("api_result.jpg", "wb") as f:
    f.write(base64.b64decode(data["image_base64"]))
print("saved api_result.jpg")
