"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export function ProjectBackLink() {
  const router = useRouter()
  return <Link href="/menu#work" className="project-back" onClick={event => {
    try {
      const origin = sessionStorage.getItem("circus-project-origin")
      if (origin === window.location.pathname && window.history.length > 1) {
        event.preventDefault()
        sessionStorage.removeItem("circus-project-origin")
        router.back()
      }
    } catch { /* The explicit menu link works when storage is unavailable. */ }
  }}>← BACK TO MENU</Link>
}
