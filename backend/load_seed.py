import csv
from ml.embed import embed_text
from ml.store import add_comparable

rows = list(csv.DictReader(open("data/comparables_seed.csv", encoding="utf-8")))
titles = [r["title"] for r in rows]

print(f"embedding {len(titles)} titles...")
vectors = embed_text(titles)

for row, vec in zip(rows, vectors):
    add_comparable(
        title=row["title"],
        craft=row["craft"],
        price_inr=int(row["price_inr"]),
        source=row["source"],
        embedding=vec,
    )

print(f"inserted {len(rows)} rows")
