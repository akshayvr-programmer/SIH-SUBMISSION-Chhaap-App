from ml.embed import embed_text

v = embed_text([
    'ajrakh block print cotton dupatta',
    'hand block printed indigo cotton scarf',
    'stainless steel cooking pot',
])
print('similar pair (dupatta vs scarf):   ', round(float(v[0] @ v[1]), 3))
print('unrelated pair (dupatta vs pot):   ', round(float(v[0] @ v[2]), 3))