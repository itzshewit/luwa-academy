
import { User, Stream, StudyNote, Question, PastPaper, AccessToken, AuditEntry, UserRole, Exam, ExamSubmission } from '../types.ts';
import { dbService } from './db.ts';

const PREFIX = 'luwa_v3_';
const SESSION_KEY = `${PREFIX}session`;

export const storageService = {
  // Session handling remains sync for immediate Auth UI checks
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

  // Database operations
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

  async getTokens(): Promise<AccessToken[]> {
    return dbService.getAll<AccessToken>('tokens');
  },

  async generateToken(): Promise<string> {
    const code = `LUWA-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await dbService.put('tokens', { code, isUsed: false, createdAt: Date.now() });
    return code;
  },

  async validateAndUseToken(code: string, userId: string): Promise<boolean> {
    const token = await dbService.getById<AccessToken>('tokens', code);
    if (token && !token.isUsed) {
      token.isUsed = true;
      token.usedBy = userId;
      await dbService.put('tokens', token);
      return true;
    }
    // Fallback for dev bypass if needed
    return code.startsWith('LUWA-DEV-');
  },

  // Exam storage support
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

  // Seed institutional data if registry is empty
  async seedRegistry(): Promise<void> {
    const existingNotes = await this.getNotes();
    if (existingNotes.length > 0) return;

    const initialNotes: StudyNote[] = [
      // ENGLISH (EUEE) – MASTER REGISTRY (Both Streams)
      {
        id: 'eng_euee_master_0',
        topic: { en: 'EUEE English: Master Grammar Overview' },
        subjectId: 'English',
        gradeLevel: 12,
        chapterNumber: 0,
        contentHtml: { en: `EUEE English tests grammar via sentence completion, error recognition, cloze passages, and reading comprehension. 
        Focus on tense logic, agreement, modals, conditionals, and cohesion.

        Key Rule Sets:
        - Simple: 1 independent clause.
        - Compound: independent + coordinating conjunction (FANBOYS).
        - Complex: independent + dependent clause.

        Exam Traps:
        - Adjective vs adverb (good vs well).
        - Run-on sentences or fragments.` },
        keyFormulas: ['FANBOYS', 'S+V+O'],
        diagrams: [],
        estimatedReadTime: 10,
        difficulty: 'MEDIUM',
        isBookmarked: false
      },
      {
        id: 'eng_euee_master_2',
        topic: { en: 'Verb Tenses & Sequence Logic' },
        subjectId: 'English',
        gradeLevel: 12,
        chapterNumber: 2,
        contentHtml: { en: `Tense errors constitute 20–30% of grammar items. 
        - Present Perfect: Experience/Continuing (She has worked).
        - Past Perfect: Before the past (She had worked).
        - Past Continuous: Interrupted action (She was working).

        Exam Traps:
        - No 'will' in if-clauses.
        - Using Past Simple with 'for/since' for actions still in progress.` },
        keyFormulas: ['had + V3', 'has/have + V3'],
        diagrams: [],
        estimatedReadTime: 15,
        difficulty: 'MEDIUM',
        isBookmarked: false
      },
      {
        id: 'eng_euee_master_4',
        topic: { en: 'Subject-Verb Agreement (SVA) Mastery' },
        subjectId: 'English',
        gradeLevel: 12,
        chapterNumber: 4,
        contentHtml: { en: `SVA errors are dominant in error recognition sections.
        - Singular subject -> Singular verb (Each is).
        - Compound with 'and' -> Plural.
        - 'Neither/nor' -> Agrees with the nearest (Neither teacher nor students are).
        - 'The number of' (is) vs 'A number of' (are).` },
        keyFormulas: ['The number of (Singular)', 'A number of (Plural)'],
        diagrams: [],
        estimatedReadTime: 12,
        difficulty: 'HARD',
        isBookmarked: false
      },

      // MATHEMATICS (NATURAL) – MASTER REGISTRY (Natural Science Only)
      {
        id: 'math_nat_g11_u1',
        topic: { en: 'Relations and Functions (Grade 11)' },
        subjectId: 'Mathematics',
        gradeLevel: 11,
        chapterNumber: 1,
        contentHtml: { en: `Distinguishes relations vs functions; covers types, composition, and inverses. 
        - Function: Each x maps to exactly one y (Vertical Line Test).
        - Composition: (f o g)(x) = f(g(x)).
        - Even Function: f(-x) = f(x).
        - Odd Function: f(-x) = -f(x).` },
        keyFormulas: ['f(g(x))', 'y = f(x) -> x = f^-1(y)'],
        diagrams: [],
        estimatedReadTime: 15,
        difficulty: 'MEDIUM',
        isBookmarked: false,
        stream: Stream.NATURAL
      },
      {
        id: 'math_nat_g11_u3',
        topic: { en: 'Matrices & Linear Systems' },
        subjectId: 'Mathematics',
        gradeLevel: 11,
        chapterNumber: 3,
        contentHtml: { en: `Operations, inverses, and determinants for systems of equations. 
        - Inverse of A: (1/det) * adj(A).
        - Solve AX = B using X = A^-1 * B.
        - Identity Matrix (I): 1s on main diagonal, 0s elsewhere.` },
        keyFormulas: ['det(A) = ad - bc', 'X = A^-1 * B'],
        diagrams: [],
        estimatedReadTime: 20,
        difficulty: 'HARD',
        isBookmarked: false,
        stream: Stream.NATURAL
      },
      {
        id: 'math_nat_g12_u3',
        topic: { en: 'Differential Calculus (Introduction)' },
        subjectId: 'Mathematics',
        gradeLevel: 12,
        chapterNumber: 3,
        contentHtml: { en: `Mastering derivatives, rules, and optimization applications. 
        - Power Rule: (x^n)' = n*x^(n-1).
        - Product Rule: (uv)' = u'v + uv'.
        - Quotient Rule: (u/v)' = (u'v - uv') / v^2.
        - Chain Rule: (f(g(x)))' = f'(g(x)) * g'(x).` },
        keyFormulas: ['f\'(x) = lim h->0', '(uv)\' = u\'v + uv\''],
        diagrams: [],
        estimatedReadTime: 25,
        difficulty: 'HARD',
        isBookmarked: false,
        stream: Stream.NATURAL
      },
      {
        id: 'math_nat_g12_u1',
        topic: { en: 'Sequences and Series' },
        subjectId: 'Mathematics',
        gradeLevel: 12,
        chapterNumber: 1,
        contentHtml: { en: `Arithmetic and Geometric progressions; sigma notation; infinite series. 
        - AP nth term: a + (n-1)d.
        - GP nth term: a * r^(n-1).
        - Infinite GP sum: a / (1-r) where |r| < 1.` },
        keyFormulas: ['Sn = n/2 (a + l)', 'S = a / (1-r)'],
        diagrams: [],
        estimatedReadTime: 15,
        difficulty: 'MEDIUM',
        isBookmarked: false,
        stream: Stream.NATURAL
      }
    ];

    const initialQuestions: Question[] = [
      // English EUEE Questions
      {
        id: 'eng_q_sva_1',
        subjectId: 'English',
        topicId: 'SVA',
        text: { en: 'Neither the teacher nor the students __________ happy with the results.' },
        options: [
          { id: 'A', text: { en: 'is' } },
          { id: 'B', text: { en: 'are' } },
          { id: 'C', text: { en: 'were' } },
          { id: 'D', text: { en: 'has been' } }
        ],
        correctAnswer: 'B',
        explanation: { en: 'In "neither...nor" structures, the verb agrees with the nearest subject. "Students" is plural, so "are" is correct.' },
        difficulty: 'MEDIUM',
        source: 'EUEE_PAST_EXAM'
      },
      // Math Natural Questions
      {
        id: 'math_nat_q_calc_1',
        subjectId: 'Mathematics',
        topicId: 'Calculus',
        text: { en: 'What is the derivative of f(x) = x^2 + 3x?' },
        options: [
          { id: 'A', text: { en: 'x + 3' } },
          { id: 'B', text: { en: '2x + 3' } },
          { id: 'C', text: { en: '2x' } },
          { id: 'D', text: { en: '3x^2' } }
        ],
        correctAnswer: 'B',
        explanation: { en: 'Using the Power Rule: d/dx(x^2) = 2x and d/dx(3x) = 3.' },
        difficulty: 'EASY',
        source: 'CURRICULUM_BASED'
      }
    ];

    await this.saveNotes(initialNotes);
    await this.saveQuestions(initialQuestions);
  }
};
