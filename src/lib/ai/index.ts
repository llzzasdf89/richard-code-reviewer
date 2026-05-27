/**
 * AI调用层，注意采用的是阿里千问，非Anthropic官方模型和API
 */

import Anthropic from "@anthropic-ai/sdk";
import type { FileDiff } from "../diff/type";
import { formatDiffForReview } from "../diff";

const client = new Anthropic({
  baseURL: process.env.BASE_URL ?? "https://api.anthropic.com",
  apiKey: process.env.DASHSCOPE_API_KEY,
});

const MODEL_NAME = process.env.MODEL_NAME ?? "qwen-plus-2025-07-28";

const SYSTEM_PROMPT = `你是一位经验丰富的高级工程师，正在对 GitHub Pull Request 进行代码审查。

你的 review 需要关注以下几个维度：
1. **潜在 Bug**：逻辑错误、边界条件、空值处理、异常情况
2. **代码质量**：可读性、命名规范、重复代码、函数职责
3. **性能问题**：不必要的计算、内存泄漏、低效算法
4. **安全隐患**：SQL 注入、XSS、敏感信息泄露、权限校验
5. **最佳实践**：是否符合语言和框架的惯用写法

输出格式要求：
- 每个问题单独列出，注明文件名和行号（如果能判断）
- 区分严重程度：🔴 严重 / 🟡 建议 / 🟢 优化
- 如果代码写得好，也要给出正面反馈
- 最后给出整体评价和是否建议合并

语言：用中文回复。`;

// ─── 单批 diff 生成 review（非 streaming）────────────────────────────────────

export async function reviewDiffBatch(
  files: FileDiff[],
  prTitle: string,
  prDescription: string,
): Promise<string> {
  const diffText = formatDiffForReview(files);

  const response = await client.messages.create({
    model: MODEL_NAME,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `## PR 信息

**标题**：${prTitle}
**描述**：${prDescription || "（无描述）"}

## 代码变更

${diffText}

请对以上代码变更进行 review。`,
      },
    ],
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// ─── 完整 PR review，支持 streaming 回调 ─────────────────────────────────────

export async function reviewPR(
  batches: FileDiff[][],
  prTitle: string,
  prDescription: string,
  onChunk: (chunk: string) => void, // 每收到一段文字就回调
  onBatchStart: (current: number, total: number) => void, // 开始新批次时回调
): Promise<string> {
  const results: string[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    onBatchStart(i + 1, batches.length);

    // 多批次时在每批前加标题
    if (batches.length > 1) {
      const batchFiles = batch.map((f) => f.filename).join("、");
      const header = `\n\n## 第 ${i + 1} 批（${batchFiles}）\n\n`;
      onChunk(header);
      results.push(header);
    }

    // streaming 调用
    const stream = await client.messages.stream({
      model: MODEL_NAME,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `## PR 信息

**标题**：${prTitle}
**描述**：${prDescription || "（无描述）"}
${batches.length > 1 ? `\n**注意**：这是第 ${i + 1}/${batches.length} 批文件，请只 review 以下文件。` : ""}

## 代码变更

${formatDiffForReview(batch)}

请对以上代码变更进行 review。`,
        },
      ],
    });

    let batchResult = "";
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const chunk = event.delta.text;
        onChunk(chunk);
        batchResult += chunk;
      }
    }

    results.push(batchResult);
  }

  return results.join("");
}

// ─── 把 review 结果格式化成 GitHub 评论的 Markdown ───────────────────────────

export function formatReviewAsComment(
  reviewText: string,
  prUrl: string,
): string {
  return `## 🤖 AI Code Review

${reviewText}

---
*由 [Code Reviewer AI](${prUrl}) 自动生成*`;
}
