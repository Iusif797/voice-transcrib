"use client";

import type { LessonRecord, LessonSummary } from "./types";

const DB_NAME = "voice-scribe";
const DB_VERSION = 1;
const STORE = "lessons";

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB недоступен"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Не удалось открыть базу уроков"));
  });
  return dbPromise;
};

const toSummary = (record: LessonRecord): LessonSummary => ({
  id: record.id,
  title: record.title,
  kind: record.kind,
  createdAt: record.createdAt,
  durationMs: record.durationMs,
  transcriptLength: record.transcript.length,
  mediaSize: record.mediaSize,
  mediaExtension: record.mediaExtension,
});

const tx = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = fn(store);
    if (request instanceof IDBRequest) {
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error ?? new Error("Ошибка базы"));
    } else {
      request.then(resolve, reject);
    }
    transaction.onerror = () => reject(transaction.error ?? new Error("Ошибка транзакции"));
  });
};

export const saveLesson = async (record: LessonRecord): Promise<void> => {
  await tx<IDBValidKey>("readwrite", (store) => store.put(record));
};

export const deleteLesson = async (id: string): Promise<void> => {
  await tx<undefined>("readwrite", (store) => store.delete(id));
};

export const getLesson = async (id: string): Promise<LessonRecord | null> => {
  const result = await tx<LessonRecord | undefined>("readonly", (store) => store.get(id));
  return result ?? null;
};

export const listLessons = async (): Promise<LessonSummary[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readonly");
    const store = transaction.objectStore(STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const records = (request.result as LessonRecord[]) ?? [];
      records.sort((a, b) => b.createdAt - a.createdAt);
      resolve(records.map(toSummary));
    };
    request.onerror = () => reject(request.error ?? new Error("Не удалось прочитать уроки"));
  });
};

export const generateLessonId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};
