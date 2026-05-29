import { Octokit } from "@octokit/rest";
let OctokitInstance: Octokit | null = null; //全局实例，采用单例模式

//工厂函数，返回OctoKit单例
function getOctokit() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("缺少 GITHUB_TOKEN 环境变量");
  }
  if (!OctokitInstance) {
    OctokitInstance = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }
  return OctokitInstance;
}

// ─── 解析 PR 链接 ────────────────────────────────────────────────────────────
// 输入：https://github.com/facebook/react/pull/1234
// 输出：{ owner: 'facebook', repo: 'react', pull_number: 1234 }

export function parsePRUrl(url: string): {
  owner: string;
  repo: string;
  pull_number: number;
} {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);

  if (!match) {
    throw new Error(
      "无效的 GitHub PR 链接，格式应为：https://github.com/owner/repo/pull/123",
    );
  }

  return {
    owner: match[1],
    repo: match[2],
    pull_number: parseInt(match[3], 10),
  };
}

// ─── 获取 PR 基本信息 ─────────────────────────────────────────────────────────

export async function getPRInfo(
  owner: string,
  repo: string,
  pull_number: number,
) {
  const octokit = getOctokit();
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
  });

  return {
    title: data.title,
    description: data.body ?? "",
    author: data.user?.login ?? "",
    baseBranch: data.base.ref,
    headBranch: data.head.ref,
    changedFiles: data.changed_files,
    additions: data.additions,
    deletions: data.deletions,
    url: data.html_url,
  };
}

// ─── 获取 PR Diff ─────────────────────────────────────────────────────────────

export async function getPRDiff(
  owner: string,
  repo: string,
  pull_number: number,
): Promise<string> {
  const octokit = getOctokit();
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
    mediaType: { format: "diff" },
  });

  return typeof data === "string" ? data : "";
}

// ─── 发评论到 PR ──────────────────────────────────────────────────────────────

export async function createPRComment(
  owner: string,
  repo: string,
  pull_number: number,
  body: string,
): Promise<string> {
  const octokit = getOctokit();
  const { data } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body,
  });

  return data.html_url;
}
