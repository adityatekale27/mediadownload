import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDownloadSchema, urlInputSchema, supportedPlatforms } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

/**
 * Register API routes and create HTTP server
 */
export async function registerRoutes(app: Express): Promise<Server> {
  
  /**
   * Get list of supported platforms for download
   */
  app.get("/api/platforms", (req, res) => {
    res.json(supportedPlatforms);
  });

  /**
   * Get recent downloads with pagination support
   */
  app.get("/api/downloads", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Cap at 50
      const downloads = await storage.getRecentDownloads(limit);
      res.json(downloads);
    } catch (error) {
      console.error("Error fetching downloads:", error);
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  });

  /**
   * Process media URL and start download
   * Validates URL, creates download record, and starts background processing
   */
  app.post("/api/process", async (req, res) => {
    try {
      // Validate and parse request body
      const { url, format, quality } = urlInputSchema.parse(req.body);
      
      // Perform URL validation and platform-specific checks
      const urlValidation = validateUrl(url);
      if (!urlValidation.isValid) {
        return res.status(400).json({ error: urlValidation.error });
      }
      
      // Create download record in storage with preliminary title
      const platformName = detectPlatform(url);
      const preliminaryTitle = `${platformName} Media`;
      
      const download = await storage.createDownload({
        url,
        format,
        quality,
        platform: platformName,
        status: "processing",
        title: preliminaryTitle,
      });

      // Start asynchronous media processing
      processMedia(download.id, url, format, quality).catch((error) => {
        console.error(`Background processing failed for download ${download.id}:`, error);
      });
      
      res.json(download);
    } catch (error) {
      console.error("Error processing URL:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to process URL" });
      }
    }
  });

  /**
   * Get download status by ID
   */
  app.get("/api/downloads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate ID parameter
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid download ID" });
      }
      
      const download = await storage.getDownload(id);
      
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      res.json(download);
    } catch (error) {
      console.error("Error fetching download:", error);
      res.status(500).json({ error: "Failed to fetch download" });
    }
  });

  /**
   * Download completed file by ID
   * Serves the actual media file to the client
   */
  app.get("/api/download/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate ID parameter
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid download ID" });
      }
      
      const download = await storage.getDownload(id);
      
      // Verify download exists and is completed
      if (!download || download.status !== "completed" || !download.filename) {
        return res.status(404).json({ error: "File not found or not ready" });
      }
      
      const filePath = path.join(process.cwd(), "downloads", download.filename);
      
      // Security check: ensure file exists and is within downloads directory
      if (!fs.existsSync(filePath) || !path.resolve(filePath).startsWith(path.resolve(process.cwd(), "downloads"))) {
        return res.status(404).json({ error: "File not found on disk" });
      }
      
      // Set appropriate headers for file download
      const stats = fs.statSync(filePath);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `attachment; filename="${download.filename}"`);
      
      res.download(filePath, download.filename);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  /**
   * Delete download record and associated file
   * Removes both database record and file from disk
   */
  app.delete("/api/downloads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate ID parameter
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid download ID" });
      }
      
      const download = await storage.getDownload(id);
      
      // Clean up file if it exists
      if (download && download.filename) {
        const filePath = path.join(process.cwd(), "downloads", download.filename);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted file: ${download.filename}`);
          }
        } catch (fileError) {
          console.error(`Failed to delete file ${download.filename}:`, fileError);
          // Continue with record deletion even if file deletion fails
        }
      }
      
      const deleted = await storage.deleteDownload(id);
      
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Download not found" });
      }
    } catch (error) {
      console.error("Error deleting download:", error);
      res.status(500).json({ error: "Failed to delete download" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

/**
 * Detect platform from URL domain
 * @param url - The media URL to analyze
 * @returns Platform name or "Unknown" if not recognized
 */
function detectPlatform(url: string): string {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Map domains to platform names
    const platformMap: Record<string, string> = {
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'instagram.com': 'Instagram',
      'tiktok.com': 'TikTok',
      'twitter.com': 'Twitter',
      'x.com': 'Twitter',
      'facebook.com': 'Facebook',
      'vimeo.com': 'Vimeo',
      'twitch.tv': 'Twitch',
      'dailymotion.com': 'Dailymotion',
      'soundcloud.com': 'SoundCloud',
      'reddit.com': 'Reddit'
    };
    
    // Check for exact domain matches
    for (const [domainKey, platform] of Object.entries(platformMap)) {
      if (domain.includes(domainKey)) {
        return platform;
      }
    }
    
    // Check if it's a direct image URL
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i)) {
      return "Direct Image";
    }
    
    return "Unknown";
  } catch (error) {
    console.warn("Failed to parse URL for platform detection:", url, error);
    return "Unknown";
  }
}

/**
 * Validate URL and check for unsupported patterns
 * @param url - The URL to validate
 * @returns Validation result with error message if invalid
 */
function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname.toLowerCase();
    
    // YouTube-specific validation
    if (domain.includes("youtube.com")) {
      const invalidPaths = ["/channel/", "/@", "/user/", "/c/"];
      
      // Block channel and user URLs
      if (invalidPaths.some(path => pathname.includes(path))) {
        return { 
          isValid: false, 
          error: "Please provide a direct video URL, not a channel or user profile URL" 
        };
      }
      
      // Block playlist URLs without specific video
      if (pathname.includes("/playlist") && !parsedUrl.searchParams.get("v")) {
        return { 
          isValid: false, 
          error: "Please provide a direct video URL, not a playlist URL" 
        };
      }
    }
    
    // Instagram-specific validation
    if (domain.includes("instagram.com")) {
      // Block homepage and explore URLs
      if (pathname === "/" || pathname.includes("/explore/")) {
        return { 
          isValid: false, 
          error: "Please provide a direct post or reel URL, not the homepage or explore page" 
        };
      }
      
      // Block profile URLs (single username paths)
      if (pathname.match(/^\/[^\/]+\/?$/) && 
          !pathname.includes("/p/") && 
          !pathname.includes("/reel/")) {
        return { 
          isValid: false, 
          error: "Please provide a direct post or reel URL, not a profile URL" 
        };
      }
    }
    
    // General validation: block homepage URLs unless they're direct media files
    if (pathname === "/" && !isDirectImageUrl(url)) {
      return { 
        isValid: false, 
        error: "Please provide a direct link to media content, not the homepage" 
      };
    }
    
    return { isValid: true };
  } catch (error) {
    console.warn("URL validation failed:", url, error);
    return { isValid: false, error: "Invalid URL format" };
  }
}

/**
 * Check if URL points to a direct image file
 * @param url - The URL to check
 * @returns True if URL appears to be a direct image link
 */
function isDirectImageUrl(url: string): boolean {
  try {
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
    return imageExtensions.test(url);
  } catch (error) {
    console.warn("Failed to check if URL is direct image:", url, error);
    return false;
  }
}

/**
 * Handle direct image URL downloads
 * Downloads image files directly via HTTP without yt-dlp
 * @param downloadId - Download record ID
 * @param url - Direct image URL
 * @param filename - Base filename for the download
 * @param downloadsDir - Directory to save the file
 */
async function handleDirectImageDownload(downloadId: number, url: string, filename: string, downloadsDir: string) {
  try {
    const { default: fetch } = await import('node-fetch');
    
    console.log(`Starting direct image download: ${url}`);
    
    // Fetch image with browser-like headers to avoid blocking
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Determine file extension from content type
    const contentType = response.headers.get('content-type') || '';
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp'
    };
    
    let extension = 'jpg'; // Default fallback
    for (const [mimeType, ext] of Object.entries(extensionMap)) {
      if (contentType.includes(mimeType)) {
        extension = ext;
        break;
      }
    }
    
    const finalFilename = `${filename}_DirectImage-image.${extension}`;
    const filePath = path.join(downloadsDir, finalFilename);
    
    // Download and save the image
    const buffer = await response.buffer();
    fs.writeFileSync(filePath, buffer);
    
    console.log(`Direct image saved: ${finalFilename} (${buffer.length} bytes)`);
    
    // Update download record with success status
    await storage.updateDownload(downloadId, {
      status: "completed",
      title: "Direct Image Download",
      filename: finalFilename,
      fileSize: buffer.length,
      metadata: {
        originalUrl: url,
        contentType: contentType,
        directImage: true,
        downloadedAt: new Date().toISOString()
      },
      downloadUrl: `/api/download/${downloadId}`,
    });
    
  } catch (error) {
    console.error(`Direct image download failed for ${url}:`, error);
    await storage.updateDownload(downloadId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Failed to download image",
    });
  }
}

// Rate limiting storage for Instagram
let instagramRequestQueue: Array<{ downloadId: number; resolve: () => void }> = [];
let isProcessingInstagram = false;
let lastInstagramRequestTime = 0;

async function processInstagramQueue() {
  if (isProcessingInstagram || instagramRequestQueue.length === 0) {
    return;
  }
  
  isProcessingInstagram = true;
  
  while (instagramRequestQueue.length > 0) {
    const { downloadId, resolve } = instagramRequestQueue.shift()!;
    
    // Calculate wait time (60 seconds between Instagram requests)
    const now = Date.now();
    const timeSinceLastRequest = now - lastInstagramRequestTime;
    const minDelay = 60000; // 60 seconds
    
    if (timeSinceLastRequest < minDelay && lastInstagramRequestTime > 0) {
      const waitTime = minDelay - timeSinceLastRequest;
      console.log(`Instagram rate limiting: waiting ${Math.ceil(waitTime / 1000)} seconds`);
      
      // Update status to show waiting
      await storage.updateDownload(downloadId, {
        status: "processing",
        errorMessage: `Waiting ${Math.ceil(waitTime / 1000)} seconds to avoid Instagram rate limiting...`,
      });
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastInstagramRequestTime = Date.now();
    
    // Clear the waiting message
    await storage.updateDownload(downloadId, {
      status: "processing",
      errorMessage: undefined,
    });
    
    resolve();
    
    // Small delay between processing requests in queue
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  isProcessingInstagram = false;
}

async function processInstagramMedia(downloadId: number, url: string, format: string, quality: string | undefined, filename: string, downloadsDir: string) {
  try {
    console.log(`Queuing Instagram media for processing: ${url}`);
    
    // Add to queue and wait for turn
    await new Promise<void>((resolve) => {
      instagramRequestQueue.push({ downloadId, resolve });
      processInstagramQueue().catch(console.error);
    });
    
    console.log(`Now processing Instagram media: ${url}`);
    
    const outputPath = path.join(downloadsDir, `${filename}_Instagram-%(title)s.%(ext)s`);
    
    // Ultra-minimal arguments for Instagram to avoid detection
    const args = [
      "--no-playlist",
      "--write-info-json",
      "--quiet",
      "--no-warnings", 
      "--retries", "1",
      "--socket-timeout", "60",
      "--no-call-home",
      "--no-check-certificate",
      "-o", outputPath,
    ];
    
    // Check for cookies
    const cookiesPath = path.join(process.cwd(), "cookies.txt");
    if (fs.existsSync(cookiesPath)) {
      args.push("--cookies", cookiesPath);
      console.log("Using cookies for Instagram authentication");
    } else {
      // Without cookies, try browser extraction as fallback
      args.push("--cookies-from-browser", "chrome");
      console.log("Attempting browser cookie extraction for Instagram");
    }
    
    // Use realistic mobile user agent
    args.push("--user-agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1");
    
    // Minimal headers to avoid detection
    args.push("--add-header", "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    args.push("--add-header", "Accept-Language:en-US,en;q=0.5");
    
    // Very conservative settings
    args.push("--sleep-interval", "30");
    args.push("--max-sleep-interval", "60");
    
    // Simple format selection
    if (format === "video") {
      args.push("--format", "best[ext=mp4]/best");
    } else if (format === "audio") {
      args.push("--extract-audio", "--audio-format", "mp3");
    } else {
      args.push("--format", "best");
    }
    
    args.push(url);
    
    // Execute with very long timeout for Instagram
    const ytDlpPath = "/home/runner/workspace/.pythonlibs/bin/yt-dlp";
    console.log(`Instagram command: ${ytDlpPath} ${args.join(' ')}`);
    
    const ytDlp = spawn(ytDlpPath, args, { timeout: 120000 }); // 2 minute timeout
    
    let stdout = "";
    let stderr = "";
    
    ytDlp.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    ytDlp.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    ytDlp.on("close", async (code) => {
      console.log(`Instagram yt-dlp process closed with code: ${code}`);
      console.log(`Instagram stdout: ${stdout}`);
      console.log(`Instagram stderr: ${stderr}`);
      
      // Handle Instagram-specific errors with enhanced guidance
      if (stderr.includes("HTTP Error 429") || stderr.includes("Too Many Requests") || 
          stderr.includes("rate-limit reached") || stderr.includes("login required")) {
        await storage.updateDownload(downloadId, {
          status: "failed",
          errorMessage: "Instagram rate limiting detected. The system will automatically wait 60 seconds between Instagram requests to avoid this. Try again in a few minutes.",
        });
        return;
      }
      
      if (code === 0) {
        // Handle successful download with same logic as main function
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const files = fs.readdirSync(downloadsDir);
          console.log(`Files in downloads directory: ${files.join(', ')}`);
          console.log(`Looking for files starting with: ${filename}`);

          let actualFile = files.find(f => 
            f.startsWith(filename) && !f.endsWith('.info.json') && !f.endsWith('.part')
          );

          if (actualFile) {
            console.log(`Processing file: ${actualFile}`);
            const filePath = path.join(downloadsDir, actualFile);
            const stats = fs.statSync(filePath);
            
            let title = "Instagram Media";
            let metadata = {};
            
            const infoFile = files.find(f => f.startsWith(filename) && f.endsWith('.info.json'));
            if (infoFile) {
              try {
                const infoContent = fs.readFileSync(path.join(downloadsDir, infoFile), 'utf8');
                metadata = JSON.parse(infoContent);
                title = (metadata as any)?.title || title;
              } catch (e) {
                console.log("Could not parse info.json:", e);
              }
            }
            
            await storage.updateDownload(downloadId, {
              status: "completed",
              title: title,
              filename: actualFile,
              fileSize: stats.size,
              metadata: metadata,
              downloadUrl: `/api/download/${downloadId}`,
            });
          } else {
            await storage.updateDownload(downloadId, {
              status: "failed",
              errorMessage: "Downloaded file not found",
            });
          }
        } catch (error) {
          await storage.updateDownload(downloadId, {
            status: "failed",
            errorMessage: "Error processing downloaded file",
          });
        }
      } else {
        await storage.updateDownload(downloadId, {
          status: "failed",
          errorMessage: "Instagram download failed. Instagram frequently blocks automated downloads. Try again later or provide authentication cookies.",
        });
      }
    });
    
  } catch (error) {
    console.error(`Error processing Instagram media:`, error);
    await storage.updateDownload(downloadId, {
      status: "failed",
      errorMessage: "Instagram processing failed due to platform restrictions.",
    });
  }
}

async function processMedia(downloadId: number, url: string, format: string, quality?: string) {
  try {
    // Ensure downloads directory exists
    const downloadsDir = path.join(process.cwd(), "downloads");
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    console.log(`Starting processing for download ${downloadId}: ${url}`);

    const filename = `${uuidv4()}`;
    const platformName = detectPlatform(url);
    
    // Handle direct image URLs differently
    if (isDirectImageUrl(url)) {
      await handleDirectImageDownload(downloadId, url, filename, downloadsDir);
      return;
    }
    
    // Check if Instagram rate limiting should use alternative approach
    if (platformName === "Instagram") {
      // For Instagram, try a different approach with minimal requests
      await processInstagramMedia(downloadId, url, format, quality, filename, downloadsDir);
      return;
    }
    
    const outputPath = path.join(downloadsDir, `${filename}_${platformName}-%(title)s.%(ext)s`);
    
    // Build yt-dlp command with enhanced options for better compatibility
    const args = [
      "--no-playlist",
      "--write-info-json", 
      "--no-warnings",
      "--ignore-errors",
      "--no-check-certificate",
      "--retries", "5",
      "--fragment-retries", "5", 
      "--retry-sleep", "exp=1:30", // Shorter retry intervals
      "--geo-bypass",
      "--sleep-interval", "1",
      "--max-sleep-interval", "5",
      "-o", outputPath,
    ];

    // Check if we have cookies file available for authentication
    const cookiesPath = path.join(process.cwd(), "cookies.txt");
    if (fs.existsSync(cookiesPath)) {
      args.push("--cookies", cookiesPath);
      console.log("Using cookies file for authentication");
    }
    
    // Add platform-specific options with enhanced anti-detection
    if (platformName === "YouTube") {
      // Try to extract cookies from browser automatically
      if (!fs.existsSync(cookiesPath)) {
        args.push("--cookies-from-browser", "chrome");
      }
      
      // YouTube-specific fixes for sign-in requirements and rate limiting
      args.push("--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      
      // Use multiple player clients to bypass restrictions
      args.push("--extractor-args", "youtube:player_client=web,mweb,android,ios;player_skip=webpage,configs");
      
      // Add headers to mimic real browser requests
      args.push("--add-header", "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
      args.push("--add-header", "Accept-Language:en-us,en;q=0.5");
      args.push("--add-header", "Accept-Encoding:gzip,deflate");
      args.push("--add-header", "DNT:1");
      args.push("--add-header", "Connection:keep-alive");
      
      // Rate limiting for YouTube
      args.push("--sleep-interval", "1");
      args.push("--max-sleep-interval", "5");
      
      // Use simpler format selection for better compatibility
      if (format === "video") {
        args.push("-f", "best[ext=mp4]/best");
      }
      
    } else if (platformName === "TikTok") {
      args.push("--user-agent", "Mozilla/5.0 (Linux; Android 12; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");
      args.push("--sleep-interval", "2");
      args.push("--max-sleep-interval", "8");
      
    } else if (platformName === "Facebook") {
      args.push("--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      args.push("--extractor-args", "facebook:tab_reel=true");
      args.push("--sleep-interval", "2");
      args.push("--max-sleep-interval", "8");
      
    } else if (platformName === "Twitter") {
      args.push("--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      args.push("--sleep-interval", "1");
      args.push("--max-sleep-interval", "5");
      
    } else if (platformName === "Vimeo") {
      args.push("--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      // Vimeo-specific format handling - use generic best format
      args.push("-f", "best[ext=mp4]/best");
      
    } else {
      // Generic user agent for other platforms
      args.push("--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
      args.push("--sleep-interval", "1");
      args.push("--max-sleep-interval", "4");
    }

    // Add format-specific options with correct quality handling
    if (format === "audio") {
      args.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", "192K");
    } else if (format === "video" && platformName !== "YouTube" && platformName !== "Vimeo") {
      // For non-YouTube, non-Vimeo platforms, use simpler format selection
      if (quality && quality !== "best") {
        const heightLimit = quality.replace('p', '');
        args.push("-f", `best[height<=${heightLimit}]/best`);
      } else {
        args.push("-f", "best");
      }
    } else if (format === "image") {
      args.push("--write-thumbnail");
      args.push("--convert-thumbnails", "jpg");
      args.push("-f", "best");
    }

    args.push(url);

    // Execute yt-dlp - try multiple possible paths
    let ytDlpPath = "yt-dlp"; // Default to PATH
    const possiblePaths = [
      "/home/runner/workspace/.pythonlibs/bin/yt-dlp",
      "/usr/local/bin/yt-dlp",
      "/usr/bin/yt-dlp",
      "yt-dlp"
    ];
    
    // Find working yt-dlp path
    for (const path of possiblePaths) {
      try {
        if (path === "yt-dlp" || fs.existsSync(path)) {
          ytDlpPath = path;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`Using yt-dlp path: ${ytDlpPath}`);
    console.log(`Command: ${ytDlpPath} ${args.join(' ')}`);
    
    // Execute yt-dlp
    const ytDlp = spawn(ytDlpPath, args);
    
    let stdout = "";
    let stderr = "";
    
    ytDlp.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    ytDlp.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    ytDlp.on("close", async (code) => {
      console.log(`yt-dlp process closed with code: ${code}`);
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      
      // Enhanced error detection and handling
      if (stderr.includes("HTTP Error 429") || stderr.includes("Too Many Requests") || stderr.includes("rate limit")) {
        await storage.updateDownload(downloadId, {
          status: "failed",
          errorMessage: `Rate limited by ${platformName}. Please wait a few minutes before trying again.`,
        });
        return;
      }
      
      if (stderr.includes("Sign in to confirm") || stderr.includes("Sign in to continue") || 
          stderr.includes("login_required") || stderr.includes("Private video") ||
          stderr.includes("cookies-from-browser") || stderr.includes("authentication") ||
          stderr.includes("This video is unavailable") || stderr.includes("Video unavailable") ||
          stderr.includes("Sign in to confirm you're not a bot")) {
        await storage.updateDownload(downloadId, {
          status: "failed", 
          errorMessage: `${platformName} requires authentication. Please sign in to the platform in your browser and try again, or contact support for help with authentication setup.`,
        });
        return;
      }
      
      if (stderr.includes("HTTP Error 403") || stderr.includes("Forbidden")) {
        await storage.updateDownload(downloadId, {
          status: "failed",
          errorMessage: `Access forbidden by ${platformName}. This content may be region-blocked, private, or require special permissions. Try using authentication cookies.`,
        });
        return;
      }
      
      if (stderr.includes("HTTP Error 404") || stderr.includes("Not Found")) {
        await storage.updateDownload(downloadId, {
          status: "failed",
          errorMessage: "Content not found. The video may have been deleted, made private, or the URL is incorrect.",
        });
        return;
      }
      
      if (code === 0) {
        try {
          // Give a moment for file system to sync
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Find downloaded files
          const files = fs.readdirSync(downloadsDir);
          console.log(`Files in downloads directory: ${files.join(', ')}`);
          console.log(`Looking for files starting with: ${filename}`);
          
          // Look for files that match our UUID pattern first
          let actualFile = files.find(f => 
            f.startsWith(filename) && !f.endsWith('.info.json') && !f.endsWith('.part')
          );
          console.log(`UUID-based file found: ${actualFile || 'none'}`);
          
          if (!actualFile) {
            // Look for very recent files (within last 5 minutes) excluding test and temp files
            const now = new Date().getTime();
            console.log(`Looking for recent files. Current time: ${now}`);
            
            const recentFiles = files
              .filter(f => {
                // Skip info files, temp files, and test files
                if (f.endsWith('.info.json') || f.startsWith('test.') || f.endsWith('.part') || f.endsWith('.tmp')) {
                  console.log(`Skipping file: ${f} (info/temp/test file)`);
                  return false;
                }
                
                try {
                  const stat = fs.statSync(path.join(downloadsDir, f));
                  const fileAge = now - stat.mtime.getTime();
                  const isRecent = fileAge < 300000; // 5 minutes
                  console.log(`File ${f}: age=${fileAge}ms, isRecent=${isRecent}, mtime=${stat.mtime}`);
                  return isRecent;
                } catch (error) {
                  console.log(`Error reading file stats for ${f}:`, error);
                  return false;
                }
              })
              .sort((a, b) => {
                try {
                  const statA = fs.statSync(path.join(downloadsDir, a));
                  const statB = fs.statSync(path.join(downloadsDir, b));
                  return statB.mtime.getTime() - statA.mtime.getTime();
                } catch {
                  return 0;
                }
              });
            
            console.log(`Recent files found: ${recentFiles.join(', ')}`);
            actualFile = recentFiles[0];
            console.log(`Selected file: ${actualFile}`);
          }

          // If still no file found, try to find by exact UUID match more aggressively
          if (!actualFile) {
            console.log(`No file found with standard approach. Trying more aggressive search...`);
            actualFile = files.find(f => f.includes(filename));
            console.log(`Aggressive search result: ${actualFile}`);
          }

          if (actualFile) {
            console.log(`Processing file: ${actualFile}`);
            const filePath = path.join(downloadsDir, actualFile);
            const stats = fs.statSync(filePath);
            
            // Get title from info.json if available
            let title = `Downloaded from ${detectPlatform(url)}`;
            let metadata = {};
            
            // Look for info file with same UUID
            const infoFile = files.find(f => f.startsWith(filename) && f.endsWith('.info.json'));
            console.log(`Info file found: ${infoFile}`);
            
            if (infoFile) {
              try {
                const infoContent = fs.readFileSync(path.join(downloadsDir, infoFile), 'utf8');
                metadata = JSON.parse(infoContent);
                title = (metadata as any)?.title || title;
                console.log(`Extracted title: ${title}`);
              } catch (e) {
                console.log("Could not parse info.json:", e);
              }
            }
            
            // Update the download with completion status
            const updatedDownload = await storage.updateDownload(downloadId, {
              status: "completed",
              title: title,
              filename: actualFile,
              fileSize: stats.size,
              metadata: metadata,
              downloadUrl: `/api/download/${downloadId}`,
            });
            
            console.log(`Download ${downloadId} updated successfully:`, updatedDownload);
          } else {
            console.error("No downloaded file found despite successful exit code");
            await storage.updateDownload(downloadId, {
              status: "failed",
              errorMessage: "Download completed but no file was found",
            });
          }
        } catch (error) {
          console.error("Error processing download:", error);
          await storage.updateDownload(downloadId, {
            status: "failed",
            errorMessage: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      } else {
        let errorMessage = stderr || `Download failed with exit code ${code}`;
        
        // Provide user-friendly error messages for common issues
        if (stderr.includes("login required") || stderr.includes("rate-limit reached") || stderr.includes("authentication")) {
          errorMessage = "This Instagram content requires authentication or you've hit rate limits. Instagram blocks automated downloads for most content. Try using a public post or wait before trying again.";
        } else if (stderr.includes("404: Not Found")) {
          errorMessage = "Content not found. The URL may be invalid, private, or the content may have been removed.";
        } else if (stderr.includes("unable to extract") || stderr.includes("General metadata extraction failed")) {
          errorMessage = "Unable to extract content from this URL. The platform may have updated their protection or the content may be restricted.";
        }
        
        await storage.updateDownload(downloadId, {
          status: "failed",
          errorMessage: errorMessage,
        });
      }
    });
    
    ytDlp.on("error", async (error) => {
      console.error("yt-dlp spawn error:", error);
      await storage.updateDownload(downloadId, {
        status: "failed",
        errorMessage: `Failed to start download process: ${error.message}`,
      });
    });
    
  } catch (error) {
    console.error("Process media error:", error);
    await storage.updateDownload(downloadId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
