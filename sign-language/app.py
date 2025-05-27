from flask import Flask, request, jsonify, render_template, send_file
import os
import cv2
import numpy as np
import tensorflow as tf
import base64
from gtts import gTTS
import tempfile
import uuid
import json
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# Disable eager execution for TensorFlow 1.x compatibility
tf.compat.v1.disable_eager_execution()


# Directory setup
UPLOAD_FOLDER = 'static/uploads'
TEMP_FOLDER = 'static/temp'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

# Dictionary for spell checking
# Dictionary for spell checking
word_dictionary = {
    'HELO': 'HELLO',
    'THER': 'THERE',
    'WRD': 'WORD',
    'GUD': 'GOOD',
    'MORNNG': 'MORNING',
    # Common misspellings
    'THX': 'THANKS',
    'PLZ': 'PLEASE',
    'U': 'YOU',
    'UR': 'YOUR',
    'R': 'ARE',
    'Y': 'WHY',
    'CUZ': 'BECAUSE',
    'BCUZ': 'BECAUSE',
    'BCZ': 'BECAUSE',
    'DONT': "DON'T",
    'CANT': "CAN'T",
    'WONT': "WON'T",
    'DIDNT': "DIDN'T",
    'ISNT': "ISN'T",
    'WASNT': "WASN'T",
    'WERENT': "WEREN'T",
    'HASNT': "HASN'T",
    'HAVENT': "HAVEN'T",
    'SHOULDNT': "SHOULDN'T",
    'WOULDNT': "WOULDN'T",
    'COULDNT': "COULDN'T",
    
    # Common text shortenings
    'TXT': 'TEXT',
    'MSG': 'MESSAGE',
    'BRB': 'BE RIGHT BACK',
    'GTG': 'GOT TO GO',
    'LOL': 'LAUGHING OUT LOUD',
    'OMG': 'OH MY GOD',
    'IMO': 'IN MY OPINION',
    'IMHO': 'IN MY HUMBLE OPINION',
    'FYI': 'FOR YOUR INFORMATION',
    'ASAP': 'AS SOON AS POSSIBLE',
    
    # Common typos
    'RECIEVE': 'RECEIVE',
    'WIERD': 'WEIRD',
    'DEFINATELY': 'DEFINITELY',
    'SEPERATE': 'SEPARATE',
    'OCCURED': 'OCCURRED',
    'TOMMORROW': 'TOMORROW',
    'ALOT': 'A LOT',
    'THIER': 'THEIR',
    'WICH': 'WHICH',
    'UNTILL': 'UNTIL',
    'BELEIVE': 'BELIEVE',
    'FREIND': 'FRIEND',
    'ACCROSS': 'ACROSS',
    'OCCASSION': 'OCCASION',
    'BUISNESS': 'BUSINESS',
    
    # Common greeting typos
    'HI': 'HI',
    'HIYA': 'HI',
    'HEY': 'HEY',
    'HOWDY': 'HOWDY',
    'EVENIN': 'EVENING',
    'AFTERNON': 'AFTERNOON',
    'AFTRN': 'AFTERNOON',
    'MORN': 'MORNING',
    'NITE': 'NIGHT',
    'GN': 'GOOD NIGHT',
    'GM': 'GOOD MORNING',
    
    # Common word truncations
    'APP': 'APPLICATION',
    'PICS': 'PICTURES',
    'PICS': 'PICTURES',
    'PROB': 'PROBLEM',
    'SEC': 'SECOND',
    'MIN': 'MINUTE',
    'HR': 'HOUR',
    'APPT': 'APPOINTMENT',
    'CONV': 'CONVERSATION',
    'CONVO': 'CONVERSATION',
    'INFO': 'INFORMATION',
    'TEMP': 'TEMPERATURE',
    'ADMIN': 'ADMINISTRATOR',
    'PROF': 'PROFESSOR',
    'TECH': 'TECHNOLOGY',
    'DOCS': 'DOCUMENTS',
}
# Load training labels file
# Update the path to your actual labels file
LABELS_PATH = "training_set_labels.txt"
label_lines = [line.rstrip() for line in tf.io.gfile.GFile(LABELS_PATH, 'r')]

