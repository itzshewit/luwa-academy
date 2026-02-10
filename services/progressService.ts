
// Service to track and manage student progress
import { getStudentType } from './authService.ts';

// Persistence Bridge: Load initial state from storage if it exists
const STORAGE_KEY = 'luwa_progress_registry';
const progressDatabase = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

function syncToDisk() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progressDatabase));
}

export function initializeProgress(studentId: string) {
  if (!progressDatabase[studentId]) {
    progressDatabase[studentId] = {
      completedTopics: [],
      quizzesTaken: {},
      multimediaViewed: {},
      lastActive: new Date().toISOString(),
    };
    syncToDisk();
  }
}

export function updateProgress(studentId: string, activity: string, details: any) {
  if (!progressDatabase[studentId]) {
    // Auto-init if missing to prevent uncaught errors during node transition
    initializeProgress(studentId);
  }

  const progress = progressDatabase[studentId];
  progress.lastActive = new Date().toISOString();

  switch (activity) {
    case 'completeTopic':
      if (!progress.completedTopics.includes(details.topic)) {
        progress.completedTopics.push(details.topic);
      }
      break;
    case 'takeQuiz':
      progress.quizzesTaken[details.quizId] = details.score;
      break;
    case 'viewMultimedia':
      if (!progress.multimediaViewed[details.mediaId]) {
        progress.multimediaViewed[details.mediaId] = 0;
      }
      progress.multimediaViewed[details.mediaId] += 1;
      break;
    default:
      throw new Error('Unknown activity type.');
  }
  syncToDisk();
}

export function getProgress(studentId: string) {
  if (!progressDatabase[studentId]) {
    initializeProgress(studentId);
  }
  return progressDatabase[studentId];
}

export function setGoals(studentId: string, goals: { [key: string]: any }) {
  if (!progressDatabase[studentId]) {
    initializeProgress(studentId);
  }
  progressDatabase[studentId].goals = goals;
  syncToDisk();
}

export function getAnalytics(studentId: string) {
  if (!progressDatabase[studentId]) {
    initializeProgress(studentId);
  }

  const progress = progressDatabase[studentId];
  const totalTopics = progress.completedTopics.length;
  const totalQuizzes = Object.keys(progress.quizzesTaken).length;
  const averageQuizScore =
    totalQuizzes > 0
      ? Object.values(progress.quizzesTaken).map(Number).reduce((a, b) => a + b, 0) / totalQuizzes
      : 0;
  const totalMultimediaViews = Object.values(progress.multimediaViewed).map(Number).reduce((a, b) => a + b, 0);

  return {
    totalTopics,
    totalQuizzes,
    averageQuizScore,
    totalMultimediaViews,
  };
}
