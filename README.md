# 🧠 ASL Recognition Studio
Sign Language Recognition App

This is a full-stack web application for **real-time American Sign Language (ASL) recognition** using a camera or uploaded images. It uses a TensorFlow Lite model to classify hand signs into letters and special tokens (`space`, `del`, `nothing`), spells out words intelligently, and even performs spellchecking.

Live App 👉 **[https://sign-recognition-1.onrender.com](https://sign-recognition-1.onrender.com)** (backend only)

---

## 📁 Project Structure

```
sign-language-recognition-app/
│
├── backend/                # FastAPI server with TFLite model
│   ├── main.py             # FastAPI entry point
│   ├── requirements.txt    # Python dependencies
│
├── frontend/               # React app for user interface
│   ├── src/
│   │   ├── App.js          # Main UI logic (camera capture, prediction, upload)
│   │   └── ...             # All React component files
│   └── package.json        # Frontend dependencies
│
└── README.md               # This file
```

---

## 🚀 Features

- 🔤 Real-time ASL recognition using webcam (live canvas).
- 🖼️ Support for uploading images for sign prediction.
- ✨ Uses a lightweight **TensorFlow Lite** model for fast inference.
- 🧠 Intelligent sentence builder:
  - Handles `space`, `del`, and character addition.
  - Optionally auto-speaks recognized text.
  - 📝 Built-in spellchecking using Python `pyspellchecker`.
- 🌐 Hosted backend on **Render.com** using FastAPI.
- 📦 Clean architecture split between frontend and backend.

---

## ⚙️ Backend Setup (FastAPI + TFLite)

### 🔧 Requirements

- Python 3.8+
- `pip install -r requirements.txt`

### 🧠 Model

The TFLite model `sign_language_model.tflite` is **automatically downloaded from Google Drive** on first run.

```bash
https://drive.google.com/uc?id=1ocwc_z36SZhO6r3d0_vqlVLAScqLK_PI
```

### 🏃 Run Locally

```bash
uvicorn main:app --reload
```

**Endpoints**:

- `POST /api/predict-sign` → Accepts base64 image + ROI, returns predicted letter.
- `GET /api/spellcheck?word=hello` → Returns corrected spelling.

---

## 🌐 Frontend Setup (React)

### 🚧 Prerequisites

- Node.js + npm

### ⚙️ Setup

```bash
cd frontend
npm install
npm run dev  # Or npm run start
```

### ✨ Main Logic

- `captureAndPredict()`
  - Draws webcam to canvas.
  - Sends base64 image to backend.
  - Handles prediction, confidence, updates sentence.
- `handleUpload()`
  - Handles file uploads (image files).
  - Sends data to backend and updates UI.

---

## 🔗 Backend Deployment (Render)

- Hosted FastAPI on Render.com using **`sign_language_model.tflite`**.
- Production URL:
  
  ```bash
  https://sign-recognition-1.onrender.com
  ```

- CORS is enabled for all origins (for dev).
  - You should restrict CORS in production.

---

## ✅ To Do (Optional Improvements)

- Add user authentication.
- Track historical predictions.
- Improve model accuracy and expand dataset.
- Add visual feedback for prediction confidence.

---

## 📜 License

MIT License. Free to use and modify.