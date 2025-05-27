
# Sign Language Recognition Web Interface

This project provides a web interface for sign language recognition, allowing users to convert sign language to text and speech using either uploaded images or live camera streaming.

## Features

- Live camera streaming for real-time sign language recognition
- Image upload functionality for processing stored images
- Text display of recognized letters, words, and sentences
- Speech output for recognized text
- Spell-checking to improve accuracy
- User-friendly interface with intuitive controls

## Project Structure

```
sign-language-web/
├── app.py                  # Main Flask application
├── static/
│   ├── uploads/            # Storage for uploaded images
│   └── temp/               # Temporary storage for generated audio files
├── templates/
│   └── index.html          # Base HTML template
├── trained_model_graph.pb  # Pre-trained TensorFlow model
└── training_set_labels.txt # Labels for the model
```

## Requirements

- Python 3.6+
- Flask
- TensorFlow
- OpenCV
- gTTS (Google Text-to-Speech)
- NumPy
- Flask-CORS

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd sign-language-web
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Ensure you have the trained model and labels files:
   - Place your `trained_model_graph.pb` in the project root
   - Place your `training_set_labels.txt` in the project root

   Note: Update the paths in `app.py` if your files are located elsewhere.

4. Create required directories:
   ```
   mkdir -p static/uploads static/temp
   ```

## Running the Application

1. Start the Flask application:
   ```
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage Instructions

### Live Camera Mode
1. Click "Start Camera" to enable your webcam
2. Position your hand showing a sign within the green box
3. Click "Capture Sign" to manually recognize a sign, or
4. Enable "Real-Time Recognition" for continuous detection
5. Use "Add Space" to complete words and "Delete Last Letter" to correct mistakes

### Upload Image Mode
1. Click "Choose Image" to select an image file
2. Click "Process Image" to recognize the sign in the image

### Output Controls
- "Add Space": Completes the current word and adds a space
- "Delete Last Letter": Removes the last recognized letter
- "Clear All": Resets all recognized text
- "Speak Text": Reads the recognized text aloud

### Settings
- "Enable Spell Check": Automatically corrects common spelling mistakes
- "Auto-Speak Words": Automatically reads words aloud when completed

## Integration with Existing Code

This web interface integrates with your existing sign language recognition code using a Flask backend. The core functionality from your original code has been preserved and enhanced with web capabilities.

## Customization

- To add more words to the spell-checking dictionary, modify the `word_dictionary` in `app.py`
- To adjust the recognition sensitivity, modify the threshold values in the `predict_sign` function

## License

[Your License Here]

## Acknowledgments

- Based on the Unvoiced project for sign language recognition
- Uses TensorFlow for neural network processing
- Google Text-to-Speech for audio output
=======
