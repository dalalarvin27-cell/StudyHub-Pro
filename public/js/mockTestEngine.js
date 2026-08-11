// public/js/mockTestEngine.js

let timerInterval = null;
let currentTestDuration = 10; // default minutes
let timeRemaining = 600;      // seconds

function initMockTestTimer(durationInMinutes) {
  currentTestDuration = durationInMinutes || 10;
  timeRemaining = currentTestDuration * 60;
  
  const timerElement = document.getElementById("timerDisplay");
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      if (timerElement) timerElement.innerText = "00:00";
      autoSubmitTest();
    } else {
      timeRemaining--;
      if (timerElement) {
        const mins = Math.floor(timeRemaining / 60);
        const secs = timeRemaining % 60;
        timerElement.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    }
  }, 1000);
}

function autoSubmitTest() {
  alert("Time is up! Your test is submitting automatically.");
  submitTestProcess();
}

function manualSubmitTest() {
  const confirmed = confirm("Are you sure you want to submit the test?");
  if (confirmed) {
    if (timerInterval) clearInterval(timerInterval);
    submitTestProcess();
  }
}

function submitTestProcess() {
  // Lock all radio inputs
  const inputs = document.querySelectorAll('input[type="radio"]');
  inputs.forEach(input => input.disabled = true);

  // Hide submit button
  const submitBtn = document.getElementById("submitTestBtn");
  if (submitBtn) submitBtn.style.display = "none";

  console.log("Mock test submitted successfully.");
}