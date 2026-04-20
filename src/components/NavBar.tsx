"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Аудио" },
  { href: "/video", label: "Видео" },
];

export const NavBar = () => {
  const pathname = usePathname();
  return (
    <header className="w-full max-w-3xl mx-auto px-5 md:px-8 pt-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-[0_10px_30px_-10px_rgba(168,85,247,0.8)]" />
        <span className="font-semibold tracking-tight">VoiceScribe</span>
      </Link>
      <nav className="flex items-center gap-1 p-1 rounded-full glass">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                active ? "bg-white text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
