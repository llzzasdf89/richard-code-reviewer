/**
 * 总的来说这个模块做两件事：
 * 1. 把大的Diff按文件拆分成多个小模块，因为一个PR diff可能很长，例如改动了50个文件，那么整个diff可能存在几十万字符。直接塞给模型会出现注意力分散的问题，甚至直接超出context window大小。
 * 2. 过滤掉不需要Review的文件(比如一些lock文件，package.json等等)
 */

// 单个文件的 diff 块
import { FileDiff } from "./type";

// 不需要 review 的文件（lock 文件、自动生成等）
const SKIP_PATTERNS = [
  /package-lock\.json$/,
  /pnpm-lock\.yaml$/,
  /yarn\.lock$/,
  /\.lock$/,
  /dist\//,
  /build\//,
  /\.next\//,
  /node_modules\//,
  /\.min\.(js|css)$/,
  /\.generated\./,
  /auto-generated/i,
];

function shouldSkipFile(filename: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(filename));
}

// ─── 解析 diff 文本，拆分成按文件的数组 ──────────────────────────────────────

export function parseDiff(rawDiff: string): FileDiff[] {
  const files: FileDiff[] = [];

  // 按 "diff --git" 分割，每段是一个文件的 diff
  const fileDiffs = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const fileDiff of fileDiffs) {
    const lines = fileDiff.split("\n");

    // 第一行格式：a/path/to/file b/path/to/file
    const firstLine = lines[0];
    const filenameMatch = firstLine.match(/b\/(.+)$/);
    if (!filenameMatch) continue;

    const filename = filenameMatch[1].trim();

    // 跳过不需要 review 的文件
    if (shouldSkipFile(filename)) continue;

    // 判断文件状态
    let status: FileDiff["status"] = "modified";
    let oldFileName: string | undefined;
    if (fileDiff.includes("new file mode")) status = "added";
    else if (fileDiff.includes("deleted file mode")) status = "deleted";
    else if (fileDiff.includes("rename from")) {
      status = "renamed";
      const renameFromMatch = fileDiff.match(/^rename from (.+)$/m);
      if (renameFromMatch) oldFileName = renameFromMatch[1].trim();
    }

    // 统计增删行数
    let additions = 0;
    let deletions = 0;
    for (const line of lines) {
      if (line.startsWith("+") && !line.startsWith("+++ ")) additions++;
      if (line.startsWith("-") && !line.startsWith("---")) deletions++;
    }

    files.push({
      filename,
      status,
      additions,
      deletions,
      content: "diff --git " + fileDiff,
      ...(oldFileName && { oldFileName }),
    });
  }

  return files;
}

// ─── 把文件列表分批，每批不超过 token 限制 ───────────────────────────────────
// 粗略估算：1 个字符 ≈ 0.3 个 token，预留 4000 token 给模型回答
// 所以每批 diff 内容不超过 12000 字符（约 4000 token）

const MAX_CHARS_PER_BATCH = 12000;

export function batchFileDiffs(files: FileDiff[]): FileDiff[][] {
  const batches: FileDiff[][] = [];
  let currentBatch: FileDiff[] = [];
  let currentChars = 0;

  for (const file of files) {
    const fileChars = file.content.length;

    // 单个文件超过限制，单独作为一批（截断处理）
    if (fileChars > MAX_CHARS_PER_BATCH) {
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
        currentChars = 0;
      }
      batches.push([
        {
          ...file,
          content:
            file.content.slice(0, MAX_CHARS_PER_BATCH) +
            "\n... (diff 过长，已截断)",
        },
      ]);
      continue;
    }

    // 加入当前批次会超限，先把当前批次存起来
    if (
      currentChars + fileChars > MAX_CHARS_PER_BATCH &&
      currentBatch.length > 0
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(file);
    currentChars += fileChars;
  }

  // 别忘了最后一批
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

// ─── 把一批文件 diff 格式化成给模型看的文本 ──────────────────────────────────

export function formatDiffForReview(files: FileDiff[]): string {
  return files
    .map((file) => {
      const statusLabel = {
        added: "新增文件",
        modified: "修改文件",
        deleted: "删除文件",
        renamed: "重命名文件",
      }[file.status];

      const renameNote =
        file.status === "renamed" && file.oldFileName
          ? `，原名 ${file.oldFileName}`
          : "";

      return `## ${file.filename} (${statusLabel}${renameNote}，+${file.additions} -${file.deletions})

\`\`\`diff
${file.content}
\`\`\``;
    })
    .join("\n\n---\n\n");
}
