'use client';

import { useState, useEffect } from 'react';

interface VideoPagePasswordProps {
  children: React.ReactNode;
}

const VIDEO_PAGE_PASSWORD = 'welcometothecircus';
const VIDEO_AUTH_COOKIE = 'video_access';

export function VideoPagePassword({ children }: VideoPagePasswordProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated via localStorage
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      // Check localStorage for video page access
      const stored = localStorage.getItem(VIDEO_AUTH_COOKIE);
      if (stored === 'true') {
        setIsAuthenticated(true);
      }
    } catch (err) {
      // localStorage not available
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple password check - doesn't grant admin access
    if (password === VIDEO_PAGE_PASSWORD) {
      // Store in localStorage (not admin cookie)
      try {
        localStorage.setItem(VIDEO_AUTH_COOKIE, 'true');
        setIsAuthenticated(true);
        setPassword('');
      } catch (err) {
        setError('Failed to save authentication. Please try again.');
      }
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#05060A] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#05060A] flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-2">Enter Password</h1>
          <p className="text-gray-400 mb-6">Please enter the password to access this page.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
