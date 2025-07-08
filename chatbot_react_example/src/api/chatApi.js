// api/chatApi.js
import axios from 'axios';

export const fetchChat = async (query, useGpt = true) => {
  try {
    const response = await axios.post("http://3.34.90.217:5000/chat", {
      query: query,
      gpt: useGpt
    });

    return response.data; // { function_call, result, gpt_summary }
  } catch (error) {
    console.error("챗봇 요청 실패:", error);
    throw error;
  }
};

// ✅ 유튜브 리스크 통계 리스트 (최근 영상 기준)
export const fetchRiskData = async (influencerName = null) => {
  try {
    const response = await axios.get("http://3.34.90.217:5000/api/youtube-risk", {
      params: influencerName ? { influencer_name: influencerName } : {}
    });

    return response.data; // 리스트 형태
  } catch (error) {
    console.error("리스크 데이터 요청 실패:", error);
    throw error;
  }
};

// ✅ 유튜브 리스크 통계 평균 (전체 혹은 특정 인플루언서)
export const fetchRiskAverage = async (influencerName = null) => {
  try {
    const response = await axios.get("http://3.34.90.217:5000/api/youtube-risk-avg", {
      params: influencerName ? { influencer_name: influencerName } : {}
    });

    return response.data; // 평균 값 객체
  } catch (error) {
    console.error("평균 리스크 요청 실패:", error);
    throw error;
  }
};
