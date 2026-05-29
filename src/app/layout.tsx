import type { Metadata } from "next";
import "./global.css";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export const metadata: Metadata = {
  title: "Richard-Code-Reviewer",
  description: "AI 驱动的 GitHub PR 代码审查工具",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <div className="grid-bg" />
        <div className="glow-orb" />

        <div className="app-layout">
          <Sidebar metaData={metadata} />

          <main className="app-main">
            <Topbar />
            <div className="page-content">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
