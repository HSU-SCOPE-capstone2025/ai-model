show tables;
DESC ad_price;
DESC influencer;
DESC instagram;
DESC instagram_comment;
DESC instagram_language;
DESC tiktok;
DESC tiktok_comment;
DESC tiktok_language;
DESC total_follower;
DESC youtube;
DESC youtube_comment;
DESC youtube_language;

select * from tiktok_comment, tiktok where tiktok_comment.video_url = tiktok.video_url and tiktok.influencer_name = '돼끼';
select * from instagram;
select * from youtube;

USE my_new_db;
drop table youtube_risk_statistics;

CREATE TABLE IF NOT EXISTS youtube_risk_statistics (
    video_url VARCHAR(255) PRIMARY KEY,
    influencer_name VARCHAR(100),
    title VARCHAR(255),
    date DATE,

    -- SCOPE score
    avg_scope_score FLOAT,

    -- Emotion ratios
    emotion_happy FLOAT,
    emotion_surprise FLOAT,
    emotion_sad FLOAT,
    emotion_neutral FLOAT,
    emotion_disgust FLOAT,
    emotion_fear FLOAT,
    emotion_anger FLOAT,

    -- Topic ratios
    topic_info_tips FLOAT,
    topic_creator_personal FLOAT,
    topic_humor FLOAT,
    topic_empathy_sharing FLOAT,
    topic_product_review FLOAT,
    topic_misc FLOAT,
    topic_issue_controversy FLOAT,
    topic_question_feedback FLOAT,
    topic_content_evaluation FLOAT,
    topic_social_issue FLOAT,

    -- Cluster ratios
    cluster_empathetic FLOAT,
    cluster_supportive FLOAT,
    cluster_neutral_informative FLOAT,
    cluster_sarcastic_playful FLOAT,
    cluster_analytical FLOAT,
    cluster_aggressive FLOAT,
    cluster_spam_promotional FLOAT,

    -- Final risk scores
    cb_score FLOAT,
    ec_score FLOAT,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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

SET SQL_SAFE_UPDATES = 0;

UPDATE youtube_risk_statistics
SET cb_score = 
    ROUND(
        emotion_fear * 0.2 +
        emotion_anger * 0.2 +
        emotion_disgust * 0.2 +
        topic_issue_controversy * 0.1 +
        cluster_aggressive * 0.3,
    2);
    
select cb_score from youtube_risk_statistics where cb_score > 20;

UPDATE youtube_risk_statistics
SET ec_score = ROUND(
    1 - (
        -- 🟠 Emotion (weight 0.4)
        0.4 * (
            -(
                IF(emotion_happy > 0, (emotion_happy / 100.0) * LN(emotion_happy / 100.0), 0) +
                IF(emotion_surprise > 0, (emotion_surprise / 100.0) * LN(emotion_surprise / 100.0), 0) +
                IF(emotion_sad > 0, (emotion_sad / 100.0) * LN(emotion_sad / 100.0), 0) +
                IF(emotion_neutral > 0, (emotion_neutral / 100.0) * LN(emotion_neutral / 100.0), 0) +
                IF(emotion_disgust > 0, (emotion_disgust / 100.0) * LN(emotion_disgust / 100.0), 0) +
                IF(emotion_fear > 0, (emotion_fear / 100.0) * LN(emotion_fear / 100.0), 0) +
                IF(emotion_anger > 0, (emotion_anger / 100.0) * LN(emotion_anger / 100.0), 0)
            ) / 1.9459
        )

        +

        -- 🟡 Topic (weight 0.2)
        0.2 * (
            -(
                IF(topic_info_tips > 0, (topic_info_tips / 100.0) * LN(topic_info_tips / 100.0), 0) +
                IF(topic_creator_personal > 0, (topic_creator_personal / 100.0) * LN(topic_creator_personal / 100.0), 0) +
                IF(topic_humor > 0, (topic_humor / 100.0) * LN(topic_humor / 100.0), 0) +
                IF(topic_empathy_sharing > 0, (topic_empathy_sharing / 100.0) * LN(topic_empathy_sharing / 100.0), 0) +
                IF(topic_product_review > 0, (topic_product_review / 100.0) * LN(topic_product_review / 100.0), 0) +
                IF(topic_misc > 0, (topic_misc / 100.0) * LN(topic_misc / 100.0), 0) +
                IF(topic_issue_controversy > 0, (topic_issue_controversy / 100.0) * LN(topic_issue_controversy / 100.0), 0) +
                IF(topic_question_feedback > 0, (topic_question_feedback / 100.0) * LN(topic_question_feedback / 100.0), 0) +
                IF(topic_content_evaluation > 0, (topic_content_evaluation / 100.0) * LN(topic_content_evaluation / 100.0), 0) +
                IF(topic_social_issue > 0, (topic_social_issue / 100.0) * LN(topic_social_issue / 100.0), 0)
            ) / 2.3026
        )

        +

        -- 🟢 Cluster (weight 0.4)
        0.4 * (
            -(
                IF(cluster_empathetic > 0, (cluster_empathetic / 100.0) * LN(cluster_empathetic / 100.0), 0) +
                IF(cluster_supportive > 0, (cluster_supportive / 100.0) * LN(cluster_supportive / 100.0), 0) +
                IF(cluster_neutral_informative > 0, (cluster_neutral_informative / 100.0) * LN(cluster_neutral_informative / 100.0), 0) +
                IF(cluster_sarcastic_playful > 0, (cluster_sarcastic_playful / 100.0) * LN(cluster_sarcastic_playful / 100.0), 0) +
                IF(cluster_analytical > 0, (cluster_analytical / 100.0) * LN(cluster_analytical / 100.0), 0) +
                IF(cluster_aggressive > 0, (cluster_aggressive / 100.0) * LN(cluster_aggressive / 100.0), 0) +
                IF(cluster_spam_promotional > 0, (cluster_spam_promotional / 100.0) * LN(cluster_spam_promotional / 100.0), 0)
            ) / 1.9459
        )
    ), 4
);

UPDATE youtube_risk_statistics
SET ec_score = ROUND(ec_score * 100, 2)
WHERE ec_score IS NOT NULL;




select ec_score from youtube_risk_statistics order by influencer_name, date asc;

