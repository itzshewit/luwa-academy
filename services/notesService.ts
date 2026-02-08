// Service to manage notes for natural and social students
import { getStudentType } from '../services/authService';

const naturalNotes = {
  biology: {
    content: "Comprehensive EUEE Biology notes covering genetics, evolution, ecology, and human physiology.",
    multimedia: [
      { type: 'video', url: 'https://example.com/biology-video' },
      { type: 'image', url: 'https://example.com/biology-diagram' }
    ],
    quiz: "https://example.com/biology-quiz"
  },
  chemistry: {
    content: "Detailed EUEE Chemistry notes on organic, inorganic, and physical chemistry.",
    multimedia: [
      { type: 'video', url: 'https://example.com/chemistry-video' },
      { type: 'image', url: 'https://example.com/chemistry-chart' }
    ],
    quiz: "https://example.com/chemistry-quiz"
  },
  physics: {
    content: "In-depth EUEE Physics notes on mechanics, thermodynamics, and electromagnetism.",
    multimedia: [
      { type: 'video', url: 'https://example.com/physics-video' },
      { type: 'image', url: 'https://example.com/physics-diagram' }
    ],
    quiz: "https://example.com/physics-quiz"
  },
  mathematics: {
    content: "Extensive EUEE Mathematics notes on calculus, algebra, and geometry.",
    multimedia: [
      { type: 'video', url: 'https://example.com/mathematics-video' },
      { type: 'image', url: 'https://example.com/mathematics-chart' }
    ],
    quiz: "https://example.com/mathematics-quiz"
  },
  geography: {
    content: "EUEE Geography notes focusing on physical and human geography.",
    multimedia: [
      { type: 'video', url: 'https://example.com/geography-video' },
      { type: 'image', url: 'https://example.com/geography-map' }
    ],
    quiz: "https://example.com/geography-quiz"
  },
  english: {
    content: "EUEE English notes covering grammar, comprehension, and essay writing.",
    multimedia: [
      { type: 'video', url: 'https://example.com/english-video' },
      { type: 'image', url: 'https://example.com/english-diagram' }
    ],
    quiz: "https://example.com/english-quiz"
  }
};

const socialNotes = {
  history: {
    content: "Comprehensive EUEE History notes on world history, African history, and Ethiopian history.",
    multimedia: [
      { type: 'video', url: 'https://example.com/history-video' },
      { type: 'image', url: 'https://example.com/history-timeline' }
    ],
    quiz: "https://example.com/history-quiz"
  },
  civics: {
    content: "Detailed EUEE Civics notes on democracy, governance, and human rights.",
    multimedia: [
      { type: 'video', url: 'https://example.com/civics-video' },
      { type: 'image', url: 'https://example.com/civics-chart' }
    ],
    quiz: "https://example.com/civics-quiz"
  },
  economics: {
    content: "In-depth EUEE Economics notes on microeconomics, macroeconomics, and development economics.",
    multimedia: [
      { type: 'video', url: 'https://example.com/economics-video' },
      { type: 'image', url: 'https://example.com/economics-chart' }
    ],
    quiz: "https://example.com/economics-quiz"
  },
  geography: {
    content: "EUEE Geography notes focusing on physical and human geography.",
    multimedia: [
      { type: 'video', url: 'https://example.com/geography-video' },
      { type: 'image', url: 'https://example.com/geography-map' }
    ],
    quiz: "https://example.com/geography-quiz"
  },
  english: {
    content: "EUEE English notes covering grammar, comprehension, and essay writing.",
    multimedia: [
      { type: 'video', url: 'https://example.com/english-video' },
      { type: 'image', url: 'https://example.com/english-diagram' }
    ],
    quiz: "https://example.com/english-quiz"
  },
  mathematics: {
    content: "Extensive EUEE Mathematics notes on calculus, algebra, and geometry.",
    multimedia: [
      { type: 'video', url: 'https://example.com/mathematics-video' },
      { type: 'image', url: 'https://example.com/mathematics-chart' }
    ],
    quiz: "https://example.com/mathematics-quiz"
  }
};

export function getNotesForStudent(studentId: string) {
  const studentType = getStudentType(studentId);

  if (studentType === 'natural') {
    return naturalNotes;
  } else if (studentType === 'social') {
    return socialNotes;
  } else {
    throw new Error('Invalid student type');
  }
}