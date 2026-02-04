
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Purpose: Interactive, gamified, and AI-assisted learning for high school students.
  Module: Generative AI Orchestration Service
*/

import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, TutorMode, IntentType, Language, Exam, ExamQuestion } from "../types.ts";

export const geminiService = {
  // Use a fresh instance for every call to ensure we catch updated API keys from the browser
  getAI: () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("NEURAL_KEY_MISSING");
    }
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
    
    const intentModifiers = {
      'Exploration': 'Provide deep conceptual intuition and clear academic examples.',
      'Deep Study': 'Focus on mathematical rigor and first principles.',
      'Exam Prep': 'Be concise and focus on high-yield patterns for EUEE.',
      'Rapid Revision': 'Provide high-level summaries and bullet points.',
      'Recovery': 'Break down concepts into foundational components.'
    };

    const modeInstructions = {
      'Teach': 'Act as a structured academic instructor using Socratic methods.',
      'Practice': 'Present a specific conceptual problem and guide the student.',
      'Exam': 'Act as a formal institutional proctor. Strict and instructional.'
    };

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
        // Reduced thinking budget for faster response in flash model
        thinkingConfig: { thinkingBudget: 0 }, 
        systemInstruction: `You are The Instructor at Luwa Academy for Grade 11-12 Ethiopian scholars (${stream} stream). 
        TONE: Professional and authoritative. No slang. 
        LANGUAGE: ${langInstruction}
        MODE: ${mode}. ${modeInstructions[mode]}
        INTENT: ${intent || 'General Mastery'}. ${intent ? intentModifiers[intent] : ''}
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
              },
              minItems: 5,
              maxItems: 5
            }
          },
          required: ["topic", "questions"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  async parseExamRawText(text: string): Promise<Partial<Exam>> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse raw institutional exam text into formal JSON: ${text}`,
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
                  type: { type: Type.STRING, enum: ["MCQ", "Short", "TF"] },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  marks: { type: Type.NUMBER },
                  section: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["type", "text", "correctAnswer", "marks", "section"]
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  // Added generateVideo to fix CinematicConcepts.tsx error
  async generateVideo(topic: string, subject: string, grade: string): Promise<string> {
    const ai = this.getAI();
    const prompt = `Generate a high-fidelity academic animation for ${grade} ${subject} explaining the concept of: ${topic}. The visual should be cinematic and educational.`;
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
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

  // Added auditPerformance to fix ScholarAnalytics.tsx error
  async auditPerformance(history: any[]): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following academic quiz performance history and provide a detailed institutional audit report with a strategic roadmap for mastery: ${JSON.stringify(history)}`,
    });
    return response.text || "Audit failed to synthesize.";
  },

  // Added getExamHint to fix ExamSystem.tsx error
  async getExamHint(question: string, subject: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a subtle conceptual hint for this ${subject} question: "${question}". Do not provide the answer, only a hint to guide the scholar.`,
    });
    return response.text || "Hint unavailable.";
  }
};
