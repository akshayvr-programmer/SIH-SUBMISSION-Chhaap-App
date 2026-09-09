# test_gem.py
from ml.export import to_gem_csv_row

listing = {
    "en": {
        "title": "Hand block printed Ajrakh cotton dupatta",
        "story": "Ajrakh printing has been practised in Kutch for generations.",
    }
}

csv_text = to_gem_csv_row("prd_001", listing, 1899, "Ajrakh block print")
print(csv_text)
