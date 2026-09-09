# test_publish.py
import requests

listing = {
    "en": {
        "title": "Handcrafted Ajrakh Block Print Dupatta",
        "bullets": ["Authentic Ajrakh block print crafted entirely by hand"],
        "story": "This dupatta carries the soul of a centuries-old Gujarati tradition.",
    }
}

resp = requests.post("http://localhost:8000/v1/publish", json={
    "product_id": "prd_001",
    "listing": listing,
    "price_inr": 1899,
    "craft": "Ajrakh block print",
})

import json
print(json.dumps(resp.json(), indent=2)[:1500])
