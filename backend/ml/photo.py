import os
import onnxruntime
onnxruntime.preload_dlls()
import numpy as np
from rembg import remove
from PIL import Image

def remove_background(image: Image.Image) -> Image.Image:
    return remove(image)

def is_flat_shot(original: Image.Image, bg_removed: Image.Image) -> bool:
    """If background removal kept very little, or kept it very faintly,
    it's likely a flat/macro shot rather than an isolated object."""
    alpha = np.array(bg_removed.convert("RGBA"))[:, :, 3]
    kept_fraction = np.mean(alpha > 10)
    mean_opacity = alpha.mean()
    return kept_fraction < 0.25 or mean_opacity < 40

import cv2

def fix_lighting(image: Image.Image) -> Image.Image:
    img = np.array(image.convert("RGB"))

    # auto white balance: stretch each color channel to use the full range
    for i in range(3):
        channel = img[:, :, i]
        low, high = np.percentile(channel, (2, 98))
        img[:, :, i] = np.clip((channel - low) * 255 / (high - low + 1e-6), 0, 255)

    # improve contrast on brightness only, keep colors natural
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    result = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)

    return Image.fromarray(result)

def enhance_photo(image: Image.Image) -> dict:
    original = image.convert("RGB")
    bg_removed = remove_background(original)
    flat = is_flat_shot(original, bg_removed)

    if flat:
        final = fix_lighting(original)
        background_handling = "none (flat/macro shot detected)"
    else:
        final = fix_lighting(bg_removed.convert("RGB"))
        background_handling = "removed"

    return {"image": final, "background": background_handling}

