const handleGenerateAndLaunch = async () => {
  setLoading(true);
  setError("");

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("difficulty", difficulty); // e.g. "hard"
    formData.append("duration", duration);     // e.g. 10

    const response = await axios.post("/api/quiz/generate", formData);

    if (response.data && response.data.success) {
      // Safely extract quiz data
      const quizData = response.data.data || response.data.quiz || response.data;
      
      // Safely extract test ID (checks all common object key patterns)
      const targetTestId = quizData.testId || quizData._id || quizData.quizId;

      if (!targetTestId) {
        throw new Error("Invalid test ID received from server.");
      }

      // Store fresh session
      localStorage.setItem("currentQuiz", JSON.stringify(quizData));
      sessionStorage.setItem("currentQuiz", JSON.stringify(quizData));

      // Navigate to the test runner page
      navigate(`/mock-test/${targetTestId}`, { state: { quizData } });
    } else {
      setError(response.data.message || "Unable to generate test. Please try again.");
    }
  } catch (err) {
    console.error("Generation error:", err);
    setError(err.response?.data?.message || "Mock test not found or failed to generate.");
  } finally {
    setLoading(false);
  }
};