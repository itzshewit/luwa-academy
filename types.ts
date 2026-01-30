/*
  Module: Global Type Definitions
  Purpose: Defines core data structures, enums, and interfaces for the Luwa Academy ecosystem.
*/

export enum Grade {
  G11 = 'Grade 11',
  G12 = 'Grade 12',
}

export enum Stream {
  NATURAL = 'Natural Science',
  SOCIAL = 'Social Science',
}

export type LifecycleStage = 'Admission' | 'Exploration' | 'Skill Acquisition' | 'Mastery' | 'Ready';

export type TutorMode = 'Teach' | 'Practice' | 'Exam';

export type IntentType = 'Exploration' | 'Deep Study' | 'Exam Prep' | 'Rapid Revision' | 'Recovery';

export type PrestigeTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Sovereign';

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
  burnoutRisk: number; // 0 to 1
  engagementScore: number; // 0 to 1
  consistencyLevel: number; // 0 to 1
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
  deactivated?: boolean;
  streak: number;
  themeColor?: string;
  currentIntent?: AcademicIntent;
  averageEffort?: number;
  masteryRecord: Record<string, ConceptMastery>;
  currentNodeId?: string;
  lifecycleStage: LifecycleStage;
  readiness: number;
  health: AcademicHealth;
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