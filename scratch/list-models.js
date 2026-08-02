const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("your_google")) {
    console.error("Gemini API key is not configured.");
    process.exit(1);
  }

  try {
    // Note: The standard listModels is accessed via the GenerativeLanguageClient or a fetch call.
    // Let's do a direct fetch call to Google's model list endpoint using the API key!
    // Endpoint: https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Fetch error: ${res.statusText}`);
    }
    const data = await res.json();
    console.log("Available Gemini Models:");
    data.models.forEach((m) => {
      console.log(`- ${m.name} (${m.displayName}) -> Supported actions: ${m.supportedGenerationMethods.join(", ")}`);
    });
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

run();
