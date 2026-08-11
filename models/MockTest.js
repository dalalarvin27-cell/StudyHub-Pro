// public/js/mockTestEngine.js

/**
 * Global Start/Launch Custom Mock Test Handler
 */
window.startTest = function(testDataOrId) {
  try {
    console.log("[QUIZ ENGINE] Launching test...", testDataOrId);

    let testId = null;
    let quizObject = null;

    if (typeof testDataOrId === 'string') {
      testId = testDataOrId;
    } else if (typeof testDataOrId === 'object' && testDataOrId !== null) {
      quizObject = testDataOrId;
      testId = testDataOrId.testId || testDataOrId._id || testDataOrId.id;
    }

    // Fallback: Read from LocalStorage if object wasn't passed directly
    if (!quizObject) {
      const stored = localStorage.getItem("currentQuiz");
      if (stored) {
        try { quizObject = JSON.parse(stored); } catch(e){}
      }
    }

    if (quizObject) {
      localStorage.setItem("currentQuiz", JSON.stringify(quizObject));
      sessionStorage.setItem("currentQuiz", JSON.stringify(quizObject));
    }

    if (!testId && quizObject) {
      testId = quizObject.testId || quizObject._id;
    }

    if (!testId) {
      alert("Unable to launch test. Test ID is missing.");
      return;
    }

    // Redirect to mock tests page with testId
    window.location.href = `/mock-tests.html?id=${testId}`;

  } catch (error) {
    console.error("[QUIZ ENGINE ERROR] startTest failed:", error);
    alert("Error launching test series. Please try again.");
  }
};

/**
 * Custom Test Generation & Auto-Launch Handler
 */
window.generateAndLaunchCustomTest = async function(formData) {
  try {
    // Clear old state before generating fresh quiz
    localStorage.removeItem("currentQuiz");
    sessionStorage.removeItem("currentQuiz");

    const response = await fetch("/api/mock-tests/generate", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result && result.success) {
      const quizData = result.data || result.quiz;
      localStorage.setItem("currentQuiz", JSON.stringify(quizData));
      
      // Call global startTest safely
      window.startTest(quizData);
    } else {
      alert(result.message || "Unable to generate a new quiz. Please try again.");
    }
  } catch (err) {
    console.error("[GENERATION ERROR]:", err);
    alert("Unable to generate a new quiz from this document. Please try again.");
  }
};