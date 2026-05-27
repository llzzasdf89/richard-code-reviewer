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
    // 重置状态
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
          } catch (e) {
            console.warn("Invalid SSE message:", line);
            continue;
          }
        }
      }
    } catch (err: any) {
      setError(err?.message ?? "请求失败，请重试");
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
          owner: reviewState.owner,
          repo: reviewState.repo,
          pull_number: reviewState.pull_number,
          reviewText,
          prUrl: reviewState.prUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPublishedUrl(data.commentUrl);
      } else {
        setError(data.error ?? "发布失败");
      }
    } catch (err: any) {
      setError(err?.message ?? "发布失败");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Code Reviewer AI</h1>
          <p className="text-gray-500 mt-1 text-sm">
            粘贴 GitHub PR 链接，AI 自动生成代码 Review 意见
          </p>
        </div>

        {/* 输入表单 */}
        <ReviewForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* 错误提示 */}
        {error && (
          <div
            className="p-3 bg-red-50 border border-red-200
            rounded-lg text-sm text-red-600"
          >
            {error}
          </div>
        )}

        {/* Review 结果 */}
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
      </div>
    </main>
  );
}
