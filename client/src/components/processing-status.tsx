import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download as DownloadIcon, FileVideo, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatFileSize } from "@/lib/utils";
import type { Download } from "@shared/schema";

interface ProcessingStatusProps {
  downloadId: number;
  onComplete?: (download: Download) => void;
}

export default function ProcessingStatus({ downloadId, onComplete }: ProcessingStatusProps) {
  const queryClient = useQueryClient();
  
  const { data: download, isLoading } = useQuery<Download>({
    queryKey: [`/api/downloads/${downloadId}`],
    refetchInterval: (data) => {
      // Trigger completion callback when done
      if (data?.status === "completed") {
        queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
        if (onComplete) {
          onComplete(data);
        }
        return false; // Stop polling
      }
      if (data?.status === "failed") {
        queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
        return false; // Stop polling
      }
      // Poll every 3 seconds while processing
      if (data?.status === "processing") {
        return 3000;
      }
      return false; // Stop polling for unknown states
    },
  });

  if (isLoading || !download) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (download.status) {
      case "processing":
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-accent-green" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
    }
  };

  const getStatusText = () => {
    switch (download.status) {
      case "processing":
        return "Processing your request...";
      case "completed":
        return "Ready to Download";
      case "failed":
        return "Download Failed";
      default:
        return "Preparing...";
    }
  };

  const handleDownload = () => {
    if (download.status === "completed") {
      window.open(`/api/download/${download.id}`, '_blank');
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
      <CardContent className="p-6 sm:p-8">
        {/* Processing State */}
        {download.status === "processing" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-neutral-800">{getStatusText()}</h3>
            </div>
            <Progress value={65} className="h-2" />
            <p className="text-sm text-neutral-500">
              Extracting video information and preparing download...
            </p>
          </div>
        )}

        {/* Completed State - This will be hidden by parent component */}
        {download.status === "completed" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-neutral-800">Processing Complete</h3>
            </div>
            <p className="text-sm text-neutral-500">
              Preparing download information...
            </p>
          </div>
        )}

        {/* Failed State */}
        {download.status === "failed" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-neutral-800">{getStatusText()}</h3>
            </div>
            <p className="text-sm text-destructive mb-2">
              {download.errorMessage || "An unknown error occurred during processing."}
            </p>
            {download.platform === "Instagram" && download.errorMessage?.includes("authentication") && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instagram Note:</strong> Instagram has strict anti-bot measures. Try using public posts or different URLs. Some content may not be accessible without login.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
