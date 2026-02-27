"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Wraps page content with a smooth fade-up entrance animation
 * that replays every time the route changes.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [animKey, setAnimKey] = useState(0);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      setAnimKey((k) => k + 1);
    }
  }, [pathname]);

  return (
    <div
      key={animKey}
      className="animate-page-enter h-full"
    >
      {children}
    </div>
  );
}
