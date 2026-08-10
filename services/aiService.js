async function callAIProvider(prompt, systemInstruction = "") {
  const provider = process.env.AI_PROVIDER || "mock";
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || provider === "mock") return null;
  try {
    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          messages: [{ role: "system", content: systemInstruction || "You are EduVault AI." }, { role: "user", content: prompt }],
          temperature: 0.7
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }
  } catch (err) {
    return null;
  }
}
module.exports = { callAIProvider };
