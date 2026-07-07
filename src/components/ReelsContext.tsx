"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ReelsContextValue {
  viewedCount: number;
  incrementViewed: () => void;
}

const ReelsContext = createContext<ReelsContextValue>({
  viewedCount: 0,
  incrementViewed: () => {},
});

export function ReelsProvider({ children }: { children: ReactNode }) {
  const [viewedCount, setViewedCount] = useState(0);
  const incrementViewed = () => setViewedCount((n) => n + 1);
  return (
    <ReelsContext.Provider value={{ viewedCount, incrementViewed }}>
      {children}
    </ReelsContext.Provider>
  );
}

export const useReels = () => useContext(ReelsContext);
