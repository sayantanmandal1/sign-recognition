from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import numpy as np
import cv2
import base64
from datetime import datetime
import gdown
from spellchecker import SpellChecker
import tensorflow as tf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production!
    allow_methods=["*"],
    allow_headers=["*"]
)

MODEL_PATH = "sign_language_model.tflite"
DRIVE_FILE_ID = "1ocwc_z36SZhO6r3d0_vqlVLAScqLK_PI"
DRIVE_URL = f"https://drive.google.com/uc?id={DRIVE_FILE_ID}"

if not os.path.exists(MODEL_PATH):
    print("Downloading TFLite model from Google Drive...")
    gdown.download(DRIVE_URL, MODEL_PATH, quiet=False)

# Load TFLite model and allocate tensors
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

class_names = [chr(i) for i in range(65, 65 + 26)] + ['del', 'nothing', 'space']

class ImageData(BaseModel):
    image_data: str  # base64-encoded image data
    roi: list[int] = [0, 0, 224, 224]  # default crop region

def preprocess(image):
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, (224, 224))
    image = image.astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)
    return image

def predict_sign_tflite(image):
    processed = preprocess(image)
    interpreter.set_tensor(input_details[0]['index'], processed)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])[0]

    idx = int(np.argmax(output))
    confidence = float(output[idx])
    label = class_names[idx]

    return label, confidence

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

    label, confidence = predict_sign_tflite(roi)

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
