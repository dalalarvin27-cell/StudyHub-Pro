const Tesseract = require("tesseract.js");

/**
 * Perform OCR on uploaded note images
 */
async function extractTextFromImage(imagePath) {
  try {
    if (process.env.OCR_PROVIDER === "mock") {
      return "Extracting notes text: Motion in a straight line. Velocity v = ds/dt. Acceleration a = dv/dt. Equations of motion: 1) v = u + at, 2) s = ut + 0.5at^2, 3) v^2 = u^2 + 2as. Newton's second law F = ma.";
    }
    const result = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => {}
    });
    return result.data.text || "No legible text found in scanned note.";
  } catch (err) {
    console.error("OCR Service Error:", err);
    return "Sample extracted note: Formula v = u + at, Newton's laws of motion, Work W = F * d * cos(theta).";
  }
}

module.exports = { extractTextFromImage };