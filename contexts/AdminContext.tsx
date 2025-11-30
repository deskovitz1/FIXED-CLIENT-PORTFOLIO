'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type AdminContextType = {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return ctx;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  // Always start in regular view mode (isAdmin = false)
  // User must re-enter password each time via keyboard shortcut
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

