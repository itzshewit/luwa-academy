
import { User, Stream, GlobalDirective, AccessToken, AcademicIntent, IntentType, ConceptMastery, ReviewEvent, ConceptNode, NodeStatus, LifecycleStage, AuditEntry, AcademicHealth, PrestigeTier } from '../types';

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
        weakConcepts: [], currentObjective: 'Oversee Nexus Operations', quizHistory: [], streak: 1,
        masteryRecord: {}, lifecycleStage: 'Admission', readiness: 0,
        health: { burnoutRisk: 0, engagementScore: 1, consistencyLevel: 1, status: 'Vibrant' }
      };
      users.push(defaultAdmin);
      localStorage.setItem(`${PREFIX}all_users`, JSON.stringify(users));
    }
    return users;
  },

  setSession: (user: User) => localStorage.setItem(`${PREFIX}active_session`, JSON.stringify(user)),

  getSession: (): User | null => {
    const simUser = localStorage.getItem(`${PREFIX}simulation_active_user`);
    let sessionUser: User | null = simUser ? JSON.parse(simUser) : JSON.parse(localStorage.getItem(`${PREFIX}active_session`) || 'null');

    if (sessionUser) {
      const oldStage = sessionUser.lifecycleStage;
      if (!sessionUser.currentIntent) sessionUser.currentIntent = storageService.inferIntent(sessionUser);
      if (!sessionUser.masteryRecord) sessionUser.masteryRecord = {};
      sessionUser.masteryRecord = storageService.decayRetention(sessionUser.masteryRecord);
      
      sessionUser.lifecycleStage = storageService.calculateLifecycleStage(sessionUser);
      sessionUser.readiness = storageService.calculateReadiness(sessionUser);
      sessionUser.health = storageService.calculateHealth(sessionUser);
      sessionUser.prestige = storageService.calculatePrestige(sessionUser.xp);

      if (oldStage && oldStage !== sessionUser.lifecycleStage) {
        storageService.logAudit(sessionUser, 'Lifecycle Shift', `Transitioned from ${oldStage} to ${sessionUser.lifecycleStage}`, 'info');
      }
    }
    return sessionUser;
  },

  logout: () => {
    localStorage.removeItem(`${PREFIX}active_session`);
    localStorage.removeItem(`${PREFIX}simulation_active_user`);
    sessionStorage.clear();
  },

  logAudit: (user: User, action: string, detail: string, severity: AuditEntry['severity'] = 'info') => {
    const logs: AuditEntry[] = JSON.parse(localStorage.getItem(`${PREFIX}audit_ledger`) || '[]');
    const entry: AuditEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      userId: user.id,
      userName: user.name,
      action,
      detail,
      severity
    };
    logs.unshift(entry);
    localStorage.setItem(`${PREFIX}audit_ledger`, JSON.stringify(logs.slice(0, 100)));
  },

  getAuditLogs: (): AuditEntry[] => JSON.parse(localStorage.getItem(`${PREFIX}audit_ledger`) || '[]'),

  calculateHealth: (user: User): AcademicHealth => {
    const history = user.quizHistory;
    if (history.length === 0) return { burnoutRisk: 0, engagementScore: 1, consistencyLevel: 1, status: 'Vibrant' };
    
    // Engagement based on volume
    const engagementScore = Math.min(1, history.length / 20);
    
    // Burnout risk based on average score vs effort
    const avgScore = history.reduce((acc, q) => acc + (q.score / q.total), 0) / history.length;
    const avgEffort = history.reduce((acc, q) => acc + q.aggregateEffort, 0) / history.length;
    
    let burnoutRisk = 0;
    if (avgEffort > 0.8 && avgScore < 0.6) burnoutRisk = 0.7; // High effort, low score = high stress
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
    if (users.length === 0) return null;
    return {
      avgReadiness: Math.round(users.reduce((acc, u) => acc + u.readiness, 0) / users.length),
      avgXp: Math.round(users.reduce((acc, u) => acc + u.xp, 0) / users.length),
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
    const existing = record[conceptId] || { id: conceptId, topic: topic, difficulty: 'medium', lastReviewed: 0, retentionScore: 0, scheduledNextReview: now, reviewHistory: [], interval: 1 };
    const history = [...existing.reviewHistory, { date: now, outcome, effortScore }];
    let interval = existing.interval;
    let retentionScore = existing.retentionScore;
    if (outcome === 'correct') {
      interval = Math.ceil(interval * (1.5 + (effortScore * 0.5)));
      retentionScore = Math.min(1, retentionScore + 0.3 * effortScore);
    } else {
      interval = Math.max(1, Math.floor(interval / 2));
      retentionScore = Math.max(0, retentionScore - 0.4);
    }
    const nextReview = now + (interval * 24 * 60 * 60 * 1000);
    const updatedMastery = { ...existing, lastReviewed: now, retentionScore, scheduledNextReview: nextReview, reviewHistory: history, interval };
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

  getReviewCandidates: (user: User): ConceptMastery[] => {
    if (!user.masteryRecord) return [];
    return Object.values(user.masteryRecord).filter(c => c.scheduledNextReview <= Date.now() || c.retentionScore < 0.4).sort((a, b) => a.retentionScore - b.retentionScore);
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
};
