"use client";

import { usePathname } from "next/navigation";

const breadcrumbMap: Record<string, string> = {
  "/": "pr-review",
  "/history": "history",
  "/rules": "rules",
  "/settings/review": "settings / review",
  "/settings/api": "settings / api",
};

export default function Topbar() {
  const pathname = usePathname();
  const active = breadcrumbMap[pathname] ?? pathname.replace("/", "");

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>workspace</span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-active">{active}</span>
      </div>
      <div className="topbar-actions">
        <span className="kbd">⌘K</span>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
          快速搜索
        </span>
      </div>
    </header>
  );
}
