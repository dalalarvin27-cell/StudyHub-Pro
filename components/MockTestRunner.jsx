import React, { useState, useEffect, useRef } from 'react';

export default function MockTestRunner({ quizData, onTestComplete }) {
  const durationInSeconds = (quizData?.duration || 10) * 60;
  const [timeLeft, setTimeLeft] = useState(durationInSeconds);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  
  const timerRef = useRef(null);

  // 1. Countdown Timer Logic
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

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleOptionSelect = (questionId, optionIndex) => {
    if (isSubmitted) return; // Prevent changing answers after submit
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Calculate Result Logic
  const processSubmission = (answers) => {
    let correctCount = 0;
    const totalQuestions = quizData.questions.length;

    quizData.questions.forEach((q, idx) => {
      const selectedOption = answers[q.questionId || idx];
      if (selectedOption !== undefined && String(selectedOption) === String(q.correctAnswer)) {
        correctCount++;
      }
    });

    const calculatedScore = {
      score: correctCount,
      total: totalQuestions,
      percentage: Math.round((correctCount / totalQuestions) * 100)
    };

    setScoreResult(calculatedScore);
    setIsSubmitted(true);

    if (onTestComplete) {
      onTestComplete(calculatedScore);
    }
  };

  // 2. Auto-submit on 00:00
  const handleAutoSubmit = () => {
    processSubmission(userAnswers);
  };

  // 3. Manual Submit with Confirmation
  const handleManualSubmit = () => {
    const confirmed = window.confirm("Are you sure you want to submit the test?");
    if (confirmed) {
      if (timerRef.current) clearInterval(timerRef.current);
      processSubmission(userAnswers);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg">
      
      {/* Top Header & Sticky Mobile-Friendly Timer */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">{quizData.sourceFile}</h2>
          <div className="text-xs sm:text-sm text-gray-500 capitalize">
            Difficulty: <span className="font-semibold text-blue-600">{quizData.difficulty}</span> | 
            Total Questions: {quizData.questions.length}
          </div>
        </div>

        {/* Countdown Timer Badge */}
        <div className={`px-4 py-2 rounded-lg font-mono text-lg sm:text-xl font-bold flex items-center gap-2 ${
          timeLeft < 120 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-700'
        }`}>
          <span>⏱️</span>
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Submitted Result Summary Banner */}
      {isSubmitted && scoreResult && (
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-2">Test Submitted Successfully!</h3>
          <p className="text-lg font-medium text-green-700">
            Your Score: {scoreResult.score} / {scoreResult.total} ({scoreResult.percentage}%)
          </p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {quizData.questions.map((q, qIdx) => {
          const qKey = q.questionId || qIdx;
          const selectedOption = userAnswers[qKey];

          return (
            <div key={qKey} className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold text-base sm:text-lg mb-3">
                {qIdx + 1}. {q.questionText}
              </h3>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                  <label 
                    key={optIdx}
                    className={`flex items-center p-3 rounded-md border cursor-pointer transition ${
                      selectedOption === optIdx 
                        ? 'bg-blue-100 border-blue-500 font-medium' 
                        : 'bg-white border-gray-200 hover:bg-gray-100'
                    } ${isSubmitted ? 'cursor-not-allowed opacity-80' : ''}`}
                  >
                    <input 
                      type="radio"
                      name={`question-${qKey}`}
                      disabled={isSubmitted} // Lock options when submitted
                      checked={selectedOption === optIdx}
                      onChange={() => handleOptionSelect(qKey, optIdx)}
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

      {/* Manual Submit Button Footer */}
      {!isSubmitted && (
        <div className="mt-8 pt-4 border-t flex justify-end">
          <button
            onClick={handleManualSubmit}
            className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition"
          >
            Submit Test
          </button>
        </div>
      )}
    </div>
  );
}