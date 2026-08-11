useEffect(() => {
  const loadQuiz = async () => {
    // 1. Check if quiz state was passed via React Router navigation
    if (location.state && location.state.quizData) {
      setQuiz(location.state.quizData);
      setLoading(false);
      return;
    }

    // 2. Fallback to LocalStorage
    const cachedQuiz = localStorage.getItem("currentQuiz");
    if (cachedQuiz) {
      try {
        const parsed = JSON.parse(cachedQuiz);
        if (parsed.testId === testId || parsed._id === testId) {
          setQuiz(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing cached quiz:", e);
      }
    }

    // 3. Fallback to API call if direct page refresh occurs
    try {
      const res = await axios.get(`/api/quiz/${testId}`);
      if (res.data && res.data.success) {
        setQuiz(res.data.data);
      } else {
        setError("Mock test not found.");
      }
    } catch (err) {
      setError("Mock test not found.");
    } finally {
      setLoading(false);
    }
  };

  loadQuiz();
}, [testId]);