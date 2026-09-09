from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from PIL import Image
import io
import base64
from ml.photo import enhance_photo

from ml.pricing import estimate_price
from ml.classify import classify_craft
from ml.voice import transcribe as run_transcribe
from ml.listing import generate_listing

app = FastAPI()


class PricingRequest(BaseModel):
    description: str
    material_inr: int
    labour_hours: float


class ListingRequest(BaseModel):
    transcript: str
    craft: str
    target_lang: str = "Hindi"

@app.post("/v1/listing/generate")
def generate_endpoint(req: ListingRequest):
    return generate_listing(req.transcript, req.craft, req.target_lang)

@app.post("/v1/pricing/estimate")
def price(req: PricingRequest):
    return estimate_price(req.description, req.material_inr, req.labour_hours)


@app.post("/v1/vision/classify")
async def classify(image: UploadFile = File(...)):
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    return {"candidates": classify_craft(img)}


@app.post("/v1/listing/transcribe")
async def transcribe_endpoint(audio: UploadFile = File(...)):
    contents = await audio.read()
    with open("_temp_audio.wav", "wb") as f:
        f.write(contents)
    return run_transcribe("_temp_audio.wav")



@app.post("/v1/vision/enhance")
async def enhance_endpoint(image: UploadFile = File(...)):
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    result = enhance_photo(img)

    buf = io.BytesIO()
    result["image"].save(buf, format="JPEG")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")

    return {"background": result["background"], "image_base64": encoded}

from ml.export import to_ondc_catalog, to_gem_csv_row, to_whatsapp_item, generate_qr

class PublishRequest(BaseModel):
    product_id: str
    listing: dict
    price_inr: int
    craft: str
    image_url: str = "https://chhaap.local/placeholder.jpg"

@app.post("/v1/publish")
def publish(req: PublishRequest):
    microsite_url = f"https://chhaap.local/p/{req.product_id}"
    return {
        "ondc": to_ondc_catalog(req.product_id, req.listing, req.price_inr, [req.image_url]),
        "gem_csv": to_gem_csv_row(req.product_id, req.listing, req.price_inr, req.craft),
        "whatsapp": to_whatsapp_item(req.product_id, req.listing, req.price_inr, req.image_url),
        "microsite_url": microsite_url,
        "qr_base64": generate_qr(microsite_url),
    }
@app.get("/health")
def health():
    return {"ok": True}
