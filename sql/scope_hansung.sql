REPLACE INTO youtube_risk_statistics (
    video_url, influencer_name, title, date,
    avg_scope_score,

    -- 감정
    emotion_happy, emotion_surprise, emotion_sad,
    emotion_neutral, emotion_disgust, emotion_fear, emotion_anger,

    -- 주제
    topic_info_tips, topic_creator_personal, topic_humor,
    topic_empathy_sharing, topic_product_review, topic_misc,
    topic_issue_controversy, topic_question_feedback, topic_content_evaluation,
    topic_social_issue,

    -- 클러스터
    cluster_empathetic, cluster_supportive, cluster_neutral_informative,
    cluster_sarcastic_playful, cluster_analytical, cluster_aggressive, cluster_spam_promotional
)
SELECT
    y.video_url,
    y.influencer_name,
    y.title,
    y.date,
    AVG(yc.fss) AS avg_scope_score,

    -- 감정 비율
    ROUND(SUM(yc.emotion = '행복') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.emotion = '놀람') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.emotion = '슬픔') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.emotion = '중립') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.emotion = '혐오') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.emotion = '공포') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.emotion = '분노') / COUNT(*) * 100, 2),

    -- 주제 비율
    ROUND(SUM(yc.topic = '정보 / 꿀팁') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '유튜버 개인') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '유머 / 드립') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '공감 / 감정 공유') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '제품 / 아이템 리뷰') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '기타 / 미분류') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '사건 / 논란') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '질문 / 피드백') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '콘텐츠 평가') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.topic = '사회 / 시사 이슈') / COUNT(*) * 100, 2),

    -- 클러스터 비율
    ROUND(SUM(yc.cluster = 'Empathetic') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.cluster = 'Supportive') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.cluster = 'Neutral Informative') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.cluster = 'Sarcastic/Playful') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.cluster = 'Analytical') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.cluster = 'Aggressive') / COUNT(*) * 100, 2),
    ROUND(SUM(yc.cluster = 'Spam/Promotional') / COUNT(*) * 100, 2)

FROM youtube_comment yc
JOIN youtube y ON yc.video_url = y.video_url
GROUP BY y.video_url, y.influencer_name, y.title, y.date;