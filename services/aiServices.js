/**
 * EduVault Modular AI Service Provider
 * Supports OpenAI, Gemini, or fallback local generator.
 */
async function callAIProvider(prompt, systemInstruction = "") {
  const provider = process.env.AI_PROVIDER || "mock";
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey || provider === "mock") {
    return null; // Triggers smart local offline generator fallback
  }

  try {
    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemInstruction || "You are EduVault AI, an expert EdTech assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }
  } catch (err) {
    console.error("AI Service Provider Error:", err.message);
    return null;
  }
}

module.exports = { callAIProvider };