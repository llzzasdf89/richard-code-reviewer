"use client";

interface PRInfo {
  title: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  url: string;
}

interface ReviewResultProps {
  prInfo: PRInfo | null;
  status: string;
  reviewText: string;
  isLoading: boolean;
  isDone: boolean;
  onPublish: () => void;
  isPublishing: boolean;
  publishedUrl: string | null;
}

export default function ReviewResult({
  prInfo,
  status,
  reviewText,
  isLoading,
  isDone,
  onPublish,
  isPublishing,
  publishedUrl,
}: ReviewResultProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* PR 基本信息 */}
      {prInfo && (
        <div
          className="card"
          style={{
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Pull Request
            </div>
            <a
              href={prInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--accent)",
                textDecoration: "none",
              }}
            >
              {prInfo.title}
            </a>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
                flexWrap: "wrap" as const,
              }}
            >
              {[
                { icon: "👤", text: prInfo.author },
                { icon: "⬅", text: prInfo.baseBranch },
                { icon: "⮕", text: prInfo.headBranch },
              ].map((chip) => (
                <span
                  key={chip.text}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {chip.icon} {chip.text}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "4px",
              flexShrink: 0,
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{ color: "var(--green)" }}>+{prInfo.additions}</span>
              <span style={{ color: "var(--red)" }}>-{prInfo.deletions}</span>
            </div>
            <span style={{ color: "var(--text-muted)" }}>
              {prInfo.changedFiles} files
            </span>
          </div>
        </div>
      )}

      {/* 状态提示 */}
      {status && isLoading && (
        <div className="status-bar">
          <div className="spinner" style={{ color: "var(--accent)" }} />
          {status}
        </div>
      )}

      {/* Review 内容 */}
      {reviewText ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-elevated)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.06em",
                  background: "var(--accent-dim)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-glow)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                AI Review
              </span>
              <span
                style={{ fontSize: "13px", color: "var(--text-secondary)" }}
              >
                {isDone ? "分析完成" : "正在生成..."}
              </span>
            </div>
            {!isDone && (
              <div className="spinner" style={{ color: "var(--accent)" }} />
            )}
          </div>
          <pre
            style={{
              padding: "20px",
              fontFamily: "var(--font-mono)",
              fontSize: "12.5px",
              lineHeight: 1.8,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              maxHeight: "600px",
              overflowY: "auto",
            }}
          >
            {reviewText}
            {!isDone && <span className="cursor" />}
          </pre>
        </div>
      ) : !isLoading ? (
        <div className="empty-state">
          <div className="empty-icon">🤖</div>
          <div className="empty-title">等待 PR 链接</div>
          <p className="empty-desc">
            输入一个 GitHub PR 链接，AI 将自动分析代码变更，识别潜在
            Bug、性能问题和最佳实践偏差
          </p>
        </div>
      ) : null}

      {/* 发布按钮 */}
      {isDone && reviewText && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {publishedUrl ? (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                fontSize: "13px",
                color: "var(--green)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
              }}
            >
              ✓ 已发布到 GitHub →
            </a>
          ) : (
            <button
              onClick={onPublish}
              disabled={isPublishing}
              className="btn-secondary"
            >
              {isPublishing ? (
                <>
                  <div className="spinner" /> 发布中
                </>
              ) : (
                <>
                  <span>💬</span> 发布到 GitHub PR
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
