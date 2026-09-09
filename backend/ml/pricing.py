import psycopg
from ml.embed import embed_text

def find_comparables(description: str, k: int = 7):
    query = embed_text([description])[0].tolist()

    conn = psycopg.connect("postgresql://chhaap:chhaap@localhost:5432/chhaap")
    with conn.cursor() as cur:
        cur.execute(
            "SELECT title, craft, price_inr, embedding <=> %s::vector AS distance "
            "FROM comparables ORDER BY distance LIMIT %s",
            (query, k),
        )
        rows = cur.fetchall()
    conn.close()

    return [
        {"title": t, "craft": c, "price_inr": p, "similarity": round(1 - d, 3)}
        for t, c, p, d in rows
    ]
def cost_floor(material_inr: int, labour_hours: float, wage_per_hour: int = 52, overhead_pct: float = 0.15) -> int:
    labour_cost = labour_hours * wage_per_hour
    subtotal = material_inr + labour_cost
    overhead = subtotal * overhead_pct
    return round(subtotal + overhead)
def estimate_price(description: str, material_inr: int, labour_hours: float, wage_per_hour: int = 52):
    comps = find_comparables(description, k=7)
    floor = cost_floor(material_inr, labour_hours, wage_per_hour)

    close = [c for c in comps if c["similarity"] >= 0.7]

    if len(close) >= 3:
        prices = sorted(c["price_inr"] for c in close)
        mid = prices[len(prices) // 2]
        recommended = max(mid, floor)
        confidence = "strong"
    elif len(close) >= 1:
        prices = [c["price_inr"] for c in close]
        recommended = max(round(sum(prices) / len(prices)), floor)
        confidence = "fair"
    else:
        recommended = floor
        confidence = "floor_only"
        close = []

    return {
        "recommended_inr": recommended,
        "confidence": confidence,
        "cost_floor_inr": floor,
        "comparables": close,
    }
