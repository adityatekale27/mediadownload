import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Download as DownloadIcon, Clipboard, Play, Music, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { urlInputSchema, type UrlInput } from "@shared/schema";
import { detectPlatform, detectContentType, getPlatformIcon, getPlatformColor } from "@/lib/utils";

interface StreamlinedDownloadFormProps {
  onDownloadStart: (downloadId: number) => void;
}

export default function StreamlinedDownloadForm({ onDownloadStart }: StreamlinedDownloadFormProps) {
  const [url, setUrl] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [detectedContent, setDetectedContent] = useState<{ type: string; formats: string[] } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"video" | "audio" | "image">("video");
  const [selectedQuality, setSelectedQuality] = useState("best");
  const { toast } = useToast();

  const form = useForm<UrlInput>({
    resolver: zodResolver(urlInputSchema),
    defaultValues: {
      url: "",
      format: "video",
      quality: "best",
    },
  });

  const processMutation = useMutation({
    mutationFn: async (data: UrlInput) => {
      const response = await apiRequest("POST", "/api/process", data);
      return response.json();
    },
    onSuccess: (result) => {
      onDownloadStart(result.downloadId);
      toast({
        title: "Download started",
        description: "Your media is being processed and will be ready shortly...",
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

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl) {
      const platform = detectPlatform(newUrl);
      const content = detectContentType(newUrl);
      setDetectedPlatform(platform !== "Unknown" ? platform : null);
      setDetectedContent(platform !== "Unknown" ? content : null);
      // Auto-select appropriate format based on content
      if (content.formats.includes("Audio (MP3)") && content.formats.length === 1) {
        setSelectedFormat("audio");
      } else if (content.formats.includes("Image (JPG)") && !content.formats.includes("Video (MP4)")) {
        setSelectedFormat("image");
      } else {
        setSelectedFormat("video");
      }
    } else {
      setDetectedPlatform(null);
      setDetectedContent(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Unable to read from clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!url || !detectedPlatform) return;
    
    processMutation.mutate({
      url,
      format: selectedFormat,
      quality: selectedFormat === "video" ? selectedQuality : undefined,
    });
    
    // Clear the form after processing starts
    setUrl("");
    setDetectedPlatform(null);
    setDetectedContent(null);
    setSelectedFormat("video");
    setSelectedQuality("best");
  };

  const formatOptions = [
    { value: "video", label: "Video", icon: Play, description: "Download as MP4 video file" },
    { value: "audio", label: "Audio", icon: Music, description: "Extract audio as MP3 file" },
    { value: "image", label: "Image", icon: ImageIcon, description: "Download thumbnail/image" },
  ];

  const getQualityOptions = (format: string) => {
    if (format === "video") {
      return [
        { value: "best", label: "Best Quality", description: "Highest available quality" },
        { value: "2160p", label: "4K (2160p)", description: "3840x2160 resolution" },
        { value: "1440p", label: "2K (1440p)", description: "2560x1440 resolution" },
        { value: "1080p", label: "1080p Full HD", description: "1920x1080 resolution" },
        { value: "720p", label: "720p HD", description: "1280x720 resolution" },
        { value: "480p", label: "480p SD", description: "854x480 resolution" },
        { value: "360p", label: "360p", description: "640x360 resolution" },
        { value: "240p", label: "240p", description: "426x240 resolution" },
      ];
    } else if (format === "audio") {
      return [
        { value: "best", label: "Best Quality", description: "Highest available bitrate" },
        { value: "320", label: "320 kbps", description: "High quality audio" },
        { value: "256", label: "256 kbps", description: "Very good quality" },
        { value: "192", label: "192 kbps", description: "Good quality" },
        { value: "128", label: "128 kbps", description: "Standard quality" },
        { value: "96", label: "96 kbps", description: "Lower quality" },
      ];
    } else {
      return [
        { value: "best", label: "Best Quality", description: "Original resolution" },
        { value: "high", label: "High", description: "High resolution" },
        { value: "medium", label: "Medium", description: "Medium resolution" },
        { value: "low", label: "Low", description: "Low resolution" },
      ];
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
      <CardContent className="p-6 sm:p-8">
        {/* Step 1: URL Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Paste your media URL here
            </label>
            <div className="relative">
              <Input
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://www.instagram.com/p/..."
                className="pr-12 py-3 text-base border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePaste}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-primary"
              >
                <Clipboard size={18} />
              </Button>
            </div>
          </div>

          {/* Step 2: Platform Detection */}
          {detectedPlatform && detectedContent && (
            <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 ${getPlatformColor(detectedPlatform)} rounded-xl flex items-center justify-center shadow-lg`}>
                  <i className={`${getPlatformIcon(detectedPlatform)} text-white text-xl`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-neutral-800">{detectedPlatform}</h3>
                    <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                      {detectedContent.type}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">Content detected and ready for download</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-neutral-500 mr-2">Available formats:</span>
                    {detectedContent.formats.map((format) => (
                      <span key={format} className="px-2 py-1 bg-white/60 text-neutral-700 text-xs rounded-md border">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Format Selection */}
          {detectedPlatform && detectedContent && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-500">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Choose download format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {formatOptions.map((option) => {
                    const Icon = option.icon;
                    const isAvailable = detectedContent.formats.some(f => 
                      f.toLowerCase().includes(option.value)
                    );
                    
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={selectedFormat === option.value ? "default" : "outline"}
                        disabled={!isAvailable}
                        className={`flex flex-col items-center p-4 h-auto space-y-2 ${
                          selectedFormat === option.value
                            ? "border-primary bg-primary text-white shadow-lg"
                            : isAvailable 
                              ? "border-gray-200 hover:border-primary hover:bg-primary/5"
                              : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() => isAvailable && setSelectedFormat(option.value as any)}
                      >
                        <Icon size={24} />
                        <div className="text-center">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs opacity-80">{option.description}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Quality Selection */}
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  {selectedFormat === "video" ? "Video quality" : selectedFormat === "audio" ? "Audio quality" : "Image quality"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {getQualityOptions(selectedFormat).map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selectedQuality === option.value ? "default" : "outline"}
                      className={`flex flex-col items-start p-3 h-auto text-left ${
                        selectedQuality === option.value
                          ? "border-primary bg-primary text-white"
                          : "border-gray-200 hover:border-primary hover:bg-primary/5"
                      }`}
                      onClick={() => setSelectedQuality(option.value)}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs opacity-80">{option.description}</div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Step 5: Download Button */}
              <div className="pt-4 animate-in slide-in-from-top-2 duration-700">
                <Button
                  onClick={handleDownload}
                  disabled={processMutation.isPending || !url || !detectedPlatform}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-lg"
                >
                  {processMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <DownloadIcon size={20} />
                      <span>Download {selectedFormat.charAt(0).toUpperCase() + selectedFormat.slice(1)}</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}