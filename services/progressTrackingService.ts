// Service to track and manage student progress
import { getStudentType } from './authService';

const progressDatabase = {};

export function initializeProgress(studentId: string) {
  if (!progressDatabase[studentId]) {
    progressDatabase[studentId] = {
      completedTopics: [],
      quizzesTaken: {},
      multimediaViewed: {},
      lastActive: new Date().toISOString(),
    };
  }
}

export function updateProgress(studentId: string, activity: string, details: any) {
  if (!progressDatabase[studentId]) {
    throw new Error('Student progress not initialized.');
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
}

export function getProgress(studentId: string) {
  if (!progressDatabase[studentId]) {
    throw new Error('Student progress not initialized.');
  }
  return progressDatabase[studentId];
}

export function setGoals(studentId: string, goals: { [key: string]: any }) {
  if (!progressDatabase[studentId]) {
    throw new Error('Student progress not initialized.');
  }

  progressDatabase[studentId].goals = goals;
}

export function getAnalytics(studentId: string) {
  if (!progressDatabase[studentId]) {
    throw new Error('Student progress not initialized.');
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