# 카카오 로그인 설정 가이드

## 1. 카카오 개발자 사이트 설정

1. [카카오 개발자 사이트](https://developers.kakao.com) 접속
2. 로그인 후 "내 애플리케이션" 클릭
3. "애플리케이션 추가하기" 클릭
4. 앱 정보 입력:
   - 앱 이름: 안심케어
   - 사업자명: (본인 또는 회사명)

## 2. 앱 키 발급

1. 생성된 앱 클릭
2. "앱 키" 메뉴에서 **JavaScript 키** 복사
3. `app.js` 파일의 다음 부분에 키 입력:
   ```javascript
   const KAKAO_JS_KEY = 'YOUR_JAVASCRIPT_KEY_HERE'; // 여기에 JavaScript 키 입력
   ```

## 3. 플랫폼 설정

1. "플랫폼" 메뉴 클릭
2. "Web 플랫폼 등록" 클릭
3. 사이트 도메인 입력:
   - 개발용: `http://localhost:포트번호`
   - 운영용: `https://your-domain.com`

## 4. 카카오 로그인 활성화

1. "제품 설정" > "카카오 로그인" 클릭
2. "활성화 설정" ON
3. "Redirect URI 등록" 클릭
4. Redirect URI 입력:
   - 개발용: `http://localhost:포트번호/oauth`
   - 운영용: `https://your-domain.com/oauth`

## 5. 동의 항목 설정

1. "카카오 로그인" > "동의항목" 클릭
2. 다음 항목 설정:
   - 닉네임: 필수 동의
   - 프로필 사진: 선택 동의
   - 카카오계정(이메일): 선택 동의

## 6. 테스트하기

1. 웹 서버 실행 (예: Live Server, http-server 등)
2. 브라우저에서 앱 접속
3. "카카오로 로그인" 버튼 클릭
4. 카카오 계정으로 로그인
5. 동의 항목 확인 후 동의

## 주의사항

- JavaScript 키는 절대 GitHub 등에 공개하지 마세요
- 운영 환경에서는 HTTPS를 반드시 사용하세요
- Redirect URI는 정확히 일치해야 합니다

## 문제 해결

### "JavaScript key is not registered" 오류
- 앱 키가 올바른지 확인
- 플랫폼에 도메인이 등록되었는지 확인

### "redirect_uri_mismatch" 오류
- Redirect URI가 정확히 일치하는지 확인
- 프로토콜(http/https)과 포트번호까지 확인

### 사용자 정보를 가져올 수 없음
- 동의 항목 설정 확인
- 사용자가 정보 제공에 동의했는지 확인