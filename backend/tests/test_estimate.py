# test_estimate.py
from ml.pricing import estimate_price

result = estimate_price(
    description="hand block printed cotton dupatta indigo dye",
    material_inr=430,
    labour_hours=14,
)
import json
print(json.dumps(result, indent=2))

