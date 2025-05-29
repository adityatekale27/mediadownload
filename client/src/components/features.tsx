import { Zap, Shield, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Features() {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Download your favorite content in seconds with our optimized servers and advanced compression.",
    },
    {
      icon: Shield,
      title: "100% Safe",
      description: "No malware, no ads, no tracking. Your privacy and security are our top priorities.",
    },
    {
      icon: Smartphone,
      title: "Works Everywhere",
      description: "Compatible with all devices and browsers. Download on desktop, mobile, or tablet.",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {features.map((feature, index) => (
        <Card
          key={index}
          className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <feature.icon className="text-primary" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              {feature.title}
            </h3>
            <p className="text-neutral-500">
              {feature.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
