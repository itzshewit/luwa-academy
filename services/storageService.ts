
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Purpose: Interactive, gamified, and AI-assisted learning for high school students.
  Module: Persistent Storage & Logic Service
  Author: Shewit – 2026
*/

import { User, Stream, GlobalDirective, AccessToken, AcademicIntent, IntentType, ConceptMastery, ConceptNode, NodeStatus, LifecycleStage, AuditEntry, AcademicHealth, PrestigeTier, HistoricalQuestion, Language, Achievement, Exam, ExamSubmission } from '../types';

const PREFIX = 'luwa_mvp_v1_';
const SALT = '_luwasalt';

const CURRICULUM_GRAPH: ConceptNode[] = [
  { id: 'math_basic_calculus', topic: 'Differentiation Basics', subject: 'Mathematics', difficulty: 'easy', prerequisites: [], importanceScore: 0.9, description: 'Foundations of rate of change and derivatives.' },
  { id: 'math_integration_intro', topic: 'Antiderivatives', subject: 'Mathematics', difficulty: 'medium', prerequisites: ['math_basic_calculus'], importanceScore: 0.8, description: 'The inverse process of differentiation.' },
  { id: 'phy_newton_laws', topic: 'Newtonian Dynamics', subject: 'Physics', difficulty: 'medium', prerequisites: [], importanceScore: 1.0, description: 'Core laws of motion and force interaction.' },
  { id: 'phy_circular_motion', topic: 'Uniform Circular Motion', subject: 'Physics', difficulty: 'hard', prerequisites: ['phy_newton_laws'], importanceScore: 0.7, description: 'Centripetal forces and rotational vectors.' },
  { id: 'chem_atomic_structure', topic: 'Quantum Shells', subject: 'Chemistry', difficulty: 'medium', prerequisites: [], importanceScore: 0.8, description: 'Electron configuration and periodic trends.' },
  { id: 'chem_bonding', topic: 'Covalent Synthesis', subject: 'Chemistry', difficulty: 'medium', prerequisites: ['chem_atomic_structure'], importanceScore: 0.9, description: 'Molecular geometry and electron sharing.' },
];

