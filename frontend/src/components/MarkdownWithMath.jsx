import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm"; // ✅ for tables, strikethrough, etc.
import "katex/dist/katex.min.css";

const MarkdownWithMath = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]} // ✅ use both plugins
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownWithMath;
