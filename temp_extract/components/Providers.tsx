"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useThemeStore } from "@/store/themeStore";

function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <ThemeInitializer />
      {children}
    </>
  );
}
