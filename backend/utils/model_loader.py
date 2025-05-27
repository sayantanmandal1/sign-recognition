import tensorflow as tf
import numpy as np
import cv2
import gdown
import os

model = None
class_names = [chr(i) for i in range(65, 65 + 26)] + ['del', 'nothing', 'space']  # A-Z + extras

def download_weights():
    if not os.path.exists("sign_language_model.h5"):
        url = "https://drive.google.com/uc?id=1V-kGImLFw7Ayn0Jx8ORuy2fydJ4PODK7"
        output = "sign_language_model.h5"
        gdown.download(url, output, quiet=False)

def load_model():
    global model
    download_weights()  # Ensure model is downloaded
    model = tf.keras.models.load_model("sign_language_model.h5")
    return model

def preprocess(image):
    image = cv2.resize(image, (224, 224))
    image = image.astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)
    return image

def predict_sign(image):
    processed = preprocess(image)
    prediction = model.predict(processed)[0]
    idx = np.argmax(prediction)
    label = class_names[idx]
    confidence = float(prediction[idx])
    return label, confidence
