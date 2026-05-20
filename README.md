# 몽글봇 v1

AIBI 포켓 펫처럼 반응하는 느낌을 목표로 한, 가장 단순한 무료 웹앱 v1입니다.

## 현재 기능

- 귀여운 포켓 로봇 화면
- 터치하면 쓰다듬기 반응
- 밥 주기, 놀아주기, 재우기 버튼
- 사용자가 문장을 입력하면 키워드 기반으로 반응
- 기분, 친밀도, 에너지, 배고픔 상태 변화
- 브라우저 localStorage에 상태 저장
- 브라우저 기본 음성 합성으로 로봇 대사 읽기
- PWA manifest와 service worker 포함

## 파일 구조

```txt
.
├── index.html
├── style.css
├── app.js
├── manifest.json
├── icon.svg
├── sw.js
├── .nojekyll
└── .github/workflows/pages.yml
```

## 로컬에서 바로 실행하기

1. 이 저장소를 내려받습니다.
2. `index.html` 파일을 브라우저로 엽니다.
3. 화면의 로봇을 누르거나 아래 입력창에 말을 걸어봅니다.

별도의 서버, API 키, 유료 서비스가 필요 없습니다.

## GitHub Pages로 배포하기

이 저장소에는 GitHub Actions 기반 Pages 배포 워크플로우가 들어 있습니다.

1. 저장소 상단의 **Settings**로 이동합니다.
2. 왼쪽 메뉴에서 **Pages**를 엽니다.
3. **Build and deployment**의 **Source**를 **GitHub Actions**로 선택합니다.
4. 상단의 **Actions** 탭에서 `Deploy MongleBot to GitHub Pages` 워크플로우를 실행하거나, `main` 브랜치에 새 커밋을 푸시합니다.
5. 배포가 끝나면 보통 아래 주소에서 열립니다.

```txt
https://jeong-zeewon.github.io/robot/
```

주의: GitHub Free 계정에서 private 저장소를 GitHub Pages로 배포하려면 제한이 있을 수 있습니다. 가장 확실한 무료 배포는 저장소를 public으로 바꾸는 것입니다.

## 다음 v2 아이디어

- 음성 입력 버튼 추가
- 로봇 표정 종류 확대
- 날짜별 미션/습관 기능
- QT 도우미 또는 교회학교용 캐릭터로 확장
- OpenAI API를 붙여 진짜 대화형 AI 로봇으로 발전
