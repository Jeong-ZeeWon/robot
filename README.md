# 시오니 영어 놀이터 v15

8살 어린이가 아이폰·아이패드에서 혼자 사용할 수 있도록 만든 영어 학습 로봇 웹앱입니다.

## 학습 경험

- 오늘의 10분 영어: 듣기 → 따라 말하기 → 그림 퀴즈
- 영어 음성 재생과 브라우저 음성 인식
- 음식·동물·놀이·기분 주제의 짧은 자유 대화
- 단어 놀이, 역할 놀이, 복습
- 별, 연속 학습일, 주간 활동, 배지
- 보호자용 한국어 도움말·AI 사용 설정
- 아이가 개인정보를 말하지 않도록 안내하는 안전 대화

학습 기록은 브라우저 `localStorage`에만 저장합니다.

## 실행

별도 빌드 없이 정적 파일을 실행합니다.

```bash
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080`을 엽니다. GitHub의 `main` 브랜치에 반영되면 Pages 워크플로가 정적 앱을 배포합니다.

## AI 연결

기본 상태에서는 검증된 로컬 대화가 작동하므로 API 키가 필요 없습니다. 실제 AI를 켜려면:

현재 운영 구성은 Cloudflare Workers AI의 무료 할당량을 사용합니다.

1. `wrangler.toml`의 Workers AI 바인딩과 함께 Worker를 배포합니다.
2. 별도 AI 키 없이 `@cf/meta/llama-3.2-3b-instruct`를 호출합니다.
3. 필요하면 `ALLOWED_ORIGIN`에 GitHub Pages 주소를 설정합니다.
4. `config.js`의 `window.SIONI_API_ENDPOINT`에 배포한 `/api/chat` 주소를 입력합니다.

Groq는 선택형 대체 공급자로 코드에 남아 있습니다. `AI_PROVIDER=groq`와 `GROQ_API_KEY`를 설정한 경우에만 사용합니다.

API 키를 `config.js`, `app.js` 또는 GitHub 저장소에 넣으면 안 됩니다.

AI 서버는 대화를 저장하지 않으며, 입력을 160자로 제한하고 어린이 개인정보로 보이는 입력을 모델 호출 전에 차단합니다. Workers AI가 응답하지 않거나 무료 한도를 넘으면 앱이 자동으로 검증된 로컬 대화를 사용합니다. 보호자 설정에서 AI를 끄면 항상 로컬 대화만 사용합니다.

## 주요 파일

- `index.html`: 모바일 화면과 접근성 구조
- `app.css`: 로봇과 어린이용 반응형 UI
- `app.js`: 학습, 음성, 대화, 별과 배지
- `config.js`: 공개 가능한 AI 서버 주소
- `api/worker.js`: 비밀키를 보호하는 AI 중계 서버 예제
