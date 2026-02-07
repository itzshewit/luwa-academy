
/*
  Luwa Academy – Neural Registry Database
  V1.6 - Registry Version Bump (Handshake & Stability Fix)
*/

const DB_NAME = 'LuwaAcademy_Institutional_Registry';
const DB_VERSION = 4; // Bumped version for schema integrity

export const dbService = {
  db: null as IDBDatabase | null,

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        const stores = [
          'users', 'notes', 'questions', 'tokens', 'results', 
          'audits', 'exams', 'static_quizzes', 'tasks', 
          'assignments', 'assignment_submissions'
        ];

        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            // Using 'id' for most, but 'code' for tokens specifically
            const keyPath = store === 'tokens' ? 'code' : 'id';
            db.createObjectStore(store, { keyPath });
          }
        });
        
        // Ensure indices are present
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
          try {
            const noteStore = transaction.objectStore('notes');
            if (!noteStore.indexNames.contains('subjectId')) noteStore.createIndex('subjectId', 'subjectId', { unique: false });
            
            const qStore = transaction.objectStore('questions');
            if (!qStore.indexNames.contains('subjectId')) qStore.createIndex('subjectId', 'subjectId', { unique: false });

            const taskStore = transaction.objectStore('tasks');
            if (!taskStore.indexNames.contains('date')) taskStore.createIndex('date', 'date', { unique: false });
          } catch (e) {
            console.warn("Registry Index Sync Warning:", e);
          }
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
        reject(`Registry access error: ${storeName}`);
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
        reject(`Registry fetch error for ${id}`);
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
        reject(`Registry write failure in ${storeName}`);
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
        reject(`Registry deletion failure in ${storeName}`);
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
        reject(`Registry bulk write failure`);
      }
    });
  }
};
