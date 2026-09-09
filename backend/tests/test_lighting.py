# test_lighting.py
from PIL import Image
from ml.photo import fix_lighting

img = Image.open("image_1.jpg").convert("RGB")
result = fix_lighting(img)
result.save("test1_lit.jpg")
print("saved test1_lit.jpg")
