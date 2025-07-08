// src/pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const API_BASE = "http://3.34.90.217:5000/api";

const normalizeScore = (score, max = 100) => Math.min(Math.max(score / max, 0), 1);
const getRiskLevelColor = (cbScore) => {
  if (cbScore <= 3) return "#e0f7e9";
  if (cbScore <= 6) return "#fff9db";
  if (cbScore <= 9) return "#ffeacc";
  if (cbScore <= 12) return "#ffd6d6";
  return "#f3d1ff";
};

const HalfDoughnut = ({ value, label, max, colors }) => {
  const percentage = normalizeScore(value, max);
  const data = {
    labels: [label, ""],
    datasets: [
      {
        data: [percentage, 1 - percentage],
        backgroundColor: [colors[0], "#f0f0f0"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    rotation: -90,
    circumference: 180,
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div style={{ width: 200, textAlign: "center" }}>
      <Doughnut data={data} options={options} />
      <div style={{ marginTop: -120, fontWeight: "bold", fontSize: "1.1rem" }}>{`${label}: ${value}`}</div>
    </div>
  );
};

const DashboardPage = () => {
  const [data, setData] = useState([]);
  const [avgData, setAvgData] = useState([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVideoTable, setShowVideoTable] = useState(true); // 토글 상태 추가
  
  useEffect(() => {
    fetchData();
  }, [selectedInfluencer]);

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
        <strong>CB (Cyberbullying Score)</strong>: 댓글 중 공격성, 조롱 등의 <u>사이버불링 표현</u> 밀도를 수치화한 지표.<br />
        <strong>EC (Echo Chamber Score)</strong>: 동질적인 의견 반복 여부를 측정한 지표.
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
            {avgData.map((row, idx) => (
              <div key={idx} style={{ width: "300px", textAlign: "center" }}>
                <h3>{row.influencer_name}</h3>
                <HalfDoughnut
                  value={row.avg_cb_score}
                  label="CB"
                  max={15}
                  colors={["#e74c3c"]}
                />
                <HalfDoughnut
                  value={row.avg_ec_score}
                  label="EC"
                  max={100}
                  colors={["#2980b9"]}
                />
              </div>
            ))}
          </div>

          <h2>📺 영상별 리스크</h2>
          <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>인플루언서</th>
                <th>제목</th>
                <th>날짜</th>
                <th>CB Score</th>
                <th>EC Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  style={{ backgroundColor: getRiskLevelColor(row.cb_score) }}
                >
                  <td>{row.influencer_name}</td>
                  <td>
                    <a href={row.video_url} target="_blank" rel="noreferrer">
                      {row.title}
                    </a>
                  </td>
                  <td>{row.date}</td>
                  <td>{row.cb_score}</td>
                  <td>{row.ec_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
