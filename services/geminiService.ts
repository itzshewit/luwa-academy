/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Generative AI Orchestration Service
*/

import { GoogleGenAI, Type } from "@google/genai";
import { Quiz, TutorMode, IntentType, Language, Exam, User, Question, QuizHistoryEntry, ExamSubmission } from "../types.ts";
import { Configuration, OpenAIApi } from 'openai';
import axios from 'axios';

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

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

export function recommendCourses(userPreferences: any, courseCatalog: any[], userHistory: any[]) {
  // Advanced AI-driven recommendation logic using collaborative filtering
  const userTags = new Set(userPreferences.interests);

  // Calculate course scores based on user preferences and history
  const courseScores = courseCatalog.map(course => {
    let score = 0;

    // Boost score for matching tags
    course.tags.forEach(tag => {
      if (userTags.has(tag)) {
        score += 10;
      }
    });

    // Boost score for courses similar to user history
    userHistory.forEach(history => {
      if (history.tags.some((tag: string) => course.tags.includes(tag))) {
        score += 5;
      }
    });

    return { ...course, score };
  });

  // Sort courses by score in descending order
  courseScores.sort((a, b) => b.score - a.score);

  return courseScores.slice(0, 5); // Return top 5 recommendations
}

// Example usage:
// const userPreferences = { interests: ['math', 'science'] };
// const userHistory = [
//   { id: 1, name: 'Algebra Basics', tags: ['math'] },
//   { id: 2, name: 'Physics Fundamentals', tags: ['science'] }
// ];
// const courseCatalog = [
//   { id: 3, name: 'Advanced Algebra', tags: ['math'] },
//   { id: 4, name: 'Chemistry 101', tags: ['science'] }
// ];
// console.log(recommendCourses(userPreferences, courseCatalog, userHistory));

export async function generatePersonalizedLearningPlan(userProfile, courseCatalog) {
  try {
    const prompt = `Create a personalized learning plan for a user with the following profile: ${JSON.stringify(userProfile)}. Use the following course catalog: ${JSON.stringify(courseCatalog)}.`;

    const response = await openai.createCompletion({
      model: 'gpt-4',
      prompt,
      max_tokens: 500,
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating personalized learning plan:', error);
    throw new Error('Failed to generate personalized learning plan.');
  }
}

// Example usage:
// const userProfile = { interests: ['math', 'science'], goals: ['career advancement'] };
// const courseCatalog = [
//   { id: 1, name: 'Algebra Basics', tags: ['math'] },
//   { id: 2, name: 'Physics Fundamentals', tags: ['science'] }
// ];
// generatePersonalizedLearningPlan(userProfile, courseCatalog).then(console.log);

export function generateAdaptiveLearningPath(userPerformance, courseCatalog) {
  // Example adaptive learning logic
  const { strengths, weaknesses } = userPerformance;

  const adaptivePath = courseCatalog.filter(course => {
    if (weaknesses.some(weakness => course.tags.includes(weakness))) {
      return true; // Prioritize courses that address weaknesses
    }
    return strengths.some(strength => course.tags.includes(strength));
  });

  return adaptivePath.slice(0, 5); // Return top 5 courses for the adaptive path
}

// Example usage:
// const userPerformance = {
//   strengths: ['math'],
//   weaknesses: ['science']
// };
// const courseCatalog = [
//   { id: 1, name: 'Algebra Basics', tags: ['math'] },
//   { id: 2, name: 'Physics Fundamentals', tags: ['science'] }
// ];
// console.log(generateAdaptiveLearningPath(userPerformance, courseCatalog));

export async function fetchExternalCourses(apiUrl) {
  try {
    const response = await axios.get(apiUrl);
    console.log('Fetched external courses:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching external courses:', error);
    throw new Error('Failed to fetch external courses.');
  }
}

// Example usage:
// const apiUrl = 'https://external-course-api.com/courses';
// fetchExternalCourses(apiUrl).then(console.log);

export async function getChatbotResponse(userMessage) {
  try {
    const prompt = `You are a helpful educational assistant. Respond to the following user message: ${userMessage}`;

    const response = await openai.createCompletion({
      model: 'gpt-4',
      prompt,
      max_tokens: 200,
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    throw new Error('Failed to generate chatbot response.');
  }
}

// Example usage:
// const userMessage = 'Can you help me understand algebra?';
// getChatbotResponse(userMessage).then(console.log);
