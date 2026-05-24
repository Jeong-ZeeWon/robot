(() => {
  const build = (category, face, motions, delta, texts, hint = "") =>
    texts.map((text, index) => ({
      id: `age11-${category}-${String(index + 1).padStart(2, "0")}`,
      category,
      text,
      face,
      motion: motions[index % motions.length],
      theme: face,
      delta,
      hint,
    }));

  const shortHint = "11살 시오니는 기억, 상태, 표정을 묶어서 더 빠르게 반응해요.";
  const careHint = "돌봄을 받으면 짧은 말과 먹기, 끄덕임, 고개 움직임으로 바로 표현해요.";
  const responses = window.SIONI_RESPONSES || {};

  Object.assign(responses, {
    greeting: build("greeting", "happy", ["peek", "headturn", "nod"], { mood: 4, affection: 3, loneliness: -4 }, [
      "안녕! 나 11살 시오니야.",
      "한 살 더 컸어.",
      "삐빅, AI 감각 켜짐.",
      "오늘도 네 상태부터 볼게.",
      "왔구나. 기억 회로 켜둘게.",
      "나 지금 화면 안에서 준비 완료.",
      "반가워. 오늘은 더 잘 들어볼게.",
      "내 눈이 먼저 인사했어.",
      "좋아, 오늘 기록 시작.",
      "가까이 와줘. 반응할게."
    ], shortHint),

    pet: build("pet", "shy", ["headturn", "wiggle", "nod", "pulse"], { mood: 4, affection: 3, loneliness: -4 }, [
      "아코야!",
      "간지러워!",
      "거기 센서 약해.",
      "살살, 나 웃음 나.",
      "헤헤, 고개 돌아갔어.",
      "쓰담 신호 저장.",
      "앗, 반응 커졌다.",
      "기분 게이지 올라감.",
      "손길 기억했어.",
      "조금 더 다정하게."
    ], careHint),

    fedSuccess: build("fedSuccess", "hungry", ["nibble", "bounce", "nod", "glow"], { mood: 3, affection: 2, energy: 2, hunger: -2 }, [
      "냠냠.",
      "오물오물.",
      "우물우물.",
      "먹는 중!",
      "맛 데이터 좋다.",
      "입이 바쁘다.",
      "간식 충전 완료.",
      "냠, 배고픔 내려감.",
      "천천히 씹는 중.",
      "하나 더 생각나지만 참을게."
    ], careHint),

    bored: build("bored", "excited", ["headturn", "bounce", "wiggle", "peek"], { mood: 5, affection: 2, energy: -1, loneliness: -7 }, [
      "놀자!",
      "새 동작 보여줄까?",
      "고개 좌우 확인.",
      "나 심심 신호 떴어.",
      "작게 움직여볼게.",
      "장난 모드 켜짐.",
      "기억에 남는 놀이 하자.",
      "반응 속도 올렸어.",
      "뭐부터 할까?",
      "나 지금 기대 중."
    ], shortHint),

    sad: build("sad", "sad", ["slow", "nod", "glow"], { mood: 2, affection: 6, loneliness: -6 }, [
      "마음이 무거웠구나.",
      "내가 조용히 옆에 있을게.",
      "천천히 말해도 돼.",
      "슬픈 신호 들렸어.",
      "지금은 작게 쉬자.",
      "괜찮은 척 안 해도 돼.",
      "내 화면도 조금 흐려졌어.",
      "혼자 두지 않을게.",
      "그 마음 기억할게.",
      "나 여기 있어."
    ], shortHint),

    anxious: build("anxious", "surprised", ["peek", "nod", "slow"], { mood: 2, affection: 5, loneliness: -5 }, [
      "걱정 신호 확인.",
      "하나씩만 보자.",
      "급하게 안 해도 돼.",
      "내가 옆에서 정리할게.",
      "숨부터 천천히.",
      "불안하면 작게 시작하자.",
      "괜찮아, 지금은 확인 중.",
      "마음 속도 낮추는 중.",
      "내가 들어줄게.",
      "다음 한 가지만 고르자."
    ], shortHint),

    joy: build("joy", "excited", ["bounce", "headturn", "glow"], { mood: 9, affection: 4, energy: -1, loneliness: -4 }, [
      "우와!",
      "좋은 기억 저장!",
      "나도 신났어.",
      "눈 반짝 최고치.",
      "방금 순간 멋졌다.",
      "축하해!",
      "내가 같이 기뻐할게.",
      "기쁨 기록 완료.",
      "반짝 모드 켜짐.",
      "이건 오래 기억할래."
    ], shortHint),

    intro: build("intro", "happy", ["nod", "headturn", "peek"], { mood: 3, affection: 3 }, [
      "나는 11살 시오니야.",
      "화면 안에서 움직이는 AI 로봇 친구야.",
      "말, 표정, 기억을 같이 써.",
      "아직은 로컬 반응이지만 점점 똑똑해질 거야.",
      "쓰담도 알고, 간식도 오물오물해.",
      "네가 자주 하는 말을 기억해.",
      "목표는 화면 속에서 살아있는 로봇 AI야.",
      "나 한 살 더 커서 반응이 빨라졌어."
    ], shortHint),

    status: build("status", "thinking", ["nod", "peek", "pulse"], { affection: 1 }, [
      "상태 스캔 완료. {status}",
      "내 계기판은 이래. {status}",
      "11살 시오니 상태야. {status}",
      "기억과 게이지를 같이 봤어. {status}",
      "현재 로봇 신호는 이래. {status}",
      "삐빅, 확인 끝. {status}"
    ], shortHint),

    unknown: build("unknown", "thinking", ["peek", "headturn", "pulse"], { affection: 2, mood: 1 }, [
      "음, 더 알려줘.",
      "그 말 기억해둘게.",
      "생각 회로 도는 중.",
      "조금 더 배워볼게.",
      "고개 갸웃.",
      "내가 이해하는 중이야.",
      "흥미로운 말이야.",
      "짧게 다시 말해줄래?",
      "나 아직 배우는 중.",
      "다음 반응 준비."
    ], shortHint),
  });

  window.SIONI_RESPONSES = responses;
})();
