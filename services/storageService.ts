import { User, Stream, GlobalDirective, AccessToken, ConceptNode, Exam, ExamSubmission, AuditEntry, PrestigeTier, HistoricalQuestion, ReviewEvent, ConceptMastery, StudyGoal } from '../types.ts';

const PREFIX = 'luwa_v2_';
const SALT = '_luwa_secured';

// High-Fidelity Curriculum Data aligned with Ethiopian Grade 12 Syllabus
const CURRICULUM_GRAPH: ConceptNode[] = [
  // --- Natural Science Core ---
  { id: 'phy_12_1', topic: 'Circular Motion', subject: 'Physics', difficulty: 'hard', prerequisites: [], importanceScore: 0.95, description: 'Uniform circular motion, centripetal acceleration, and bank curves.', summaryNote: 'Centripetal force F = mv^2/r. Angular velocity w = v/r.' },
  { id: 'phy_12_2', topic: 'Electromagnetic Induction', subject: 'Physics', difficulty: 'hard', prerequisites: ['phy_12_1'], importanceScore: 0.98, description: 'Faraday’s law, Lenz’s law, and AC generators.', summaryNote: 'Induced EMF = -N(dPhi/dt).' },
  { id: 'chem_12_1', topic: 'Chemical Equilibrium', subject: 'Chemistry', difficulty: 'medium', prerequisites: [], importanceScore: 0.88, description: 'Dynamic equilibrium, Le Chatelier’s principle, and Kc calculations.', summaryNote: 'Kc = [Products]/[Reactants]. Equilibrium shifts to counteract change.' },
  { id: 'chem_12_2', topic: 'Acid-Base Equilibria', subject: 'Chemistry', difficulty: 'hard', prerequisites: ['chem_12_1'], importanceScore: 0.94, description: 'pH scale, buffers, and titration curves.', summaryNote: 'pH = -log[H+]. Ka * Kb = Kw.' },
  { id: 'math_12_1', topic: 'Limits and Continuity', subject: 'Mathematics', difficulty: 'medium', prerequisites: [], importanceScore: 1.0, description: 'Foundations of calculus, limits at infinity, and continuous functions.', summaryNote: 'Limit exists if LHL = RHL.' },
  { id: 'math_12_2', topic: 'Derivatives', subject: 'Mathematics', difficulty: 'hard', prerequisites: ['math_12_1'], importanceScore: 1.0, description: 'Chain rule, implicit differentiation, and optimization.', summaryNote: 'Power rule: d/dx(x^n) = nx^(n-1).' },
  { id: 'bio_12_1', topic: 'Cell Biology', subject: 'Biology', difficulty: 'medium', prerequisites: [], importanceScore: 0.85, description: 'Cell structure, organelle functions, and membrane transport.', summaryNote: 'Mitochondria: ATP synthesis. Ribosomes: Protein synthesis.' },
  { id: 'bio_12_2', topic: 'Genetics', subject: 'Biology', difficulty: 'hard', prerequisites: ['bio_12_1'], importanceScore: 0.96, description: 'Mendelian inheritance, DNA replication, and biotechnology.', summaryNote: 'A-T, G-C pairs. Transcription: DNA to mRNA.' },
  
  // --- Social Science Core ---
  { id: 'hist_12_1', topic: 'The Formation of Ethiopia', subject: 'History', difficulty: 'easy', prerequisites: [], importanceScore: 0.9, description: 'State formation and unification process under Tewodros II.', summaryNote: 'Tewodros II: Modernization and unification.' },
  { id: 'geog_12_1', topic: 'Climate of Ethiopia', subject: 'Geography', difficulty: 'medium', prerequisites: [], importanceScore: 0.85, description: 'Relief features, rainfall patterns, and agricultural seasons.', summaryNote: 'Meher: Long rain season. Belg: Short rain season.' },
  { id: 'econ_12_1', topic: 'National Income Accounting', subject: 'Economics', difficulty: 'medium', prerequisites: [], importanceScore: 0.92, description: 'GDP, GNP, and methods of calculating national income.', summaryNote: 'GDP = C + I + G + (X - M).' },
  
  // --- Common Subjects ---
  { id: 'eng_12_1', topic: 'Grammar and Usage', subject: 'English', difficulty: 'medium', prerequisites: [], importanceScore: 1.0, description: 'Tenses, conditionals, and active/passive voice.', summaryNote: 'If + past, would + base (Type 2 conditional).' },
  { id: 'sat_12_1', topic: 'Verbal Reasoning', subject: 'SAT', difficulty: 'hard', prerequisites: [], importanceScore: 1.0, description: 'Analogy, sentence completion, and critical reading.', summaryNote: 'Look for context clues and tonal shifts.' }
];

