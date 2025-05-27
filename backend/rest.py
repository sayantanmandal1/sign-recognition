import tensorflow as tf

# Load the existing Keras model (.h5)
model = tf.keras.models.load_model("sign_language_model.h5")

# Convert the model to TFLite format
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

# Save the converted model
with open("sign_language_model.tflite", "wb") as f:
    f.write(tflite_model)

print("Model converted to TFLite and saved as sign_language_model.tflite")
