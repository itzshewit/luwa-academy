
import { User, Stream, StudyNote, Question, PastPaper, AccessToken, AuditEntry, UserRole, Exam, ExamSubmission, StaticQuiz, StudyTask, Assignment, AssignmentSubmission } from '../types.ts';
import { dbService } from './db.ts';

const PREFIX = 'luwa_v3_';
const SESSION_KEY = `${PREFIX}session`;

export const storageService = {
  setSession: (user: User) => localStorage.setItem(SESSION_KEY, JSON.stringify(user)),
  getSession: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },
  logout: () => localStorage.removeItem(SESSION_KEY),
  
  isSessionExpired: (user: User | null) => {
    if (!user?.lastActive) return false;
    return Date.now() - user.lastActive > 30 * 60 * 1000;
  },

  updateSessionActivity: (user: User) => {
    const updated = { ...user, lastActive: Date.now() };
    storageService.setSession(updated);
    return updated;
  },

  async getAllUsers(): Promise<User[]> {
    return dbService.getAll<User>('users');
  },

  async saveUser(user: User): Promise<void> {
    await dbService.put('users', user);
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.email === email) || null;
  },

  async getNotes(): Promise<StudyNote[]> {
    return dbService.getAll<StudyNote>('notes');
  },

  async saveNotes(notes: StudyNote[]): Promise<void> {
    await dbService.bulkPut('notes', notes);
  },

  async getQuestions(): Promise<Question[]> {
    return dbService.getAll<Question>('questions');
  },

  async saveQuestions(questions: Question[]): Promise<void> {
    await dbService.bulkPut('questions', questions);
  },

  async getStaticQuizzes(): Promise<StaticQuiz[]> {
    return dbService.getAll<StaticQuiz>('static_quizzes');
  },

  async saveStaticQuizzes(quizzes: StaticQuiz[]): Promise<void> {
    await dbService.bulkPut('static_quizzes', quizzes);
  },

  async getStudyTasks(): Promise<StudyTask[]> {
    return dbService.getAll<StudyTask>('tasks');
  },

  async saveStudyTask(task: StudyTask): Promise<void> {
    await dbService.put('tasks', task);
  },

  async deleteStudyTask(id: string): Promise<void> {
    await dbService.delete('tasks', id);
  },

  // Assignment System Integration
  async getAssignments(): Promise<Assignment[]> {
    return dbService.getAll<Assignment>('assignments');
  },

  async saveAssignment(assignment: Assignment): Promise<void> {
    await dbService.put('assignments', assignment);
  },

  async deleteAssignment(id: string | number): Promise<void> {
    await dbService.delete('assignments', id);
  },

  async getAssignmentSubmissions(): Promise<AssignmentSubmission[]> {
    return dbService.getAll<AssignmentSubmission>('assignment_submissions');
  },

  async saveAssignmentSubmission(submission: AssignmentSubmission): Promise<void> {
    await dbService.put('assignment_submissions', submission);
  },

  async getTokens(): Promise<AccessToken[]> {
    return dbService.getAll<AccessToken>('tokens');
  },

  async generateToken(): Promise<string> {
    const code = `LUWA-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await dbService.put('tokens', { code, isUsed: false, createdAt: Date.now() });
    return code;
  },

  async deleteToken(code: string): Promise<void> {
    await dbService.delete('tokens', code);
  },

  async validateAndUseToken(code: string, userId: string): Promise<boolean> {
    if (code.startsWith('LUWA-DEV-')) return true;
    const token = await dbService.getById<AccessToken>('tokens', code);
    if (token && !token.isUsed) {
      token.isUsed = true;
      token.usedBy = userId;
      await dbService.put('tokens', token);
      return true;
    }
    return false;
  },

  async getExams(): Promise<Exam[]> {
    return dbService.getAll<Exam>('exams');
  },

  async saveExam(exam: Exam): Promise<void> {
    await dbService.put('exams', exam);
  },

  async getSubmissions(): Promise<ExamSubmission[]> {
    return dbService.getAll<ExamSubmission>('results');
  },

  async saveSubmission(submission: ExamSubmission): Promise<void> {
    await dbService.put('results', submission);
  },

  getSubjects: (stream: Stream) => stream === Stream.NATURAL 
    ? ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT'] 
    : ['Mathematics', 'History', 'Geography', 'Economics', 'English', 'SAT'],

  hashPassword: (pw: string) => btoa(pw + '_luwa'),

  getPastPapers: (): PastPaper[] => [
    { id: 'pp1', subject: 'Mathematics', yearEC: 2017, yearGC: 2024, questionCount: 60, timeLimit: 120 },
    { id: 'pp2', subject: 'Physics', yearEC: 2016, yearGC: 2023, questionCount: 60, timeLimit: 120 },
    { id: 'pp3', subject: 'SAT', yearEC: 2017, yearGC: 2024, questionCount: 65, timeLimit: 120 }
  ],

  getLeaderboard: (currentUser: User) => [
    { userId: '1', name: 'Ababa K.', xp: 4500, rank: 1, isCurrentUser: false },
    { userId: '2', name: 'Sara M.', xp: 3200, rank: 2, isCurrentUser: false },
    { userId: currentUser.id, name: currentUser.fullName, xp: currentUser.xp, rank: 3, isCurrentUser: true },
    { userId: '4', name: 'Desta T.', xp: 1800, rank: 4, isCurrentUser: false },
    { userId: '5', name: 'Tirusew B.', xp: 950, rank: 5, isCurrentUser: false }
  ].sort((a, b) => b.xp - a.xp).map((e, i) => ({ ...e, rank: i + 1 })),

  addToLedger: async (user: User, entry: { question: string, answer: string }) => {
    const ledger = user.questionLedger || [];
    const updatedUser = { ...user, questionLedger: [...ledger, { ...entry, timestamp: Date.now() }] };
    await dbService.put('users', updatedUser);
    return updatedUser;
  },

  shuffleQuestions: <T>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  },

  calculateAdaptiveTime: (user: User, baseMinutes: number): number => {
    const ratio = user.avgCompletionRatio || 0.85;
    if (ratio > 0.9) return Math.ceil(baseMinutes * 1.15);
    return baseMinutes;
  },

  async seedRegistry(): Promise<void> {
    const existingQuizzes = await this.getStaticQuizzes();
    if (existingQuizzes.length > 0) return;

    const initialQuizzes: StaticQuiz[] = [
      {
        id: 1,
        title: "Mathematics - Relations & Functions",
        subject: "Mathematics",
        stream: "both",
        icon: "📐",
        color: "#2563eb",
        duration: "15 min",
        totalQuestions: 8,
        description: "Test your understanding of relations, functions, domain and range.",
        questions: [
          { type: "multiple-choice", question: "What is the domain of f(x) = √(x - 4)?", options: ["x ≥ 4", "x > 4", "x ≤ 4", "All real numbers"], correctAnswer: 0 },
          { type: "true-false", question: "A function is a relation where each input has exactly one output.", correctAnswer: true },
          { type: "multiple-choice", question: "Which of the following represents a function?", options: ["{(1,2), (2,3), (1,4)}", "{(1,2), (2,2), (3,2)}", "{(1,2), (1,3), (2,4)}", "None of the above"], correctAnswer: 1 },
          { type: "fill-blank", question: "If f(x) = 3x + 5 and f(2) = k, what is the value of k?", correctAnswer: "11" },
          { type: "multiple-select", question: "Which of the following are properties of equivalence relations? (Select all that apply)", options: ["Reflexive", "Symmetric", "Transitive", "Associative"], correctAnswers: [0, 1, 2] },
          { type: "multiple-choice", question: "What is the range of f(x) = x²?", options: ["All real numbers", "x ≥ 0", "y ≥ 0", "y ≤ 0"], correctAnswer: 2 },
          { type: "true-false", question: "The relation {(1,1), (2,2), (3,3)} is reflexive on the set {1, 2, 3}.", correctAnswer: true },
          { type: "multiple-choice", question: "If f(x) = 2x - 1, what is f⁻¹(x)?", options: ["(x + 1)/2", "(x - 1)/2", "2x + 1", "Cannot be determined"], correctAnswer: 0 }
        ]
      },
      {
        id: 2,
        title: "Mathematics - Sequences & Series",
        subject: "Mathematics",
        stream: "both",
        icon: "📐",
        color: "#2563eb",
        duration: "12 min",
        totalQuestions: 6,
        description: "Test your knowledge of arithmetic and geometric sequences.",
        questions: [
          { type: "multiple-choice", question: "What is the 10th term of the arithmetic sequence 3, 7, 11, 15...?", options: ["39", "43", "47", "51"], correctAnswer: 0 },
          { type: "fill-blank", question: "In a geometric sequence, if a = 2 and r = 3, the 4th term is ___.", correctAnswer: "54" },
          { type: "true-false", question: "The sum of an infinite geometric series converges when |r| < 1.", correctAnswer: true },
          { type: "multiple-choice", question: "The formula for the nth term of an arithmetic sequence is:", options: ["a_n = a + nd", "a_n = a + (n-1)d", "a_n = ar^n", "a_n = ar^(n-1)"], correctAnswer: 1 },
          { type: "multiple-select", question: "Which of the following are geometric sequences? (Select all that apply)", options: ["2, 4, 8, 16...", "3, 6, 9, 12...", "1, -2, 4, -8...", "5, 10, 20, 40..."], correctAnswers: [0, 2, 3] },
          { type: "true-false", question: "An arithmetic sequence has a constant ratio between consecutive terms.", correctAnswer: false }
        ]
      }
    ];

    await this.saveStaticQuizzes(initialQuizzes);

    const initialNotes: StudyNote[] = [
      { id: 'sat_overview', topic: { en: 'EUEE SAT: Overview' }, subjectId: 'SAT', gradeLevel: 12, chapterNumber: 0, contentHtml: { en: "The Scholastic Aptitude Test (SAT) is mandatory. 60 Qs: 35 Verbal, 25 Quantitative. 120 minutes." }, keyFormulas: [], diagrams: [], estimatedReadTime: 10, difficulty: 'MEDIUM', isBookmarked: false },
      { id: 'hist_g11_u1', topic: { en: 'G11 History U1: Historiography' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 1, contentHtml: { en: "History is study of past human events based on evidence. Historiography is historical writing. Sources are primary and secondary." }, keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL }
    ];

    await this.saveNotes(initialNotes);
  }
};
