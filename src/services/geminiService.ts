import { GoogleGenAI, Type, Modality } from "@google/genai";
import { FootprintData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ... existing functions ...

export async function getEcoVoiceResponse(message: string) {
  const model = "gemini-2.5-flash-preview-tts";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: `You are EcoQuest Voice Coach. Respond to this in a warm, encouraging, and brief way (under 30 words): "${message}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Error in Eco Voice Coach:", error);
    return null;
  }
}

export async function getEcoRecommendations(footprint: FootprintData) {
  const model = "gemini-3-flash-preview";
  const prompt = `As EcoQuest, an intelligent environmental impact guide, analyze this carbon footprint data (kg CO2/month):
  Transportation: ${footprint.transportation}
  Energy: ${footprint.energy}
  Diet: ${footprint.diet}
  Waste: ${footprint.waste}
  Shopping: ${footprint.shopping}

  Provide 3 personalized, actionable recommendations to reduce this footprint. 
  Include:
  1. The action title
  2. A brief explanation of why it helps
  3. Estimated monthly CO2 reduction
  4. Estimated monthly financial savings

  Format the response as a JSON array of objects with keys: title, explanation, co2Reduction, financialSavings.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    return [];
  }
}

export async function getEcoFact() {
  const model = "gemini-3-flash-preview";
  const prompt = "Provide a single, bite-sized, surprising environmental fact or sustainability tip. Keep it under 20 words.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Recycling one aluminum can saves enough energy to run a TV for three hours.";
  } catch (error) {
    console.error("Error getting AI fact:", error);
    return "Small changes lead to big impacts!";
  }
}

export async function scanReceipt(base64Image: string, mimeType: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `Analyze this receipt or utility bill. Extract the items or services and estimate their environmental impact (CO2 footprint in kg) and cost. 
  Categorize them into: transportation, energy, diet, waste, or shopping.
  Return a JSON object with:
  - totalCost: number
  - totalImpact: number
  - categories: { transportation: number, energy: number, diet: number, waste: number, shopping: number }
  - items: Array<{ name: string, cost: number, impact: number, category: string }>
  
  Be realistic with estimates based on common carbon footprint data.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw error;
  }
}

export async function chatWithEcoAI(message: string, history: any[]) {
  const model = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: "You are EcoQuest AI, a sustainability expert. Use Google Search to provide accurate, localized advice on recycling, eco-friendly products, and sustainable living. Be helpful, encouraging, and data-driven." }] },
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Error in Eco Chat:", error);
    return "I'm having trouble connecting to my knowledge base right now.";
  }
}
