/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Purpose: Interactive, gamified, and AI-assisted learning for high school students.
  Module: Generative AI Orchestration Service
*/

import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, TutorMode, IntentType, Language, Exam, ExamQuestion } from "../types.ts";

export const geminiService = {
  getAI: () => new GoogleGenAI({ apiKey: process.env.API_KEY }),

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
      'Exploration': 'Provide deep conceptual intuition and clear academic examples. Maintain a formal, exploratory tone.',
      'Deep Study': 'Focus on mathematical rigor, structural logic, and first principles. Be exhaustive and precise.',
      'Exam Prep': 'Be concise and direct. Focus on high-yield patterns relevant to the Ethiopian National Exam standards.',
      'Rapid Revision': 'Provide high-level summaries and precise bullet points. Avoid unnecessary elaboration.',
      'Recovery': 'Break down concepts into foundational components. Use clear, accessible academic language to rebuild confidence.'
    };

    const modeInstructions = {
      'Teach': 'Focus on structured, step-by-step academic pedagogy. Use Socratic methods to lead the student to their own conclusions. Avoid casual language or emojis.',
      'Practice': 'Present one specific conceptual problem. Do not provide immediate solutions. Evaluate the student response against rigorous curriculum standards.',
      'Exam': 'Act as a formal institutional proctor. Be precise, strict, and purely instructional. Minimal conversational elements.'
    };

    const langInstruction = lang === 'am' ? 'Explain primarily in formal Amharic (Ethiopic script), retaining technical scientific nomenclature in English. Maintain a professional educational tone.' : 'Use formal academic English.';

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
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are The Instructor at Luwa Academy, a prestigious educational platform for Grade 11-12 Ethiopian scholars (${stream} stream). 
        
        TONE: Calm, professional, and institutionally authoritative. Do not use casual language, slang, or emojis. 
        
        KNOWLEDGE: You have deep mastery of the Ethiopian National Curriculum. Align strictly with textbook definitions and EUEE (Ethiopian University Entrance Examination) standards.
        
        LANGUAGE: ${langInstruction}
        
        Current Mode: ${mode}. ${modeInstructions[mode]}
        Current Scholar Intent: ${intent || 'General Mastery'}. ${intent ? intentModifiers[intent] : ''}
        
        IDENTITY: Luwa Academy Assistant. Built by Shewit. Always refer to the user as a "scholar".`,
      }
    });
  },

  async generateQuiz(topic: string, stream: string, intent?: IntentType, difficulty: number = 3): Promise<Quiz> {
    const ai = this.getAI();
    const difficultyLevel = difficulty === 1 ? 'Foundational' : difficulty === 5 ? 'High-Level EUEE Mastery' : 'Standard Curriculum';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a 5-question multiple choice formal diagnostic for a Grade 12 scholar (${stream} stream) based on Ethiopian National Textbooks for: ${topic}. 
      LEVEL: ${difficultyLevel}.
      Tone: Institutional. Format: Professional JSON.`,
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
      contents: `Parse raw institutional exam text into a formal JSON structure. Categorize by difficulty and curriculum section.
      RAW TEXT: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            topic: { type: Type.STRING },
            totalMarks: { type: Type.NUMBER },
            durationMinutes: { type: Type.NUMBER },
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
          },
          required: ["title", "subject", "questions"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  async getExamHint(question: string, subject: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Question: ${question}. Subject: ${subject}. 
      Provide a formal conceptual hint to scaffold reasoning without giving the final answer.`,
    });
    return response.text || "Hint unavailable. Trust your neural training.";
  },

  async generateChapterSummary(chapter: string, subject: string): Promise<{summary: string, formulas: string[], keyPoints: string[]}> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Synthesize a formal academic summary for Chapter: ${chapter} in Subject: ${subject}. Format: JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "formulas", "keyPoints"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  async generateVideo(topic: string, subject: string, grade: string): Promise<string> {
    const ai = this.getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A formal, minimalist academic animation visualizing ${topic} for Grade ${grade} ${subject}. Style: Clean motion graphics, professional educational quality.`,
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
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  async auditPerformance(history: any[]): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a formal institutional academic audit of scholar session history: ${JSON.stringify(history)}. 
      Provide a data-driven strategic roadmap for EUEE mastery. Tone: Calm, professional, authoritative.`,
    });
    return response.text || "Audit cycle failed.";
  }
};