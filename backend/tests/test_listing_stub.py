# test_listing_stub.py
import requests

resp = requests.post(
    "http://localhost:8000/v1/listing/generate",
    json={"transcript": "yeh ajrakh print ka dupatta hai", "craft": "Ajrakh block print"},
)
print(resp.status_code)
print(resp.json())
