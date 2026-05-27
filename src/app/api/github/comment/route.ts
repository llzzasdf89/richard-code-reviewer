import { NextRequest, NextResponse } from "next/server";
import { createPRComment } from "@/lib/github";
import { formatReviewAsComment } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, pull_number, reviewText, prUrl } = await req.json();

    if (!owner || !repo || !pull_number || !reviewText) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const commentBody = formatReviewAsComment(reviewText, prUrl);
    const commentUrl = await createPRComment(
      owner,
      repo,
      pull_number,
      commentBody,
    );

    return NextResponse.json({ success: true, commentUrl });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "发布评论失败";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
