import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}

export function detectPlatform(url: string): string {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes("youtube.com") || domain.includes("youtu.be")) return "YouTube";
    if (domain.includes("instagram.com")) return "Instagram";
    if (domain.includes("tiktok.com")) return "TikTok";
    if (domain.includes("twitter.com") || domain.includes("x.com")) return "Twitter";
    if (domain.includes("facebook.com")) return "Facebook";
    if (domain.includes("vimeo.com")) return "Vimeo";
    if (domain.includes("twitch.tv")) return "Twitch";
    if (domain.includes("dailymotion.com")) return "Dailymotion";
    if (domain.includes("soundcloud.com")) return "SoundCloud";
    if (domain.includes("reddit.com")) return "Reddit";
    
    // Check if it's a direct image URL
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i)) return "Direct Image";
    
    return "Unknown";
  } catch {
    return "Unknown";
  }
}

export function detectContentType(url: string): { type: string; formats: string[] } {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    const path = new URL(url).pathname.toLowerCase();
    
    // Check for direct image URLs first
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i)) {
      return { type: "Direct Image", formats: ["Image (JPG)"] };
    }
    
    // Instagram detection
    if (domain.includes("instagram.com")) {
      if (path.includes("/reel")) {
        return { type: "Video Reel", formats: ["Video (MP4)", "Audio (MP3)"] };
      }
      if (path.includes("/p/")) {
        return { type: "Post", formats: ["Video (MP4)", "Image (JPG)", "Audio (MP3)"] };
      }
      if (path.includes("/stories")) {
        return { type: "Story", formats: ["Video (MP4)", "Image (JPG)"] };
      }
      return { type: "Content", formats: ["Video (MP4)", "Image (JPG)", "Audio (MP3)"] };
    }
    
    // YouTube detection
    if (domain.includes("youtube.com") || domain.includes("youtu.be")) {
      if (path.includes("/shorts")) {
        return { type: "YouTube Short", formats: ["Video (MP4)", "Audio (MP3)"] };
      }
      return { type: "Video", formats: ["Video (MP4)", "Audio (MP3)"] };
    }
    
    // TikTok detection
    if (domain.includes("tiktok.com")) {
      return { type: "TikTok Video", formats: ["Video (MP4)", "Audio (MP3)"] };
    }
    
    // Twitter/X detection
    if (domain.includes("twitter.com") || domain.includes("x.com")) {
      return { type: "Tweet Media", formats: ["Video (MP4)", "Image (JPG)", "Audio (MP3)"] };
    }
    
    // SoundCloud detection
    if (domain.includes("soundcloud.com")) {
      return { type: "Audio Track", formats: ["Audio (MP3)"] };
    }
    
    // Default for other platforms
    return { type: "Media Content", formats: ["Video (MP4)", "Audio (MP3)", "Image (JPG)"] };
  } catch {
    return { type: "Media Content", formats: ["Video (MP4)", "Audio (MP3)", "Image (JPG)"] };
  }
}

export function getPlatformIcon(platform: string): string {
  switch (platform.toLowerCase()) {
    case "youtube": return "fab fa-youtube";
    case "instagram": return "fab fa-instagram";
    case "tiktok": return "fab fa-tiktok";
    case "twitter": 
    case "twitter/x": return "fab fa-x-twitter";
    case "facebook": return "fab fa-facebook";
    case "vimeo": return "fab fa-vimeo-v";
    case "twitch": return "fab fa-twitch";
    case "dailymotion": return "fas fa-video";
    case "soundcloud": return "fab fa-soundcloud";
    case "reddit": return "fab fa-reddit-alien";
    case "direct image": return "fas fa-image";
    default: return "fas fa-globe";
  }
}

export function getPlatformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case "youtube": return "bg-red-500";
    case "instagram": return "bg-gradient-to-r from-purple-500 to-pink-500";
    case "tiktok": return "bg-black";
    case "twitter": return "bg-blue-400";
    case "facebook": return "bg-blue-600";
    case "vimeo": return "bg-blue-500";
    case "direct image": return "bg-green-500";
    default: return "bg-gray-500";
  }
}


