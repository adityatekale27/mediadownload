import Header from "@/components/header";
import StreamlinedDownloadForm from "@/components/streamlined-download-form";
import MediaInfoDisplay from "@/components/media-info-display";
import MediaInfoCard from "@/components/media-info-card";
import SupportedPlatforms from "@/components/supported-platforms";
import DownloadHistory from "@/components/download-history";
import Features from "@/components/features";
import Footer from "@/components/footer";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Download } from "@shared/schema";

/**
 * Home page component - main download interface
 * Manages download state and coordinates between form, status display, and history
 */
export default function Home() {
  const [currentDownloadId, setCurrentDownloadId] = useState<number | null>(null);

  // Query to get the current download data with smart polling
  const { data: currentDownload, isError } = useQuery<Download>({
    queryKey: ["/api/downloads", currentDownloadId],
    enabled: !!currentDownloadId,
    refetchInterval: 2000, // Poll every 2 seconds for active downloads
    staleTime: 1000, // Consider data stale after 1 second during active downloads
  });

  /**
   * Handle new download initiation
   * Sets current download for tracking and scrolls to monitoring section
   */
  const handleNewDownload = useCallback((id: number) => {
    setCurrentDownloadId(id);
    
    // Smooth scroll to downloads section for user feedback
    setTimeout(() => {
      const downloadsSection = document.getElementById('recent-downloads-section');
      if (downloadsSection) {
        downloadsSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }, 300);
  }, []);

  /**
   * Trigger automatic file download
   * Creates temporary download link and clicks it programmatically
   */
  const handleAutoDownload = useCallback((download: Download) => {
    if (!download.downloadUrl) {
      console.warn('No download URL available for', download.id);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = download.downloadUrl;
      link.download = download.filename || download.title || 'download';
      link.setAttribute('target', '_blank');
      
      // Temporarily add to DOM for click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to trigger download:', error);
    }
  }, []);

  /**
   * Auto-clear completed downloads from active monitoring
   * Removes download from current view after completion to reduce clutter
   */
  useEffect(() => {
    if (currentDownload?.status === "completed" || currentDownload?.status === "failed") {
      const timer = setTimeout(() => {
        setCurrentDownloadId(null);
      }, 5000); // Show completed status for 5 seconds before clearing

      return () => clearTimeout(timer);
    }
  }, [currentDownload?.status]);

  /**
   * Clear current download if query fails
   * Prevents stuck loading states from network errors
   */
  useEffect(() => {
    if (isError && currentDownloadId) {
      console.warn('Download query failed, clearing current download');
      setCurrentDownloadId(null);
    }
  }, [isError, currentDownloadId]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-800 mb-4">
            Download from <span className="text-primary">Any Platform</span>
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
            Fast, free, and reliable media downloader. Support for YouTube, Instagram, TikTok, Twitter, and 100+ more platforms.
          </p>
        </div>

        {/* Download Form */}
        <StreamlinedDownloadForm onDownloadStart={handleNewDownload} />

        {/* Media Info Card - Shows processing status and info */}
        {currentDownloadId && (
          <div className="mb-8">
            <MediaInfoCard downloadId={currentDownloadId} />
          </div>
        )}

        {/* Media Info Display - Only show when we have actual media info, not just processing */}
        {currentDownload && currentDownload.status === "completed" && (
          <div id="media-info-section">
            <MediaInfoDisplay 
              download={currentDownload}
              onAutoDownload={handleAutoDownload}
            />
          </div>
        )}

        <SupportedPlatforms />
        <DownloadHistory />
        <Features />
      </main>

      <Footer />
    </div>
  );
}