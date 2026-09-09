# test_flat_detect.py
import numpy as np
from PIL import Image
from ml.photo import remove_background, is_flat_shot

original = Image.open("image_1.jpg").convert("RGB")
bg_removed = remove_background(original)

alpha = np.array(bg_removed.convert("RGBA"))[:, :, 3]
print("kept fraction:", np.mean(alpha > 10))
print("alpha min/max/mean:", alpha.min(), alpha.max(), alpha.mean())
print("is flat shot:", is_flat_shot(original, bg_removed))
