/*
  Module: Generative AI Orchestration Service
  Purpose: Orchestrates calls to Gemini models for streaming tutoring, quiz generation, and multimedia synthesis.
*/

import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, TutorMode, QuizResult, IntentType } from "../types";

export const geminiService = {
  getAI: () => new GoogleGenAI({ apiKey: process.env.API_KEY }),

  async streamTutorResponse(
    prompt: string, 
    stream: string, 
    mode: TutorMode, 
    history: {role: string, content: string, image?: {data: string, mimeType: string}}[],
    intent?: IntentType
  ) {
    const ai = this.getAI();
    
    const intentModifiers = {
      'Exploration': 'Provide deep intuition, real-world examples, and historical context. Be discursive and encouraging of curiosity.',
      'Deep Study': 'Focus on rigorous first principles, mathematical derivations, and structural logic. Leave no conceptual stone unturned.',
      'Exam Prep': 'Be concise, formula-driven, and focus on EUEE question patterns and scoring traps. Maximize efficiency.',
      'Rapid Revision': 'Give high-yield summaries and memory triggers (mnemonics). Minimal fluff.',
      'Recovery': 'Use simplified language, build confidence slowly, and focus on foundational prerequisites before complexity.'
    };

    const modeInstructions = {
      'Teach': 'Focus on step-by-step rigorous academic explanations and Socratic questioning. Help the student derive the answer themselves. Use formal, professional academic language.',
      'Practice': 'Generate one specific problem at a time. Do not provide the solution immediately. Wait for user input. Evaluate rigorously based on EUEE benchmarks.',
      'Exam': 'Provide direct, strict, and time-conscious responses. Act like a formal Grade 12 EUEE invigilator. Minimal dialogue; focus on scoring and precision.'
    };

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
      return { 
        role: h.role === 'user' ? 'user' : 'model', 
        parts 
      };
    });

    return await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are The Instructor at Luwa Academy for Grade 12 Ethiopian scholars (${stream} stream). 
        Current Mode: ${mode}. ${modeInstructions[mode]}
        Current Scholar Intent: ${intent || 'General Mastery'}. ${intent ? intentModifiers[intent] : ''}
        Your objective is conceptual mastery for the EUEE. 
        Identity Traits: Calm, authoritative, formal, respectful, and academically precise.
        Avoid motivational slang; use institutional feedback (e.g., "Logic verified," "Correction required").`,
      }
    });
  },

  async generateQuiz(topic: string, stream: string, intent?: IntentType): Promise<Quiz> {
    const ai = this.getAI();
    
    const quizIntentPrompt = intent === 'Exam Prep' 
      ? "Focus on high-pressure, complex EUEE style questions." 
      : intent === 'Recovery' 
      ? "Focus on core foundational concepts with clear, encouraging neural breakdowns." 
      : "Ensure broad conceptual coverage.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a rigorous 5-question multiple choice diagnostic for a Grade 12 scholar (${stream} stream) focusing specifically on the EUEE standards for: ${topic}. 
      ${quizIntentPrompt}
      Each question must include a "Neural Breakdown" (explanation) that deeply analyzes the conceptual logic, addressing common misconceptions.`,
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
                  correctIndex: { type: Type.INTEGER, description: "Index of correct answer (0-3)" },
                  explanation: { type: Type.STRING, description: "Highly detailed academic breakdown of the logic." },
                  conceptTag: { type: Type.STRING, description: "Specific curriculum node tested." }
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

  async generateStudyStrategy(results: any[], score: number, topic: string): Promise<string[]> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Scholar performance: ${score}/5 in topic ${topic}. 
      Review data: ${JSON.stringify(results)}.
      Generate 3 critical remediation vectors for the academic record. 
      Professional, high-impact institutional tone.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          minItems: 3,
          maxItems: 3
        }
      }
    });
    return JSON.parse(response.text || '[]');
  },

  async generateVideo(topic: string, subject: string, grade: string): Promise<string> {
    const ai = this.getAI();
    let subjectFocus = "Institutional educational animation. Professional motion graphics and precise visual metaphors.";
    const subLower = subject.toLowerCase();
    
    if (subLower.includes("physics")) {
      subjectFocus = "Focus on vector overlays, Newtonian motion, and cinematic lighting. Professional academic motion graphics.";
    } else if (subLower.includes("biology") || subLower.includes("chemistry")) {
      subjectFocus = "Focus on molecular structures, cellular landscapes, and glowing particle systems. Cinematic scientific animation.";
    }

    const masterPrompt = `A high-fidelity cinematic academic animation explaining ${topic} for a ${grade} scholar (${subject}). ${subjectFocus} Detailed lighting, 1080p rendering, professional institutional tone.`;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: masterPrompt,
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
    if (!downloadLink) throw new Error("Synthesis failure.");
    
    return `${downloadLink}&key=${process.env.API_KEY}`;
  },

  async auditPerformance(history: QuizResult[]): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Execute an Institutional Academic Audit. 
      Input: ${JSON.stringify(history.slice(0, 10))}.
      Deliver:
      1. Identification of latent cognitive gaps.
      2. EUEE readiness projection.
      3. 72-hour specialized remediation framework.
      Tone: Authoritative, institutional, scholarly.`,
      config: {
        systemInstruction: "You are the Luwa National Academic Auditor. You transform data into formal academic strategy.",
      }
    });
    return response.text || "Insufficient data for full audit cycle.";
  }
};