"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  return (
    <main className={`flex-1 fade-in ${isHome ? "" : "pt-16"}`}>
      {children}
    </main>
  );
}
