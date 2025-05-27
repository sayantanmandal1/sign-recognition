document.addEventListener('DOMContentLoaded', function() {

    const videoElement = document.getElementById('videoElement');
    const capturedImage = document.getElementById('capturedImage');
    const startCameraBtn = document.getElementById('startCameraBtn');
    const captureBtnLive = document.getElementById('captureBtnLive');
    const toggleRealTimeBtn = document.getElementById('toggleRealTimeBtn');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const processImageBtn = document.getElementById('processImageBtn');
    const streamModeBtn = document.getElementById('streamModeBtn');
    const uploadModeBtn = document.getElementById('uploadModeBtn');
    const streamMode = document.getElementById('streamMode');
    const uploadMode = document.getElementById('uploadMode');
    const addSpaceBtn = document.getElementById('addSpaceBtn');
    const deleteLastBtn = document.getElementById('deleteLastBtn');
    const clearBtn = document.getElementById('clearBtn');
    const speakBtn = document.getElementById('speakBtn');
    const spellCheckToggle = document.getElementById('spellCheckToggle');
    const autoSpeakToggle = document.getElementById('autoSpeakToggle');
    const showDebugToggle = document.getElementById('showDebugToggle');
    const completedText = document.getElementById('completedText');
    const currentWord = document.getElementById('currentWord');
    const letterPrediction = document.getElementById('letterPrediction');
    const predictionScore = document.getElementById('predictionScore');
    const cameraBox = document.getElementById('cameraBox');
    const loadingElement = document.querySelector('.loading');
    const debugCanvas = document.getElementById('debugCanvas');
    const bgCanvas = document.getElementById('bgCanvas');

    let stream = null;
    let isRealTimeEnabled = false;
    let realTimeInterval = null;
    let letterHistory = [];
    let currentWordText = '';
    let completedTextContent = '';
    let lastPrediction = '';
    let consecutiveSamePredictions = 0;
    const predictionThreshold = 0.65; 
    const consecutiveThreshold = 3; 

    initThreeJsBackground();

    streamModeBtn.addEventListener('click', function() {
        streamModeBtn.classList.add('active');
        uploadModeBtn.classList.remove('active');
        streamMode.style.display = 'block';
        uploadMode.style.display = 'none';
    });

    uploadModeBtn.addEventListener('click', function() {
        uploadModeBtn.classList.add('active');
        streamModeBtn.classList.remove('active');
        uploadMode.style.display = 'block';
        streamMode.style.display = 'none';
    });

    startCameraBtn.addEventListener('click', async function() {
        try {

            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });

            videoElement.srcObject = stream;

            captureBtnLive.disabled = false;

            setTimeout(setupCameraBox, 500);

            startCameraBtn.textContent = 'Restart Camera';

        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please ensure you have given permission.');
        }
    });

    function setupCameraBox() {
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;

        const videoRect = videoElement.getBoundingClientRect();
        const displayWidth = videoRect.width;
        const displayHeight = videoRect.height;

        const boxSize = Math.min(displayWidth, displayHeight) * 0.6;

        const left = (displayWidth - boxSize) / 2;
        const top = (displayHeight - boxSize) / 2;

        cameraBox.style.left = `${left}px`;
        cameraBox.style.top = `${top}px`;
        cameraBox.style.width = `${boxSize}px`;
        cameraBox.style.height = `${boxSize}px`;
    }

    window.addEventListener('resize', function() {
        if (stream) {
            setupCameraBox();
        }
    });

    captureBtnLive.addEventListener('click', function() {
        if (!stream) return;

        processCameraImage();
    });

    function processCameraImage() {

        const boxRect = cameraBox.getBoundingClientRect();
        const videoRect = videoElement.getBoundingClientRect();

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        const scaleX = videoElement.videoWidth / videoRect.width;
        const scaleY = videoElement.videoHeight / videoRect.height;

        const sourceX = (boxRect.left - videoRect.left) * scaleX;
        const sourceY = (boxRect.top - videoRect.top) * scaleY;
        const sourceWidth = boxRect.width * scaleX;
        const sourceHeight = boxRect.height * scaleY;

        ctx.drawImage(
            videoElement,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, 200, 200
        );

        const imageData = canvas.toDataURL('image/jpeg');

        if (showDebugToggle.checked) {
            const debugCtx = debugCanvas.getContext('2d');
            debugCanvas.width = 200;
            debugCanvas.height = 200;
            debugCtx.drawImage(canvas, 0, 0);
            debugCanvas.style.display = 'block';
        } else {
            debugCanvas.style.display = 'none';
        }

        processImageData(imageData, {
            x: sourceX,
            y: sourceY,
            width: sourceWidth,
            height: sourceHeight
        });
    }

    toggleRealTimeBtn.addEventListener('click', function() {
        if (!stream) {
            alert('Please start the camera first');
            return;
        }

        isRealTimeEnabled = !isRealTimeEnabled;

        if (isRealTimeEnabled) {

            toggleRealTimeBtn.textContent = 'Disable Real-Time Recognition';
            toggleRealTimeBtn.style.backgroundColor = '#f44336';

            realTimeInterval = setInterval(processCameraImage, 1000);
        } else {

            toggleRealTimeBtn.textContent = 'Enable Real-Time Recognition';
            toggleRealTimeBtn.style.backgroundColor = '#4267B2';

            clearInterval(realTimeInterval);
        }
    });

    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            fileName.textContent = file.name;

            const reader = new FileReader();
            reader.onload = function(e) {
                capturedImage.src = e.target.result;
                capturedImage.style.display = 'block';
                processImageBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    processImageBtn.addEventListener('click', function() {
        if (!capturedImage.src) return;

        processImageData(capturedImage.src);
    });

    function processImageData(imageData, roi = null) {

        loadingElement.style.display = 'block';

        const data = {
            image_data: imageData.split(',')[1]
        };

        if (roi) {
            data.roi = [roi.x, roi.y, roi.width, roi.height];
        }

        fetch('/api/process-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {

            loadingElement.style.display = 'none';

            if (data.error) {
                alert('Error: ' + data.error);
                return;
            }

            const letter = data.letter;
            const confidence = data.confidence;

            displayPrediction(letter, confidence);

            processPrediction(letter, confidence);
        })
        .catch(error => {
            loadingElement.style.display = 'none';
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    }

    function displayPrediction(letter, confidence) {
        letterPrediction.textContent = letter;
        predictionScore.textContent = `Confidence: ${(confidence * 100).toFixed(2)}%`;
    }

    function processPrediction(letter, confidence) {

        if (confidence < predictionThreshold) {
            consecutiveSamePredictions = 0;
            lastPrediction = '';
            return;
        }

        if (letter === lastPrediction) {
            consecutiveSamePredictions++;
        } else {
            consecutiveSamePredictions = 1;
            lastPrediction = letter;
        }

        if (consecutiveSamePredictions >= consecutiveThreshold) {

            consecutiveSamePredictions = 0;

            if (letter === 'SPACE') {

                addSpace();
            } else if (letter === 'DEL') {

                deleteLastLetter();
            } else if (letter !== 'NOTHING') {

                currentWordText += letter;
                updateTextOutput();
            }
        }
    }

    function updateTextOutput() {
        currentWord.textContent = currentWordText;
    }

    function addSpace() {

        if (spellCheckToggle.checked && currentWordText) {
            applySpellCheck(currentWordText, function(correctedWord) {
                completedTextContent += correctedWord + ' ';
                completedText.textContent = completedTextContent;
                currentWordText = '';
                updateTextOutput();

                if (autoSpeakToggle.checked) {
                    speakText(correctedWord);
                }
            });
        } else {
            completedTextContent += currentWordText + ' ';
            completedText.textContent = completedTextContent;
            currentWordText = '';
            updateTextOutput();
        }
    }

    function deleteLastLetter() {
        if (currentWordText.length > 0) {
            currentWordText = currentWordText.slice(0, -1);
            updateTextOutput();
        } else if (completedTextContent.length > 0) {

            completedTextContent = completedTextContent.slice(0, -1);
            completedText.textContent = completedTextContent;
        }
    }

    function clearAll() {
        currentWordText = '';
        completedTextContent = '';
        completedText.textContent = '';
        currentWord.textContent = '';
    }

    function applySpellCheck(word, callback) {
        fetch('/api/correct-word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word: word })
        })
        .then(response => response.json())
        .then(data => {
            callback(data.corrected);
        })
        .catch(error => {
            console.error('Spell check error:', error);
            callback(word); 
        });
    }

    function speakText(text) {
        fetch('/api/generate-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        })
        .then(response => response.json())
        .then(data => {
            if (data.audio_url) {
                const audio = new Audio(data.audio_url);
                audio.play();
            }
        })
        .catch(error => {
            console.error('Speech error:', error);
        });
    }

    addSpaceBtn.addEventListener('click', addSpace);
    deleteLastBtn.addEventListener('click', deleteLastLetter);
    clearBtn.addEventListener('click', clearAll);
    speakBtn.addEventListener('click', function() {
        const textToSpeak = completedTextContent + currentWordText;
        if (textToSpeak.trim()) {
            speakText(textToSpeak);
        }
    });

    showDebugToggle.addEventListener('change', function() {
        debugCanvas.style.display = this.checked ? 'block' : 'none';
    });

    function initThreeJsBackground() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        const renderer = new THREE.WebGLRenderer({ 
            canvas: bgCanvas,
            alpha: true 
        });
        renderer.setSize(window.innerWidth, window.innerHeight);

        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;

        const posArray = new Float32Array(particlesCount * 3);

        for(let i = 0; i < particlesCount * 3; i++) {

            posArray[i] = (Math.random() - 0.5) * 5;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.005,
            color: '#4267B2',
            transparent: true,
            opacity: 0.5
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        camera.position.z = 3;

        window.addEventListener('resize', function() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        function animate() {
            requestAnimationFrame(animate);

            particlesMesh.rotation.x += 0.0005;
            particlesMesh.rotation.y += 0.0005;

            renderer.render(scene, camera);
        }

        animate();
    }
});