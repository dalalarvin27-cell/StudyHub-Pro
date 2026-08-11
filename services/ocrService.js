const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");

// List of PDF internal syntax patterns to detect and scrub
const PDF_SYNTAX_PATTERNS = [
  /\/Parent\s+\d+\s+\d+\s+R/gi,
  /\/Resources\b/gi,
  /\/Font\b/gi,
  /\/ProcSet\b/gi,
  /\/Image[BCI]\b/gi,
  /\/Producer\b/gi,
  /\/CreationDate\b/gi,
  /\/ModDate\b/gi,
  /\/MediaBox\b/gi,
  /\/CropBox\b/gi,
  /\/Type\s*\/[A-Za-z0-9]+/gi,
  /\/Catalog\b/gi,
  /\/Pages\s+\d+\s+\d+\s+R/gi,
  /\b\d+\s+\d+\s+obj\b/gi,
  /\bendobj\b/gi,
  /\bstream\b/gi,
  /\bendstream\b/gi,
  /\bASCII85Decode\b/gi,
  /\bFlateDecode\b/gi,
  /\/Filter\s*\/[A-Za-z0-9]+/gi,
  /\/Length\s+\d+/gi
];

/**
 * Validates whether extracted text is meaningful or mostly PDF syntax/garbage.
 */
function isGarbageText(text) {
  if (!text || typeof text !== "string") return true;
  const trimmed = text.trim();
  if (trimmed.length < 30) return true;

  let syntaxMatches = 0;
  for (const pattern of PDF_SYNTAX_PATTERNS) {
    const matches = trimmed.match(pattern);
    if (matches) {
      syntaxMatches += matches.length;
    }
  }

  const words = trimmed.split(/\s+/);
  if (syntaxMatches >= 3 || (words.length > 0 && syntaxMatches / words.length > 0.05)) {
    return true;
  }

  return false;
}

/**
 * Cleans and normalizes extracted text, stripping PDF internal garbage.
 */
function cleanExtractedText(rawText) {
  if (!rawText) return "";

  let clean = rawText;

  for (const pattern of PDF_SYNTAX_PATTERNS) {
    clean = clean.replace(pattern, " ");
  }

  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ");
  clean = clean.replace(/[ \t]+/g, " ");
  clean = clean.replace(/\n\s*\n/g, "\n\n");
  return clean.trim();
}

/**
 * Main Document Text Extractor
 */
async function extractTextFromFile(filePath, mimeType, originalName = "") {
  const ext = path.extname(filePath).toLowerCase();
  const isPdf = mimeType === "application/pdf" || ext === ".pdf";

  console.log(`[QUIZ] File received: ${originalName || path.basename(filePath)}`);
  console.log(`[QUIZ] File type: ${isPdf ? "application/pdf" : mimeType || ext}`);

  let rawText = "";
  let ocrRequired = false;

  if (isPdf) {
    console.log("[QUIZ] Extracting PDF text using pdf-parse...");
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text || "";

      console.log(`[QUIZ] Extracted characters: ${rawText.length}`);

      if (rawText.trim().length < 50) {
        console.log("[QUIZ] OCR required: true (Scanned PDF with minimal text stream)");
        ocrRequired = true;
      } else {
        console.log("[QUIZ] OCR required: false");
      }
    } catch (err) {
      console.error("[QUIZ] PDF parsing error:", err.message);
      ocrRequired = true;
    }
  } else {
    console.log("[QUIZ] OCR required: true (Image file)");
    ocrRequired = true;
  }

  if (ocrRequired && !isPdf) {
    console.log("[QUIZ] Running Tesseract OCR on image...");
    try {
      const result = await Tesseract.recognize(filePath, "eng", { logger: () => {} });
      rawText = result.data.text || "";
      console.log(`[QUIZ] OCR Extracted characters: ${rawText.length}`);
    } catch (ocrErr) {
      console.error("[QUIZ] OCR Error:", ocrErr.message);
      rawText = "";
    }
  }

  const cleanText = cleanExtractedText(rawText);
  console.log(`[QUIZ] Clean text characters: ${cleanText.length}`);

  if (isGarbageText(cleanText)) {
    console.log("[QUIZ] Validation failed: Text is empty, too short, or dominated by PDF syntax.");
    return {
      success: false,
      cleanText: "",
      error: "Could not read meaningful text from this document. Please upload a clearer PDF/image."
    };
  }

  return {
    success: true,
    cleanText,
    charCount: cleanText.length,
    ocrRequired
  };
}

module.exports = {
  extractTextFromFile,
  cleanExtractedText,
  isGarbageText
};