import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Trash2,
  ExternalLink,
  Clock,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Loader2,
  DownloadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Download as DownloadType } from "@shared/schema";
import { getPlatformColor, getPlatformIcon } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function DownloadHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: downloads = [], isLoading } = useQuery<DownloadType[]>({
    queryKey: ["/api/downloads"],
    refetchInterval: 2000, // Refresh every 2 seconds to catch new downloads
    staleTime: 1000, // Consider data stale after 1 second
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/downloads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      toast({
        title: "Download deleted",
        description: "Download has been removed from history",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDownload = (download: DownloadType) => {
    if (download.status === "completed") {
      window.open(`/api/download/${download.id}`, "_blank");
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
        <CardContent className="p-6 sm:p-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (downloads.length === 0) {
    return (
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-neutral-800">
              Recent Downloads
            </h3>
          </div>
          <div className="text-center py-8">
            <Download className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-neutral-500">No downloads yet</p>
            <p className="text-sm text-neutral-400">
              Start by pasting a URL above
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="recent-downloads-section" className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-neutral-800">
            Recent Downloads
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-dark"
            onClick={() => {
              downloads.forEach((download) => handleDelete(download.id));
            }}
          >
            Clear All
          </Button>
        </div>

        <div className="space-y-0">
          {downloads.map((download, index) => (
            <div
              key={download.id}
              className={`flex items-center justify-between p-4 ${
                index !== downloads.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 ${getPlatformColor(download.platform)} rounded-lg flex items-center justify-center shadow-sm`}
                >
                  <i
                    className={`${getPlatformIcon(download.platform)} text-white text-sm`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-800 truncate max-w-xs">
                    {download.title || "Untitled Media"}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-neutral-500">
                    <span className="font-medium">{download.platform}</span>
                    {download.metadata &&
                      (download.metadata as any).duration && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {Math.floor(
                              (download.metadata as any).duration / 60,
                            )}
                            :
                            {Math.floor(
                              (download.metadata as any).duration % 60,
                            )
                              .toString()
                              .padStart(2, "0")}
                          </span>
                        </div>
                      )}
                    {download.fileSize && (
                      <div className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{formatFileSize(download.fileSize)}</span>
                      </div>
                    )}
                    <span>•</span>
                    <span>{formatTimeAgo(new Date(download.createdAt))}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {download.status === "completed" && (
                  <span className="px-2 py-1 bg-accent-green/10 text-accent-green text-xs font-medium rounded-full flex items-center">
                    <CheckCircle size={12} className="mr-1" />
                    Complete
                  </span>
                )}
                {download.status === "failed" && (
                  <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded-full">
                    Failed
                  </span>
                )}
                {download.status === "processing" && (
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center">
                    <Loader2 size={12} className="mr-1 animate-spin" />
                    Processing
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(download)}
                  disabled={download.status !== "completed"}
                  className="text-neutral-400 hover:text-primary transition-colors"
                >
                  <Download size={16} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(download.id)}
                  className="text-neutral-400 hover:text-destructive transition-colors"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
