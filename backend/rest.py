import tensorflow as tf

model = tf.keras.models.load_model("sign_language_model.h5")

converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]  # Enables quantization
# Uncomment one of the following if needed:
# converter.target_spec.supported_types = [tf.float16]
# converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
tflite_model = converter.convert()

with open("sign_language_model_quant.tflite", "wb") as f:
    f.write(tflite_model)
