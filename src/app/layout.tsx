import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import { Toaster } from "sonner";
import {
  BadgeCheck,
  BadgeInfo,
  Loader,
  ShieldX,
  TriangleAlert,
  X,
} from "lucide-react";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voice Transcription",
  description: "Modern voice transcription with visualizer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${quicksand.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen"></div>
            }
          >
            {children}
            <Toaster
              richColors
              expand
              position="top-center"
              theme="dark"
              className="font-primary toast-jiggle"
              visibleToasts={3}
              icons={{
                close: <X className="h-4 w-4" />,
                error: <ShieldX className="h-4 w-4" />,
                info: <BadgeInfo className="h-4 w-4" />,
                loading: <Loader className="h-4 w-4" />,
                success: <BadgeCheck className="h-4 w-4" />,
                warning: <TriangleAlert className="h-4 w-4" />,
              }}
            />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
