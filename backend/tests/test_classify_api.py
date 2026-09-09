import requests

with open("image_1.jpg", "rb") as f:
    resp = requests.post(
        "http://localhost:8000/v1/vision/classify",
        files={"image": f},
    )

print(resp.status_code)
print(resp.json())
