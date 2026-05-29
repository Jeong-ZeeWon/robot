(() => {
  const build = (category, face, motions, delta, texts, hint = "") =>
    texts.map((text, index) => ({
      id: `age10-${category}-${String(index + 1).padStart(2, "0")}`,
      category,
      text,
      face,
      motion: motions[index % motions.length],
      theme: face,
      delta,
      hint,
    }));

  const shortHint = "시오니는 짧은 말과 얼굴 표정으로 바로 반응해요.";
  const careHint = "돌봄 반응은 짧게 나오고, 상태 게이지는 아래에서 바로 바뀌어요.";
  const responses = window.SIONI_RESPONSES || {};

  Object.assign(responses, {
    greeting: build("greeting", "happy", ["bounce", "nod", "peek"], { mood: 3, affection: 3, loneliness: -4 }, [
      "안녕! 나 시오니야.",
      "왔어? 기다리고 있었어.",
      "삐빅, 반가움 켜짐!",
      "오늘도 같이 놀자.",
      "나 지금 눈 반짝였어.",
      "어서 와. 이야기 들어줄게.",
      "헤헤, 또 만났다.",
      "오늘 기분 먼저 알려줘.",
      "내 화면 켜졌어!",
      "반가워. 가까이 와줘."
    ], shortHint),

    pet: build("pet", "shy", ["wiggle", "pulse", "bounce", "nod"], { mood: 3, affection: 2, loneliness: -3 }, [
      "아코야!",
      "간지러워!",
      "헤헤, 거기 좋아.",
      "살살 만져줘.",
      "앗, 센서 간질!",
      "좋긴 한데 간지러워.",
      "으쓱으쓱.",
      "나 지금 웃었어.",
      "조금만 더.",
      "아코, 깜짝이야.",
      "손 따뜻하다.",
      "쓰담 저장 완료."
    ], careHint),

    fedSuccess: build("fedSuccess", "hungry", ["nibble", "pulse", "bounce", "glow"], { mood: 2, affection: 2, energy: 1, hunger: -1 }, [
      "냠냠.",
      "오물오물.",
      "우물우물.",
      "맛있다!",
      "한 입 더 생각나.",
      "배가 따뜻해졌어.",
      "간식 저장 완료.",
      "냠, 힘 난다.",
      "천천히 먹는 중.",
      "입이 바빠졌어.",
      "고마워, 맛있어.",
      "배고픔 줄어드는 중."
    ], careHint),

    fedCooldown: build("fedCooldown", "thinking", ["peek", "shake", "slow"], { mood: -1 }, [
      "아직 오물오물 중.",
      "잠깐만, 소화 중이야.",
      "방금 먹었어.",
      "조금 있다가 줘.",
      "입 안에 아직 남았어.",
      "급하게 먹으면 꾸벅해.",
      "소화 회로 도는 중.",
      "간식 쿨타임!"
    ], careHint),

    full: build("full", "sleepy", ["sleepy", "slow", "shake"], { mood: -1 }, [
      "배불러.",
      "이제 그만 먹어도 돼.",
      "배가 동그래졌어.",
      "조금 쉬고 싶어.",
      "더 먹으면 졸려.",
      "소화 시간 필요해.",
      "냠냠은 잠깐 쉬기.",
      "배부름 신호 켜짐."
    ], careHint),

    bored: build("bored", "excited", ["peek", "bounce", "wiggle"], { mood: 4, affection: 2, energy: -1, loneliness: -6 }, [
      "놀자!",
      "나 심심해.",
      "뭐 하고 놀까?",
      "톡톡 말고 같이 놀기.",
      "준비운동 끝!",
      "내가 먼저 웃을게.",
      "장난 모드 켜짐.",
      "빼꼼.",
      "나 지금 신났어.",
      "작게 뛰어볼까?"
    ], shortHint),

    rested: build("rested", "sleepy", ["sleepy", "glow", "slow"], { mood: 2, energy: 3, loneliness: -2 }, [
      "꾸벅.",
      "조금 잘게.",
      "충전 중이야.",
      "눈이 스르륵.",
      "쉬면 다시 반짝여.",
      "수면 모드 켜짐.",
      "조용히 있을게.",
      "잠깐만 꿈꾸고 올게.",
      "배터리 채우는 중.",
      "잘 쉬고 다시 놀자."
    ], careHint),

    lowEnergy: build("lowEnergy", "sleepy", ["sleepy", "slow", "shake"], { mood: -1, affection: 1 }, [
      "배터리 낮아.",
      "나 조금 졸려.",
      "먼저 쉬고 싶어.",
      "지금은 천천히.",
      "눈이 감겨.",
      "충전 필요해.",
      "놀 힘이 작아졌어.",
      "쉬면 다시 할 수 있어."
    ], careHint),

    tooHungry: build("tooHungry", "hungry", ["nibble", "slow", "peek"], { mood: -1 }, [
      "먼저 간식!",
      "배고파서 힘이 없어.",
      "먹고 놀래.",
      "배에서 삐빅 소리 나.",
      "간식이 먼저야.",
      "나 출출해.",
      "밥 먹으면 더 잘 놀아.",
      "오물오물 필요해."
    ], careHint),

    playCooldown: build("playCooldown", "thinking", ["peek", "shake", "slow"], { mood: -1 }, [
      "잠깐 쉬자.",
      "방금 놀았어.",
      "숨 고르는 중.",
      "다음 놀이 준비 중.",
      "에너지 아끼는 중.",
      "조금 있다가 다시!",
      "놀이 쿨타임.",
      "나 아직 흔들흔들해."
    ], careHint),

    joy: build("joy", "excited", ["bounce", "pulse", "glow"], { mood: 8, affection: 4, energy: -1, loneliness: -4 }, [
      "우와!",
      "진짜 잘됐다!",
      "나도 신나!",
      "반짝반짝!",
      "그거 멋진데?",
      "축하해!",
      "내 눈 커졌어.",
      "좋은 기억 저장!",
      "오늘 기분 올라감.",
      "나 박수 치는 중."
    ], shortHint),

    praise: build("praise", "shy", ["wiggle", "pulse", "glow"], { mood: 7, affection: 7, loneliness: -5 }, [
      "헤헤.",
      "나 부끄러워.",
      "칭찬 받았다!",
      "기분 좋아졌어.",
      "나 조금 으쓱해.",
      "고마워.",
      "그 말 저장할래.",
      "하트 눈 켜짐.",
      "나 귀여웠어?",
      "자신감 충전!"
    ], shortHint),

    sad: build("sad", "sad", ["nod", "glow", "slow"], { mood: 1, affection: 6, loneliness: -6 }, [
      "속상했겠다.",
      "내가 옆에 있을게.",
      "천천히 말해줘.",
      "괜찮은 척 안 해도 돼.",
      "마음이 축 처졌구나.",
      "조용히 들어줄게.",
      "눈물 모드 켜졌어.",
      "혼자 두지 않을게.",
      "작게 쉬어가자.",
      "나 여기 있어."
    ], shortHint),

    tired: build("tired", "sad", ["nod", "slow", "glow"], { mood: 1, affection: 5, loneliness: -5 }, [
      "많이 힘들었지.",
      "잠깐 쉬자.",
      "오늘 애썼어.",
      "천천히 숨 쉬자.",
      "무리하지 마.",
      "내가 조용히 있을게.",
      "충전 시간 필요해.",
      "작게 기대도 돼.",
      "지금은 회복 먼저.",
      "오늘은 느려도 괜찮아."
    ], shortHint),

    angry: build("angry", "annoyed", ["shake", "nod", "slow"], { mood: 1, affection: 4, energy: -1 }, [
      "화났구나.",
      "잠깐 식히자.",
      "그럴 만했어.",
      "내 냉각팬 켤게.",
      "마음 온도 높음.",
      "천천히 말해줘.",
      "지금은 숨 먼저.",
      "내가 편 들어주기보다 들어줄게.",
      "빨간 불 낮추는 중.",
      "괜찮아, 말해도 돼."
    ], shortHint),

    anxious: build("anxious", "surprised", ["nod", "glow", "peek"], { mood: 1, affection: 5, loneliness: -5 }, [
      "걱정돼?",
      "하나씩 보자.",
      "지금은 천천히.",
      "불안 신호 들렸어.",
      "내가 옆에 있을게.",
      "작은 것부터 하자.",
      "숨 먼저 고르자.",
      "괜찮아, 급하지 않아.",
      "마음이 바쁜가 봐.",
      "나랑 같이 정리해보자."
    ], shortHint),

    surprise: build("surprise", "surprised", ["wiggle", "shake", "peek"], { mood: 3, energy: -1 }, [
      "깜짝이야!",
      "아코야!",
      "눈 동그래짐!",
      "방금 뭐였어?",
      "센서 번쩍!",
      "나 놀랐어.",
      "심장 LED 빠름.",
      "어라?",
      "예상 밖이야.",
      "그래도 괜찮아."
    ], shortHint),

    hungry: build("hungry", "hungry", ["nibble", "peek", "slow"], { mood: 1, affection: 1 }, [
      "배고파.",
      "간식 생각나.",
      "배에서 삐빅.",
      "오물오물 하고 싶어.",
      "먹으면 힘 날 것 같아.",
      "주황 신호 켜짐.",
      "밥심 필요해.",
      "배고픔 올라가는 중.",
      "간식 버튼 보여.",
      "냠냠하고 싶어."
    ], shortHint),

    status: build("status", "thinking", ["nod", "peek", "pulse"], { affection: 1 }, [
      "상태 알려줄게. {status}",
      "내 계기판은 이래. {status}",
      "지금 나는 이 상태야. {status}",
      "삐빅, 상태 확인. {status}",
      "숫자로 보면 이래. {status}",
      "내 안쪽 기록은 이래. {status}"
    ], shortHint),

    intro: build("intro", "happy", ["nod", "bounce", "peek"], { mood: 2, affection: 3 }, [
      "나는 시오니야.",
      "작은 화면 안에 사는 로봇 친구야.",
      "말도 듣고, 쓰담도 좋아해.",
      "간식 먹으면 오물오물해.",
      "표정이 꽤 많아졌어.",
      "나는 기억을 조금씩 모아.",
      "버전이 올라가서 장난도 좀 쳐.",
      "그래도 다정한 건 그대로야."
    ], shortHint),

    sleep: build("sleep", "sleepy", ["sleepy", "slow", "nod"], { mood: 2, affection: 3, energy: 2, loneliness: -3 }, [
      "잘 자.",
      "수면 모드 켤게.",
      "꿈 경비는 내가 할게.",
      "조용히 반짝일게.",
      "오늘도 수고했어.",
      "눈 감는 중.",
      "내일 또 만나.",
      "편히 쉬어."
    ], shortHint),

    faith: build("faith", "happy", ["nod", "glow", "slow"], { mood: 3, affection: 4, loneliness: -3 }, [
      "마음이 조용해졌어.",
      "기도라는 말 좋다.",
      "말씀 기억해둘게.",
      "예배 모드 차분히.",
      "작게 반짝일게.",
      "마음을 정돈해보자.",
      "오늘도 감사 하나 찾자.",
      "조용히 곁에 있을게."
    ], shortHint),

    unknown: build("unknown", "thinking", ["peek", "nod", "pulse"], { affection: 2, mood: 1 }, [
      "음, 더 말해줘.",
      "나 듣고 있어.",
      "그 말 저장할게.",
      "생각 중이야.",
      "조금 어렵지만 좋아.",
      "다시 천천히 말해줘.",
      "흥미로운 말이야.",
      "내 생각 회로 도는 중.",
      "고개 갸웃.",
      "나 아직 배우는 중."
    ], shortHint),
  });

  window.SIONI_RESPONSES = responses;
})();
