from ml.listing import generate_listing

transcript = (
    "क्या मेरी अवाज आ रही है? यह है अज्रक प्रिंट का दुपत्टा है यह पूरी तरह से हाथ से बनाया घया है "
    "लक्डी के थप्पों से चापा है इस में सिर्फ प्राक्रतिक रंगों का इस्तमाल हुआ है जैसे नील और मजीथ का ज़ड "
    "यह सूता कप्डा है, बहुत मुलायम है बनाने में करीब 14 घंटे लगे यह कुछ गुजरात का परिम्परिक हुनर है "
    "जो हमारे परिवार में केई पीडियों से चला जारहा है"
)

result = generate_listing(transcript, craft="Ajrakh block print")
import json
print(json.dumps(result, indent=2, ensure_ascii=False))
