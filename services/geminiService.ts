
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Generative AI Orchestration Service
*/

import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, TutorMode, IntentType, Language, Exam } from "../types.ts";

export const geminiService = {
  /**
   * Initializes a fresh AI instance. 
   * RELIANCE: Must use process.env.API_KEY exclusively.
   */
  getAI: () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("AUTH_KEY_MISSING");
    }
    // Create a new instance every time to ensure we pick up the most recent key from the environment/dialog
    return new GoogleGenAI({ apiKey });
  },

  async streamTutorResponse(
    prompt: string, 
    stream: string, 
    mode: TutorMode, 
    history: {role: string, content: string, image?: {data: string, mimeType: string}}[],
    intent?: IntentType,
    lang: Language = 'en'
  ) {
    const ai = this.getAI();
    const langInstruction = lang === 'am' ? 'Respond in formal Amharic (Ethiopic script), keeping scientific terms in English.' : 'Use formal academic English.';

    const contents = history.map(h => {
      const parts: any[] = [{ text: h.content }];
      if (h.image) {
        parts.push({
          inlineData: {
            data: h.image.data,
            mimeType: h.image.mimeType
          }
        });
      }
      return { role: h.role === 'user' ? 'user' : 'model', parts };
    });

    return await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: `You are The Instructor at Luwa Academy for Grade 11-12 Ethiopian scholars (${stream} stream). 
        TONE: Professional, authoritative, yet encouraging. 
        LANGUAGE: ${langInstruction}
        MODE: ${mode}.
        INTENT: ${intent || 'General Mastery'}.
        Always refer to the user as "scholar".`,
      }
    });
  },

  async generateQuiz(topic: string, stream: string, intent?: IntentType, difficulty: number = 3): Promise<Quiz> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a 5-question multiple choice formal diagnostic for a Grade 12 scholar (${stream} stream) based on Ethiopian National Textbooks for: ${topic}. Difficulty: ${difficulty}/5.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  conceptTag: { type: Type.STRING }
                },
                required: ["question", "options", "correctIndex", "explanation", "conceptTag"]
              }
            }
          },
          required: ["topic", "questions"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  async generateVideo(topic: string, subject: string, grade: string): Promise<string> {
    const ai = this.getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `High-fidelity academic animation for ${grade} ${subject}: ${topic}.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("SYNTHESIS_FAILED");
    return `${downloadLink}&key=${process.env.API_KEY}`;
  },

  async auditPerformance(history: any[]): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Audit scholar performance: ${JSON.stringify(history)}`,
    });
    return response.text || "Audit failed.";
  },

  async getExamHint(question: string, subject: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Subtle hint for: "${question}" in ${subject}. No answers.`,
    });
    return response.text || "Hint unavailable.";
  },

  async parseExamRawText(text: string): Promise<Partial<Exam>> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse into Exam JSON: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  marks: { type: Type.NUMBER },
                  section: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }
};
