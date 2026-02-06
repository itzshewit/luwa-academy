
/*
  Luwa Academy – Neural Registry Database
  V1.3 - Assignment System Stores Integration
*/

const DB_NAME = 'LuwaAcademy_Institutional_Registry';
const DB_VERSION = 1;

export const dbService = {
  db: null as IDBDatabase | null,

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Institutional Data Stores
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('questions')) db.createObjectStore('questions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('tokens')) db.createObjectStore('tokens', { keyPath: 'code' });
        if (!db.objectStoreNames.contains('results')) db.createObjectStore('results', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('audits')) db.createObjectStore('audits', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('exams')) db.createObjectStore('exams', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('static_quizzes')) db.createObjectStore('static_quizzes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
        
        // Assignment System Stores
        if (!db.objectStoreNames.contains('assignments')) db.createObjectStore('assignments', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('assignment_submissions')) db.createObjectStore('assignment_submissions', { keyPath: 'id' });
        
        // Indices for faster querying
        const noteStore = request.transaction?.objectStore('notes');
        noteStore?.createIndex('subjectId', 'subjectId', { unique: false });
        
        const qStore = request.transaction?.objectStore('questions');
        qStore?.createIndex('subjectId', 'subjectId', { unique: false });

        const taskStore = request.transaction?.objectStore('tasks');
        taskStore?.createIndex('date', 'date', { unique: false });

        const assignmentStore = request.transaction?.objectStore('assignments');
        assignmentStore?.createIndex('subject', 'subject', { unique: false });

        const subStore = request.transaction?.objectStore('assignment_submissions');
        subStore?.createIndex('userId', 'userId', { unique: false });
        subStore?.createIndex('assignmentId', 'assignmentId', { unique: false });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => reject('Institutional Registry Access Denied (IndexedDB Error)');
    });
  },

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(`Failed to fetch from ${storeName}`);
    });
  },

  async getById<T>(storeName: string, id: string | number): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(`Failed to fetch ID ${id} from ${storeName}`);
    });
  },

  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(`Failed to persist to ${storeName}`);
    });
  },

  async delete(storeName: string, id: string | number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(`Failed to delete from ${storeName}`);
    });
  },

  async bulkPut<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      items.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(`Bulk persist failed for ${storeName}`);
    });
  }
};
