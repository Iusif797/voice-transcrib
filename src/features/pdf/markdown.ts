export type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "bullet"; text: string }
  | { type: "p"; text: string }
  | { type: "space" };

export const parseMarkdown = (input: string): Block[] => {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: "p", text: paragraph.join(" ").trim() });
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      blocks.push({ type: "space" });
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith("# ")) {
      flush();
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flush();
      blocks.push({ type: "bullet", text: line.replace(/^[-*]\s+/, "").trim() });
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return blocks;
};

export const stripBold = (text: string): string => text.replace(/\*\*(.+?)\*\*/g, "$1");
