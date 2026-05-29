"use client";

import { useState } from "react";

interface ReviewFormProps {
  onSubmit: (prUrl: string) => void;
  isLoading: boolean;
}

export default function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [prUrl, setPrUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim() || isLoading) return;
    onSubmit(prUrl.trim());
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              padding: "0 12px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRight: "none",
              borderRadius: "var(--radius) 0 0 var(--radius)",
            }}
          >
            github.com/
          </span>
          <input
            type="url"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            placeholder="owner/repo/pull/123"
            disabled={isLoading}
            style={{
              flex: 1,
              height: "38px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "0 var(--radius) var(--radius) 0",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              padding: "0 14px",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border)";
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!prUrl.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ borderTopColor: "white" }} />{" "}
                分析中
              </>
            ) : (
              <>
                <span>⚡</span> 开始 Review
              </>
            )}
          </button>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "10px",
            fontSize: "12px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span>💡</span>
          支持公开仓库 · 需要 GITHUB_TOKEN 访问私有仓库
        </div>
      </div>
    </form>
  );
}
