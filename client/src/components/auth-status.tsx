import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthStatusResponse {
  hasCookies: boolean;
  cookieInfo?: {
    fileSize: number;
    lastModified: string;
    domains: string[];
    error?: string;
  };
  recommendations: {
    youtube: string;
    instagram: string;
    facebook: string;
    general: string;
  };
}

export default function AuthStatus() {
  const { data: authStatus, isLoading } = useQuery<AuthStatusResponse>({
    queryKey: ['/api/auth-status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Checking authentication status...</div>
        </CardContent>
      </Card>
    );
  }

  if (!authStatus) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {authStatus.hasCookies ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          )}
          Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={authStatus.hasCookies ? "default" : "secondary"}>
            {authStatus.hasCookies ? "Authenticated" : "No Authentication"}
          </Badge>
          {authStatus.cookieInfo && (
            <span className="text-sm text-muted-foreground">
              {authStatus.cookieInfo.domains?.length || 0} platform(s)
            </span>
          )}
        </div>

        {!authStatus.hasCookies && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Many downloads fail without authentication cookies. Add your browser cookies to improve success rates, especially for YouTube and Instagram.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Platform Status:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">YouTube</span>
              <Badge variant={authStatus.recommendations.youtube === "Authenticated" ? "default" : "outline"} className="text-xs">
                {authStatus.recommendations.youtube === "Authenticated" ? "Ready" : "Needs Auth"}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">Instagram</span>
              <Badge variant={authStatus.recommendations.instagram === "Authenticated" ? "default" : "outline"} className="text-xs">
                {authStatus.recommendations.instagram === "Authenticated" ? "Ready" : "Needs Auth"}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">Facebook</span>
              <Badge variant={authStatus.recommendations.facebook === "Authenticated" ? "default" : "outline"} className="text-xs">
                {authStatus.recommendations.facebook === "Authenticated" ? "Ready" : "Needs Auth"}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded">
              <span className="text-sm">Other Platforms</span>
              <Badge variant="default" className="text-xs">
                Ready
              </Badge>
            </div>
          </div>
        </div>

        {authStatus.cookieInfo && authStatus.cookieInfo.domains && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Platforms:</h4>
            <div className="flex flex-wrap gap-1">
              {authStatus.cookieInfo.domains.map((domain, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {domain}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(authStatus.cookieInfo.lastModified).toLocaleString()}
            </p>
          </div>
        )}

        {!authStatus.hasCookies && (
          <div className="text-sm space-y-2">
            <h4 className="font-medium">How to add authentication:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Install a browser extension like "Get cookies.txt LOCALLY"</li>
              <li>Visit and log into the platform you want to download from</li>
              <li>Export cookies using the extension</li>
              <li>Save the file as "cookies.txt" in the project root</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}