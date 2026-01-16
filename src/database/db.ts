import * as SQLite from 'expo-sqlite';

export interface Document {
    id: number;
    uri: string;
    name: string;
    pageCount: number;
    lastReadPage: number;
    thumbnailUri?: string;
    createdAt: string;
}

const DB_NAME = 'daytripper.db';

// Use a promise-based singleton to ensure initialization completes before any operations
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDb = (): Promise<SQLite.SQLiteDatabase> => {
    if (!dbPromise) {
        dbPromise = SQLite.openDatabaseAsync(DB_NAME, {
            // This option can help with certain Android device issues
            useNewConnection: true,
        });
    }
    return dbPromise;
};

export const initDatabase = async (): Promise<void> => {
    const db = await getDb();
    // Execute PRAGMA and CREATE TABLE in separate statements for better compatibility
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uri TEXT NOT NULL,
            name TEXT NOT NULL,
            pageCount INTEGER DEFAULT 0,
            lastReadPage INTEGER DEFAULT 1,
            thumbnailUri TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
};

export const addDocument = async (uri: string, name: string, pageCount: number = 0): Promise<number> => {
    const db = await getDb();
    const statement = await db.prepareAsync(
        'INSERT INTO documents (uri, name, pageCount) VALUES ($uri, $name, $pageCount)'
    );
    try {
        const result = await statement.executeAsync({ $uri: uri, $name: name, $pageCount: pageCount });
        return result.lastInsertRowId;
    } finally {
        await statement.finalizeAsync();
    }
};

export const getDocuments = async (): Promise<Document[]> => {
    const db = await getDb();
    const result = await db.getAllAsync<Document>('SELECT * FROM documents ORDER BY createdAt DESC');
    return result;
};

export const updateLastReadPage = async (id: number, page: number): Promise<void> => {
    const db = await getDb();
    const statement = await db.prepareAsync('UPDATE documents SET lastReadPage = $page WHERE id = $id');
    try {
        await statement.executeAsync({ $page: page, $id: id });
    } finally {
        await statement.finalizeAsync();
    }
};

export const deleteDocument = async (id: number): Promise<void> => {
    const db = await getDb();
    const statement = await db.prepareAsync('DELETE FROM documents WHERE id = $id');
    try {
        await statement.executeAsync({ $id: id });
    } finally {
        await statement.finalizeAsync();
    }
};
