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

  console.log("rawFeedback value:", rawFeedback);

  // 直接从对象里取字段（保证是字符串）
  const encouraging = typeof rawFeedback.encouragingRemarks === "string" ? rawFeedback.encouragingRemarks : "";
  const errors = typeof rawFeedback.errorSummary === "string" ? rawFeedback.errorSummary : "";
  const suggestions = typeof rawFeedback.suggestions === "string" ? rawFeedback.suggestions : "";

  // 拆分成行（过滤空行）
  const encouragingLines = encouraging ? encouraging.split("\n").filter((l) => l.trim().startsWith("-")) : [];
  const errorLines = errors ? errors.split("\n").filter((l) => l.trim().startsWith("-")) : [];
  const suggestionLines = suggestions ? suggestions.split("\n").filter((l) => l.trim().startsWith("-")) : [];

  return (
    <div className="feedback-section p-4 space-y-4">
      {/* Encouraging Remarks */}
      {encouragingLines.length > 0 && (
        <div className="bg-[#f0fdf4] p-3 rounded-lg">
          <h3 className="font-semibold mb-2">✅ Encouraging Remarks</h3>
          <ul className="list-disc pl-6 space-y-1">
            {encouragingLines.map((line, idx) => (
              <li key={idx}>{line.replace(/^-\s*/, "")}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Summary */}
      {errorLines.length > 0 && (
        <div className="bg-[#fef3c7] p-3 rounded-lg">
          <h3 className="font-semibold mb-2">❗️ Error Summary</h3>
          <ul className="list-disc pl-6 space-y-1">
            {errorLines.map((line, idx) => renderErrorLine(line.replace(/^-\s*/, ""), idx))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestionLines.length > 0 && (
        <div className="bg-[#dbeafe] p-3 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Suggestions</h3>
          <ol className="list-decimal pl-6 space-y-1">
            {suggestionLines.map((line, idx) => (
              <li key={idx}>{line.replace(/^-\s*/, "")}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default FeedbackSection;
