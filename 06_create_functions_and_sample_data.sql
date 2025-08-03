-- 함수: 광고 클릭 수 증가
CREATE OR REPLACE FUNCTION increment_ad_click(ad_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE ad_banners 
    SET click_count = click_count + 1 
    WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

-- 샘플 데이터: 비상 연락처
INSERT INTO emergency_contacts (name, phone, type, address) VALUES
    ('서울종로소방서', '02-760-4119', 'fire', '서울특별시 종로구 율곡로 35'),
    ('종로경찰서', '02-2171-0112', 'police', '서울특별시 종로구 율곡로 46'),
    ('종로구청', '02-2148-1234', 'admin', '서울특별시 종로구 삼봉로 17'),
    ('서울대학교병원', '02-2072-2114', 'medical', '서울특별시 종로구 대학로 101')
ON CONFLICT DO NOTHING;

-- 샘플 데이터: 광고 배너
INSERT INTO ad_banners (category, title, content, url) VALUES
    ('insurance', '실버 안심보험', '고령자를 위한 맞춤형 보험 상품', 'https://example.com/insurance'),
    ('funeral', '효도 상조 서비스', '부담 없는 월 납입료로 준비하는 상조 서비스', 'https://example.com/funeral'),
    ('lawyer', '상속 전문 법률 상담', '복잡한 상속 문제, 전문가와 함께 해결하세요', 'https://example.com/lawyer')
ON CONFLICT DO NOTHING;