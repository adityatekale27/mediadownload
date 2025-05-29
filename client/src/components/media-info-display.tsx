
import React from "react";
import { Download, Clock, User, FileVideo, Music, Image, Loader2, Trash2, HardDrive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, formatTimeAgo, getPlatformIcon, getPlatformColor } from "@/lib/utils";
import type { Download as DownloadType } from "@shared/schema";

interface MediaInfoDisplayProps {
  download: DownloadType;
  onAutoDownload: (download: DownloadType) => void;
}

export default function MediaInfoDisplay({ download, onAutoDownload }: MediaInfoDisplayProps) {
  const isProcessing = download.status === "processing" || download.status === "pending";
  
  // Auto-download when processing completes and hide the section
  React.useEffect(() => {
    if (download.status === "completed" && download.downloadUrl) {
      // Automatically trigger download
      const link = document.createElement('a');
      link.href = download.downloadUrl;
      link.download = download.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Hide this section after 3 seconds and let it move to recent downloads
      setTimeout(() => {
        if (onAutoDownload) {
          // Signal parent to hide this component
          const event = new CustomEvent('downloadCompleted', { detail: download });
          window.dispatchEvent(event);
        }
      }, 3000);
    }
  }, [download.status, download.downloadUrl, onAutoDownload]);

  const metadata = download.metadata as any;
  const duration = metadata?.duration ? `${Math.floor(metadata.duration / 60)}:${Math.floor(metadata.duration % 60).toString().padStart(2, '0')}` : null;
  const uploader = metadata?.uploader || metadata?.channel || "Unknown Creator";
  const thumbnail = metadata?.thumbnail;

  const getFormatIcon = () => {
    switch (download.format) {
      case "video": return <FileVideo className="w-4 h-4" />;
      case "audio": return <Music className="w-4 h-4" />;
      case "image": return <Image className="w-4 h-4" />;
      default: return <FileVideo className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 animate-in slide-in-from-top-2 duration-300">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-32 h-20 bg-gray-100 rounded-lg overflow-hidden relative">
            {thumbnail ? (
              <img 
                src={thumbnail} 
                alt={download.title || "Media thumbnail"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                {getFormatIcon()}
              </div>
            )}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          
          {/* Media Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-neutral-800 truncate pr-4">
                {download.title || "Extracting media information..."}
              </h3>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className={`w-8 h-8 ${getPlatformColor(download.platform || "Unknown")} rounded-lg flex items-center justify-center shadow-sm`}>
                  <i className={`${getPlatformIcon(download.platform || "Unknown")} text-white text-sm`} />
                </div>
                <Badge 
                  variant={download.status === "completed" ? "default" : "secondary"}
                  className={isProcessing ? "animate-pulse bg-orange-100 text-orange-700" : ""}
                >
                  {isProcessing ? "Processing" : "Ready"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{uploader}</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3 flex-wrap">
              {duration && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{duration}</span>
                </div>
              )}
              {download.fileSize && (
                <div className="flex items-center space-x-1">
                  <HardDrive className="w-4 h-4" />
                  <span>{formatFileSize(download.fileSize)}</span>
                </div>
              )}
              <span>•</span>
              <span className="font-medium">{download.format?.toUpperCase()}</span>
              {download.quality && <span>• {download.quality}</span>}
            </div>

            {/* Processing status or completed actions */}
            {isProcessing ? (
              <div className="flex items-center space-x-2 text-orange-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Processing media...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-600 font-medium">
                  ✓ Downloaded automatically
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => onAutoDownload(download)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download Again
                  </Button>
                  <Button variant="outline" size="sm" className="hover:bg-red-50 hover:border-red-200 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
