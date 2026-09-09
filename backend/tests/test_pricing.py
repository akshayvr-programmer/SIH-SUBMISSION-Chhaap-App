# test_pricing.py
from ml.pricing import find_comparables
from ml.pricing import cost_floor

results = find_comparables("hand block printed cotton dupatta indigo dye")
for r in results:
    print(r)
print(cost_floor(material_inr=430, labour_hours=14))
