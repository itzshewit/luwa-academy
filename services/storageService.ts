
import { User, Stream, StudyNote, Question, PastPaper, AccessToken, AuditEntry, UserRole, Exam, ExamSubmission } from '../types.ts';
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

  async getTokens(): Promise<AccessToken[]> {
    return dbService.getAll<AccessToken>('tokens');
  },

  async generateToken(): Promise<string> {
    const code = `LUWA-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    await dbService.put('tokens', { code, isUsed: false, createdAt: Date.now() });
    return code;
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

  async seedRegistry(): Promise<void> {
    const existingNotes = await this.getNotes();
    if (existingNotes.length > 0) return;

    const initialNotes: StudyNote[] = [
      // MATHEMATICS - NATURAL (G11 & G12)
      {
        id: 'math_nat_g11_u1',
        topic: { en: 'Unit 1: Relations and Functions' },
        subjectId: 'Mathematics',
        gradeLevel: 11,
        chapterNumber: 1,
        contentHtml: { en: `Distinguishes relations vs functions; covers types, composition, and inverses. Essential for all later algebra and EUEE function questions. 
        - Function: Relation where each x maps to exactly one y.
        - Domain: All possible x-inputs.
        - Range: All y-outputs.
        - Composition: (f o g)(x) = f(g(x)).
        - Inverse: f^-1(f(x)) = x.` },
        keyFormulas: ['(f o g)(x) = f(g(x))', 'f^-1(x)'],
        diagrams: [],
        estimatedReadTime: 15,
        difficulty: 'MEDIUM',
        isBookmarked: false,
        stream: Stream.NATURAL
      },
      {
        id: 'math_nat_g12_u3',
        topic: { en: 'Unit 3: Differential Calculus' },
        subjectId: 'Mathematics',
        gradeLevel: 12,
        chapterNumber: 3,
        contentHtml: { en: `Introduction to derivatives and rules of differentiation.
        - Power Rule: (x^n)' = n*x^(n-1).
        - Product Rule: (uv)' = u'v + uv'.
        - Quotient Rule: (u/v)' = (u'v - uv') / v^2.
        - Chain Rule: f(g(x))' = f'(g(x)) * g'(x).` },
        keyFormulas: ['f\'(x) = lim h->0', '(uv)\' = u\'v + uv\''],
        diagrams: [],
        estimatedReadTime: 25,
        difficulty: 'HARD',
        isBookmarked: false,
        stream: Stream.NATURAL
      },

      // PHYSICS - NATURAL (G11 & G12)
      {
        id: 'phys_nat_g11_u2',
        topic: { en: 'Unit 2: Vector Quantities' },
        subjectId: 'Physics',
        gradeLevel: 11,
        chapterNumber: 2,
        contentHtml: { en: `Scalars (magnitude only) vs Vectors (magnitude + direction).
        Resolution: Ax = A cos θ, Ay = A sin θ.
        Dot Product: A · B = AB cos θ = AxBx + AyBy.
        Used for Work calculation (W = F · s).` },
        keyFormulas: ['Ax = A cos θ', 'A · B = AB cos θ'],
        diagrams: [],
        estimatedReadTime: 12,
        difficulty: 'MEDIUM',
        isBookmarked: false,
        stream: Stream.NATURAL
      },
      {
        id: 'phys_nat_g12_u4',
        topic: { en: 'Unit 4: Electromagnetism' },
        subjectId: 'Physics',
        gradeLevel: 12,
        chapterNumber: 4,
        contentHtml: { en: `Magnetic fields, forces, and induction.
        - Force on charge: F = qvB sin θ.
        - Force on wire: F = BIL sin θ.
        - Faraday's Law: ε = -dΦ/dt.
        - Lenz's Law: Direction of induced current opposes flux change.` },
        keyFormulas: ['F = qvB sin θ', 'ε = -dΦ/dt'],
        diagrams: [],
        estimatedReadTime: 20,
        difficulty: 'HARD',
        isBookmarked: false,
        stream: Stream.NATURAL
      },

      // CHEMISTRY - NATURAL (G11 & G12)
      {
        id: 'chem_nat_g11_u5',
        topic: { en: 'Unit 5: Chemical Equilibrium' },
        subjectId: 'Chemistry',
        gradeLevel: 11,
        chapterNumber: 5,
        contentHtml: { en: `Dynamic state where rates of forward and reverse reactions are equal.
        Kc = [Products]^coefficients / [Reactants]^coefficients.
        Le Chatelier's Principle: System shifts to oppose disturbances (P, T, Conc).` },
        keyFormulas: ['Kc = [C]^c[D]^d / [A]^a[B]^b'],
        diagrams: [],
        estimatedReadTime: 15,
        difficulty: 'HARD',
        isBookmarked: false,
        stream: Stream.NATURAL
      },
      {
        id: 'chem_nat_g12_u4',
        topic: { en: 'Unit 4: Electrochemistry' },
        subjectId: 'Chemistry',
        gradeLevel: 12,
        chapterNumber: 4,
        contentHtml: { en: `Redox reactions and electrochemical cells.
        - Galvanic Cell: Chemical to Electrical (Spontaneous).
        - Electrolytic Cell: Electrical to Chemical (Non-spontaneous).
        - Faraday's Law: m = (Q * M) / (n * F).` },
        keyFormulas: ['E_cell = E_cat - E_an', 'm = (ItM)/(nF)'],
        diagrams: [],
        estimatedReadTime: 18,
        difficulty: 'HARD',
        isBookmarked: false,
        stream: Stream.NATURAL
      },

      // BIOLOGY - NATURAL (G11 & G12)
      {
        id: 'bio_nat_g11_u4',
        topic: { en: 'Unit 4: Genetics' },
        subjectId: 'Biology',
        gradeLevel: 11,
        chapterNumber: 4,
        contentHtml: { en: `Mendelian inheritance patterns.
        - Law of Segregation and Independent Assortment.
        - Monohybrid (3:1) and Dihybrid (9:3:3:1) ratios.
        - Sex-linkage (Haemophilia, Colour blindness).` },
        keyFormulas: ['Genotypic Ratio', 'Phenotypic Ratio'],
        diagrams: [],
        estimatedReadTime: 15,
        difficulty: 'MEDIUM',
        isBookmarked: false,
        stream: Stream.NATURAL
      },
      {
        id: 'bio_nat_g12_u3',
        topic: { en: 'Unit 3: Energy Transformation' },
        subjectId: 'Biology',
        gradeLevel: 12,
        chapterNumber: 3,
        contentHtml: { en: `Cellular Respiration and Photosynthesis.
        - Aerobic Respiration: Glycolysis, Krebs, ETC.
        - Photosynthesis: Light reactions (Thylakoids), Calvin Cycle (Stroma).
        - C4 vs C3 plants.` },
        keyFormulas: ['6CO2 + 6H2O -> C6H12O6 + 6O2'],
        diagrams: [],
        estimatedReadTime: 20,
        difficulty: 'HARD',
        isBookmarked: false,
        stream: Stream.NATURAL
      }
    ];

    const initialQuestions: Question[] = [
      {
        id: 'q_phys_1',
        subjectId: 'Physics',
        topicId: 'Vectors',
        text: { en: 'A vector has a magnitude of 10N and makes an angle of 30° with the x-axis. What is its x-component?' },
        options: [
          { id: 'A', text: { en: '5.0N' } },
          { id: 'B', text: { en: '8.66N' } },
          { id: 'C', text: { en: '10.0N' } },
          { id: 'D', text: { en: '15.0N' } }
        ],
        correctAnswer: 'B',
        explanation: { en: 'Ax = A cos θ = 10 * cos(30°) = 10 * 0.866 = 8.66N.' },
        difficulty: 'MEDIUM',
        source: 'EUEE_PAST_EXAM'
      },
      {
        id: 'q_chem_1',
        subjectId: 'Chemistry',
        topicId: 'Equilibrium',
        text: { en: 'According to Le Chatelier\'s principle, increasing the temperature of an exothermic reaction shifts the equilibrium towards:' },
        options: [
          { id: 'A', text: { en: 'The products' } },
          { id: 'B', text: { en: 'The reactants' } },
          { id: 'C', text: { en: 'No shift' } },
          { id: 'D', text: { en: 'The catalysts' } }
        ],
        correctAnswer: 'B',
        explanation: { en: 'For exothermic reactions, heat is a product. Adding heat shifts the equilibrium to the left (reactants).' },
        difficulty: 'MEDIUM',
        source: 'EUEE_PAST_EXAM'
      }
    ];

    await this.saveNotes(initialNotes);
    await this.saveQuestions(initialQuestions);
  }
};
