'use client';

import { useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';

export function AdminShortcutListener() {
  const { setIsAdmin } = useAdmin();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();
      const isCmdShiftC = e.shiftKey && key === 'c' && e.metaKey; // Cmd+Shift+C (Mac)
      const isCtrlShiftC = e.shiftKey && key === 'c' && e.ctrlKey; // Ctrl+Shift+C (Win/Linux)

      if (!isCmdShiftC && !isCtrlShiftC) return;

      // Always prompt for password (no check for isAdmin)
      const password = window.prompt('Enter admin password');
      if (!password) return;

      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Admin login failed');
            return;
          }
          setIsAdmin(true);
          alert('Admin mode enabled');
        })
        .catch(() => {
          alert('Network error during admin login');
        });
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setIsAdmin]);

  return null;
}

