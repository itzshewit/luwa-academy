
/*
  Luwa Academy – Neural Registry Database
  V1.5 - Registry Version Bump (Store Synchronization Fix)
*/

const DB_NAME = 'LuwaAcademy_Institutional_Registry';
const DB_VERSION = 3; // Bumped version to force schema update

export const dbService = {
  db: null as IDBDatabase | null,

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Institutional Data Stores - Verified existence before creation
        if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('questions')) db.createObjectStore('questions', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('tokens')) db.createObjectStore('tokens', { keyPath: 'code' });
        if (!db.objectStoreNames.contains('results')) db.createObjectStore('results', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('audits')) db.createObjectStore('audits', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('exams')) db.createObjectStore('exams', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('static_quizzes')) db.createObjectStore('static_quizzes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('assignments')) db.createObjectStore('assignments', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('assignment_submissions')) db.createObjectStore('assignment_submissions', { keyPath: 'id' });
        
        // Indices for faster querying
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          const noteStore = transaction.objectStore('notes');
          if (!noteStore.indexNames.contains('subjectId')) noteStore.createIndex('subjectId', 'subjectId', { unique: false });
          
          const qStore = transaction.objectStore('questions');
          if (!qStore.indexNames.contains('subjectId')) qStore.createIndex('subjectId', 'subjectId', { unique: false });

          const taskStore = transaction.objectStore('tasks');
          if (!taskStore.indexNames.contains('date')) taskStore.createIndex('date', 'date', { unique: false });
        }
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
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Failed to fetch from ${storeName}`);
      } catch (e) {
        reject(`Registry error accessing ${storeName}`);
      }
    });
  },

  async getById<T>(storeName: string, id: string | number): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(`Failed to fetch ID ${id} from ${storeName}`);
      } catch (e) {
        reject(`Registry error accessing ${storeName} for ID ${id}`);
      }
    });
  },

  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(`Failed to persist to ${storeName}`);
      } catch (e) {
        reject(`Registry write error for ${storeName}`);
      }
    });
  },

  async delete(storeName: string, id: string | number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(`Failed to delete from ${storeName}`);
      } catch (e) {
        reject(`Registry deletion error for ${storeName}`);
      }
    });
  },

  async bulkPut<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        items.forEach(item => store.put(item));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(`Bulk persist failed for ${storeName}`);
      } catch (e) {
        reject(`Registry bulk write error for ${storeName}`);
      }
    });
  }
};
