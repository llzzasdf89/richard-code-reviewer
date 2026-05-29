import { NextRequest } from "next/server";
import { parsePRUrl, getPRInfo, getPRDiff } from "@/lib/github";
import { parseDiff, batchFileDiffs } from "@/lib/diff";
import { reviewPR } from "@/lib/ai";

export const maxDuration = 60; // PR 较大时可能需要更长时间

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  (async () => {
    try {
      const { prUrl } = await req.json();

      if (!prUrl) {
        await sendEvent({ type: "error", message: "请提供 PR 链接" });
        return;
      }

      // ① 解析 PR 链接
      await sendEvent({ type: "status", message: "正在解析 PR 链接..." });
      const { owner, repo, pull_number } = parsePRUrl(prUrl);

      // ② 获取 PR 基本信息
      await sendEvent({ type: "status", message: "正在获取 PR 信息..." });
      const prInfo = await getPRInfo(owner, repo, pull_number);
      await sendEvent({ type: "pr_info", data: prInfo });

      // ③ 拉取 diff
      await sendEvent({ type: "status", message: "正在拉取代码变更..." });
      const rawDiff = await getPRDiff(owner, repo, pull_number);

      // ④ 解析和分批
      const files = parseDiff(rawDiff);

      if (files.length === 0) {
        await sendEvent({
          type: "error",
          message: "没有找到需要 review 的文件",
        });
        return;
      }

      const batches = batchFileDiffs(files);
      await sendEvent({
        type: "status",
        message: `共 ${files.length} 个文件，分 ${batches.length} 批处理`,
      });

      // ⑤ AI review（streaming）
      await sendEvent({ type: "review_start" });

      const fullReview = await reviewPR(
        batches,
        prInfo.title,
        prInfo.description,
        // 每收到一段文字，推给前端
        async (chunk) => {
          await sendEvent({ type: "chunk", content: chunk });
        },
        // 开始新批次时通知前端
        async (current, total) => {
          if (total > 1) {
            await sendEvent({
              type: "status",
              message: `正在处理第 ${current}/${total} 批文件...`,
            });
          }
        },
      );

      // ⑥ 完成
      await sendEvent({
        type: "done",
        fullReview,
        prUrl,
        owner,
        repo,
        pull_number,
      });
    } catch (err: any) {
      await sendEvent({
        type: "error",
        message: err?.message ?? "未知错误",
      });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
