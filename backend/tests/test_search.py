import psycopg
from ml.embed import embed_text

query = embed_text(["hand block printed cotton dupatta indigo dye"])[0].tolist()

conn = psycopg.connect("postgresql://chhaap:chhaap@localhost:5432/chhaap")
with conn.cursor() as cur:
    cur.execute(
        "SELECT title, craft, price_inr, embedding <=> %s::vector AS distance "
        "FROM comparables ORDER BY distance LIMIT 5",
        (query,),
    )
    for title, craft, price, dist in cur.fetchall():
        print(f"{dist:.3f}  {craft:20s}  Rs{price:5d}  {title}")
conn.close()
