import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khmer Note",
  description: "កម្មវិធីចំណាំជាភាសាខ្មែរ - Khmer Note Taking Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="km" suppressHydrationWarning>
      <body className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 h-screen flex overflow-hidden selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
