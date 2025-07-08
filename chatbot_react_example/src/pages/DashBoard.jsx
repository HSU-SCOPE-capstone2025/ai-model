// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import GaugeChart from "react-gauge-chart";
import { useLocation } from "react-router-dom";

const API_BASE = "http://3.34.90.217:5000/api";

const normalizeScore = (score) => Math.min(Math.max(score / 100, 0), 1);
const normalizeCBScore = (score) => Math.min(Math.max(score / 15, 0), 1);
const getRiskLevelColor = (cbScore) => {
  if (cbScore <= 3) return "#e0f7e9";
  if (cbScore <= 6) return "#fff9db";
  if (cbScore <= 9) return "#ffeacc";
  if (cbScore <= 12) return "#ffd6d6";
  return "#f3d1ff";
};

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const DashboardPage = () => {
  const [data, setData] = useState([]);
  const [avgData, setAvgData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(true); // 테이블 토글 상태
  const query = useQuery();
  const initialInfluencer = query.get("influencer_name") || "";
  const [selectedInfluencer, setSelectedInfluencer] = useState(initialInfluencer);
  const [selectedRow, setSelectedRow] = useState(null); // 선택된 행 인덱스 저장
  const [chatResponse, setChatResponse] = useState(""); // 응답 텍스트용 state
  useEffect(() => {
    fetchData();
  }, [selectedInfluencer]);

  const sendChatQuery = async (rowData, purpose) => {
    try {
      // ✅ v= 뒤 해시값만 추출
      const videoId = new URL(rowData.video_url).searchParams.get("v");

      const query = `"${rowData.influencer_name}"의 영상(${videoId})에 대한 negative 댓글 [${purpose}] CB: ${rowData.cb_score}, EC: ${rowData.ec_score}`;

      const response = await axios.post("http://3.34.90.217:5000/chat", {
        query: query,
        gpt: true
      });

      const resultText = response.data.gpt_summary + response.data.result;
      setChatResponse(`[${purpose}] 완료됨:\n` + resultText);
    } catch (err) {
      console.error("POST 실패:", err);
      setChatResponse("❌ 요청 중 오류가 발생했습니다.");
    }
  };


  const fetchData = async () => {
    setLoading(true);
    try {
      const riskUrl = selectedInfluencer
        ? `${API_BASE}/youtube-risk?influencer_name=${encodeURIComponent(selectedInfluencer)}`
        : `${API_BASE}/youtube-risk`;

      const avgUrl = selectedInfluencer
        ? `${API_BASE}/youtube-risk-avg?influencer_name=${encodeURIComponent(selectedInfluencer)}`
        : `${API_BASE}/youtube-risk-avg`;

      const [riskRes, avgRes] = await Promise.all([
        axios.get(riskUrl),
        axios.get(avgUrl),
      ]);

      setData(riskRes.data);
      setAvgData(avgRes.data);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>📊 유튜브 리스크 대시보드</h1>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1.5rem" }}>
        <strong>CB (Cyberbullying Score)</strong>: 영상에 달린 댓글 중 공격성, 혐오, 비난, 조롱 등의
        <u> 사이버불링 관련 표현</u>의 밀도를 수치화한 지표입니다. 점수가 높을수록
        <b> 악성 댓글의 비율이 높음</b>을 의미합니다.<br />
        <strong>EC (Echo Chamber Score)</strong>: 특정한 의견이 <u>동질적인 댓글</u>
        을 통해 반복적으로 증폭되는 경향을 측정한 지표입니다.
        점수가 높을수록 <b>의견 다양성이 부족하고 편향된 반응</b>이 나타납니다.
      </p>

      <input
        type="text"
        placeholder="인플루언서 이름으로 검색"
        value={selectedInfluencer}
        onChange={(e) => setSelectedInfluencer(e.target.value)}
        style={{ padding: "0.5rem", width: "300px", marginBottom: "1.5rem" }}
      />

      {loading ? (
        <p>데이터 로딩 중...</p>
      ) : (
        <>
          <h2>🔥 평균 리스크 점수</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", marginBottom: "2rem" }}>
            {avgData.length === 0 ? (
              <p>검색된 평균 데이터가 없습니다.</p>
            ) : (
              avgData.map((row, idx) => (
                <div key={idx} style={{ width: "300px", textAlign: "center" }}>
                  <h3>{row.influencer_name}</h3>
                  <GaugeChart
                    id={`cb-gauge-${idx}`}
                    nrOfLevels={20}
                    arcsLength={[0.2, 0.2, 0.2, 0.2, 0.2]}
                    colors={["#2ecc71", "#f1c40f", "#e67e22", "#e74c3c", "#8e44ad"]}
                    percent={normalizeCBScore(row.avg_cb_score)}
                    arcPadding={0.02}
                    textColor="#000"
                    formatTextValue={() => `CB: ${row.avg_cb_score}`}
                    needleColor="#000"
                  />
                  <GaugeChart
                    id={`ec-gauge-${idx}`}
                    nrOfLevels={20}
                    arcsLength={[0.2, 0.2, 0.2, 0.2, 0.2]}
                    colors={["#2ecc71", "#f1c40f", "#e67e22", "#e74c3c", "#8e44ad"]}
                    percent={normalizeScore(row.avg_ec_score)}
                    arcPadding={0.02}
                    textColor="#000"
                    formatTextValue={() => `EC: ${row.avg_ec_score}`}
                    needleColor="#000"
                  />
                </div>
              ))
            )}
          </div>

          <h2 style={{ cursor: "pointer" }} onClick={() => setShowTable(!showTable)}>
            📺 영상별 리스크 {showTable ? "🔽" : "▶"}
          </h2>

          {showTable && (
            <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th></th> {/* 체크박스 열 */}
                  <th>인플루언서</th>
                  <th>제목</th>
                  <th>날짜</th>
                  <th>CB Score</th>
                  <th>EC Score</th>
                  <th>url</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>데이터가 없습니다.</td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: getRiskLevelColor(row.cb_score),
                        transition: "background-color 0.3s"
                      }}
                    >
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="radio"
                          name="selectedRow"
                          checked={selectedRow === idx}
                          onChange={() => setSelectedRow(idx)}
                        />
                      </td>
                      <td>{row.influencer_name}</td>
                      <td>
                        <a href={row.video_url} target="_blank" rel="noreferrer">
                          {row.title}
                        </a>
                      </td>
                      <td>{row.date}</td>
                      <td>{row.cb_score}</td>
                      <td>{row.ec_score}</td>
                      <td>{row.video_url}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </>
      )}
      <button
        style={{
          padding: "0.7rem 1.2rem",
          marginRight: "1rem",
          backgroundColor: "#3498db",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
        onClick={() => {
          if (selectedRow == null) {
            alert("먼저 테이블에서 항목을 선택하세요.");
            return;
          }
          sendChatQuery(data[selectedRow], "리포트 생성");
        }}
      >
        🔍 리포트 생성
      </button>
      <button
        style={{
          padding: "0.7rem 1.2rem",
          backgroundColor: "#27ae60",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
        onClick={() => {
          if (selectedRow == null) {
            alert("먼저 테이블에서 항목을 선택하세요.");
            return;
          }
          sendChatQuery(data[selectedRow], "대처방안 생성");
        }}
      >
        💡 대처방안 생성
      </button>
      <br/><br/>
      <button
        style={{
          padding: "0.8rem 1.5rem",
          backgroundColor: "#8e44ad",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
        onClick={() => {
          if (selectedRow == null) {
            alert("먼저 테이블에서 항목을 선택하세요.");
            return;
          }
          sendChatQuery(data[selectedRow], "반대관점 콘텐츠 제안");
        }}
      >
        🔁 반대관점 콘텐츠 제안
      </button>
      {chatResponse && (
        <div
          style={{
            marginTop: "1.5rem",
            whiteSpace: "pre-wrap",
            backgroundColor: "#f4f4f4",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc"
          }}
        >
          {chatResponse}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