# Load trained model's graph
# Update the path to your actual model file
MODEL_PATH = "trained_model_graph.pb"
with tf.io.gfile.GFile(MODEL_PATH, 'rb') as f:
    graph_def = tf.compat.v1.GraphDef()
    graph_def.ParseFromString(f.read())
    _ = tf.import_graph_def(graph_def, name='')

def predict_sign(image_data):
    """
    Process and predict the sign from the given image
    """
    # Resize to 200 x 200 if not already
    if image_data.shape[0] != 200 or image_data.shape[1] != 200:
        image_data = cv2.resize(image_data, (200, 200))
    
    # Encode as JPEG
    _, img_encoded = cv2.imencode('.jpg', image_data)
    
    with tf.compat.v1.Session() as sess:
        # Feed the image_data as input to the graph and get prediction
        softmax_tensor = sess.graph.get_tensor_by_name('final_result:0')
        predictions = sess.run(softmax_tensor, {'DecodeJpeg/contents:0': img_encoded.tobytes()})
        
        # Sort to show labels of first prediction in order of confidence
        top_k = predictions[0].argsort()[-len(predictions[0]):][::-1]
        
        results = []
        for node_id in top_k:
            # Handle the Z error as in the original code
            if node_id < len(label_lines):
                if label_lines[node_id].upper() == 'Z':
                    human_string = label_lines[node_id + 1] if node_id + 1 < len(label_lines) else label_lines[node_id]
                else:
                    human_string = label_lines[node_id]
                score = float(predictions[0][node_id])
                results.append((human_string.upper(), score))
        
        # Return the top prediction
        return results[0]

def correct_spelling(word):
    """
    Return corrected word if in dictionary
    """
    return word_dictionary.get(word, word)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate-speech', methods=['POST'])
def generate_speech():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Create a unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(TEMP_FOLDER, filename)
        
        # Generate speech
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(filepath)
        
        # Return the URL to the audio file
        audio_url = f"/static/temp/{filename}"
        return jsonify({'audio_url': audio_url})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/correct-word', methods=['POST'])
def correct_word():
    try:
        data = request.json
        word = data.get('word', '')
        
        if not word:
            return jsonify({'error': 'No word provided'}), 400
        
        # Apply spell checking
        corrected = correct_spelling(word.upper())
        
        return jsonify({
            'original': word,
            'corrected': corrected,
            'changed': word.upper() != corrected
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/process-image', methods=['POST'])
def process_image():
    try:
        # Check if image is provided
        if 'image' not in request.files and 'image_data' not in request.json:
            return jsonify({'error': 'No image provided'}), 400
        
        # Process image from file upload
        if 'image' in request.files:
            file = request.files['image']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400
            
            # Save the uploaded file
            filename = str(uuid.uuid4()) + '.jpg'
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            
            # Read the image
            image = cv2.imread(filepath)
            
        # Process image from base64 data
        elif 'image_data' in request.json:
            # Get the base64 image data
            image_data = request.json['image_data']
            
            # Strip the data URL prefix if present
            if 'data:image' in image_data:
                image_data = image_data.split(',')[1]
                
            # Decode base64 to binary
            image_binary = base64.b64decode(image_data)
            
            # Convert to numpy array
            np_arr = np.frombuffer(image_binary, np.uint8)
            
            # Decode the image
            image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        # Extract the region of interest (ROI) if coordinates are provided
        x, y, w, h = request.json.get('roi', (0, 0, image.shape[1], image.shape[0]))
        roi = image[y:y+h, x:x+w]
        
        # Predict the sign
        letter, score = predict_sign(roi)
        
        # Return the prediction
        return jsonify({
            'letter': letter,
            'confidence': score,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500