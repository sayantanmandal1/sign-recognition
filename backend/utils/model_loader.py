import tensorflow as tf
import numpy as np
import cv2

model = None
class_names = [chr(i) for i in range(65, 65+26)] + ['del', 'nothing', 'space']  # A-Z + 3 extras (adjust if needed)

def load_model():
    global model
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
