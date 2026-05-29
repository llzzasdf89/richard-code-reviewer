"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import ReviewResult from "@/components/ReviewResult";

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

interface ReviewState {
  owner: string;
  repo: string;
  pull_number: number;
  prUrl: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [prInfo, setPrInfo] = useState<PRInfo | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (prUrl: string) => {
    setIsLoading(true);
    setStatus("");
    setPrInfo(null);
    setReviewText("");
    setIsDone(false);
    setReviewState(null);
    setPublishedUrl(null);
    setError("");

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            switch (data.type) {
              case "status":
                setStatus(data.message);
                break;
              case "pr_info":
                setPrInfo(data.data);
                break;
              case "review_start":
                setStatus("");
                break;
              case "chunk":
                setReviewText((prev) => prev + data.content);
                break;
              case "done":
                setIsDone(true);
                setIsLoading(false);
                setReviewState({
                  owner: data.owner,
                  repo: data.repo,
                  pull_number: data.pull_number,
                  prUrl: data.prUrl,
                });
                break;
              case "error":
                setError(data.message);
                setIsLoading(false);
                break;
            }
          } catch {
            continue;
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "请求失败，请重试");
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!reviewState || !reviewText) return;
    setIsPublishing(true);
    try {
      const res = await fetch("/api/github/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewState,
          reviewText,
          prUrl: reviewState.prUrl,
        }),
      });
      const data = await res.json();
      if (data.success) setPublishedUrl(data.commentUrl);
      else setError(data.error ?? "发布失败");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "发布失败");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <div className="section-header">
        <div className="section-title">PR 代码审查</div>
        <div className="section-desc">
          粘贴 GitHub Pull Request 链接，AI 自动分析代码变更
        </div>
      </div>

      <ReviewForm onSubmit={handleSubmit} isLoading={isLoading} />

      {error && (
        <div className="error-banner">
          <span>⚠</span>
          {error}
        </div>
      )}

      <ReviewResult
        prInfo={prInfo}
        status={status}
        reviewText={reviewText}
        isLoading={isLoading}
        isDone={isDone}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        publishedUrl={publishedUrl}
      />
    </>
  );
}
