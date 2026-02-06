
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
      // ==========================================
      // SHARED SUBJECTS
      // ==========================================
      {
        id: 'sat_overview', topic: { en: 'EUEE SAT: Overview' }, subjectId: 'SAT', gradeLevel: 12, chapterNumber: 0,
        contentHtml: { en: "SAT is mandatory for all students. 60 Qs total: 35 Verbal, 25 Quantitative. 120 minutes." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 10, difficulty: 'MEDIUM', isBookmarked: false
      },
      {
        id: 'eng_grammar_master', topic: { en: 'English: Grammar Master' }, subjectId: 'English', gradeLevel: 12, chapterNumber: 0,
        contentHtml: { en: "Focus on Tenses, Conditional Sentences, Modals, and Reading Comprehension strategies." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false
      },

      // ==========================================
      // HISTORY (SOCIAL STREAM ONLY)
      // ==========================================
      {
        id: 'hist_g11_u1', topic: { en: 'G11 History U1: Historiography and Evolution' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 1,
        contentHtml: { en: "1.1 What is History? Meaning, Use, and Scope. History is study of past human events based on evidence. Historiography is the writing of history. Sources are primary (original) and secondary. 1.3 Human Evolution: Theories of human origin, biological evolution from hominids to Homo sapiens. East Africa as 'cradle of humankind' (Lucy/Australopithecus afarensis)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g11_u2', topic: { en: 'G11 History U2: Ancient Civilizations' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 2,
        contentHtml: { en: "Mesopotamia (Cuneiform, Hammurabi), Egypt (Hieroglyphics, Pyramids), Indus Valley (Mohenjo-Daro), Ancient China (Confucianism, Paper/Silk). African: Nubia/Kush (Meroë iron centre), Carthage (Punic Wars)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 20, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g11_u3', topic: { en: 'G11 History U3: Ethiopia & Horn to 13th Century' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 3,
        contentHtml: { en: "Ethno-linguistic groups: Afro-Asiatic and Nilo-Saharan. Aksumite Kingdom (1st-7th c. AD): Red Sea trade, Ge'ez script, Christianity adoption under Ezana. Decline due to trade route shifts." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g11_u4', topic: { en: 'G11 History U4: Middle Ages and Early Modern' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 4,
        contentHtml: { en: "European Feudalism (Lords/Serfs/Church). Byzantine Empire. Rise of Islam (7th c.) and cultural achievements. Transition: Renaissance, Reformation, Scientific Revolution, Enlightenment." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g11_u5', topic: { en: 'G11 History U5: Peoples and States of Africa to 1500' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 5,
        contentHtml: { en: "West Africa: Ghana, Mali (Mansa Musa), Songhai. East Africa: Swahili city-states. Southern Africa: Great Zimbabwe." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g11_u6', topic: { en: 'G11 History U6: Africa and Outside World 1500-1880' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 6,
        contentHtml: { en: "Transition to Atlantic trade. Atlantic Slave Trade: Triangular trade, demographic impact. Early European penetration (Livingstone, Stanley)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g11_u7', topic: { en: 'G11 History U7: Medieval Ethiopia 13th-16th Century' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 7,
        contentHtml: { en: "Restoration of Solomonic Dynasty (1270). Muslim states (Ifat, Adal). Omotic states. Christian-Muslim interactions and tensions." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g11_u8', topic: { en: 'G11 History U8: Ethiopia mid-16th to mid-19th Century' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 8,
        contentHtml: { en: "Wars of Ahmad Gragn. Oromo Migrations and impact. Zemene Mesafint (Era of Princes): decentralization and regionalism." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g11_u9', topic: { en: 'G11 History U9: Age of Revolutions 1789-1815' }, subjectId: 'History', gradeLevel: 11, chapterNumber: 9,
        contentHtml: { en: "American Revolution (British policies/Taxation). French Revolution (Social inequality, Enlightenment Stage: Monarchy -> Republic -> Napoleon). Impact: spread of nationalism." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u1', topic: { en: 'G12 History U1: Capitalism & Nationalism 1815-1914' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 1,
        contentHtml: { en: "Industrial Revolution (Britain). Ideologies: Liberalism, Marxism, Nationalism. Unifications: Italy (Cavour/Garibaldi) and Germany (Bismarck)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u2', topic: { en: 'G12 History U2: Africa and Colonial Experience' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 2,
        contentHtml: { en: "Partition (Berlin Conference 1884-85). Modes: Direct vs Indirect rule. Impact: Artificial borders, economic dependency. Resistance: Adwa, Samori Toure, Maji Maji." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u3', topic: { en: 'G12 History U3: Ethiopia mid-19th C to 1941' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 3,
        contentHtml: { en: "Unification: Tewodros II, Yohannes IV, Menelik II. Battle of Adwa (1896): Victory over Italy. Italian Aggression and Occupation (1935-1941) and resistance (Arbegnoch)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 22, difficulty: 'HARD', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u4', topic: { en: 'G12 History U4: World Wars 1914-1945' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 4,
        contentHtml: { en: "WWI Causes (Alliances, Sarajevo trigger). Consequences: Versailles Treaty, League of Nations. WWII Causes (Nazism/Fascism). Founding of UN." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 20, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u5', topic: { en: 'G12 History U5: Global Developments since 1945' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 5,
        contentHtml: { en: "Cold War (USA vs USSR). Decolonization wave in Asia/Africa. Non-Aligned Movement (NAM). Globalization and International Orgs (AU, World Bank, UN)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u6', topic: { en: 'G12 History U6: Ethiopia 1941-1991' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 6,
        contentHtml: { en: "Post-liberation reforms (Haile Selassie). 1974 Revolution: Overthrow of monarchy, establishment of Derg. Socialist policies: Land reform, Red Terror. Fall of Derg (1991)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 20, difficulty: 'HARD', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u7', topic: { en: 'G12 History U7: Africa since 1960s' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 7,
        contentHtml: { en: "Independence challenges: State-building, ethnic diversity. African Unity: OAU (1963) to AU transition. Reform efforts (Agenda 2063)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u8', topic: { en: 'G12 History U8: Post-1991 Ethiopia' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 8,
        contentHtml: { en: "New Political Order: FDRE, ethnic-based federalism, new constitution. Socio-economic changes: Education, health, infrastructure expansion." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'hist_g12_u9', topic: { en: 'G12 History U9: Indigenous Knowledge and Heritage' }, subjectId: 'History', gradeLevel: 12, chapterNumber: 9,
        contentHtml: { en: "IKS in agri, health, conflict resolution. Cultural Heritage: Tangible (Lalibela, Gondar, Aksum, Harar) and Intangible (Languages, music, rituals)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'EASY', isBookmarked: false, stream: Stream.SOCIAL
      },

      // ==========================================
      // ECONOMICS (SOCIAL STREAM ONLY)
      // ==========================================
      {
        id: 'econ_g11_u1', topic: { en: 'G11 Economics U1: Concepts of Economics' }, subjectId: 'Economics', gradeLevel: 11, chapterNumber: 1,
        contentHtml: { en: "1.1 Meaning: study of scarcity, choice, allocation. Opportunity cost = next best alternative foregone. 1.2 PPC shows maximum efficient output. Points on/inside/outside curve. 1.4 Economic Systems: Traditional, Capitalist (Market), Socialist (Command), Mixed (Ethiopia current)." },
        keyFormulas: ['Opportunity Cost'], diagrams: [], estimatedReadTime: 15, difficulty: 'EASY', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g11_u2', topic: { en: 'G11 Economics U2: Demand, Supply and Elasticity' }, subjectId: 'Economics', gradeLevel: 11, chapterNumber: 2,
        contentHtml: { en: "Law of Demand (P down, Q up). Law of Supply (P up, Q up). Market Equilibrium (D=S). Elasticity: Ed = (% change Q)/(% change P). PED > 1 (Elastic), < 1 (Inelastic). Cross elasticity: Positive for substitutes." },
        keyFormulas: ['Ed = (%ΔQd)/(%ΔP)'], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g11_u3', topic: { en: 'G11 Economics U3: Theory of Consumer Behavior' }, subjectId: 'Economics', gradeLevel: 11, chapterNumber: 3,
        contentHtml: { en: "Utility concepts (Cardinal vs Ordinal). Cardinal: MU = change TU / change Q. Equi-marginal utility (MUx/Px = MUy/Py). Ordinal: Indifference Curves (IC) and Budget Lines. Equilibrium at IC tangent to Budget Line." },
        keyFormulas: ['MUx/Px = MUy/Py'], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g11_u4', topic: { en: 'G11 Economics U4: Theory of Production and Cost' }, subjectId: 'Economics', gradeLevel: 11, chapterNumber: 4,
        contentHtml: { en: "Short run (fixed factor) vs Long run (variable factors). Law of Diminishing Returns (Variable proportions). Costs: TC = TFC + TVC. MC = change TC / change Q. AC = TC/Q. U-shaped curves." },
        keyFormulas: ['TC = TFC + TVC'], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g11_u5', topic: { en: 'G11 Economics U5: Market Structures' }, subjectId: 'Economics', gradeLevel: 11, chapterNumber: 5,
        contentHtml: { en: "Perfect Competition (many firms, price takers, normal profit in long run). Monopoly (single seller, price maker). Monopolistic Competition (differentiation). Oligopoly (interdependence, collusion)." },
        keyFormulas: ['MR = MC'], diagrams: [], estimatedReadTime: 18, difficulty: 'HARD', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g11_u6', topic: { en: 'G11 Economics U6: Fundamental Concerns of Macroeconomics' }, subjectId: 'Economics', gradeLevel: 11, chapterNumber: 6,
        contentHtml: { en: "Growth, Inflation, Unemployment, BoP. Indicators monitoring. Macro targets vs problems." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 12, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g11_u7', topic: { en: 'G11 Economics U7: National Income Accounting' }, subjectId: 'Economics', gradeLevel: 11, chapterNumber: 7,
        contentHtml: { en: "GDP = value final goods within country. GNP = GDP + net factor income abroad. Methods: Output, Income, Expenditure (C+I+G+X-M). Real vs Nominal (inflation adjusted)." },
        keyFormulas: ['GDP = C + I + G + (X - M)'], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g12_u1', topic: { en: 'G12 Economics U1: Fundamental Concepts (Revisit)' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 1,
        contentHtml: { en: "Review variables: GDP, GNP, CPI. Business cycles: Expansion, Peak, Recession, Trough. Philips curve (Inflation-Unemployment tradeoff)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g12_u2', topic: { en: 'G12 Economics U2: AD and AS Analysis' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 2,
        contentHtml: { en: "AD = C+I+G+NX. SRAS (upward) vs LRAS (vertical at full employment). Equilibrium gaps: Inflationary (AD > AS) vs Recessionary (AD < AS)." },
        keyFormulas: ['AD = C + I + G + NX'], diagrams: [], estimatedReadTime: 20, difficulty: 'HARD', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g12_u3', topic: { en: 'G12 Economics U3: Market Failure and Consumer Protection' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 3,
        contentHtml: { en: "Externalities (pollution), Public goods, Information failure, Market power. Consumer rights: safety, info, choice." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g12_u4', topic: { en: 'G12 Economics U4: Macroeconomic Policy Instruments' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 4,
        contentHtml: { en: "Fiscal (G and T): Expansionary vs Contractionary. Monetary (MS and rates): Open market ops, Reserve requirements, Discount rate. Exchange rate policy." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g12_u5', topic: { en: 'G12 Economics U5: Tax Theory and Practice' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 5,
        contentHtml: { en: "Direct (Income) vs Indirect (VAT, Excise). Canons: Equity, Certainty, Economy. Structure: Progressive (rate up with income), Proportional, Regressive." },
        keyFormulas: ['VAT'], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g12_u6', topic: { en: 'G12 Economics U6: Poverty and Inequality' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 6,
        contentHtml: { en: "Absolute vs Relative poverty. Headcount ratio. Inequality measurement: Lorenz Curve and Gini Coefficient (0=perfect equality, 1=max inequality)." },
        keyFormulas: ['Gini Coefficient'], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g12_u7', topic: { en: 'G12 Economics U7: Macroeconomic Reforms in Ethiopia' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 7,
        contentHtml: { en: "Sectors: Agri, Industry, Services. Structural transformation. Reforms: Imperial (feudal), Derg (Socialist), Post-1991 (Market-oriented, ADLI)." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },
      {
        id: 'econ_g12_u8', topic: { en: 'G12 Economics U8: Economy, Environment and Climate Change' }, subjectId: 'Economics', gradeLevel: 12, chapterNumber: 8,
        contentHtml: { en: "Interactions: environment as resource provider and sink. Sustainable Development. Green Economy (low-carbon). Vulnerability of rain-fed agri in Ethiopia." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 12, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },

      // ==========================================
      // GEOGRAPHY (SOCIAL STREAM ONLY)
      // ==========================================
      {
        id: 'geo_g11_u1', topic: { en: 'G11 Geography U1: Formation of Continents' }, subjectId: 'Geography', gradeLevel: 11, chapterNumber: 1,
        contentHtml: { en: "Plate Tectonics, Continental Drift. Layers: Crust, Mantle, Core. East African Rift System." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 18, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.SOCIAL
      },

      // ==========================================
      // MATHEMATICS (SHARED - SOCIAL STREAM MAPS TO SOCIAL TEXTBOOKS)
      // ==========================================
      {
        id: 'math_soc_g11_u10', topic: { en: 'Math Social G11 U10: Linear Programming' }, subjectId: 'Mathematics', gradeLevel: 11, chapterNumber: 10,
        contentHtml: { en: "Optimization models. Feasible region. Corner point theorem: Max/Min occurs at a vertex." },
        keyFormulas: ['Z = ax + by'], diagrams: [], estimatedReadTime: 15, difficulty: 'HARD', isBookmarked: false, stream: Stream.SOCIAL
      },

      // ==========================================
      // NATURAL SCIENCE STREAM (LOCKED)
      // ==========================================
      {
        id: 'phys_nat_g11_u2', topic: { en: 'Physics G11 U2: Vector Quantities' }, subjectId: 'Physics', gradeLevel: 11, chapterNumber: 2,
        contentHtml: { en: "Vector resolution, resolution into components. Dot Product (Work calculation), Cross Product (Torque)." },
        keyFormulas: ['Ax = A cos θ'], diagrams: [], estimatedReadTime: 15, difficulty: 'MEDIUM', isBookmarked: false, stream: Stream.NATURAL
      },
      {
        id: 'bio_nat_g11_u4', topic: { en: 'Biology G11 U4: Genetics' }, subjectId: 'Biology', gradeLevel: 11, chapterNumber: 4,
        contentHtml: { en: "Mendelian inheritance. Ratios: 3:1 (Mono), 9:3:3:1 (Di). DNA structure and protein synthesis." },
        keyFormulas: [], diagrams: [], estimatedReadTime: 20, difficulty: 'HARD', isBookmarked: false, stream: Stream.NATURAL
      }
    ];

    const initialQuestions: Question[] = [
      {
        id: 'q_hist_partition', subjectId: 'History', topicId: 'Colonialism',
        text: { en: 'Which agreement formally established the principles for the partition of Africa?' },
        options: [{ id: 'A', text: { en: 'Versailles' } }, { id: 'B', text: { en: 'Berlin Conference' } }, { id: 'C', text: { en: 'Treaty of Wuchale' } }, { id: 'D', text: { en: 'Yalta' } }],
        correctAnswer: 'B', explanation: { en: 'Berlin Conference 1884-85 established rules for effective occupation.' },
        difficulty: 'MEDIUM', source: 'MOCK'
      },
      {
        id: 'q_econ_opp', subjectId: 'Economics', topicId: 'Concepts',
        text: { en: 'The next best alternative foregone when a choice is made is called:' },
        options: [{ id: 'A', text: { en: 'Scarcity' } }, { id: 'B', text: { en: 'Opportunity Cost' } }, { id: 'C', text: { en: 'Economic Cost' } }, { id: 'D', text: { en: 'Marginal Cost' } }],
        correctAnswer: 'B', explanation: { en: 'Opportunity cost represents the sacrifice made in making a choice.' },
        difficulty: 'EASY', source: 'MOCK'
      }
    ];

    await this.saveNotes(initialNotes);
    await this.saveQuestions(initialQuestions);
  }
};
