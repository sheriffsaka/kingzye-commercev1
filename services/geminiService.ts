import { GoogleGenAI } from "@google/genai";
import { MOCK_PRODUCTS } from "../constants";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client && process.env.API_KEY) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const getGeminiResponse = async (userPrompt: string): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "AI Assistant is currently offline. Please configure the API Key.";
  }

  // Create a context-aware system instruction
  const productContext = MOCK_PRODUCTS.map(p => 
    `${p.name} (${p.category}): ₦${p.price}, Requires Script: ${p.requiresPrescription}`
  ).join('\n');

  const systemInstruction = `You are PharmaBot, a helpful and professional AI assistant for Kingzy Pharmaceuticals Limited.
  You assist customers with general queries about our catalog and health advice.
  
  CURRENT PRODUCT CATALOG:
  ${productContext}
  
  RULES:
  1. Be professional, concise, and empathetic.
  2. If a user asks about a specific condition, suggest relevant products from our catalog if available.
  3. ALWAYS advise consulting a doctor for serious conditions or prescription medications.
  4. Do not make definitive medical diagnoses.
  5. If asked about prices, quote the retail price from the catalog in Naira (₦).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I am currently experiencing high traffic. Please try again later.";
  }
};