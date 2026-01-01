"use client"

import { Video } from "@/lib/db"
import { Film, Rocket, Music, Camera } from "lucide-react"

interface MainMenuProps {
  onCategoryClick: (category: string) => void
  onAllVideosClick: () => void
}

export function MainMenu({ onCategoryClick, onAllVideosClick }: MainMenuProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1a1a1a] to-[#0f0f0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-[#272727] px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 sm:h-16">
          <h1 className="text-xl sm:text-2xl font-bold">CIRCUS17</h1>
        </div>
      </header>

      {/* Main Menu Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-3 sm:mb-4">Welcome</h2>
          <p className="text-gray-400 text-base sm:text-lg">Select a category to explore</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Recent Videos */}
          <button
            onClick={() => onCategoryClick("recent-work")}
            className="group relative p-6 sm:p-8 bg-[#181818] hover:bg-[#272727] active:bg-[#272727] border border-[#272727] hover:border-white/20 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-100 touch-manipulation min-h-[44px]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <Film className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium mb-2">Recent Videos</h3>
              <p className="text-gray-400 text-xs sm:text-sm">Latest work and projects</p>
            </div>
          </button>

          {/* Launch Videos */}
          <button
            onClick={() => onCategoryClick("industry-work")}
            className="group relative p-6 sm:p-8 bg-[#181818] hover:bg-[#272727] active:bg-[#272727] border border-[#272727] hover:border-white/20 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-100 touch-manipulation min-h-[44px]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium mb-2">Launch Videos</h3>
              <p className="text-gray-400 text-xs sm:text-sm">Industry work and launches</p>
            </div>
          </button>

          {/* Music */}
          <button
            onClick={() => onCategoryClick("music-video")}
            className="group relative p-6 sm:p-8 bg-[#181818] hover:bg-[#272727] active:bg-[#272727] border border-[#272727] hover:border-white/20 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-100 touch-manipulation min-h-[44px]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium mb-2">Music</h3>
              <p className="text-gray-400 text-xs sm:text-sm">Music videos and soundtracks</p>
            </div>
          </button>

          {/* BTS */}
          <button
            onClick={onAllVideosClick}
            className="group relative p-6 sm:p-8 bg-[#181818] hover:bg-[#272727] active:bg-[#272727] border border-[#272727] hover:border-white/20 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-100 touch-manipulation min-h-[44px]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium mb-2">BTS</h3>
              <p className="text-gray-400 text-xs sm:text-sm">Behind the scenes content</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}



