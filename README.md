# 시오니 — 나의 영어 모험 친구

8살 어린이가 매일 12분 동안 듣고, 말하고, 놀며 영어 한 문장을 자기 것으로 만드는 어린이용 AI 영어 웹앱입니다.

## Sioni 2.0

- 표정과 동작이 살아 있는 CSS 캐릭터 시스템
- 3개 세계, 12개 스토리 미션
- 듣기 → 말하기 → 그림 찾기 → 보상의 4단계 학습 루프
- 브라우저 음성 합성 및 음성 인식
- 현재 미션과 배운 단어를 반영하는 어린이용 AI 대화
- 아이가 바로 누를 수 있는 짧은 영어 답변 선택지
- 별, 연속 학습, 배지, 수집품, 능력별 성장 기록
- 점수 대신 시도와 관심을 보여주는 보호자 리포트
- 개인정보 사전 차단 및 AI 장애 시 검증된 대화로 자동 전환
- 데스크톱·태블릿·모바일 반응형 PWA

## 구조

```text
index.html              시오니 2.0 화면 구조
app.css                 캐릭터·지도·미션·대화 디자인 시스템
app.js                  학습 상태와 전체 상호작용
config.js               공개 AI Worker 주소
api/worker.js           어린이 안전 AI 프록시
wrangler.toml           Cloudflare Workers 설정
docs/SIONI_MASTER_PLAN.md
```

## 로컬 실행

```bash
python3 -m http.server 4173
```

`http://127.0.0.1:4173`에서 확인할 수 있습니다.

## 배포

- 프론트엔드: `main` 업데이트 시 GitHub Pages 자동 배포
- AI: Cloudflare Workers AI
- 공개 앱: <https://jeong-zeewon.github.io/robot/>
- AI Worker: <https://sioni-english-ai.baysuss.workers.dev>

AI 키나 비밀값은 브라우저 코드와 저장소에 넣지 않습니다.
