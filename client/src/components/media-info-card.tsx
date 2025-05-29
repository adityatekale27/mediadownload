import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Download as DownloadIcon, Clock, CheckCircle, Loader2 } from "lucide-react";
import { formatFileSize, getPlatformIcon, getPlatformColor } from "@/lib/utils";
import type { Download } from "@shared/schema";

interface MediaInfoCardProps {
  downloadId: number;
}

export default function MediaInfoCard({ downloadId }: MediaInfoCardProps) {
  const { data: download, isLoading } = useQuery<Download>({
    queryKey: ["/api/downloads", downloadId],
    refetchInterval: 2000,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading media info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!download) return null;

  const getStatusIcon = () => {
    switch (download.status) {
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (download.status) {
      case "processing":
        return "default";
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleDownload = () => {
    if (download.downloadUrl) {
      const link = document.createElement('a');
      link.href = download.downloadUrl;
      link.download = download.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className={`text-2xl ${getPlatformIcon(download.platform)}`} style={{ color: getPlatformColor(download.platform) }} />
          Media Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={getStatusColor() as any}>
              {download.status.charAt(0).toUpperCase() + download.status.slice(1)}
            </Badge>
          </div>
          <Badge variant="outline">{download.platform}</Badge>
        </div>

        {/* Progress for processing */}
        {download.status === "processing" && (
          <div className="space-y-2">
            <Progress value={undefined} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {download.errorMessage || "Processing your request..."}
            </p>
          </div>
        )}

        {/* Title */}
        {download.title && (
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Title</h3>
            <p className="text-sm">{download.title}</p>
          </div>
        )}

        {/* URL */}
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">URL</h3>
          <p className="text-sm break-all text-blue-600">{download.url}</p>
        </div>

        {/* File Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Format</h3>
            <p className="text-sm">{download.format}</p>
          </div>
          {download.quality && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Quality</h3>
              <p className="text-sm">{download.quality}</p>
            </div>
          )}
        </div>

        {/* File Size */}
        {download.fileSize && (
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">File Size</h3>
            <p className="text-sm">{formatFileSize(download.fileSize)}</p>
          </div>
        )}

        {/* Error Message */}
        {download.status === "failed" && download.errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{download.errorMessage}</p>
            </div>
          </div>
        )}

        {/* Download Button */}
        {download.status === "completed" && download.downloadUrl && (
          <Button 
            onClick={handleDownload}
            className="w-full"
            size="sm"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download File
          </Button>
        )}
      </CardContent>
    </Card>
  );
}