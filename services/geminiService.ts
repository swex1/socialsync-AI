import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CampaignData, GeneratedPost, Platform, Tone, ImageSize, AspectRatio } from "../types";

// Helper to get AI instance (always fresh to pick up potential key changes)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    linkedin: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "Long-form professional post content" },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
        imagePrompt: { type: Type.STRING, description: "A detailed prompt to generate an image for this post" }
      },
      required: ["content", "hashtags", "imagePrompt"]
    },
    twitter: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "Short, punchy post under 280 chars" },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
        imagePrompt: { type: Type.STRING }
      },
      required: ["content", "hashtags", "imagePrompt"]
    },
    instagram: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "Visual-focused caption with engaging hook" },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
        imagePrompt: { type: Type.STRING }
      },
      required: ["content", "hashtags", "imagePrompt"]
    }
  },
  required: ["linkedin", "twitter", "instagram"]
};

export const generateCampaignText = async (idea: string, tone: Tone): Promise<Omit<CampaignData, 'linkedin.imageUrl' | 'twitter.imageUrl' | 'instagram.imageUrl'>> => {
  const ai = getAI();
  const prompt = `
    Create a social media content campaign for the following idea: "${idea}".
    Tone: ${tone}.
    
    1. LinkedIn: Professional, insightful, long-form.
    2. Twitter/X: Short, punchy, engaging, under 280 characters.
    3. Instagram: Casual, visual-focused, engaging hook.
    
    Also provide a creative image generation prompt for each that suits the platform's aesthetic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: "You are an expert social media manager and content creator."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from model");
    
    const data = JSON.parse(text);

    return {
      linkedin: { ...data.linkedin, platform: Platform.LINKEDIN, aspectRatio: '4:3' }, // Professional standard
      twitter: { ...data.twitter, platform: Platform.TWITTER, aspectRatio: '16:9' }, // Wide for feed
      instagram: { ...data.instagram, platform: Platform.INSTAGRAM, aspectRatio: '1:1' } // Square for feed
    };

  } catch (error) {
    console.error("Text generation failed:", error);
    throw error;
  }
};

export const generateImage = async (
  prompt: string, 
  aspectRatio: AspectRatio, 
  size: ImageSize = ImageSize.SIZE_1K
): Promise<string> => {
  const ai = getAI();
  
  // Checking for High Quality needs (2K/4K) or specific aspect ratio needs
  const model = 'gemini-3-pro-image-preview'; 

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const generateVideo = async (
  imageUrl: string, 
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
  const ai = getAI();
  
  // Extract base64 data from Data URL
  const base64Data = imageUrl.split(',')[1];
  const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "Animate this image cinematically",
      image: {
        imageBytes: base64Data,
        mimeType: mimeType
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p', // Current limitation of preview usually
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video URI not found in response");

    // Fetch the actual video bytes using the API key
    const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) throw new Error("Failed to download video bytes");
    
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};

export const checkApiKeySelection = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return true; // Fallback if not in that specific environment, assume env var is enough
};

export const requestApiKeySelection = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  } else {
    alert("Please configure your API key in the environment.");
  }
};
