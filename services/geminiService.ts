
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Generative AI Orchestration Service
*/

import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, TutorMode, IntentType, Language, Exam, User, Question, QuizHistoryEntry, ExamSubmission } from "../types.ts";

export const geminiService = {
  getAI: () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  },

  handleError: (err: any): string => {
    console.error("Luwa Neural Engine Error:", err);
    const msg = err?.message || "";
    if (msg.includes("API key not valid")) return "Institutional API Key mismatch. Contact Registry.";
    if (msg.includes("safety")) return "Query blocked by institutional safety protocols. Refine your enquiry.";
    if (msg.includes("quota") || msg.includes("429")) return "Neural bandwidth saturated. Please allow a brief cooldown.";
    if (msg.includes("Requested entity was not found")) return "Registry node not found. Verification required.";
    return "Operational frequency fluctuation detected. Please retry.";
  },

  async streamTutorResponse(
    prompt: string, 
    stream: string, 
    mode: TutorMode, 
    history: {role: string, content: string, image?: {data: string, mimeType: string}}[],
    intent?: IntentType,
    lang: Language = 'en'
  ) {
    try {
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

      if (prompt) {
          contents.push({ role: 'user', parts: [{ text: prompt }] });
      }

      return await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: `You are The Instructor at Luwa Academy for Grade 11-12 Ethiopian scholars (${stream} stream). 
          TONE: Professional, authoritative, yet encouraging. 
          LANGUAGE: ${langInstruction}
          MODE: ${mode}.
          INTENT: ${intent || 'General Mastery'}.
          Always refer to the user as "scholar". Use structured Markdown for explanations.`,
        }
      });
    } catch (e) {
      throw new Error(this.handleError(e));
    }
  },

  async generateQuiz(topic: string, stream: string, intent?: IntentType, difficulty: number = 3): Promise<Quiz> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a 5-question multiple choice formal diagnostic for a Grade 12 scholar (${stream} stream) based on Ethiopian National Textbooks for: ${topic}. Difficulty level: ${difficulty}/5. Intent: ${intent || 'General'}.`,
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
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    } catch (e) {
      throw new Error(this.handleError(e));
    }
  },

  async generateExamFeedback(submission: ExamSubmission, exam: Exam): Promise<string> {
    try {
      const ai = this.getAI();
      const missedTopics = exam.questions
        .filter(q => submission.answers[q.id] !== q.correctAnswer)
        .map(q => q.topicTag || 'General Subject Area');

      const prompt = `Analyze this scholar's exam performance:
      Subject: ${exam.subject}
      Score: ${submission.score}/${exam.totalMarks}
      Missed Topics: ${missedTopics.join(', ')}
      
      Provide a concise, encouraging, and highly technical remediation roadmap for this Grade 12 Ethiopian scholar. Highlight specific curriculum nodes they should revisit.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      return response.text || "Continue focusing on core principles.";
    } catch (e) {
      return "Feedback engine busy. Focus on topics missed during review.";
    }
  },

  async generatePersonalizedMockExam(user: User, subject: string): Promise<Question[]> {
    try {
      const ai = this.getAI();
      const weakTopics = user.weakConcepts?.length ? user.weakConcepts.join(', ') : 'general curriculum';
      const prompt = `Generate 10 advanced multiple-choice questions for the subject "${subject}" tailored for a Grade 12 Ethiopian scholar. 
      Focus heavily on these weak areas: ${weakTopics}. 
      Ensure questions align with the EUEE (Ethiopian University Entrance Exam) style. 
      Provide the output in a structured JSON format with English and Amharic translations for text and options.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                subjectId: { type: Type.STRING },
                topicId: { type: Type.STRING },
                text: {
                  type: Type.OBJECT,
                  properties: {
                    en: { type: Type.STRING },
                    am: { type: Type.STRING }
                  }
                },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: {
                        type: Type.OBJECT,
                        properties: {
                          en: { type: Type.STRING },
                          am: { type: Type.STRING }
                        }
                      }
                    }
                  }
                },
                correctAnswer: { type: Type.STRING },
                explanation: {
                  type: Type.OBJECT,
                  properties: {
                    en: { type: Type.STRING },
                    am: { type: Type.STRING }
                  }
                },
                difficulty: { type: Type.STRING },
                source: { type: Type.STRING }
              }
            }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (e) {
      throw new Error(this.handleError(e));
    }
  },

  async parseExamRawText(rawText: string): Promise<Partial<Exam>> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Parse the following raw text into a structured institutional Exam object. Extract questions, options, and correct answers. Text: ${rawText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              durationMinutes: { type: Type.INTEGER },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
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
    } catch (e) {
      throw new Error(this.handleError(e));
    }
  },

  async getExamHint(question: string, subject: string): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a subtle, conceptual hint for the following ${subject} question without giving away the answer: "${question}"`,
      });
      return response.text || "Think about the core principles related to this topic.";
    } catch (e) {
      return "Scaffold hint unavailable. Rely on core logic.";
    }
  },

  async generateVideo(topic: string, subject: string, grade: string): Promise<string> {
    try {
      const ai = this.getAI();
      const prompt = `A cinematic educational animation about ${topic} for a ${grade} ${subject} student. High fidelity, scholarly visualization.`;
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
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
      if (!downloadLink) throw new Error("Video synthesis failed - no output URI.");

      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error("Failed to download synthesized video.");
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      throw new Error(this.handleError(e));
    }
  }
};
