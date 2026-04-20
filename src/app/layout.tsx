import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "VoiceScribe — запись, транскрибация и экспорт уроков",
  description:
    "Записывайте аудио или видео, получайте автоматический транскрипт, AI-конспект и экспорт в MP3, MP4 и PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
