import React from "react";

// 辅助函数：解析 Error Summary 的每一行
const renderErrorLine = (line, idx) => {
  const match = line.match(/_(.*?)_\s*→\s*(.*)/); // 匹配 "_错误句子_ → 正确句子"
  if (match) {
    return (
      <li key={idx} className="mb-1">
        <span className="text-red-600 line-through mr-2">{match[1]}</span>
        <span className="text-green-600 font-semibold">{match[2]}</span>
      </li>
    );
  }
  return <li key={idx}>{line}</li>;
};

const FeedbackSection = ({ rawFeedback }) => {
  if (!rawFeedback) return null;
  
  // 先打印出 rawFeedback 的内容，看看它的类型
  console.log("rawFeedback value:", rawFeedback);
  console.log("rawFeedback type:", typeof rawFeedback);

  // 确保 rawFeedback 是字符串，如果是其他类型，做转换处理
  let text = "";
  if (typeof rawFeedback === "string") {
    text = rawFeedback;
  } else if (Array.isArray(rawFeedback)) {
    text = rawFeedback.join("\n"); // 数组拼成字符串
  } else if (typeof rawFeedback === "object" && rawFeedback !== null) {
    text = rawFeedback.feedback || JSON.stringify(rawFeedback); // 取 feedback 字段
  }

  // 按 section 拆分
  const sections = text.split(/(?=Encouraging Remarks|Error Summary|Suggestions)/);

  const encouraging = sections.find((s) => s.startsWith("Encouraging Remarks")) || "";
  const errors = sections.find((s) => s.startsWith("Error Summary")) || "";
  const suggestions = sections.find((s) => s.startsWith("Suggestions")) || "";

  const encouragingLines = encouraging.split("\n").filter((l) => l.trim().startsWith("-"));
  const errorLines = errors.split("\n").filter((l) => l.trim().startsWith("-"));
  const suggestionLines = suggestions.split("\n").filter((l) => l.trim());

  return (
    <div className="feedback-section p-4 space-y-4">
      {/* Encouraging Remarks */}
      <div className="bg-[#f0fdf4] p-3 rounded-lg">
        <h3 className="font-semibold mb-2">✅ Encouraging Remarks</h3>
        <ul className="list-disc pl-6 space-y-1">
          {encouragingLines.map((line, idx) => (
            <li key={idx}>{line.replace(/^-\s*/, "")}</li>
          ))}
        </ul>
      </div>

      {/* Error Summary */}
      <div className="bg-[#fef3c7] p-3 rounded-lg">
        <h3 className="font-semibold mb-2">❗️ Error Summary</h3>
        <ul className="list-disc pl-6 space-y-1">
          {errorLines.map((line, idx) => renderErrorLine(line.replace(/^-\s*/, ""), idx))}
        </ul>
      </div>

      {/* Suggestions */}
      <div className="bg-[#dbeafe] p-3 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Suggestions</h3>
        <ol className="list-decimal pl-6 space-y-1">
          {suggestionLines
            .filter((line) => line.startsWith("-"))
            .map((line, idx) => <li key={idx}>{line.replace(/^-\s*/, "")}</li>)}
        </ol>
      </div>
    </div>
  );
};

export default FeedbackSection;
