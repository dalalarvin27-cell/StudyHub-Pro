import React, { useState, useEffect, useRef } from 'react';

export default function MockTestRunner({ testData, onComplete }) {
  const totalSeconds = (testData?.duration || 10) * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);

  // Timer Countdown
  useEffect(() => {
    if (isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isSubmitted]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const calculateResult = (answers) => {
    let score = 0;
    const questions = testData.questions || [];

    questions.forEach((q, idx) => {
      const selected = answers[q.questionId || idx];
      if (selected !== undefined && String(selected) === String(q.correctAnswer)) {
        score++;
      }
    });

    const summary = {
      score,
      total: questions.length,
      percentage: questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
    };

    setResult(summary);
    setIsSubmitted(true);

    if (onComplete) onComplete(summary);
  };

  const handleAutoSubmit = () => {
    calculateResult(userAnswers);
  };

  const handleManualSubmit = () => {
    const confirmSubmit = window.confirm("Are you sure you want to submit the test?");
    if (confirmSubmit) {
      if (timerRef.current) clearInterval(timerRef.current);
      calculateResult(userAnswers);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-10 bg-white border-b pb-4 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{testData.sourceFile}</h2>
          <p className="text-sm text-gray-500 capitalize">Difficulty: {testData.difficulty}</p>
        </div>

        {/* Timer Badge (Mobile & Desktop) */}
        <div className={`px-4 py-2 rounded-lg font-mono font-bold text-lg ${
          timeLeft < 120 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-800'
        }`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Result Display */}
      {isSubmitted && result && (
        <div className="p-4 mb-6 bg-green-100 border border-green-300 rounded-lg text-center">
          <h3 className="text-xl font-bold text-green-800">Test Submitted!</h3>
          <p className="text-green-700 font-semibold mt-1">
            Score: {result.score} / {result.total} ({result.percentage}%)
          </p>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {testData.questions?.map((q, qIdx) => {
          const qKey = q.questionId || qIdx;
          const selectedOption = userAnswers[qKey];

          return (
            <div key={qKey} className="p-4 border rounded-lg bg-gray-50">
              <p className="font-semibold text-lg mb-3">{qIdx + 1}. {q.questionText}</p>
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                  <label 
                    key={optIdx} 
                    className={`flex items-center p-3 rounded border cursor-pointer ${
                      selectedOption === optIdx ? 'bg-blue-100 border-blue-500 font-medium' : 'bg-white'
                    } ${isSubmitted ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name={`q-${qKey}`}
                      disabled={isSubmitted} 
                      checked={selectedOption === optIdx}
                      onChange={() => setUserAnswers(prev => ({ ...prev, [qKey]: optIdx }))}
                      className="mr-3"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!isSubmitted && (
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleManualSubmit}
            className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow transition"
          >
            Submit Test
          </button>
        </div>
      )}
    </div>
  );
}