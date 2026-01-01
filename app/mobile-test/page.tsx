"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MobileTestPage() {
  const router = useRouter()

  useEffect(() => {
    // Force mobile viewport for testing
    const metaViewport = document.querySelector('meta[name="viewport"]')
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=375, initial-scale=1, maximum-scale=1, user-scalable=no')
    } else {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=375, initial-scale=1, maximum-scale=1, user-scalable=no'
      document.head.appendChild(meta)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mobile Test Page</h1>
        <p className="mb-4">This page forces a mobile viewport (375px width).</p>
        <p className="mb-4 text-sm text-gray-400">
          Current viewport width: <span id="viewport-width" className="text-white font-mono"></span>px
        </p>
        <div className="space-y-2">
          <a
            href="/"
            className="block px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-center transition-colors"
          >
            Go to Homepage (Mobile View)
          </a>
          <a
            href="/videos"
            className="block px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-center transition-colors"
          >
            Go to Videos (Mobile View)
          </a>
          <a
            href="/menu"
            className="block px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-center transition-colors"
          >
            Go to Menu (Mobile View)
          </a>
        </div>
        <p className="mt-6 text-xs text-gray-500">
          Note: This is a test page. For best results, use browser DevTools device emulation.
        </p>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            function updateViewportWidth() {
              const width = window.innerWidth;
              const el = document.getElementById('viewport-width');
              if (el) el.textContent = width;
            }
            updateViewportWidth();
            window.addEventListener('resize', updateViewportWidth);
          `,
        }}
      />
    </div>
  )
}

