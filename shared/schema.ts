import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Downloads table schema
 * Stores information about media download requests and their status
 */
export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(), // Original media URL
  title: text("title"), // Media title extracted from source
  platform: text("platform").notNull(), // Platform name (YouTube, Instagram, etc.)
  format: text("format").notNull(), // Download format: 'video', 'audio', 'image'
  quality: text("quality"), // Quality setting: '1080p', '720p', 'best', etc.
  filename: text("filename"), // Generated filename for downloaded file
  fileSize: integer("file_size"), // File size in bytes
  status: text("status").notNull().default("pending"), // Download status
  downloadUrl: text("download_url"), // API endpoint to download the file
  metadata: jsonb("metadata"), // Additional metadata from yt-dlp or other sources
  errorMessage: text("error_message"), // Error details if download failed
  createdAt: timestamp("created_at").defaultNow().notNull(), // Creation timestamp
});

/**
 * Schema for creating new download records
 * Excludes auto-generated fields (id, createdAt)
 */
export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  createdAt: true,
});

/**
 * Schema for updating existing download records
 * All fields are optional, excludes immutable fields (id, url, createdAt)
 */
export const updateDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  url: true,
  createdAt: true,
}).partial();

// Type definitions derived from schemas
export type Download = typeof downloads.$inferSelect;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type UpdateDownload = z.infer<typeof updateDownloadSchema>;

/**
 * Schema for validating URL input from client
 * Ensures proper URL format and valid format/quality options
 */
export const urlInputSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  format: z.enum(["video", "audio", "image"]).default("video"),
  quality: z.string().optional().refine(
    (val) => !val || ['best', '1080p', '720p', '480p', '360p', '240p'].includes(val),
    "Invalid quality option"
  ),
});

export type UrlInput = z.infer<typeof urlInputSchema>;

/**
 * List of supported platforms for media download
 * Each platform includes display metadata and domain information
 */
export const supportedPlatforms = [
  { 
    name: "YouTube", 
    icon: "fab fa-youtube", 
    color: "bg-red-500", 
    domain: "youtube.com",
    description: "Videos, shorts, and audio from YouTube"
  },
  { 
    name: "Instagram", 
    icon: "fab fa-instagram", 
    color: "bg-gradient-to-r from-purple-500 to-pink-500", 
    domain: "instagram.com",
    description: "Posts, reels, and stories from Instagram"
  },
  { 
    name: "TikTok", 
    icon: "fab fa-tiktok", 
    color: "bg-black", 
    domain: "tiktok.com",
    description: "Videos and audio from TikTok"
  },
  { 
    name: "Twitter", 
    icon: "fab fa-twitter", 
    color: "bg-blue-400", 
    domain: "twitter.com",
    description: "Videos and GIFs from Twitter/X"
  },
  { 
    name: "Facebook", 
    icon: "fab fa-facebook", 
    color: "bg-blue-600", 
    domain: "facebook.com",
    description: "Videos and media from Facebook"
  },
  { 
    name: "Vimeo", 
    icon: "fab fa-vimeo", 
    color: "bg-blue-500", 
    domain: "vimeo.com",
    description: "High-quality videos from Vimeo"
  },
  { 
    name: "Twitch", 
    icon: "fab fa-twitch", 
    color: "bg-purple-600", 
    domain: "twitch.tv",
    description: "Clips and VODs from Twitch"
  },
  { 
    name: "SoundCloud", 
    icon: "fab fa-soundcloud", 
    color: "bg-orange-500", 
    domain: "soundcloud.com",
    description: "Audio tracks from SoundCloud"
  },
  { 
    name: "Reddit", 
    icon: "fab fa-reddit", 
    color: "bg-orange-600", 
    domain: "reddit.com",
    description: "Videos and GIFs from Reddit"
  },
  { 
    name: "Dailymotion", 
    icon: "fas fa-video", 
    color: "bg-blue-700", 
    domain: "dailymotion.com",
    description: "Videos from Dailymotion"
  },
] as const;
