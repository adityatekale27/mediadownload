import { Download as DownloadIcon } from "lucide-react";

export default function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "How it Works", href: "#" },
        { label: "Supported Sites", href: "#" },
        { label: "API Access", href: "#" },
        { label: "Browser Extension", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "FAQ", href: "#" },
        { label: "Contact Us", href: "#" },
        { label: "Report Issue", href: "#" },
        { label: "Feature Request", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "DMCA Policy", href: "#" },
        { label: "Disclaimer", href: "#" },
      ],
    },
  ];

  const socialLinks = [
    { icon: "fab fa-twitter", href: "#" },
    { icon: "fab fa-github", href: "#" },
    { icon: "fab fa-discord", href: "#" },
  ];

  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <DownloadIcon className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-primary">FastDL</span>
            </div>
            <p className="text-neutral-500 text-sm">
              The fastest and most reliable media downloader for all your favorite platforms.
            </p>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-neutral-800 mb-4">{section.title}</h4>
              <ul className="space-y-2 text-sm text-neutral-500">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-neutral-500">
            © 2024 FastDL. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="text-neutral-400 hover:text-primary transition-colors"
              >
                <i className={social.icon} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
