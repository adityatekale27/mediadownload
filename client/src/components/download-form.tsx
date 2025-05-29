import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Download as DownloadIcon, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { urlInputSchema, type UrlInput } from "@shared/schema";
import { detectPlatform, detectContentType, getPlatformIcon, getPlatformColor } from "@/lib/utils";

interface DownloadFormProps {
  onDownloadStart: (downloadId: number) => void;
}

export default function DownloadForm({ onDownloadStart }: DownloadFormProps) {
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [detectedContent, setDetectedContent] = useState<{ type: string; formats: string[] } | null>(null);
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
        title: "Processing started",
        description: "Your download is being processed...",
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

  const handleUrlChange = (url: string) => {
    if (url) {
      const platform = detectPlatform(url);
      const content = detectContentType(url);
      setDetectedPlatform(platform !== "Unknown" ? platform : null);
      setDetectedContent(platform !== "Unknown" ? content : null);
    } else {
      setDetectedPlatform(null);
      setDetectedContent(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      form.setValue("url", text);
      handleUrlChange(text);
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Unable to read from clipboard",
        variant: "destructive",
      });
    }
  };

  const formatOptions = [
    { value: "video", label: "Video (MP4)", icon: "fas fa-video", badge: "BEST" },
    { value: "audio", label: "Audio (MP3)", icon: "fas fa-music", badge: null },
    { value: "image", label: "Images", icon: "fas fa-image", badge: null },
  ];

  const qualityOptions = [
    { value: "best", label: "Best Quality Available" },
    { value: "1080p", label: "1080p (Full HD)" },
    { value: "720p", label: "720p (HD)" },
    { value: "480p", label: "480p (SD)" },
    { value: "360p", label: "360p (Mobile)" },
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
      <CardContent className="p-6 sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => processMutation.mutate(data))} className="space-y-6">
            {/* URL Input */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-700">
                    Paste your media URL here
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="pr-12 py-3 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                        onChange={(e) => {
                          field.onChange(e);
                          handleUrlChange(e.target.value);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handlePaste}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-primary"
                      >
                        <Clipboard size={16} />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Platform Detection */}
            {detectedPlatform && detectedContent && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${getPlatformColor(detectedPlatform)} rounded-lg flex items-center justify-center`}>
                    <i className={`${getPlatformIcon(detectedPlatform)} text-white text-lg`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold text-neutral-800">{detectedPlatform}</p>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                        {detectedContent.type}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">Content detected and ready to download</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-neutral-500">Available formats:</span>
                      {detectedContent.formats.map((format, index) => (
                        <span key={format} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Format Selection */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-700">Download Format</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {formatOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={field.value === option.value ? "default" : "outline"}
                          className={`flex items-center justify-between p-3 h-auto ${
                            field.value === option.value
                              ? "border-primary bg-primary/5 text-primary hover:bg-primary/10"
                              : "border-gray-200 hover:border-primary hover:bg-primary/5"
                          }`}
                          onClick={() => field.onChange(option.value)}
                        >
                          <div className="flex items-center space-x-2">
                            <i className={`${option.icon} ${field.value === option.value ? "text-primary" : "text-neutral-500"}`} />
                            <span className={`font-medium ${field.value === option.value ? "text-primary" : "text-neutral-700"}`}>
                              {option.label}
                            </span>
                          </div>
                          {option.badge && field.value === option.value && (
                            <span className="text-xs text-primary font-medium">{option.badge}</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quality Selection */}
            {form.watch("format") === "video" && (
              <FormField
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-700">Video Quality</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-200 rounded-xl focus:ring-2 focus:ring-primary">
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {qualityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Download Button */}
            <Button
              type="submit"
              disabled={processMutation.isPending}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <DownloadIcon className="mr-2" size={20} />
              {processMutation.isPending ? "Processing..." : "Download Now"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
