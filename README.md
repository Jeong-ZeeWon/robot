# 시오니 v13

8살 아이도 쉽게 즐길 수 있는 무료 포켓 로봇 웹앱입니다. 화면에는 나이 대신 버전으로 `시오니 v13`이라고 표현합니다.

실행 주소:

```txt
https://jeong-zeewon.github.io/robot/
```

## 핵심 변화 (v13)

- 화면 표시를 나이 표현 대신 `시오니 v13` 버전 중심으로 정리
- 활동 반응 추가: `📚 공부중`, `🏃 운동중`, `🎵 음악`, `🌿 외출` 버튼으로 상황에 맞는 응원 반응
- 활동별 전용 대사 은행 추가 (공부/운동/음악/외출/감사/업무)
- `고마워 시오니` 버튼과 감사(grateful) 반응 카테고리 추가
- 로봇 애니메이션 추가: 떨림, 인사(bow), 말랑(squeeze), 팝(pop), 갸웃(tippy), 손 뻗기(reach), 으쓱(shrug)
- 로봇을 두 번 빠르게 누르면(더블탭) 더 큰 반짝 반응
- UI 개선: 그라디언트 제목, 글래스모피즘 카드, 추가 반짝임 효과
- 아이폰 사파리 더블탭 확대 방지(`touch-action: manipulation`)
- 오프라인 캐시(서비스워커) 제거로 업데이트가 즉시 반영되도록 변경

## 유지되는 기능

- 대화/돌봄 기억
- 상태 기반 얼굴 표정 (40종)
- 대기 중 자동 반응
- 배고픔, 에너지, 외로움, 친밀도, 기분 게이지
- 카메라 반응 모드 (손짓, 밝기, 움직임 감지)
- 효과음과 기기 음성 설정
- 브라우저 localStorage 저장
- GitHub Pages 배포

## 주요 파일

```txt
index.html            화면 구조
style.css             기본 디자인
v5.css                로봇 방, 상태 카드, 기억 카드
sioni-10.css          UI 보정
sioni-11.css          UI 보정
sioni-v13.css         v13 카메라/활동 UI
motions.css           로봇 동작 애니메이션
v9-face.css           40종 얼굴 표정 스타일
v9-face-engine.js     문맥 기반 얼굴 표정 엔진
responses.js          기본 대화 은행 (활동 카테고리 포함)
responses-extra.js    쓰다듬기 반응
sioni-10-lines.js     짧은 반응 말투
sioni-11-lines.js     짧은 반응 말투
v5-motions.js         버튼/기분별 동작·이모지 매핑
app.js                상태, 게이지, 대화 흐름, 활동 핸들러
camera-vision.js      카메라, 손짓, 밝기, 움직임 감지
idle.js               대기 중 상태 기반 반응
memory-engine.js      기억 요약
persist.js            상태 저장 보강
sw.js                 (사용 안 함) 옛 서비스워커 자가 제거용
```

## 되돌리기

마음에 들지 않으면 GitHub 커밋 기록에서 이전 배포 커밋으로 되돌릴 수 있습니다.
