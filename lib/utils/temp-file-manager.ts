/**
 * Temporary File Manager
 * Manages temporary file storage and automatic cleanup
 */
import { generateUniqueFileName } from './file-security';

/**
 * Temporary file entry
 */
interface TempFileEntry {
  id: string;
  fileName: string;
  content: string | Buffer;
  createdAt: number;
  expiresAt: number;
}

/**
 * Temporary file manager singleton
 * Stores files in memory with automatic cleanup after 1 hour
 */
class TempFileManager {
  private files: Map<string, TempFileEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // Run cleanup every 5 minutes

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Store file temporarily
   * Returns unique file ID
   */
  storeFile(originalFileName: string, content: string | Buffer): string {
    const uniqueFileName = generateUniqueFileName(originalFileName);
    const now = Date.now();

    const entry: TempFileEntry = {
      id: uniqueFileName,
      fileName: originalFileName,
      content,
      createdAt: now,
      expiresAt: now + this.EXPIRATION_TIME,
    };

    this.files.set(uniqueFileName, entry);

    return uniqueFileName;
  }

  /**
   * Retrieve file by ID
   */
  getFile(fileId: string): TempFileEntry | null {
    const entry = this.files.get(fileId);

    if (!entry) {
      return null;
    }

    // Check if file has expired
    if (Date.now() > entry.expiresAt) {
      this.deleteFile(fileId);
      return null;
    }

    return entry;
  }

  /**
   * Delete file by ID
   */
  deleteFile(fileId: string): boolean {
    return this.files.delete(fileId);
  }

  /**
   * Delete all files for cleanup
   */
  deleteAllFiles(): void {
    this.files.clear();
  }

  /**
   * Get number of stored files
   */
  getFileCount(): number {
    return this.files.size;
  }

  /**
   * Cleanup expired files
   */
  private cleanupExpiredFiles(): void {
    const now = Date.now();
    const expiredFiles: string[] = [];

    // Find expired files
    for (const [fileId, entry] of this.files.entries()) {
      if (now > entry.expiresAt) {
        expiredFiles.push(fileId);
      }
    }

    // Delete expired files
    for (const fileId of expiredFiles) {
      this.deleteFile(fileId);
    }

    if (expiredFiles.length > 0) {
      console.log(`Cleaned up ${expiredFiles.length} expired temporary files`);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredFiles();
    }, this.CLEANUP_INTERVAL);

    // Ensure cleanup runs on process exit
    if (typeof process !== 'undefined') {
      process.on('beforeExit', () => {
        this.stopCleanupTimer();
        this.deleteAllFiles();
      });
    }
  }

  /**
   * Stop automatic cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const tempFileManager = new TempFileManager();

/**
 * Store file temporarily and return unique ID
 */
export function storeTempFile(fileName: string, content: string | Buffer): string {
  return tempFileManager.storeFile(fileName, content);
}

/**
 * Retrieve temporary file by ID
 */
export function getTempFile(fileId: string): { fileName: string; content: string | Buffer } | null {
  const entry = tempFileManager.getFile(fileId);

  if (!entry) {
    return null;
  }

  return {
    fileName: entry.fileName,
    content: entry.content,
  };
}

/**
 * Delete temporary file by ID
 */
export function deleteTempFile(fileId: string): boolean {
  return tempFileManager.deleteFile(fileId);
}

/**
 * Get statistics about temporary files
 */
export function getTempFileStats(): { count: number } {
  return {
    count: tempFileManager.getFileCount(),
  };
}