export const storageService = {
  hashPassword: (password: string) => btoa(password + SALT),

  saveUser: (user: User) => {
    const allUsers = storageService.getAllUsers();
    const index = allUsers.findIndex(u => u.id === user.id || u.email === user.email);
    if (index > -1) allUsers[index] = user;
    else allUsers.push(user);
    localStorage.setItem(`${PREFIX}all_users`, JSON.stringify(allUsers));
  },

  getAllUsers: (): User[] => {
    const data = localStorage.getItem(`${PREFIX}all_users`);
    const users = data ? JSON.parse(data) : [];
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: 'admin-primary', email: 'admin@luwa.academy', passwordHash: btoa('admin123' + SALT),
        token: 'MASTER-ADMIN', name: 'Luwa Registry Admin', role: 'admin', stream: Stream.NATURAL,
        grade: 'N/A', targetYear: 'N/A', xp: 0, level: 'Builder', prestige: 'Bronze',
        weakConcepts: [], currentObjective: 'Oversee Nexus Operations', quizHistory: [], questionLedger: [], 
        achievements: [], streak: 1, lastActiveDate: new Date().toISOString().split('T')[0],
        masteryRecord: {}, lifecycleStage: 'Admission', readiness: 0,
        health: { burnoutRisk: 0, engagementScore: 1, consistencyLevel: 1, status: 'Vibrant' },
        preferredLanguage: 'en'
      };
      users.push(defaultAdmin);
      localStorage.setItem(`${PREFIX}all_users`, JSON.stringify(users));
    }
    return users;
  },

  setSession: (user: User) => localStorage.setItem(`${PREFIX}active_session`, JSON.stringify(user)),

  getSession: (): User | null => {
    const simUser = localStorage.getItem(`${PREFIX}simulation_active_user`);
    const activeSession = localStorage.getItem(`${PREFIX}active_session`);
    let sessionUser: User | null = simUser ? JSON.parse(simUser) : (activeSession ? JSON.parse(activeSession) : null);

    if (sessionUser) {
      if (!sessionUser.questionLedger) sessionUser.questionLedger = [];
      if (!sessionUser.achievements) sessionUser.achievements = [];
      if (!sessionUser.currentIntent) sessionUser.currentIntent = storageService.inferIntent(sessionUser);
      if (!sessionUser.masteryRecord) sessionUser.masteryRecord = {};
      if (!sessionUser.preferredLanguage) sessionUser.preferredLanguage = 'en';
      
      sessionUser.masteryRecord = storageService.decayRetention(sessionUser.masteryRecord);
      sessionUser.lifecycleStage = storageService.calculateLifecycleStage(sessionUser);
      sessionUser.readiness = storageService.calculateReadiness(sessionUser);
      sessionUser.health = storageService.calculateHealth(sessionUser);
      sessionUser.prestige = storageService.calculatePrestige(sessionUser.xp);
      
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      if (sessionUser.lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (sessionUser.lastActiveDate === yesterdayStr) {
          sessionUser.streak += 1;
        } else {
          sessionUser.streak = 1;
        }
        sessionUser.lastActiveDate = today;
      }
    }
    return sessionUser;
  },

  logout: () => {
    localStorage.removeItem(`${PREFIX}active_session`);
    localStorage.removeItem(`${PREFIX}simulation_active_user`);
    sessionStorage.clear();
  },

  // SES Storage Methods
  getExams: (): Exam[] => JSON.parse(localStorage.getItem(`${PREFIX}exams`) || '[]'),
  saveExam: (exam: Exam) => {
    const exams = storageService.getExams();
    const idx = exams.findIndex(e => e.id === exam.id);
    if (idx > -1) exams[idx] = exam;
    else exams.push(exam);
    localStorage.setItem(`${PREFIX}exams`, JSON.stringify(exams));
  },
  
  getSubmissions: (): ExamSubmission[] => JSON.parse(localStorage.getItem(`${PREFIX}submissions`) || '[]'),
  saveSubmission: (sub: ExamSubmission) => {
    const subs = storageService.getSubmissions();
    const idx = subs.findIndex(s => s.id === sub.id);
    if (idx > -1) subs[idx] = sub;
    else subs.push(sub);
    localStorage.setItem(`${PREFIX}submissions`, JSON.stringify(subs));
  },

  getPersonalizedSuggestions: (user: User) => {
    const suggestions = [];
    if (user.weakConcepts.length > 0) {
      suggestions.push({
        id: 'weak-1',
        type: 'Remediation',
        title: `Deep Dive: ${user.weakConcepts[0]}`,
        desc: "Adaptive algorithms suggest prioritizing this gap to stabilize your EUEE readiness.",
        xp: 150
      });
    }
    const readyItems = CURRICULUM_GRAPH.filter(n => storageService.getNodeStatus(user, n.id) === 'Ready');
    if (readyItems.length > 0) {
      suggestions.push({
        id: 'next-1',
        type: 'Advancement',
        title: `Next Pillar: ${readyItems[0].topic}`,
        desc: "Foundational nodes verified. Ready for higher-level conceptual synthesis.",
        xp: 200
      });
    }
    if (user.health.burnoutRisk > 0.5) {
      suggestions.push({
        id: 'health-1',
        type: 'Recovery',
        title: 'Cognitive Reboot',
        desc: "Vigilance score dropping. A session of 'Exploration' mode is advised.",
        xp: 50
      });
    }
    return suggestions;
  },

  checkAchievements: (user: User): User => {
    const newAchievements: Achievement[] = [...user.achievements];
    const existingIds = new Set(newAchievements.map(a => a.id));

    if (!existingIds.has('first-step') && user.xp > 0) {
      newAchievements.push({ id: 'first-step', title: 'The Awakening', icon: '🌟', unlockedAt: Date.now(), description: 'Initialize first academic sync.' });
    }
    if (!existingIds.has('streak-3') && user.streak >= 3) {
      newAchievements.push({ id: 'streak-3', title: 'Neural Consistency', icon: '🔥', unlockedAt: Date.now(), description: 'Maintain 3-day active streak.' });
    }
    if (!existingIds.has('master-1') && Object.values(user.masteryRecord).some(m => m.retentionScore > 0.9)) {
      newAchievements.push({ id: 'master-1', title: 'Sovereign Node', icon: '🏛️', unlockedAt: Date.now(), description: 'Achieve absolute mastery (>90%) on any node.' });
    }

    return { ...user, achievements: newAchievements };
  },

  addToLedger: (user: User, entry: Omit<HistoricalQuestion, 'id' | 'timestamp'>) => {
    const questionLedger = user.questionLedger || [];
    const newEntry: HistoricalQuestion = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      lang: user.preferredLanguage
    };
    let updatedUser = { ...user, questionLedger: [newEntry, ...questionLedger].slice(0, 100) };
    updatedUser = storageService.checkAchievements(updatedUser);
    storageService.saveUser(updatedUser);
    storageService.setSession(updatedUser);
    return updatedUser;
  },

  calculateHealth: (user: User): AcademicHealth => {
    const history = user.quizHistory;
    if (history.length === 0) return { burnoutRisk: 0, engagementScore: 1, consistencyLevel: 1, status: 'Vibrant' };
    const engagementScore = Math.min(1, history.length / 20);
    const avgScore = history.reduce((acc, q) => acc + (q.score / q.total), 0) / history.length;
    const avgEffort = history.reduce((acc, q) => acc + q.aggregateEffort, 0) / history.length;
    let burnoutRisk = 0;
    if (avgEffort > 0.8 && avgScore < 0.6) burnoutRisk = 0.7;
    if (history.length > 50) burnoutRisk += 0.2;
    const consistencyLevel = user.streak > 7 ? 0.9 : user.streak > 3 ? 0.6 : 0.3;
    let status: AcademicHealth['status'] = 'Vibrant';
    if (burnoutRisk > 0.6) status = 'At Risk';
    else if (burnoutRisk > 0.3) status = 'Fatigued';
    else if (engagementScore > 0.4) status = 'Stable';
    return { burnoutRisk, engagementScore, consistencyLevel, status };
  },

  calculatePrestige: (xp: number): PrestigeTier => {
    if (xp >= 10000) return 'Sovereign';
    if (xp >= 5000) return 'Platinum';
    if (xp >= 2500) return 'Gold';
    if (xp >= 1000) return 'Silver';
    return 'Bronze';
  },

  getCohortStats: () => {
    const users = storageService.getAllUsers().filter(u => u.role === 'scholar');
    const totalXp = users.reduce((acc, u) => acc + (u.xp || 0), 0);
    const avgXp = users.length > 0 ? totalXp / users.length : 1000;
    const avgReadiness = users.length > 0 ? users.reduce((acc, u) => acc + (u.readiness || 0), 0) / users.length : 0;
    
    return {
      avgReadiness: Math.round(avgReadiness),
      avgXp: Math.round(avgXp),
      stageDistribution: {
        Admission: users.filter(u => u.lifecycleStage === 'Admission').length,
        Exploration: users.filter(u => u.lifecycleStage === 'Exploration').length,
        'Skill Acquisition': users.filter(u => u.lifecycleStage === 'Skill Acquisition').length,
        Mastery: users.filter(u => u.lifecycleStage === 'Mastery').length,
        Ready: users.filter(u => u.lifecycleStage === 'Ready').length,
      }
    };
  },

  calculateLifecycleStage: (user: User): LifecycleStage => {
    const masteryList = Object.values(user.masteryRecord || {}) as ConceptMastery[];
    const masteredCount = masteryList.filter(m => m.retentionScore > 0.7).length;
    const masteryRate = masteredCount / CURRICULUM_GRAPH.length;
    const avgEffort = user.averageEffort || 0.5;
    if (masteryRate > 0.85 && avgEffort > 0.8) return 'Ready';
    if (user.xp >= 5000 || masteryRate > 0.6) return 'Mastery';
    if (user.xp >= 1500 || masteredCount >= 2) return 'Skill Acquisition';
    if (user.xp >= 300 || masteredCount >= 1) return 'Exploration';
    return 'Admission';
  },

  calculateReadiness: (user: User): number => {
    const masteryList = Object.values(user.masteryRecord || {}) as ConceptMastery[];
    if (masteryList.length === 0) return 0;
    const avgRetention = masteryList.reduce((acc, curr) => acc + curr.retentionScore, 0) / masteryList.length;
    const masteredWeight = masteryList.filter(m => m.retentionScore > 0.7).length / CURRICULUM_GRAPH.length;
    const effortWeight = user.averageEffort || 0.5;
    const readiness = (masteredWeight * 50) + (avgRetention * 30) + (effortWeight * 20);
    return Math.min(100, Math.round(readiness));
  },

  getNodeStatus: (user: User, nodeId: string): NodeStatus => {
    const node = CURRICULUM_GRAPH.find(n => n.id === nodeId);
    if (!node) return 'Locked';
    const mastery = user.masteryRecord?.[nodeId];
    if (mastery && mastery.retentionScore > 0.8) return 'Mastered';
    if (mastery && mastery.retentionScore < 0.4) return 'Review';
    for (const preId of node.prerequisites) {
      const preMastery = user.masteryRecord?.[preId];
      if (!preMastery || preMastery.retentionScore < 0.6) return 'Locked';
    }
    return 'Ready';
  },

  getLeverageTask: (user: User): { node: ConceptNode; status: NodeStatus } => {
    const reviewItems = CURRICULUM_GRAPH.map(n => ({ node: n, status: storageService.getNodeStatus(user, n.id) })).filter(item => item.status === 'Review');
    if (reviewItems.length > 0) return reviewItems[0];
    const readyItems = CURRICULUM_GRAPH.map(n => ({ node: n, status: storageService.getNodeStatus(user, n.id) })).filter(item => item.status === 'Ready').sort((a, b) => b.node.importanceScore - a.node.importanceScore);
    if (readyItems.length > 0) return readyItems[0];
    const lockedItems = CURRICULUM_GRAPH.map(n => ({ node: n, status: storageService.getNodeStatus(user, n.id) })).filter(item => item.status === 'Locked');
    return lockedItems[0] || { node: CURRICULUM_GRAPH[0], status: 'Ready' };
  },

  getFullCurriculum: () => CURRICULUM_GRAPH,

  updateMastery: (user: User, conceptId: string, topic: string, outcome: 'correct' | 'wrong', effortScore: number): User => {
    const now = Date.now();
    const record = user.masteryRecord || {};
    const existing = record[conceptId] || { id: conceptId, topic: topic, difficulty: 'medium', lastReviewed: 0, retentionScore: 0, scheduledNextReview: now, reviewHistory: [], interval: 1, adaptiveLevel: 1 };
    const history = [...existing.reviewHistory, { date: now, outcome, effortScore }];
    let interval = existing.interval;
    let retentionScore = existing.retentionScore;
    let adaptiveLevel = existing.adaptiveLevel;

    if (outcome === 'correct') {
      interval = Math.ceil(interval * (1.5 + (effortScore * 0.5)));
      retentionScore = Math.min(1, retentionScore + 0.3 * effortScore);
      if (retentionScore > 0.8 && adaptiveLevel < 5) adaptiveLevel += 1;
    } else {
      interval = Math.max(1, Math.floor(interval / 2));
      retentionScore = Math.max(0, retentionScore - 0.4);
      if (adaptiveLevel > 1) adaptiveLevel -= 1;
    }
    const nextReview = now + (interval * 24 * 60 * 60 * 1000);
    const updatedMastery = { ...existing, lastReviewed: now, retentionScore, scheduledNextReview: nextReview, reviewHistory: history, interval, adaptiveLevel };
    return { ...user, masteryRecord: { ...record, [conceptId]: updatedMastery } };
  },

  decayRetention: (record: Record<string, ConceptMastery>): Record<string, ConceptMastery> => {
    const now = Date.now();
    const decayed = { ...record };
    Object.keys(decayed).forEach(key => {
      const concept = decayed[key];
      const daysSinceLast = (now - concept.lastReviewed) / (1000 * 60 * 60 * 24);
      concept.retentionScore = Math.max(0, concept.retentionScore - ((daysSinceLast / (concept.interval * 2)) * 0.1));
    });
    return decayed;
  },

  inferIntent: (user: User): AcademicIntent => {
    const now = Date.now();
    const hour = new Date().getHours();
    let type: IntentType = 'Deep Study';
    if (hour > 22 || hour < 5) type = 'Recovery';
    else if (user.quizHistory.length > 0 && user.quizHistory[0].score < user.quizHistory[0].total * 0.4) type = 'Recovery';
    else if (user.xp > 3000 && user.quizHistory.length > 10) type = 'Exam Prep';
    else if (hour >= 6 && hour <= 11) type = 'Exploration';
    return { type, confidence: 0.5, detectedAt: now, expiresAt: now + (1000 * 60 * 60 * 2) };
  },

  getTokens: (): AccessToken[] => JSON.parse(localStorage.getItem(`${PREFIX}master_vault_codes`) || '[]'),
  generateToken: () => {
    const code = `LUWA-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const tokens = storageService.getTokens();
    tokens.push({ code, isUsed: false, createdAt: Date.now() });
    localStorage.setItem(`${PREFIX}master_vault_codes`, JSON.stringify(tokens));
    return code;
  },
  validateAndUseToken: (code: string, userId: string) => {
    if (code === 'LUWA-MASTER-ADMIN') return true;
    const tokens = storageService.getTokens();
    const tokenIdx = tokens.findIndex(t => t.code === code && !t.isUsed);
    if (tokenIdx > -1) {
      tokens[tokenIdx].isUsed = true;
      tokens[tokenIdx].usedBy = userId;
      localStorage.setItem(`${PREFIX}master_vault_codes`, JSON.stringify(tokens));
      return true;
    }
    return false;
  },

  enterSimulation: (user: User) => localStorage.setItem(`${PREFIX}simulation_active_user`, JSON.stringify(user)),
  exitSimulation: () => localStorage.removeItem(`${PREFIX}simulation_active_user`),
  isSimulating: () => localStorage.getItem(`${PREFIX}simulation_active_user`) !== null,
  
  saveDirective: (directive: GlobalDirective) => {
    const directives = storageService.getDirectives();
    localStorage.setItem(`${PREFIX}directives`, JSON.stringify([directive, ...directives].slice(0, 5)));
  },
  getDirectives: (): GlobalDirective[] => JSON.parse(localStorage.getItem(`${PREFIX}directives`) || '[]'),
  
  calculateLevel: (xp: number): 'Initiate' | 'Builder' | 'Strategist' => xp >= 5000 ? 'Strategist' : xp >= 1000 ? 'Builder' : 'Initiate',
  getSubjects: (stream: Stream) => stream === Stream.NATURAL ? ['Mathematics', 'Physics', 'English', 'Chemistry', 'Biology', 'SAT'] : ['English', 'Mathematics', 'Geography', 'History', 'Economics', 'SAT'],
  getUserByEmail: (email: string) => storageService.getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null,
  getAuditLogs: (): AuditEntry[] => JSON.parse(localStorage.getItem(`${PREFIX}audit_logs`) || '[]'),
};
