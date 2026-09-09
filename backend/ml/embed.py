# ml/embed.py
import torch
from PIL import Image
from transformers import AutoModel, AutoProcessor

MODEL = "google/siglip-base-patch16-224"

_device = "cuda" if torch.cuda.is_available() else "cpu"
_model = AutoModel.from_pretrained(MODEL).to(_device).eval()
_proc = AutoProcessor.from_pretrained(MODEL)


@torch.inference_mode()
def embed_text(texts: list[str]) -> torch.Tensor:
    b = _proc(text=texts, padding="max_length", truncation=True, return_tensors="pt")
    b = {k: v.to(_device) for k, v in b.items()}
    v = _model.get_text_features(**b)
    if not isinstance(v, torch.Tensor):
        v = v.pooler_output
    return torch.nn.functional.normalize(v, dim=-1)


@torch.inference_mode()
def embed_image(images: list[Image.Image]) -> torch.Tensor:
    b = _proc(images=images, return_tensors="pt")
    b = {k: v.to(_device) for k, v in b.items()}
    v = _model.get_image_features(**b)
    if not isinstance(v, torch.Tensor):
        v = v.pooler_output
    return torch.nn.functional.normalize(v, dim=-1)
