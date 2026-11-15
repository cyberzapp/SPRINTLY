import { GoogleGenAI } from "@google/genai";

/**
 * Exclusively initializes Google Cloud Vertex AI client.
 * Connects to Google Cloud Project (sprintly-si) in the designated location.
 */
export function getVertexAIClient(customApiKey?: string) {
  const project =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "sprintly-si";

  const location =
    process.env.GOOGLE_CLOUD_LOCATION ||
    process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION ||
    "us-central1";

  const apiKey =
    customApiKey ||
    process.env.VERTEX_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  return new GoogleGenAI({
    vertexai: true,
    project,
    location,
    ...(apiKey ? { apiKey } : {}),
  });
}

// Retain alias for backwards compatibility
export const getGeminiClient = getVertexAIClient;
