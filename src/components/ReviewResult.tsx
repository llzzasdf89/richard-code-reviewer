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
  if (!prInfo && !status && !reviewText) return null;

  return (
    <div className="w-full space-y-4">
      {/* PR 基本信息 */}
      {prInfo && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <a
                href={prInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {prInfo.title}
              </a>
              <p className="text-sm text-gray-500 mt-1">
                {prInfo.author} 将 {prInfo.headBranch} 合并到{" "}
                {prInfo.baseBranch}
              </p>
            </div>
            <div className="text-sm text-gray-500 text-right shrink-0">
              <span className="text-green-600">+{prInfo.additions}</span>
              {" / "}
              <span className="text-red-500">-{prInfo.deletions}</span>
              <br />
              <span>{prInfo.changedFiles} 个文件</span>
            </div>
          </div>
        </div>
      )}

      {/* 状态提示 */}
      {status && isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>{status}</span>
        </div>
      )}

      {/* Review 内容 */}
      {reviewText && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">Review 结果</h3>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {reviewText}
            </pre>
          </div>
        </div>
      )}

      {/* 发布按钮 */}
      {isDone && reviewText && (
        <div className="flex items-center gap-3">
          {publishedUrl ? (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:underline"
            >
              ✅ 已发布到 GitHub →
            </a>
          ) : (
            <button
              onClick={onPublish}
              disabled={isPublishing}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {isPublishing ? "发布中..." : "发布到 GitHub PR"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
