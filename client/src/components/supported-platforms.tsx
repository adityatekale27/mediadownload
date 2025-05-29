import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface Platform {
  name: string;
  icon: string;
  color: string;
  domain: string;
}

export default function SupportedPlatforms() {
  const { data: platforms = [] } = useQuery<Platform[]>({
    queryKey: ["/api/platforms"],
  });

  const defaultPlatforms: Platform[] = [
    { name: "YouTube", icon: "fab fa-youtube", color: "bg-red-500", domain: "youtube.com" },
    { name: "Instagram", icon: "fab fa-instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500", domain: "instagram.com" },
    { name: "TikTok", icon: "fab fa-tiktok", color: "bg-black", domain: "tiktok.com" },
    { name: "Twitter/X", icon: "fab fa-x-twitter", color: "bg-blue-400", domain: "twitter.com" },
    { name: "Facebook", icon: "fab fa-facebook", color: "bg-blue-600", domain: "facebook.com" },
    { name: "Twitch", icon: "fab fa-twitch", color: "bg-purple-600", domain: "twitch.tv" },
    { name: "Reddit", icon: "fab fa-reddit", color: "bg-orange-600", domain: "reddit.com" },
    { name: "Snapchat", icon: "fab fa-snapchat", color: "bg-yellow-400", domain: "snapchat.com" },
    { name: "LinkedIn", icon: "fab fa-linkedin", color: "bg-blue-700", domain: "linkedin.com" },
    { name: "Pinterest", icon: "fab fa-pinterest", color: "bg-red-600", domain: "pinterest.com" },
    { name: "Tumblr", icon: "fab fa-tumblr", color: "bg-indigo-600", domain: "tumblr.com" },
    { name: "Vimeo", icon: "fab fa-vimeo", color: "bg-blue-500", domain: "vimeo.com" },
    { name: "SoundCloud", icon: "fab fa-soundcloud", color: "bg-orange-500", domain: "soundcloud.com" },
    { name: "Dailymotion", icon: "fab fa-dailymotion", color: "bg-blue-800", domain: "dailymotion.com" },
    { name: "1800+ More", icon: "fas fa-plus", color: "bg-gradient-to-r from-orange-500 to-red-500", domain: "more" },
  ];

  const displayPlatforms = platforms.length > 0 ? [...platforms, { name: "1800+ More", icon: "fas fa-plus", color: "bg-gradient-to-r from-orange-500 to-red-500", domain: "more" }] : defaultPlatforms;

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
      <CardContent className="p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-neutral-800 mb-6 text-center">
          Supported Platforms
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayPlatforms.map((platform) => (
            <div
              key={platform.name}
              className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
            >
              <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center mb-2`}>
                <i className={`${platform.icon} text-white text-lg`} />
              </div>
              <span className="text-sm font-medium text-neutral-700 group-hover:text-primary transition-colors">
                {platform.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}