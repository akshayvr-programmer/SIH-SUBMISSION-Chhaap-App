# test_photo.py
from PIL import Image
from ml.photo import remove_background

img = Image.open("test1.jpg").convert("RGB")
result = remove_background(img)
result.save("test1_nobg.png")
print("saved test1_nobg.png")
