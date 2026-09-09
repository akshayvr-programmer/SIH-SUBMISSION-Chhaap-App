from datetime import datetime, timezone

def to_ondc_catalog(product_id: str, listing: dict, price_inr: int, images: list[str]):
    return {
        "context": {
            "domain": "ONDC:RET10",
            "action": "on_search",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "message": {
            "catalog": {
                "providers": [{
                    "items": [{
                        "id": product_id,
                        "descriptor": {
                            "name": listing["en"]["title"],
                            "short_desc": listing["en"]["bullets"][0],
                            "long_desc": listing["en"]["story"],
                            "images": images,
                        },
                        "price": {
                            "currency": "INR",
                            "value": str(price_inr),
                        },
                    }]
                }]
            }
        },
    }

import csv
import io

def to_gem_csv_row(product_id: str, listing: dict, price_inr: int, craft: str) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "product_id", "title", "description", "category", "price_inr", "hsn_code"
    ])
    writer.writerow([
        product_id,
        listing["en"]["title"],
        listing["en"]["story"],
        craft,
        price_inr,
        "5811",  # HSN code for handicraft textiles/handmade goods, adjust per craft
    ])
    return output.getvalue()

import qrcode
from io import BytesIO
import base64

def to_whatsapp_item(product_id: str, listing: dict, price_inr: int, image_url: str):
    return {
        "retailer_id": product_id,
        "name": listing["en"]["title"],
        "description": listing["en"]["bullets"][0],
        "price": price_inr * 100,  # WhatsApp expects price in the smallest currency unit (paise)
        "currency": "INR",
        "image_url": image_url,
    }

def generate_qr(url: str) -> str:
    img = qrcode.make(url)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")
