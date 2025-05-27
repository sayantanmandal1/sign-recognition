from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

# Disable TensorFlow GPU usage and reduce verbosity of logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import tensorflow as tf
import numpy as np
import cv2
import base64
from datetime import datetime
import gdown
from spellchecker import SpellChecker

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production!
    allow_methods=["*"],
    allow_headers=["*"]
)

MODEL_PATH = "sign_language_model.h5"
DRIVE_FILE_ID = "1V-kGImLFw7Ayn0Jx8ORuy2fydJ4PODK7"
DRIVE_URL = f"https://drive.google.com/uc?id={DRIVE_FILE_ID}"

if not os.path.exists(MODEL_PATH):
    print("Downloading model from Google Drive...")
    gdown.download(DRIVE_URL, MODEL_PATH, quiet=False)

# Fix the input_shape warning by explicitly using Input layer
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Input

# Load model normally (assuming the saved model was created properly)
model = load_model(MODEL_PATH)

class_names = [chr(i) for i in range(65, 65 + 26)] + ['del', 'nothing', 'space']

class ImageData(BaseModel):
    image_data: str  # base64 image data
    roi: list[int] = [0, 0, 224, 224]  # default full image crop

def preprocess(image):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, (224, 224))
    image = image.astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@app.post("/api/predict-sign")
def predict_sign(data: ImageData):
    if "base64," in data.image_data:
        _, data_str = data.image_data.split("base64,")
    else:
        data_str = data.image_data

    image_bytes = base64.b64decode(data_str)
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    x, y, w, h = data.roi
    roi = image[y:y + h, x:x + w]

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

spell = SpellChecker()

@app.get("/api/spellcheck")
def spell_check(word: str = Query(..., min_length=1)):
    corrected = spell.correction(word)
    return {"original": word, "corrected": corrected}
