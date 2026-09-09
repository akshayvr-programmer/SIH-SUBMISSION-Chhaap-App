# test_enhance.py
from PIL import Image
from ml.photo import enhance_photo

img = Image.open("image_1.jpg").convert("RGB")
result = enhance_photo(img)
result["image"].save("test1_final.jpg")
print("background handling:", result["background"])



