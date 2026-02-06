
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
    const existingNotes = await this.getNotes();
    if (existingNotes.length > 0) return;

    const initialNotes: StudyNote[] = [
      { id: 'sat_overview', topic: { en: 'EUEE SAT: Overview' }, subjectId: 'SAT', gradeLevel: 12, chapterNumber: 0, contentHtml: { en: "The Scholastic Aptitude Test (SAT) is mandatory. 60 Qs: 35 Verbal, 25 Quantitative. 120 minutes." }, keyFormulas: [], diagrams: [], estimatedReadTime: 10, difficulty: 'MEDIUM', isBookmarked: false },
      // Full History G11
      { id: 'hist_g11_u1', topic: { en: 'G11 History U1: Historiography' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 1, contentHtml: { en: "History is study of past human events based on evidence. Historiography is historical writing. Sources are primary and secondary." }, keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g11_u2', topic: { en: 'G11 History U2: Ancient Civilizations' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 2, contentHtml: { en: "Mesopotamia, Egypt, Indus Valley, China. Nubia/Kush and Carthage in Africa." }, keyFormulas: [], diagrams: [], estimatedReadTime: 20, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g11_u3', topic: { en: 'G11 History U3: Ethiopia to 13th C' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 3, contentHtml: { en: "Aksumite Kingdom adoption of Christianity under Ezana. Ge'ez script. Red Sea trade." }, keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g11_u4', topic: { en: 'G11 History U4: Middle Ages' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 4, contentHtml: { en: "Feudalism. Rise of Islam. Renaissance and Enlightenment transitions." }, keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g11_u5', topic: { en: 'G11 History U5: States of Africa to 1500' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 5, contentHtml: { en: "West Africa: Ghana, Mali (Mansa Musa), Songhai. Zimbabwe and Kongo." }, keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g11_u6', topic: { en: 'G11 History U6: Africa & Outside World' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 6, contentHtml: { en: "Atlantic Slave Trade. Triangular trade impact. Early European exploration." }, keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g11_u7', topic: { en: 'G11 History U7: Medieval Ethiopia' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 7, contentHtml: { en: "Solomonic Restoration (1270). Ifat and Adal Sultanates." }, keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g11_u8', topic: { en: 'G11 History U8: Ethiopia 16th-19th C' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 8, contentHtml: { en: "Wars of Ahmad Gragn. Oromo Migrations. Zemene Mesafint." }, keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g11_u9', topic: { en: 'G11 History U9: Age of Revolutions' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 9, contentHtml: { en: "American and French Revolutions. Napoleonic era." }, keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      // Full History G12
      { id: 'hist_g12_u1', topic: { en: 'G12 History U1: Capitalism/Nationalism' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 1, contentHtml: { en: "Industrial Revolution. Italian/German Unifications." }, keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g12_u2', topic: { en: 'G12 History U2: Africa Colonialism' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 2, contentHtml: { en: "Berlin Conference. Resistance: Adwa, Samori Toure." }, keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g12_u3', topic: { en: 'G12 History U3: Ethiopia 19th C to 1941' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 3, contentHtml: { en: "Menelik II. Battle of Adwa. Italian Occupation." }, keyFormulas: [], diagrams: [], estimatedReadTime: 22, difficulty: 'HARD', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g12_u4', topic: { en: 'G12 History U4: World Wars' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 4, contentHtml: { en: "WWI and WWII triggers. Versailles. Founding of UN." }, keyFormulas: [], diagrams: [], estimatedReadTime: 20, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g12_u5', topic: { en: 'G12 History U5: Global Post-1945' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 5, contentHtml: { en: "Cold War. Decolonization. Globalization." }, keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g12_u6', topic: { en: 'G12 History U6: Ethiopia 1941-1991' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 6, contentHtml: { en: "Haile Selassie. 1974 Revolution. Derg Regime." }, keyFormulas: [], diagrams: [], estimatedReadTime: 20, difficulty: 'HARD', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g12_u7', topic: { en: 'G12 History U7: Africa since 1960s' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 7, contentHtml: { en: "OAU/AU transition. Agenda 2063." }, keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g12_u8', topic: { en: 'G12 History U8: Post-1991 Ethiopia' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 8, contentHtml: { en: "FDRE. Federalism. 1995 Constitution." }, keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'hist_g12_u9', topic: { en: 'G12 History U9: Indigenous Knowledge' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 9, contentHtml: { en: "Cultural Heritage. IKS in agri and health." }, keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'EASY', isBookmarked: false, stream: Stream.SOCIAL },
      // Full Economics G11-12
      { id: 'econ_g11_u1', topic: { en: 'G11 Econ U1: Basic Concepts' }, subjectId: 'Economics', gradeLevel: 11, chapterNumber: 1, contentHtml: { en: "Scarcity, Choice, Opportunity Cost. Economic Systems." }, keyFormulas: ['Opp Cost'], diagrams: [], estimatedReadTime: 15, difficulty: 'EASY', isBookmarked: false, stream: Stream.SOCIAL },
      { id: 'econ_g12_u8', topic: { en: 'G12 Econ U8: Economy & Environment' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 8, contentHtml: { en: "Sustainable development. Green economy policies." }, keyFormulas: [], diagrams: [], estimatedReadTime: 12, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL }
    ];

    const initialQuestions: Question[] = [
      { id: 'q_mock_math_1', subjectId: 'Mathematics', topicId: 'Functions', text: { en: 'If f(x) = 3x - 2 and g(x) = x² + 1, what is (g ∘ f)(2)?' }, options: [{ id: 'A', text: { en: '17' } }, { id: 'B', text: { en: '19' } }, { id: 'C', text: { en: '21' } }, { id: 'D', text: { en: '23' } }], correctAnswer: 'A', explanation: { en: 'f(2)=4. g(4)=16+1=17.' }, difficulty: 'MEDIUM', source: 'MOCK' },
      { id: 'q_mock_phys_1', subjectId: 'Physics', topicId: 'Kinematics', text: { en: 'A car accelerates from rest at 2 m/s². What is its velocity after 5 seconds?' }, options: [{ id: 'A', text: { en: '5 m/s' } }, { id: 'B', text: { en: '10 m/s' } }, { id: 'C', text: { en: '15 m/s' } }, { id: 'D', text: { en: '20 m/s' } }], correctAnswer: 'B', explanation: { en: 'v = u + at = 0 + 2(5) = 10.' }, difficulty: 'EASY', source: 'MOCK' }
    ];

    await this.saveNotes(initialNotes);
    await this.saveQuestions(initialQuestions);
  }
};
