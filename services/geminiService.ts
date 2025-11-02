import { GoogleGenAI, Type } from "@google/genai";
import { LocationData } from "../types";

// The API key must be obtained from the environment variable `process.env.API_KEY`.
// This is automatically provided by the execution environment.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY is not defined. Please ensure it is configured in the environment settings.");
}

const ai = new GoogleGenAI({ apiKey });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    city: { type: Type.STRING },
    country: { type: Type.STRING },
    lat: { type: Type.NUMBER },
    lng: { type: Type.NUMBER },
    aqi: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    pollutants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          concentration: { type: Type.NUMBER },
          unit: { type: Type.STRING },
        },
        required: ["name", "concentration", "unit"],
      },
    },
    healthAdvisory: {
        type: Type.ARRAY,
        items: {
            type: Type.STRING,
        },
        description: "A list of 2-4 concise, actionable health recommendations based on the current air quality.",
    },
  },
  required: ["city", "country", "lat", "lng", "aqi", "summary", "pollutants", "healthAdvisory"],
};

export const getAqiDataForLocation = async (location: string): Promise<LocationData> => {
  const prompt = `Get the current Air Quality Index (AQI) and related data for ${location}. Provide the city name, country, latitude, longitude, overall AQI value (US EPA standard), a brief summary of the air quality, a list of primary pollutants with their concentration and units (e.g., µg/m³), and a bulleted list of 2-4 concise, actionable health recommendations (healthAdvisory) based on the AQI and pollutants.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    
    if (
      !data.city ||
      !data.country ||
      typeof data.lat !== 'number' ||
      typeof data.lng !== 'number' ||
      typeof data.aqi !== 'number' ||
      !Array.isArray(data.healthAdvisory)
    ) {
      throw new Error("Invalid data structure received from API.");
    }
    
    return data as LocationData;
  } catch (error) {
    console.error("Error fetching AQI data from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch air quality data for "${location}". Reason: ${error.message}`);
    }
    throw new Error(`An unknown error occurred while fetching air quality data for "${location}".`);
  }
};

export const getAqiDataForCoordinates = async (lat: number, lon: number): Promise<LocationData> => {
    const prompt = `Get the current Air Quality Index (AQI) and related data for the location at latitude ${lat} and longitude ${lon}. Provide the city name, country, latitude, longitude, overall AQI value (US EPA standard), a brief summary of the air quality, a list of primary pollutants with their concentration and units (e.g., µg/m³), and a bulleted list of 2-4 concise, actionable health recommendations (healthAdvisory) based on the AQI and pollutants.`;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });
  
      const jsonText = response.text.trim();
      const data = JSON.parse(jsonText);
      
      if (
        !data.city ||
        !data.country ||
        typeof data.lat !== 'number' ||
        typeof data.lng !== 'number' ||
        typeof data.aqi !== 'number' ||
        !Array.isArray(data.healthAdvisory)
      ) {
        throw new Error("Invalid data structure received from API.");
      }
      
      return data as LocationData;
    } catch (error) {
      console.error("Error fetching AQI data from Gemini API:", error);
      if (error instanceof Error) {
          throw new Error(`Failed to fetch air quality data for your location. Reason: ${error.message}`);
      }
      throw new Error(`An unknown error occurred while fetching air quality data for your location.`);
    }
  };