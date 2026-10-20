"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

export const WORK_CATEGORIES = [
  { value: "", label: "All" },
  { value: "music-video", label: "Music Videos" },
  { value: "industry-work", label: "Launch Films" },
  { value: "clothing", label: "Fashion" },
  { value: "live-events", label: "Live Events" },
  { value: "bts", label: "Behind the Scenes" },
]

export function SiteNavigation({ category = "", actions, continuous = false, hideSpinner = false, onCategoryChange }: {
  category?: string; actions?: ReactNode; continuous?: boolean; hideSpinner?: boolean; onCategoryChange?: (value: string) => void
}) {
  const pathname = usePathname()
  return (
    <header className="studio-navigation">
      <div className="studio-navigation-top">
        <Link href={continuous ? (hideSpinner ? "#work" : "#spinner") : "/menu#spinner"} className="studio-wordmark" aria-label="CIRCUS17 home">CIRCUS<span>17</span></Link>
        <nav aria-label="Main navigation" className="studio-main-links">
          <Link href={continuous ? "#work" : "/menu#work"}>Work</Link>
          {!hideSpinner && <Link href={continuous ? "#spinner" : "/menu#spinner"}>Spinner</Link>}
          <Link href="/contact" aria-current={pathname === "/contact" ? "page" : undefined}>Contact</Link>
          {actions}
        </nav>
      </div>
      <nav aria-label="Project categories" className="studio-categories">
        {WORK_CATEGORIES.map(item => (
          <Link key={item.value} href={continuous ? `${pathname}${item.value ? `?category=${item.value}` : ""}#portfolio` : `/menu${item.value ? `?category=${item.value}` : ""}#portfolio`}
            onClick={onCategoryChange ? event => { event.preventDefault(); onCategoryChange(item.value) } : undefined}
            aria-current={(continuous || pathname === "/videos") && category === item.value ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
