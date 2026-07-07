"use client";

import { ReelsSidebarRobot } from "@/components/ReelsSidebarRobot";
import { ReelsProvider, useReels } from "@/components/ReelsContext";
import { ReactNode, useEffect, useState } from "react";

function ReelsShell({ children }: { children: ReactNode }) {
  const { viewedCount } = useReels();
  const [lucidRobots, setLucidRobots] = useState(true);

  useEffect(() => {
    const app = localStorage.getItem("settings_appearance");
    if (app) {
      try {
        const parsed = JSON.parse(app);
        if (parsed.lucidRobots !== undefined) setLucidRobots(parsed.lucidRobots);
      } catch (e) {}
    }
  }, []);

  return (
    <div className="flex w-full min-h-screen">
      {/* Main reels content */}
      <div className="flex-1 min-w-0" id="reels-main-feed-wrapper">{children}</div>

      {/* PC Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex flex-col items-center justify-center w-36 shrink-0 sticky top-0 h-screen">
        <ReelsSidebarRobot viewedCount={viewedCount} disableAnimations={!lucidRobots} />
      </div>
    </div>
  );
}

export default function ReelsLayout({ children }: { children: ReactNode }) {
  return (
    <ReelsProvider>
      <ReelsShell>{children}</ReelsShell>
    </ReelsProvider>
  );
}
