"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
interface SiderBarProps {
  metaData: {
    title: string;
    description: string;
  };
}

const navItems = [
  { href: "/", icon: "🔍", label: "PR Review" },
  { href: "/history", icon: "📋", label: "历史记录" },
  { href: "/rules", icon: "📚", label: "代码规范库" },
];

const settingsItems = [
  { href: "/settings/review", icon: "⚙️", label: "Review 规则" },
  { href: "/settings/api", icon: "🔑", label: "API 设置" },
];

export default function Sidebar({ metaData }: SiderBarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">{metaData.title}</span>
          <span className="logo-badge">AI</span>
        </div>
      </div>

      <nav className="nav-section">
        <div className="nav-label">工作台</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <div className="nav-label">配置</div>
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-dot">
          <div className="status-dot-indicator" />
          <span>AI 服务正常</span>
        </div>
      </div>
    </aside>
  );
}
