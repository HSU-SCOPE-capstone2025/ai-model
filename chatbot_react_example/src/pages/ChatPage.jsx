import React, { useState } from "react";
import { fetchChat } from "../api/chatApi";

const ChatPage = () => {
  const [query, setQuery] = useState(""); // 사용자 입력
  const [chatLog, setChatLog] = useState([]); // 이전 대화 히스토리
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!query.trim()) return;

    setIsLoading(true);

    try {
      // 서버에 챗봇 질문 보내기
      const response = await fetchChat(query, true); // GPT 분석 포함

      const newEntry = {
        question: query,
        functionCall: response.function_call,
        result: response.result,
        gptSummary: response.gpt_summary,
      };

      setChatLog((prev) => [...prev, newEntry]);
      setQuery(""); // 입력창 초기화
    } catch (error) {
      console.error("챗봇 응답 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>SCOPE 챗봇</h2>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="질문을 입력하세요..."
          style={{ width: "70%", padding: "8px" }}
        />
        <button onClick={handleSubmit} disabled={isLoading} style={{ marginLeft: "10px" }}>
          {isLoading ? "분석 중..." : "전송"}
        </button>
      </div>

      <div>
        {chatLog.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "10px" }}>
            <p><strong>🙋 질문:</strong> {entry.question}</p>
            <p><strong>📌 호출된 함수:</strong> {entry.functionCall}</p>
            <p><strong>📊 통계 결과:</strong><br />{entry.result}</p>
            {entry.gptSummary && (
              <p><strong>🧠 GPT 요약:</strong><br />{entry.gptSummary}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatPage;
