# test_classify.py
from PIL import Image
from ml.classify import classify_craft

img = Image.open("image_1.jpg").convert("RGB")
for r in classify_craft(img):
    print(r)
