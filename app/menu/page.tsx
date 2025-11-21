"use client"

import Link from "next/link"

function MenuButton({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="px-6 py-3 border border-white/40 rounded-full text-lg hover:bg-white hover:text-black transition"
    >
      {label}
    </Link>
  )
}

export default function MainMenuPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-semibold tracking-[0.3em]">
        CIRCUS17
      </h1>
      <div className="flex flex-wrap justify-center gap-4">
        <MenuButton label="Recent Videos" href="/videos?category=recent-work" />
        <MenuButton label="Launch Videos" href="/videos?category=industry-work" />
        <MenuButton label="Music" href="/videos?category=music-video" />
        <MenuButton label="Clothing" href="/videos?category=clothing" />
        <MenuButton label="Narrative" href="/videos?category=narrative" />
      </div>
    </main>
  )
}
