# test_whatsapp_qr.py
from ml.export import to_whatsapp_item, generate_qr

item = to_whatsapp_item("prd_001", {"en": {"title": "Ajrakh dupatta", "bullets": ["Hand block printed"]}}, 1899, "https://chhaap.local/img1.jpg")
print(item)

qr_b64 = generate_qr("https://chhaap.local/p/prd_001")
with open("test_qr.png", "wb") as f:
    import base64
    f.write(base64.b64decode(qr_b64))
print("saved test_qr.png")
