
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Purpose: Interactive, gamified, and AI-assisted learning for high school students.
  Module: Global Type Definitions
  Author: Shewit – 2026
*/

export enum Grade {
  G11 = 'Grade 11',
  G12 = 'Grade 12',
}

export enum Stream {
  NATURAL = 'Natural Science',
  SOCIAL = 'Social Science',
}

export type Language = 'en' | 'am';

export type LifecycleStage = 'Admission' | 'Exploration' | 'Skill Acquisition' | 'Mastery' | 'Ready';

export type TutorMode = 'Teach' | 'Practice' | 'Exam';

export type IntentType = 'Exploration' | 'Deep Study' | 'Exam Prep' | 'Rapid Revision' | 'Recovery';

export type PrestigeTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Sovereign';

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  unlockedAt: number;
  description: string;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AcademicIntent {
  type: IntentType;
  confidence: number;
  detectedAt: number;
  expiresAt: number;
}

export interface AcademicHealth {
  burnoutRisk: number;
  engagementScore: number;
  consistencyLevel: number;
  status: 'Vibrant' | 'Stable' | 'Fatigued' | 'At Risk';
}

export interface EffortMetrics {
  timeSpent: number;
  revisions: number;
  effortScore: number;
}

export interface ReviewEvent {
  date: number;
  outcome: 'correct' | 'wrong';
  effortScore: number;
}

export interface ConceptMastery {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed: number;
  retentionScore: number;
  scheduledNextReview: number;
  reviewHistory: ReviewEvent[];
  interval: number;
  adaptiveLevel: number; // 1 (Intro) to 5 (Advanced)
}

export interface ConceptNode {
  id: string;
  topic: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  importanceScore: number;
  description: string;
}

export type NodeStatus = 'Locked' | 'Ready' | 'Review' | 'Mastered';

export interface HistoricalQuestion {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  topic?: string;
  lang?: Language;
}

// SES Definitions
export type QuestionType = 'MCQ' | 'Short' | 'TF';

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string | number;
  marks: number;
  section: string;
  explanation: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  topic: string;
  questions: ExamQuestion[];
  startTime: number;
  durationMinutes: number;
  isApproved: boolean;
  status: 'Draft' | 'Scheduled' | 'Live' | 'Completed';
  totalMarks: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  userId: string;
  userName: string;
  answers: Record<string, string | number>;
  startTime: number;
  submitTime: number;
  score: number;
  sectionScores: Record<string, number>;
  isGraded: boolean;
  status: 'Pending' | 'Approved' | 'Flagged';
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  token: string;
  name: string;
  role: 'scholar' | 'admin';
  stream: Stream;
  grade: string;
  targetYear: string;
  xp: number;
  level: 'Initiate' | 'Builder' | 'Strategist';
  prestige: PrestigeTier;
  weakConcepts: string[];
  currentObjective: string;
  quizHistory: QuizResult[];
  questionLedger: HistoricalQuestion[];
  achievements: Achievement[];
  deactivated?: boolean;
  streak: number;
  lastActiveDate?: string;
  themeColor?: string;
  currentIntent?: AcademicIntent;
  averageEffort?: number;
  masteryRecord: Record<string, ConceptMastery>;
  currentNodeId?: string;
  lifecycleStage: LifecycleStage;
  readiness: number;
  health: AcademicHealth;
  preferredLanguage: Language;
  examSubmissions?: ExamSubmission[];
}

export interface AccessToken {
  code: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt: number;
}

export interface QuizResult {
  id: string;
  topic: string;
  score: number;
  total: number;
  date: string;
  timestamp: number;
  aggregateEffort: number;
  adaptiveRating?: number;
  results: {
    question: string;
    answer: string;
    correct: boolean;
    explanation: string;
    conceptTag: string;
    originalQuestion: QuizQuestion;
    metrics: EffortMetrics;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: {
    data: string;
    mimeType: string;
  };
  timestamp: number;
  senderName?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptTag: string;
}

export interface Quiz {
  topic: string;
  questions: QuizQuestion[];
}

export interface GlobalDirective {
  id: string;
  content: string;
  timestamp: number;
  author: string;
}
