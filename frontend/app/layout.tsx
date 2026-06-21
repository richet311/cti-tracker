import type { Metadata } from "next";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { ConfirmProvider } from "@/hooks/useConfirm";
import { ToastProvider } from "@/hooks/useToast";

export const metadata: Metadata = {
  title: "CTI Tracker: Threat Intelligence Platform",
  description: "Full-stack cyber threat intelligence platform. Collect IOCs, map MITRE ATT&CK TTPs, and produce finished intelligence reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen relative">
        <SessionProviderWrapper>
          <ConfirmProvider><ToastProvider>{children}</ToastProvider></ConfirmProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
