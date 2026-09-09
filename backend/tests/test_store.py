from ml.embed import embed_text
from ml.store import add_comparable

v = embed_text(['ajrakh block print cotton dupatta'])[0]
add_comparable(
    title="Ajrakh hand block print cotton dupatta",
    craft="Ajrakh block print",
    price_inr=1899,
    source="manual",
    embedding=v,
)
print("inserted")
