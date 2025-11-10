import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { PetProfile, ChatMessage } from '../types';

// FIX: The API key must be obtained from process.env.API_KEY as per the coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateRoutine = async (petDetails: { age: string; breed: string; weight: string }): Promise<GenerateContentResponse> => {
  const prompt = `Generate a custom daily pet schedule for a ${petDetails.breed} that is ${petDetails.age} old and weighs ${petDetails.weight}. The schedule should include feeding, water, walk, medicine, and sleep times.`;

  return await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, description: 'Time of the activity (e.g., 8:00 AM)' },
            activity: { type: Type.STRING, description: 'Name of the activity (e.g., Breakfast)' },
            details: { type: Type.STRING, description: 'Details about the activity' },
            icon: { type: Type.STRING, description: 'An icon name from: food, water, walk, medicine, sleep' }
          },
          required: ['time', 'activity', 'details', 'icon']
        }
      }
    }
  });
};

export const analyzePetHealth = async (imageBase64: string, mimeType: string, species: 'Dog' | 'Cat'): Promise<GenerateContentResponse> => {
    const prompt = `Analyze this ${species}'s photo. Focus on the skin, eyes, and fur for any potential issues. Provide a health score from 0 to 100, a status ('Normal', 'Caution', or 'Alert'), a brief analysis of your findings, and a short list of simple, actionable recommendations for the owner.`;
    
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };
  
    return await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER, description: 'A health score from 0-100.' },
                status: { type: Type.STRING, description: 'Health status: Normal, Caution, or Alert.' },
                analysis: { type: Type.STRING, description: 'A brief analysis of findings.' },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of actionable recommendations.'}
            },
            required: ['score', 'status', 'analysis', 'recommendations']
        }
      }
    });
};

export const simplifyText = async (textToSimplify: string): Promise<GenerateContentResponse> => {
    const prompt = `Explain the following text in simple, easy-to-understand terms for a pet owner. Keep it concise and avoid technical jargon. Text: "${textToSimplify}"`;
    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
};

export const getPetAdvice = async (symptoms: string, history: ChatMessage[], pet: PetProfile): Promise<GenerateContentResponse> => {
    const systemInstruction = `You are PetPal Lite Assistant, a friendly and helpful AI for dog and cat owners. Your answers should be concise, kind, and helpful. Use the provided pet profile to tailor your answers. 
    The user's pet is ${pet.name}, a ${pet.age} ${pet.species} (${pet.breed}) that weighs ${pet.weight}.
    Avoid giving medical prescriptions or diagnoses. For any serious or concerning symptoms, you MUST advise an immediate vet visit. 
    When giving advice, try to include a short, actionable checklist. If you're unsure about something, say so and recommend consulting a professional vet.
    This is not a substitute for professional veterinary care.`;

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history,
    });
    return await chat.sendMessage({ message: symptoms });
};

export const findNearbyVets = async (lat: number, lon: number): Promise<GenerateContentResponse> => {
    const prompt = 'Find the top 3 highest-rated veterinarians near my location.';

    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: lat,
                        longitude: lon
                    }
                }
            }
        }
    });
};
