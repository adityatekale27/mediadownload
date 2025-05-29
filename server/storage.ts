import { downloads, type Download, type InsertDownload, type UpdateDownload } from "@shared/schema";

/**
 * Storage interface for download operations
 * Defines the contract for download data persistence
 */
export interface IStorage {
  createDownload(download: InsertDownload): Promise<Download>;
  getDownload(id: number): Promise<Download | undefined>;
  updateDownload(id: number, updates: UpdateDownload): Promise<Download | undefined>;
  getRecentDownloads(limit?: number): Promise<Download[]>;
  deleteDownload(id: number): Promise<boolean>;
}

/**
 * In-memory storage implementation for downloads
 * Stores download records in memory using a Map for fast access
 * Data is lost on server restart - suitable for development and testing
 */
export class MemStorage implements IStorage {
  private downloads: Map<number, Download>;
  private currentId: number;

  constructor() {
    this.downloads = new Map();
    this.currentId = 1;
    console.log("Initialized in-memory storage for downloads");
  }

  /**
   * Create a new download record
   * @param insertDownload - Download data to insert
   * @returns The created download with assigned ID
   */
  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = this.currentId++;
    const download: Download = {
      id,
      url: insertDownload.url,
      title: insertDownload.title || null,
      platform: insertDownload.platform,
      format: insertDownload.format,
      quality: insertDownload.quality || null,
      filename: insertDownload.filename || null,
      fileSize: insertDownload.fileSize || null,
      status: insertDownload.status || "pending",
      downloadUrl: insertDownload.downloadUrl || null,
      metadata: insertDownload.metadata || null,
      errorMessage: insertDownload.errorMessage || null,
      createdAt: new Date(),
    };
    
    this.downloads.set(id, download);
    console.log(`Created download record ${id} for ${insertDownload.platform}: ${insertDownload.url}`);
    return download;
  }

  /**
   * Get download record by ID
   * @param id - Download ID to retrieve
   * @returns Download record or undefined if not found
   */
  async getDownload(id: number): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  /**
   * Update existing download record
   * @param id - Download ID to update
   * @param updates - Partial download data to update
   * @returns Updated download record or undefined if not found
   */
  async updateDownload(id: number, updates: UpdateDownload): Promise<Download | undefined> {
    const existing = this.downloads.get(id);
    if (!existing) {
      console.warn(`Attempted to update non-existent download ${id}`);
      return undefined;
    }
    
    const updated: Download = { ...existing, ...updates };
    this.downloads.set(id, updated);
    
    // Log status changes for debugging
    if (updates.status && updates.status !== existing.status) {
      console.log(`Download ${id} status changed: ${existing.status} -> ${updates.status}`);
    }
    
    return updated;
  }

  /**
   * Get recent downloads sorted by creation date
   * @param limit - Maximum number of downloads to return (default: 10)
   * @returns Array of downloads sorted by most recent first
   */
  async getRecentDownloads(limit: number = 10): Promise<Download[]> {
    const allDownloads = Array.from(this.downloads.values());
    return allDownloads
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, Math.max(1, Math.min(limit, 100))); // Cap between 1 and 100
  }

  /**
   * Delete download record
   * @param id - Download ID to delete
   * @returns True if deleted, false if not found
   */
  async deleteDownload(id: number): Promise<boolean> {
    const deleted = this.downloads.delete(id);
    if (deleted) {
      console.log(`Deleted download record ${id}`);
    }
    return deleted;
  }
}

// Create and export storage instance
export const storage = new MemStorage();
