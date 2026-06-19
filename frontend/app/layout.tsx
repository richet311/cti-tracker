import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CTI Tracker: Threat Intelligence Platform",
  description: "Full-stack cyber threat intelligence platform. Collect IOCs, map MITRE ATT&CK TTPs, and produce finished intelligence reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('cti-theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-screen relative">{children}</body>
    </html>
  );
}
