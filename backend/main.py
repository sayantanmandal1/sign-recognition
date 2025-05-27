from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import cv2
import base64
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for production!
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load model and class names once
model = tf.keras.models.load_model("sign_language_model.h5")
class_names = [chr(i) for i in range(65, 65+26)] + ['del', 'nothing', 'space']

class ImageData(BaseModel):
    image_data: str  # base64 image data (e.g. from canvas or img tag)
    roi: list[int] = [0, 0, 224, 224]  # default full image crop

def preprocess(image):
    # Convert BGR (OpenCV) to RGB (model trained on RGB)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, (224, 224))
    image = image.astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@app.post("/api/predict-sign")
def predict_sign(data: ImageData):
    # Extract base64 and decode to bytes
    if "base64," in data.image_data:
        header, data_str = data.image_data.split("base64,")
    else:
        data_str = data.image_data

    image_bytes = base64.b64decode(data_str)
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Crop ROI safely
    x, y, w, h = data.roi
    roi = image[y:y+h, x:x+w]

    # Defensive check in case ROI is empty or invalid
    if roi.size == 0:
        return {"error": "Invalid ROI or empty image crop"}

    processed = preprocess(roi)
    prediction = model.predict(processed)[0]
    idx = int(np.argmax(prediction))
    label = class_names[idx]
    confidence = float(prediction[idx])

    return {
        "letter": label,
        "confidence": confidence,
        "timestamp": datetime.now().isoformat()
    }
from spellchecker import SpellChecker
from fastapi import Query

spell = SpellChecker()

@app.get("/api/spellcheck")
def spell_check(word: str = Query(..., min_length=1)):
    corrected = spell.correction(word)
    return {"original": word, "corrected": corrected}