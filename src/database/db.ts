import * as SQLite from 'expo-sqlite';

export interface Document {
    id: number;
    uri: string;
    name: string;
    author?: string;
    pageCount: number;
    lastReadPage: number;
    thumbnailUri?: string;
    fileSize?: number;
    fileType: 'pdf' | 'epub';
    createdAt: string;
    lastOpenedAt?: string;
}

export interface ReadingProgress {
    id: number;
    docId: number;
    currentTokenIndex: number;
    currentPageNum: number;
    snippet: string;
    totalWordsRead: number;
    sessionStartTime: number;
    lastUpdateTime: number;
    estimatedTimeRemaining: number;
}

export interface ExtractedTextCache {
    id: number;
    docId: number;
    tokenStream: string; // JSON array of tokens
    totalTokens: number;
    totalPages: number;
    cacheDate: number;
    fileHash: string;
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

    // Documents table
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uri TEXT NOT NULL,
            name TEXT NOT NULL,
            author TEXT,
            pageCount INTEGER DEFAULT 0,
            lastReadPage INTEGER DEFAULT 1,
            thumbnailUri TEXT,
            fileSize INTEGER,
            fileType TEXT DEFAULT 'pdf',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            lastOpenedAt DATETIME
        );
    `);

    // Migration: Add missing columns to existing documents table
    // SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we catch errors
    const columnsToAdd = [
        { name: 'author', definition: 'TEXT' },
        { name: 'fileSize', definition: 'INTEGER' },
        { name: 'fileType', definition: "TEXT DEFAULT 'pdf'" },
        { name: 'lastOpenedAt', definition: 'DATETIME' },
    ];

    for (const column of columnsToAdd) {
        try {
            await db.execAsync(`ALTER TABLE documents ADD COLUMN ${column.name} ${column.definition};`);
        } catch {
            // Column already exists, ignore error
        }
    }

    // Reading progress table for RSVP
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS reading_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            docId INTEGER NOT NULL UNIQUE,
            currentTokenIndex INTEGER NOT NULL DEFAULT 0,
            currentPageNum INTEGER DEFAULT 1,
            snippet TEXT,
            totalWordsRead INTEGER DEFAULT 0,
            sessionStartTime INTEGER,
            lastUpdateTime INTEGER,
            estimatedTimeRemaining INTEGER,
            FOREIGN KEY (docId) REFERENCES documents(id) ON DELETE CASCADE
        );
    `);

    // Extracted text cache metadata table (stores metadata, tokens are in token_chunks)
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS extracted_text_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            docId INTEGER NOT NULL UNIQUE,
            totalTokens INTEGER,
            totalPages INTEGER,
            cacheDate INTEGER,
            fileHash TEXT,
            FOREIGN KEY (docId) REFERENCES documents(id) ON DELETE CASCADE
        );
    `);

    // Token chunks table - stores tokens in smaller chunks to avoid OOM
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS token_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            docId INTEGER NOT NULL,
            chunkIndex INTEGER NOT NULL,
            tokens TEXT NOT NULL,
            tokenCount INTEGER NOT NULL,
            FOREIGN KEY (docId) REFERENCES documents(id) ON DELETE CASCADE,
            UNIQUE(docId, chunkIndex)
        );
    `);

    // Create indexes
    await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_progress_doc_id ON reading_progress(docId);
    `);
    await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cache_doc_id ON extracted_text_cache(docId);
    `);
    await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_token_chunks_doc_id ON token_chunks(docId);
    `);

    // Settings table for user preferences
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);
};

// === Document Operations ===

export interface AddDocumentParams {
    uri: string;
    name: string;
    author?: string;
    pageCount?: number;
    fileSize?: number;
    fileType?: 'pdf' | 'epub';
}

export const addDocument = async (params: AddDocumentParams): Promise<number> => {
    const db = await getDb();
    const { uri, name, author, pageCount = 0, fileSize, fileType = 'pdf' } = params;
    const statement = await db.prepareAsync(
        'INSERT INTO documents (uri, name, author, pageCount, fileSize, fileType) VALUES ($uri, $name, $author, $pageCount, $fileSize, $fileType)'
    );
    try {
        const result = await statement.executeAsync({
            $uri: uri,
            $name: name,
            $author: author || null,
            $pageCount: pageCount,
            $fileSize: fileSize || null,
            $fileType: fileType,
        });
        return result.lastInsertRowId;
    } finally {
        await statement.finalizeAsync();
    }
};

export type SortOption = 'latest_added' | 'alpha_asc' | 'alpha_desc' | 'last_read_newest' | 'last_read_oldest' | 'progress_least' | 'progress_most';

export const getDocuments = async (sortBy: SortOption = 'latest_added'): Promise<Document[]> => {
    const db = await getDb();

    let orderClause: string;
    switch (sortBy) {
        case 'alpha_asc':
            orderClause = 'ORDER BY name ASC';
            break;
        case 'alpha_desc':
            orderClause = 'ORDER BY name DESC';
            break;
        case 'last_read_newest':
            orderClause = 'ORDER BY lastOpenedAt DESC NULLS LAST';
            break;
        case 'last_read_oldest':
            orderClause = 'ORDER BY lastOpenedAt ASC NULLS LAST';
            break;
        case 'progress_least':
            orderClause = 'ORDER BY (CAST(lastReadPage AS REAL) / NULLIF(pageCount, 0)) ASC';
            break;
        case 'progress_most':
            orderClause = 'ORDER BY (CAST(lastReadPage AS REAL) / NULLIF(pageCount, 0)) DESC';
            break;
        case 'latest_added':
        default:
            orderClause = 'ORDER BY createdAt DESC';
            break;
    }

    const result = await db.getAllAsync<Document>(`SELECT * FROM documents ${orderClause}`);
    return result;
};

export const updateLastOpenedAt = async (id: number): Promise<void> => {
    const db = await getDb();
    const statement = await db.prepareAsync('UPDATE documents SET lastOpenedAt = CURRENT_TIMESTAMP WHERE id = $id');
    try {
        await statement.executeAsync({ $id: id });
    } finally {
        await statement.finalizeAsync();
    }
};

export const getDocument = async (id: number): Promise<Document | null> => {
    const db = await getDb();
    const result = await db.getFirstAsync<Document>('SELECT * FROM documents WHERE id = $id', { $id: id });
    return result || null;
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

export const updatePageCount = async (id: number, count: number): Promise<void> => {
    const db = await getDb();
    const statement = await db.prepareAsync('UPDATE documents SET pageCount = $count WHERE id = $id');
    try {
        await statement.executeAsync({ $count: count, $id: id });
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

export const updateThumbnailUri = async (id: number, thumbnailUri: string): Promise<void> => {
    const db = await getDb();
    const statement = await db.prepareAsync('UPDATE documents SET thumbnailUri = $thumbnailUri WHERE id = $id');
    try {
        await statement.executeAsync({ $thumbnailUri: thumbnailUri, $id: id });
    } finally {
        await statement.finalizeAsync();
    }
};

// === Reading Progress Operations ===

export const saveReadingProgress = async (
    docId: number,
    currentTokenIndex: number,
    currentPageNum: number,
    snippet: string,
    totalWordsRead: number
): Promise<void> => {
    const db = await getDb();
    const statement = await db.prepareAsync(`
        INSERT INTO reading_progress (docId, currentTokenIndex, currentPageNum, snippet, totalWordsRead, lastUpdateTime)
        VALUES ($docId, $tokenIndex, $pageNum, $snippet, $wordsRead, $updateTime)
        ON CONFLICT(docId) DO UPDATE SET
            currentTokenIndex = $tokenIndex,
            currentPageNum = $pageNum,
            snippet = $snippet,
            totalWordsRead = $wordsRead,
            lastUpdateTime = $updateTime
    `);
    try {
        await statement.executeAsync({
            $docId: docId,
            $tokenIndex: currentTokenIndex,
            $pageNum: currentPageNum,
            $snippet: snippet,
            $wordsRead: totalWordsRead,
            $updateTime: Date.now(),
        });
    } finally {
        await statement.finalizeAsync();
    }
};

export const getReadingProgress = async (docId: number): Promise<ReadingProgress | null> => {
    const db = await getDb();
    const result = await db.getFirstAsync<ReadingProgress>(
        'SELECT * FROM reading_progress WHERE docId = $docId',
        { $docId: docId }
    );
    return result || null;
};

export const deleteReadingProgress = async (docId: number): Promise<void> => {
    const db = await getDb();
    const statement = await db.prepareAsync('DELETE FROM reading_progress WHERE docId = $docId');
    try {
        await statement.executeAsync({ $docId: docId });
    } finally {
        await statement.finalizeAsync();
    }
};

// === Extracted Text Cache Operations ===

// Chunk size for token storage (1000 tokens per chunk to avoid OOM)
const TOKEN_CHUNK_SIZE = 1000;

export const cacheExtractedTokens = async (
    docId: number,
    tokenStream: string,
    totalTokens: number,
    totalPages: number,
    fileHash: string
): Promise<void> => {
    const db = await getDb();

    // Parse tokens from JSON string
    const tokens = JSON.parse(tokenStream) as unknown[];

    // Delete existing chunks for this docId
    const deleteChunksStmt = await db.prepareAsync('DELETE FROM token_chunks WHERE docId = $docId');
    try {
        await deleteChunksStmt.executeAsync({ $docId: docId });
    } finally {
        await deleteChunksStmt.finalizeAsync();
    }

    // Insert tokens in chunks
    const insertChunkStmt = await db.prepareAsync(`
        INSERT INTO token_chunks (docId, chunkIndex, tokens, tokenCount)
        VALUES ($docId, $chunkIndex, $tokens, $tokenCount)
    `);

    try {
        for (let i = 0; i < tokens.length; i += TOKEN_CHUNK_SIZE) {
            const chunk = tokens.slice(i, i + TOKEN_CHUNK_SIZE);
            const chunkIndex = Math.floor(i / TOKEN_CHUNK_SIZE);
            await insertChunkStmt.executeAsync({
                $docId: docId,
                $chunkIndex: chunkIndex,
                $tokens: JSON.stringify(chunk),
                $tokenCount: chunk.length,
            });
        }
    } finally {
        await insertChunkStmt.finalizeAsync();
    }

    // Save metadata (without the full tokenStream)
    const metadataStmt = await db.prepareAsync(`
        INSERT INTO extracted_text_cache (docId, totalTokens, totalPages, cacheDate, fileHash)
        VALUES ($docId, $totalTokens, $totalPages, $cacheDate, $fileHash)
        ON CONFLICT(docId) DO UPDATE SET
            totalTokens = $totalTokens,
            totalPages = $totalPages,
            cacheDate = $cacheDate,
            fileHash = $fileHash
    `);
    try {
        await metadataStmt.executeAsync({
            $docId: docId,
            $totalTokens: totalTokens,
            $totalPages: totalPages,
            $cacheDate: Date.now(),
            $fileHash: fileHash,
        });
    } finally {
        await metadataStmt.finalizeAsync();
    }
};

export const getCachedTokens = async (docId: number): Promise<ExtractedTextCache | null> => {
    const db = await getDb();

    // Get metadata
    const metadata = await db.getFirstAsync<{
        id: number;
        docId: number;
        totalTokens: number;
        totalPages: number;
        cacheDate: number;
        fileHash: string;
    }>(
        'SELECT * FROM extracted_text_cache WHERE docId = $docId',
        { $docId: docId }
    );

    if (!metadata) return null;

    // Load chunks incrementally and assemble
    const chunks = await db.getAllAsync<{ chunkIndex: number; tokens: string }>(
        'SELECT chunkIndex, tokens FROM token_chunks WHERE docId = $docId ORDER BY chunkIndex ASC',
        { $docId: docId }
    );

    if (chunks.length === 0) {
        // No chunks found - might be old data format, return null to trigger re-extraction
        console.warn('[getCachedTokens] No token chunks found for docId:', docId);
        return null;
    }

    // Assemble tokens from chunks
    const allTokens: unknown[] = [];
    for (const chunk of chunks) {
        const chunkTokens = JSON.parse(chunk.tokens) as unknown[];
        allTokens.push(...chunkTokens);
    }

    // Return in expected format with tokenStream for compatibility
    return {
        id: metadata.id,
        docId: metadata.docId,
        tokenStream: JSON.stringify(allTokens),
        totalTokens: metadata.totalTokens,
        totalPages: metadata.totalPages,
        cacheDate: metadata.cacheDate,
        fileHash: metadata.fileHash,
    };
};

export const deleteCachedTokens = async (docId: number): Promise<void> => {
    const db = await getDb();

    // Delete chunks first
    const deleteChunksStmt = await db.prepareAsync('DELETE FROM token_chunks WHERE docId = $docId');
    try {
        await deleteChunksStmt.executeAsync({ $docId: docId });
    } finally {
        await deleteChunksStmt.finalizeAsync();
    }

    // Delete metadata
    const deleteMetadataStmt = await db.prepareAsync('DELETE FROM extracted_text_cache WHERE docId = $docId');
    try {
        await deleteMetadataStmt.executeAsync({ $docId: docId });
    } finally {
        await deleteMetadataStmt.finalizeAsync();
    }
};

// === Cache Validation ===

export const isCacheValid = async (docId: number, currentFileHash: string): Promise<boolean> => {
    const cached = await getCachedTokens(docId);
    if (!cached) return false;

    // Check if hash matches
    if (cached.fileHash !== currentFileHash) return false;

    // Check if cache is older than 30 days
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - cached.cacheDate > thirtyDaysMs) return false;

    return true;
};

// === Settings Operations ===

export const getSetting = async (key: string): Promise<string | null> => {
    const db = await getDb();
    const result = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = $key',
        { $key: key }
    );
    return result?.value || null;
};

export const setSetting = async (key: string, value: string): Promise<void> => {
    const db = await getDb();
    const statement = await db.prepareAsync(`
        INSERT INTO settings (key, value)
        VALUES ($key, $value)
        ON CONFLICT(key) DO UPDATE SET value = $value
    `);
    try {
        await statement.executeAsync({ $key: key, $value: value });
    } finally {
        await statement.finalizeAsync();
    }
};
