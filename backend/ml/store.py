import psycopg

def add_comparable(title: str, craft: str, price_inr: int, source: str, embedding):
    conn = psycopg.connect("postgresql://chhaap:chhaap@localhost:5432/chhaap")
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO comparables (title, craft, price_inr, source, embedding) "
            "VALUES (%s, %s, %s, %s, %s)",
            (title, craft, price_inr, source, embedding.tolist()),
        )
    conn.commit()
    conn.close()
