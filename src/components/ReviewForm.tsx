'use client';

import { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (prUrl: string) => void;
  isLoading: boolean;
}

export default function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [prUrl, setPrUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prUrl.trim() || isLoading) return;
    onSubmit(prUrl.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3">
        <label
          htmlFor="pr-url"
          className="text-sm font-medium text-gray-700"
        >
          GitHub PR 链接
        </label>
        <div className="flex gap-2">
          <input
            id="pr-url"
            type="url"
            value={prUrl}
            onChange={e => setPrUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              text-sm"
          />
          <button
            type="submit"
            disabled={!prUrl.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
              text-sm font-medium transition-colors"
          >
            {isLoading ? '分析中...' : '开始 Review'}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          支持公开仓库和有权限的私有仓库
        </p>
      </div>
    </form>
  );
}