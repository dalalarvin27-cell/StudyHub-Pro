import React, { useState } from 'react';
import axios from 'axios';

export default function CustomTestGenerator({ onLaunch }) {
  const [file, setFile] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [duration, setDuration] = useState(10); // 5, 10, 15
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!file) {
      setError("Please select a PDF or image file.");
      return;
    }

    setLoading(true);
    setError('');

    // CLEAR STALE FRONTEND CACHE
    localStorage.removeItem("currentQuiz");
    sessionStorage.removeItem("currentQuiz");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('difficulty', difficulty);
      formData.append('duration', duration);

      const res = await axios.post('/api/mock-tests/generate', formData);

      if (res.data && res.data.success) {
        const quiz = res.data.data;
        localStorage.setItem("currentQuiz", JSON.stringify(quiz));
        
        if (onLaunch) onLaunch(quiz);
      } else {
        setError(res.data.message || "Unable to generate a new quiz from this document. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate a new quiz from this document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Generate Custom Test Series 🚀</h2>

      {error && <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">{error}</div>}

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Select File</label>
        <input 
          type="file" 
          accept=".pdf,image/*" 
          onChange={(e) => setFile(e.target.files[0])} 
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Difficulty */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1">Difficulty Level</label>
        <select 
          value={difficulty} 
          onChange={(e) => setDifficulty(e.target.value)} 
          className="w-full border p-2 rounded"
        >
          <option value="easy">Easy (Basic Concepts)</option>
          <option value="medium">Medium (Conceptual & Application)</option>
          <option value="hard">Hard (Advanced Tricky)</option>
        </select>
      </div>

      {/* Time Limit: 5, 10, 15 Mins */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-1">Countdown Timer Duration</label>
        <div className="flex space-x-6">
          {[5, 10, 15].map((mins) => (
            <label key={mins} className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                name="duration" 
                value={mins} 
                checked={Number(duration) === mins} 
                onChange={() => setDuration(mins)} 
              />
              <span className="font-medium">{mins} Minutes</span>
            </label>
          ))}
        </div>
      </div>

      <button 
        onClick={handleGenerate} 
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow transition"
      >
        {loading ? "Generating Fresh Test..." : "Generate & Launch Custom Test Series Now 🚀"}
      </button>
    </div>
  );
}