export const storageService = {
  hashPassword: (password: string) => btoa(password + SALT),

  saveUser: (user: User) => {
    const allUsers = storageService.getAllUsers();
    const index = allUsers.findIndex(u => u.id === user.id);
    if (index > -1) allUsers[index] = user;
    else allUsers.push(user);
    localStorage.setItem(`${PREFIX}all_users`, JSON.stringify(allUsers));
    storageService.logAction(user.id, user.name, 'USER_UPDATE', `Registry updated for ${user.name}`, 'info');
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem(`${PREFIX}all_users`);
    const users = data ? JSON.parse(data) : [];
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: 'admin-1', email: 'admin@luwa.academy', passwordHash: btoa('admin123' + SALT),
        token: 'ROOT-ACCESS', name: 'Registry Administrator', role: 'admin', stream: Stream.NATURAL,
        grade: 'N/A', targetYear: '2026', xp: 0, level: 'Strategist', prestige: 'Sovereign',
        weakConcepts: [], currentObjective: 'System Oversight', quizHistory: [], questionLedger: [], 
        achievements: [], streak: 1, masteryRecord: {}, lifecycleStage: 'Ready', readiness: 100,
        health: { burnoutRisk: 0, engagementScore: 1, consistencyLevel: 1, status: 'Vibrant' },
        preferredLanguage: 'en', studyGoals: [], bookmarks: []
      };
      users.push(defaultAdmin);
      localStorage.setItem(`${PREFIX}all_users`, JSON.stringify(users));
    }
    return users;
  },

  getUserByEmail: (email: string): User | undefined => {
    return storageService.getAllUsers().find(u => u.email === email);
  },

  setSession: (user: User) => localStorage.setItem(`${PREFIX}session`, JSON.stringify(user)),
  getSession: (): User | null => {
    const data = localStorage.getItem(`${PREFIX}session`);
    return data ? JSON.parse(data) : null;
  },
  logout: () => localStorage.removeItem(`${PREFIX}session`),

  logAction: (userId: string, userName: string, action: string, detail: string, severity: 'info' | 'warning' | 'critical') => {
    const logs: AuditEntry[] = JSON.parse(localStorage.getItem(`${PREFIX}audit`) || '[]');
    logs.push({ id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), userId, userName, action, detail, severity });
    localStorage.setItem(`${PREFIX}audit`, JSON.stringify(logs.slice(-500)));
  },

  getAuditLogs: (): AuditEntry[] => JSON.parse(localStorage.getItem(`${PREFIX}audit`) || '[]'),
  
  getExams: (): Exam[] => JSON.parse(localStorage.getItem(`${PREFIX}exams`) || '[]'),
  saveExam: (exam: Exam) => {
    const exams = storageService.getExams();
    exams.push(exam);
    localStorage.setItem(`${PREFIX}exams`, JSON.stringify(exams));
  },

  getSubmissions: (): ExamSubmission[] => JSON.parse(localStorage.getItem(`${PREFIX}submissions`) || '[]'),
  saveSubmission: (sub: ExamSubmission) => {
    const subs = storageService.getSubmissions();
    subs.push(sub);
    localStorage.setItem(`${PREFIX}submissions`, JSON.stringify(subs));
  },

  getDirectives: (): GlobalDirective[] => JSON.parse(localStorage.getItem(`${PREFIX}directives`) || '[]'),
  saveDirective: (d: GlobalDirective) => {
    const ds = storageService.getDirectives();
    localStorage.setItem(`${PREFIX}directives`, JSON.stringify([d, ...ds].slice(0, 10)));
  },

  getTokens: (): AccessToken[] => JSON.parse(localStorage.getItem(`${PREFIX}tokens`) || '[]'),
  generateToken: () => {
    const code = `LUWA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const tokens = storageService.getTokens();
    tokens.push({ code, isUsed: false, createdAt: Date.now() });
    localStorage.setItem(`${PREFIX}tokens`, JSON.stringify(tokens));
    return code;
  },
  validateAndUseToken: (code: string, userId: string) => {
    const tokens = storageService.getTokens();
    const t = tokens.find(t => t.code === code && !t.isUsed);
    if (t) {
      t.isUsed = true;
      t.usedBy = userId;
      localStorage.setItem(`${PREFIX}tokens`, JSON.stringify(tokens));
      return true;
    }
    return code === 'LUWA-PREVIEW';
  },

  getSubjects: (stream: Stream) => stream === Stream.NATURAL 
    ? ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'SAT'] 
    : ['Mathematics', 'History', 'Geography', 'Economics', 'English', 'SAT'],

  getLeverageTask: (user: User) => {
    const relevant = CURRICULUM_GRAPH.filter(n => {
      const subs = storageService.getSubjects(user.stream);
      return subs.includes(n.subject);
    });
    return { node: relevant[0] || CURRICULUM_GRAPH[0], status: 'Ready' };
  },

  getPersonalizedSuggestions: (user: User) => [
    { id: '1', type: 'Advancement', title: 'Circular Motion Lab', desc: 'New high-yield content available for Natural Science scholars.', xp: 200 },
    { id: '2', type: 'Revision', title: 'English Grammar Synthesis', desc: 'Identify patterns in past SAT sections.', xp: 150 }
  ],

  addToLedger: (user: User, entry: { question: string, answer: string }): User => {
    const newEntry: HistoricalQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      question: entry.question,
      answer: entry.answer,
      timestamp: Date.now(),
      lang: user.preferredLanguage
    };
    const updated = { ...user, questionLedger: [newEntry, ...(user.questionLedger || [])].slice(0, 50) };
    storageService.saveUser(updated);
    return updated;
  },

  getFullCurriculum: (): ConceptNode[] => CURRICULUM_GRAPH,

  updateMastery: (user: User, conceptId: string, topic: string, outcome: 'correct' | 'wrong', effort: number): User => {
    const masteryRecord = { ...user.masteryRecord };
    let mastery = masteryRecord[conceptId];
    
    if (!mastery) {
      mastery = {
        id: conceptId,
        topic,
        difficulty: 'medium',
        lastReviewed: Date.now(),
        retentionScore: 0.5,
        scheduledNextReview: Date.now() + 86400000,
        reviewHistory: [],
        interval: 1,
        adaptiveLevel: 1
      };
    }

    const review: ReviewEvent = { date: Date.now(), outcome, effortScore: effort };
    mastery.reviewHistory = [...mastery.reviewHistory, review];
    mastery.lastReviewed = Date.now();
    
    if (outcome === 'correct') {
      mastery.retentionScore = Math.min(1, mastery.retentionScore + 0.1);
      mastery.adaptiveLevel = Math.min(5, mastery.adaptiveLevel + (effort > 0.7 ? 1 : 0));
    } else {
      mastery.retentionScore = Math.max(0, mastery.retentionScore - 0.15);
    }

    masteryRecord[conceptId] = mastery;
    return { ...user, masteryRecord };
  },

  checkAchievements: (user: User): User => {
    const achievements = [...user.achievements];
    if (user.xp >= 1000 && !achievements.some(a => a.id === '1000xp')) {
      achievements.push({ id: '1000xp', title: 'Scholar Initiate', icon: '🎓', unlockedAt: Date.now(), description: 'Reached 1000 XP in the registry.' });
    }
    return { ...user, achievements };
  },

  getCohortStats: () => ({ avgXp: 2500 }),

  calculateLevel: (xp: number): 'Initiate' | 'Builder' | 'Strategist' => xp >= 5000 ? 'Strategist' : xp >= 1000 ? 'Builder' : 'Initiate',
  calculatePrestige: (xp: number): PrestigeTier => xp >= 10000 ? 'Sovereign' : 'Bronze',
  calculateHealth: (user: User) => ({ burnoutRisk: 0, engagementScore: 1, consistencyLevel: 1, status: 'Vibrant' as const }),
  enterSimulation: (u: User) => localStorage.setItem(`${PREFIX}sim_user`, JSON.stringify(u)),
  exitSimulation: () => localStorage.removeItem(`${PREFIX}sim_user`),
  isSimulating: () => !!localStorage.getItem(`${PREFIX}sim_user`)
};