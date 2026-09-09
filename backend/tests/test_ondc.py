# test_ondc.py
import json
from ml.export import to_ondc_catalog

listing = {
    "en": {
        "title": "Hand block printed Ajrakh cotton dupatta",
        "bullets": ["Printed by hand using carved wooden blocks"],
        "story": "Ajrakh printing has been practised in Kutch for generations.",
    }
}

result = to_ondc_catalog("prd_001", listing, 1899, ["https://chhaap.local/img1.jpg"])
print(json.dumps(result, indent=2))
