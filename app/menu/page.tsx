// app/menu/page.tsx

import Link from "next/link";

function MenuButton({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="px-6 py-3 border border-white/40 rounded-full text-lg hover:bg-white hover:text-black transition"
    >
      {label}
    </Link>
  );
}

export default function MainMenuPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-semibold tracking-[0.3em]">CIRCUS17</h1>
      <div className="flex flex-wrap justify-center gap-4">
        {/*
          IMPORTANT:
          Replace "/videos" below with the REAL route where your actual videos page exists.
          If your working page is /videos, keep it.
          If it is something else (like /circus, /portfolio, /allvideos), change it.
        */}
        <MenuButton label="Recent Videos" href="/videos" />
        <MenuButton label="Launch Videos" href="/videos" />
        <MenuButton label="Music" href="/videos" />
        <MenuButton label="Clothing" href="/videos" />
        <MenuButton label="Narrative" href="/videos" />
      </div>
    </main>
  );
}
