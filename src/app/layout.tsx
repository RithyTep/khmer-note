import type { Metadata } from "next";
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
    <html lang="km">
      <body className="bg-white text-zinc-800 h-screen flex overflow-hidden selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
