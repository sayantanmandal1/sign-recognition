import React, { useState } from 'react';
import axios from 'axios';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please upload an image.');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://127.0.0.1:8000/predict', formData);
      setResult(res.data.prediction || 'No result received');
    } catch (err) {
      console.error(err);
      setResult('Error during prediction.');
    }
  };

  return (
    <div className="my-4">
      <h2 className="text-lg font-semibold mb-2">Upload an Image</h2>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="p-2 border"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Predict
        </button>
      </form>
      {result && <p className="mt-4 font-semibold">Prediction: {result}</p>}
    </div>
  );
};

export default UploadForm;
