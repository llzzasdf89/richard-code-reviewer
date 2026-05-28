// 单个文件的 diff 块
export interface FileDiff {
  filename: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  content: string; // 这个文件的完整 diff 内容
  oldFileName?: string;
}
