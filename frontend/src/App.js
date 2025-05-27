import React, { useState, useRef, useEffect } from "react";

export default function ASLApp() {
  const [mode, setMode] = useState("live");
  const [file, setFile] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [spellCheck, setSpellCheck] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [prediction, setPrediction] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  // Speech synthesis
  function speak(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  // Capture image from video and send to backend
  async function captureAndPredict() {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 224, 224);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");

    const payload = { image_data: dataUrl, roi: [0, 0, 224, 224] };
    try {
      const res = await fetch("http://localhost:8000/api/predict-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setPrediction(data);
      setIsConnected(true);

      if (data.letter) {
        let newText = recognizedText;
        if (data.letter === "space") newText += " ";
        else if (data.letter === "del") newText = newText.slice(0, -1);
        else if (data.letter !== "nothing") newText += data.letter;

        if (spellCheck && newText.trim()) {
          const words = newText.trim().split(/\s+/);
          const lastWord = words[words.length - 1];
          const spellRes = await fetch(
            `http://localhost:8000/api/spellcheck?word=${lastWord}`
          );
          const spellData = await spellRes.json();
          if (spellData.corrected && spellData.corrected !== lastWord) {
            words[words.length - 1] = spellData.corrected;
            newText = words.join(" ") + " ";
          }
        }

        setRecognizedText(newText);
        if (autoSpeak) speak(newText);
      }
    } catch (error) {
      setIsConnected(false);
      console.error("Connection error:", error);
    }
  }

  // Start webcam stream
  async function startCamera() {
    if (!navigator.mediaDevices) return alert("Camera not supported");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCapturing(true);
    } catch (error) {
      alert("Camera access denied or not available");
    }
  }

  // Stop webcam stream
  function stopCamera() {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    setCapturing(false);
  }

  // Live recognition loop
  useEffect(() => {
    if (!capturing) return;
    const interval = setInterval(() => {
      captureAndPredict();
    }, 1500);
    return () => clearInterval(interval);
  }, [capturing, recognizedText, spellCheck, autoSpeak]);

  // Image upload predict
  async function handleUpload(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const payload = { image_data: dataUrl, roi: [0, 0, 224, 224] };
      try {
        const res = await fetch("http://localhost:8000/api/predict-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setPrediction(data);
        setIsConnected(true);
        if (data.letter && data.letter !== "nothing") {
          let newText = recognizedText;
          if (data.letter === "space") newText += " ";
          else if (data.letter === "del") newText = newText.slice(0, -1);
          else newText += data.letter;
          setRecognizedText(newText);
          if (autoSpeak) speak(newText);
        }
      } catch (error) {
        setIsConnected(false);
        console.error("Connection error:", error);
      }
    };
    reader.readAsDataURL(f);
  }

  // Output controls handlers
  function addSpace() {
    setRecognizedText((t) => t + " ");
    if (autoSpeak) speak(recognizedText + " ");
  }
  function deleteLast() {
    setRecognizedText((t) => t.slice(0, -1));
  }
  function clearAll() {
    setRecognizedText("");
  }
  function speakText() {
    if (recognizedText.trim()) speak(recognizedText);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            ASL Recognition Studio
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Advanced sign language recognition powered by AI
          </p>
          
          {/* Connection Status */}
          <div className="flex items-center justify-center mt-6">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected to AI Engine' : 'Connection Lost'}
            </span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-2 border border-slate-700/50">
            <button
              onClick={() => setMode("live")}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform ${
                mode === "live"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Live Camera</span>
              </div>
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform ${
                mode === "upload"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 scale-105"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Upload Image</span>
              </div>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <div className="space-y-8">
            {/* Live Camera Mode */}
            {mode === "live" && (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 animate-slide-up">
                <div className="text-center">
                  <div className="relative inline-block">
                    <video
                      ref={videoRef}
                      width="400"
                      height="300"
                      className="rounded-2xl border-2 border-slate-600/50 shadow-2xl transform transition-all duration-500 hover:scale-105"
                      autoPlay
                      muted
                    />
                    {capturing && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
                    )}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  </div>
                  <canvas ref={canvasRef} width="224" height="224" className="hidden" />
                  
                  <div className="mt-8">
                    {!capturing ? (
                      <button 
                        onClick={startCamera}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/25"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                          <span>Start Recognition</span>
                        </div>
                      </button>
                    ) : (
                      <button 
                        onClick={stopCamera}
                        className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-white rounded-sm"></div>
                          <span>Stop Recognition</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upload Image Mode */}
            {mode === "upload" && (
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 animate-slide-up">
                <div className="text-center">
                  <div className="border-3 border-dashed border-slate-600/50 rounded-2xl p-12 hover:border-purple-500/50 transition-colors duration-300">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center space-y-4"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">Upload an Image</p>
                        <p className="text-slate-400">Drag and drop or click to select</p>
                      </div>
                    </label>
                  </div>
                  
                  {file && (
                    <div className="mt-8 animate-fade-in">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Uploaded Sign"
                        className="max-w-sm mx-auto rounded-2xl shadow-2xl border-2 border-slate-600/50 transform hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prediction Results */}
            {prediction && (
              <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 animate-slide-up">
                <h3 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  AI Prediction Results
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-700/30 rounded-2xl">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">{prediction.letter}</div>
                    <div className="text-slate-400 text-sm">Detected Letter</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-2xl">
                    <div className="text-3xl font-bold text-green-400 mb-2">{(prediction.confidence * 100).toFixed(1)}%</div>
                    <div className="text-slate-400 text-sm">Confidence</div>
                  </div>
                  <div className="text-center p-4 bg-slate-700/30 rounded-2xl">
                    <div className="text-lg font-bold text-purple-400 mb-2">{new Date(prediction.timestamp).toLocaleTimeString()}</div>
                    <div className="text-slate-400 text-sm">Timestamp</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="space-y-8">
            {/* Recognized Text */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 animate-slide-up">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Recognized Text
              </h3>
              <textarea
                rows={6}
                value={recognizedText}
                onChange={(e) => setRecognizedText(e.target.value)}
                className="w-full p-6 text-lg bg-slate-900/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all duration-300 resize-none"
                placeholder="Your recognized text will appear here as you sign..."
              />

              {/* Text Controls */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <button 
                  onClick={addSpace}
                  className="bg-blue-600/80 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  Add Space
                </button>
                <button 
                  onClick={deleteLast}
                  className="bg-red-600/80 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  Delete Last
                </button>
                <button 
                  onClick={clearAll}
                  className="bg-gray-600/80 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  Clear All
                </button>
                <button 
                  onClick={speakText}
                  className="bg-green-600/80 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                >
                  🔊 Speak
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 animate-slide-up">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Settings
              </h3>
              <div className="space-y-6">
                <label className="flex items-center justify-between p-4 bg-slate-700/30 rounded-2xl cursor-pointer hover:bg-slate-700/50 transition-colors duration-300">
                  <div>
                    <div className="font-semibold text-white">Spell Check</div>
                    <div className="text-slate-400 text-sm">Auto-correct recognized words</div>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={spellCheck} 
                      onChange={() => setSpellCheck(!spellCheck)}
                      className="sr-only"
                    />
                    <div className={`w-14 h-8 rounded-full transition-colors duration-300 ${spellCheck ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1 ${spellCheck ? 'translate-x-7 ml-1' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-4 bg-slate-700/30 rounded-2xl cursor-pointer hover:bg-slate-700/50 transition-colors duration-300">
                  <div>
                    <div className="font-semibold text-white">Auto-Speak</div>
                    <div className="text-slate-400 text-sm">Automatically speak recognized text</div>
                  </div>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={autoSpeak} 
                      onChange={() => setAutoSpeak(!autoSpeak)}
                      className="sr-only"
                    />
                    <div className={`w-14 h-8 rounded-full transition-colors duration-300 ${autoSpeak ? 'bg-green-500' : 'bg-slate-600'}`}>
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-1 ${autoSpeak ? 'translate-x-7 ml-1' : 'translate-x-1'}`}></div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
        
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}