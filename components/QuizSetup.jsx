import React, { useState } from 'react';
import axios from 'axios';

export default function QuizSetup({ onQuizGenerated }) {
  const [file, setFile] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [duration, setDuration] = useState(10); // Default 10 Mins
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF or Image file.');
      return;
    }

    setLoading(true);
    setError('');

    // CRITICAL: Clear stale quiz state from local/session storage
    localStorage.removeItem("currentQuiz");
    localStorage.removeItem("quizTimerState");
    sessionStorage.removeItem("currentQuiz");

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('difficulty', difficulty);
      formData.append('duration', duration);

      const response = await axios.post('/api/quiz/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        // Store fresh session
        const freshQuizData = response.data.data;
        localStorage.setItem("currentQuiz", JSON.stringify(freshQuizData));
        
        if (onQuizGenerated) {
          onQuizGenerated(freshQuizData);
        }
      } else {
        setError(response.data.message || 'Unable to generate a new quiz from this document. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Unable to generate a new quiz from this document. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-generator-card p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Generate Mock Test</h2>
      
      {error && <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">{error}</div>}

      <form onSubmit={handleGenerate}>
        {/* Upload File */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Upload PDF or Image</label>
          <input 
            type="file" 
            accept=".pdf,image/*" 
            onChange={handleFileChange} 
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Difficulty Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Difficulty Level</label>
          <select 
            value={difficulty} 
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="easy">Easy (Basic Concepts)</option>
            <option value="medium">Medium (Conceptual & Application)</option>
            <option value="hard">Hard (Advanced & Deep Concepts)</option>
          </select>
        </div>

        {/* Time Limit Selection (5, 10, 15 Mins) */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Test Duration</label>
          <div className="flex space-x-4">
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
          type="submit" 
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow transition"
        >
          {loading ? 'Generating Fresh Quiz...' : 'Generate Quiz'}
        </button>
      </form>
    </div>
  );
}