# test_full_voice_flow.py
import requests

with open("test.m4a", "rb") as f:
    t = requests.post("http://localhost:8000/v1/listing/transcribe", files={"audio": f})
print("Transcript:", t.json())

g = requests.post(
    "http://localhost:8000/v1/listing/generate",
    json={"transcript": t.json()["transcript"], "craft": "Ajrakh block print"},
)
print("Status:", g.status_code)
print("Raw:", g.text)
