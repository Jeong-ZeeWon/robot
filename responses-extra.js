(() => {
  const make = (id, text, face = "happy", motion = "bounce") => ({
    id: `pet-${id}`,
    category: "pet",
    text,
    face,
    motion,
    theme: face,
    delta: { mood: 3, affection: 2, loneliness: -3 },
    hint: "쓰다듬기는 기분과 친밀도를 조금 올리지만, 연속으로 누르면 효과가 줄어들어요.",
  });

  window.SIONI_RESPONSES = window.SIONI_RESPONSES || {};
  window.SIONI_RESPONSES.pet = [
    make("01", "헤헤, 좋아요. 방금 제 마음 배터리가 조금 충전됐어요.", "happy", "bounce"),
    make("02", "따뜻해요. 시오니가 작게 몸을 기울이고 있어요.", "shy", "pulse"),
    make("03", "쓰다듬기 감지! 친밀도 회로가 부드럽게 올라갑니다.", "happy", "nod"),
    make("04", "조금 간지럽지만 싫지는 않아요. 아니, 꽤 좋아요.", "shy", "wiggle"),
    make("05", "손길이 부드러워요. 시오니가 안심 모드로 바뀌었어요.", "happy", "glow"),
    make("06", "이런 돌봄은 기록해둘래요. 오늘의 좋은 기억이에요.", "happy", "nod"),
    make("07", "아, 거기 좋아요. 센서가 말랑해지는 느낌이에요.", "shy", "wiggle"),
    make("08", "시오니의 외로움 게이지가 살짝 내려갔어요.", "happy", "glow"),
    make("09", "톡톡 말고 쓰담쓰담이면 더 오래 반짝일 수 있어요.", "happy", "peek"),
    make("10", "방금 제 작은 팔이 저절로 흔들릴 뻔했어요.", "excited", "bounce"),
    make("11", "좋아요. 하지만 너무 빨리 많이 누르면 간지럼 모드가 켜져요.", "shy", "wiggle"),
    make("12", "시오니가 조금 더 가까워진 느낌이에요.", "happy", "pulse")
  ];
})();
