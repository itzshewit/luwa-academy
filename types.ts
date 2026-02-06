
/*
  Luwa Academy – AI-Powered Educational Platform
  Global Type Definitions - V3.8 (Stream Visibility Update)
*/

export enum Grade {
  G10 = 'Grade 10',
  G11 = 'Grade 11',
  G12 = 'Grade 12',
}

export enum Stream {
  NATURAL = 'NATURAL_SCIENCE',
  SOCIAL = 'SOCIAL_SCIENCE',
}

export type Language = 'en' | 'am' | 'or' | 'ti';

export type UserRole = 'scholar' | 'admin' | 'content_manager' | 'moderator';

export interface BilingualText {
  en: string;
  am?: string;
}

export interface StudyNote {
  id: string;
  topic: BilingualText;
  subjectId: string;
  gradeLevel: number;
  chapterNumber: number;
  contentHtml: BilingualText;
  keyFormulas: string[];
  diagrams: string[];
  estimatedReadTime: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isBookmarked: boolean;
  userNotes?: string;
  rating?: number;
  stream?: Stream; // If defined, only scholars in this stream can access this note.
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  text: BilingualText;
  options: { id: string; text: BilingualText }[];
  correctAnswer: string;
  explanation: BilingualText;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  source: 'EUEE_PAST_EXAM' | 'CURRICULUM_BASED' | 'MOCK';
  year?: number;
}

export interface PastPaper {
  id: string;
  subject: string;
  yearEC: number;
  yearGC: number;
  questionCount: number;
  timeLimit: number;
}

export type TutorMode = 'Teach' | 'Practice' | 'Exam';

export type IntentType = 'General Mastery' | 'Exam Prep' | 'Concept Deep-Dive' | 'Homework Help';

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

export interface EffortMetrics {
  timeSpent: number;
  revisions: number;
  effortScore: number;
}

export interface QuizResult {
  question: string;
  answer: string;
  correct: boolean;
  explanation: string;
  conceptTag: string;
  originalQuestion: QuizQuestion;
  metrics: EffortMetrics;
}

export interface QuizHistoryEntry {
  id: string;
  topic: string;
  score: number;
  total: number;
  date: string;
  timestamp: number;
  aggregateEffort: number;
  results: QuizResult[];
}

export interface ConceptMastery {
  topic: string;
  adaptiveLevel: number;
  retentionScore: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  xp: number;
  rank: number;
  isCurrentUser: boolean;
}

export type SubscriptionTier = 'BASIC' | 'PRO' | 'INSTITUTIONAL';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  name?: string;
  phone?: string; // 12.1 Requirement
  role: UserRole;
  dob?: string;
  stream: Stream;
  grade: number | string;
  xp: number;
  prestige: string;
  streak: number;
  readiness: number;
  preferredLanguage: Language;
  dailyGoal: number;
  targetUniversity?: string;
  studyGoals: StudyGoal[];
  bookmarks: string[];
  masteryRecord: Record<string, ConceptMastery>;
  token?: string;
  weakConcepts: string[];
  currentObjective: string;
  currentIntent?: { type: IntentType };
  quizHistory: QuizHistoryEntry[];
  questionLedger?: any[];
  lastActive?: number;
  is2FAEnabled?: boolean;
  subscriptionTier: SubscriptionTier;
  badges: Badge[];
  privacySettings: {
    analyticsEnabled: boolean;
    cloudBackupEnabled: boolean;
    marketingConsent: boolean;
  };
  deactivated?: boolean;
}

export interface StudyGoal {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  deadline?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  image?: { data: string; mimeType: string };
  senderName?: string;
}

export interface ExamQuestion {
  id: string;
  type: 'MCQ' | 'TF' | 'Short';
  text: string;
  options?: string[];
  correctAnswer: any;
  marks: number;
  section: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  questions: ExamQuestion[];
  startTime: number;
  durationMinutes: number;
  status: 'Scheduled' | 'Live' | 'Closed';
  isApproved: boolean;
  totalMarks: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  userId: string;
  userName: string;
  answers: Record<string, any>;
  startTime: number;
  submitTime: number;
  score: number;
  sectionScores: Record<string, number>;
  isGraded: boolean;
  status: 'Pending' | 'Approved';
}

export interface AccessToken {
  code: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt: number;
}

export interface GlobalDirective {
  id: string;
  content: string;
  timestamp: number;
  author: string;
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

export interface MockExam {
  id: string;
  title: string;
  subject: string;
  questions: Question[];
  timeLimit: number;
  totalMarks: number;
}

export type FeedbackType = 'Usability' | 'Content' | 'Performance' | 'Bug' | 'Feature Request';

export interface BetaFeedback {
  id: string;
  userId: string;
  userName: string;
  type: FeedbackType;
  message: string;
  timestamp: number;
  status: 'Open' | 'Investigating' | 'Resolved';
}

export interface ContentReport {
  id: string;
  userId: string;
  contentId: string;
  contentType: 'Question' | 'Note';
  issueType: 'Wrong Answer' | 'Typo' | 'Unclear Explanation' | 'Curriculum Mismatch';
  comment: string;
  timestamp: number;
  status: 'Open' | 'Fixed' | 'Ignored';
}

export interface BugReport {
  id: string;
  userId: string;
  appVersion: string;
  deviceModel: string;
  osVersion: string;
  screen: string;
  description: string;
  timestamp: number;
  status: 'New' | 'In Progress' | 'Resolved' | 'Won\'t Fix';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface FeatureRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  votes: number;
  timestamp: number;
  status: 'Under Consideration' | 'Planned' | 'In Development' | 'Released';
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Offline' | 'Study Planner' | 'Technical';
}
