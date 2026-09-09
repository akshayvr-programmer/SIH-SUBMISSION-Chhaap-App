from ml.embed import embed_text, embed_image

CRAFT_DESCRIPTIONS = {
    "Ajrakh block print": "Ajrakh hand block printed cotton fabric with natural indigo and madder red geometric patterns",
    "Madhubani painting": "Madhubani folk painting on paper with bold outlines, bright natural colours, and mythological figures",
    "Channapatna toys": "Channapatna wooden lacquerware toy, brightly coloured, smooth turned wood, traditional Indian craft",
    "Pattachitra": "Pattachitra traditional scroll painting on cloth or palm leaf, intricate mythological Odisha art",
    "Bidri": "Bidri metal craft, blackened alloy inlaid with silver wire in floral and geometric patterns",
    "Phulkari": "Phulkari hand embroidered textile with dense colourful floral thread work on cotton",
}

_names = list(CRAFT_DESCRIPTIONS.keys())
_craft_vectors = embed_text(list(CRAFT_DESCRIPTIONS.values()))

def classify_craft(image):
    img_vec = embed_image([image])[0]
    scores = (_craft_vectors @ img_vec).tolist()
    ranked = sorted(zip(_names, scores), key=lambda x: -x[1])
    return [{"craft": name, "confidence": round(score, 3)} for name, score in ranked]
