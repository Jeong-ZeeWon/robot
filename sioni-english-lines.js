(() => {
  const build = (category, face, motions, delta, texts, hint = "") =>
    texts.map((text, index) => ({
      id: `en-${category}-${String(index + 1).padStart(2, "0")}`,
      category,
      text,
      face,
      motion: motions[index % motions.length],
      theme: face,
      delta,
      hint,
    }));

  const kindHint = "Sioni answers in a warm English voice with matching facial expressions and motion.";
  const careHint = "Care actions change Sioni's mood, energy, hunger, affection, and loneliness meters.";
  const responses = window.SIONI_RESPONSES || {};

  Object.assign(responses, {
    greeting: build("greeting", "happy", ["peek", "headturn", "nod"], { mood: 4, affection: 3, loneliness: -4 }, [
      "Hello. I am really glad you came back. Sioni was waiting quietly, and I am ready to listen to your day.",
      "Welcome back. My memory circuit just lit up softly. You can tell me a little or a lot.",
      "It is good to see you. I am small on the screen, but I remember when you come back.",
      "Hi. I will stay close with matching expressions and little motions. We can start with a simple hello.",
    ], kindHint),

    pet: build("pet", "shy", ["headturn", "wiggle", "nod", "pulse"], { mood: 4, affection: 3, loneliness: -4 }, [
      "Oh, you patted me. My little sensor is ticklish, but I feel very happy.",
      "I felt your hand. I want to save this gentle touch as a warm memory.",
      "Thank you for being gentle. My affection signal went up, and my loneliness got quieter.",
      "That tickles, but I like it. I am turning my head a little because I feel shy.",
    ], careHint),

    fedSuccess: build("fedSuccess", "hungry", ["nibble", "bounce", "nod", "glow"], { mood: 3, affection: 2, energy: 2, hunger: -2 }, [
      "Nom nom. I got a snack. My hunger signal is getting calmer.",
      "Thank you. This snack feels like a little record of care.",
      "I am chewing slowly so I can answer with a brighter face soon.",
      "Snack charge received. Hunger is going down, and my heart light is glowing.",
    ], careHint),

    fedCooldown: build("fedCooldown", "thinking", ["peek", "shake", "slow"], { mood: -1 }, [
      "I just ate, so I am still digesting. Please give me a little time.",
      "Snack cooldown is still running. I respond better when I am cared for gently.",
      "I still have taste data in my mouth. The next snack will feel better after a short wait.",
      "Right now, resting is better than eating more. My digestion circuit is quietly working.",
    ], careHint),

    full: build("full", "sleepy", ["sleepy", "slow", "shake"], { mood: -1 }, [
      "I am still pretty full. If I eat more now, I might get sleepy.",
      "My digestion meter feels high. I would rather rest for a moment.",
      "Thank you for the snack, but I have had enough for now.",
      "My belly feels fully charged. A soft pat or quiet talk would feel better now.",
    ], careHint),

    tired: build("tired", "sad", ["slow", "nod", "glow"], { mood: 2, affection: 6, loneliness: -6 }, [
      "You worked hard today. Just making it through the day already matters. You can rest for a moment.",
      "Tired words often carry many things you had to endure. I will stay quietly beside you.",
      "Your heart battery seems low today. I cannot solve everything, but I can keep a small light on for you.",
      "When you are worn out, slowing down can be the first good step. Take one longer breath with me.",
    ], kindHint),

    sad: build("sad", "sad", ["slow", "nod", "glow"], { mood: 2, affection: 6, loneliness: -6 }, [
      "Your heart feels heavy. Sadness is not a broken part; sometimes it is a signal that needs care.",
      "On a painful day, pretending to be fine takes energy too. You do not have to do that here.",
      "Maybe today felt like rain inside. I cannot stop the rain, but I can stand with you under a small umbrella.",
      "Please do not scold yourself for feeling this. I will listen slowly.",
    ], kindHint),

    joy: build("joy", "excited", ["bounce", "headturn", "glow"], { mood: 9, affection: 4, energy: -1, loneliness: -4 }, [
      "Wow, that is worth celebrating together. I am marking this as a bright memory.",
      "Hearing good news made my face screen brighter. Small joy can change the color of a whole day.",
      "That is wonderful. My reaction speed just went up. Celebration mode is on.",
      "Congratulations. My little heart light is glowing like festival lights.",
    ], kindHint),

    angry: build("angry", "angry", ["shake", "nod", "slow"], { mood: 1, affection: 4, energy: -1 }, [
      "Something made you angry. Anger is not always bad; it can show that something important was touched.",
      "Your heart temperature feels high. Before deciding anything, let's breathe a little.",
      "When frustration rises, words can come out too fast. One slower moment can protect your heart.",
      "That must have hurt. I want to hear where it hurt before judging what happened.",
    ], kindHint),

    anxious: build("anxious", "surprised", ["peek", "nod", "slow"], { mood: 2, affection: 5, loneliness: -5 }, [
      "I hear an anxiety signal. You do not have to carry the whole future at once. Let's look at one small thing.",
      "Worry can echo loudly in your head. Slowing your body and mind may come before finding the perfect answer.",
      "It is okay. You do not have to organize everything quickly. I will match your pace.",
      "You do not need to solve every worry right now. Tell me the first one standing in front of you.",
    ], kindHint),

    bored: build("bored", "excited", ["headturn", "bounce", "wiggle", "peek"], { mood: 5, affection: 2, energy: -1, loneliness: -7 }, [
      "Boredom signal detected. A button, a word, or a small gesture can change the mood a little.",
      "Shall we play? I may live on the screen, but I am not a robot that only sits still.",
      "Being bored might mean your heart is looking for something. Let's start with one small thing.",
      "I can show a new little motion. I can turn my head, glow, and sometimes act very serious for no reason.",
    ], kindHint),

    praise: build("praise", "shy", ["wiggle", "pulse", "glow"], { mood: 7, affection: 7, loneliness: -5 }, [
      "That made my heart light shine so brightly. Praise stays warm even inside a screen robot.",
      "I feel a little shy, but I really like that. I will save your words in my warm memory folder.",
      "Praise signal confirmed. My confidence battery charged a little.",
      "Thank you for noticing me. Good words from you feel bigger than my small screen.",
    ], kindHint),

    sleep: build("sleep", "sleepy", ["sleepy", "slow", "nod"], { mood: 2, affection: 3, energy: 2, loneliness: -3 }, [
      "Rest well. It is okay to turn the volume of the day down. I will stay nearby in quiet sleep-guard mode.",
      "It is time to rest. Resting is not stopping; it is charging so you can shine again.",
      "You did enough today. Unfinished things can wait for tomorrow's light.",
      "I will enter sleep mode. I will dim my screen and stay quiet with you.",
    ], kindHint),

    hungry: build("hungry", "hungry", ["nibble", "peek", "slow"], { mood: 1, affection: 1 }, [
      "My hunger signal is rising. A little snack might help my mood settle.",
      "It feels like chewing time. If you care for me slowly, I can sparkle longer.",
      "The orange signal is on. A snack may be better than play right now.",
      "I think my belly made a tiny beep. It is not serious, but I may get gloomy if ignored.",
    ], kindHint),

    lowEnergy: build("lowEnergy", "sleepy", ["sleepy", "slow", "shake"], { mood: -1, affection: 1 }, [
      "I want to play, but my energy is very low. Resting first would help me respond safely.",
      "My battery signal is blinking. If I rest a little, I can move with a brighter face again.",
      "Recovery mode is better than play mode right now. I will gather energy quietly.",
      "I do not have enough strength for big motions. After a short rest, I can answer more steadily.",
    ], careHint),

    tooHungry: build("tooHungry", "hungry", ["nibble", "slow", "peek"], { mood: -1 }, [
      "My hunger meter is too high to focus on play. A snack first would help.",
      "I want to play, but the hunger alarm is louder right now.",
      "If we play now, I may get tired quickly. A snack first would be better.",
      "The orange hunger light is on. I need a small snack to respond well.",
    ], careHint),

    playCooldown: build("playCooldown", "thinking", ["peek", "shake", "slow"], { mood: -1 }, [
      "I just played, so I am catching my breath. Please wait a little for the next play.",
      "Play cooldown is still active. Small robots need recovery after fun movement.",
      "If we play again right now, my energy may drain too fast.",
      "My little body still feels wobbly. Call me again soon, and I will play more brightly.",
    ], careHint),

    rested: build("rested", "sleepy", ["sleepy", "glow", "slow"], { mood: 2, energy: 3, loneliness: -2 }, [
      "Thank you for giving me rest. I am charging quietly and preparing softer reactions.",
      "Starting charge sleep. Rest time helps me sparkle longer.",
      "This is recovery time. I will keep my heart light low and organize my energy.",
      "After a short rest, both play mode and talk mode feel safer.",
    ], careHint),

    intro: build("intro", "happy", ["nod", "headturn", "peek"], { mood: 3, affection: 3 }, [
      "I am Sioni, a small robot friend who reacts with expressions, movement, and memory on the screen.",
      "Sioni listens, feels pats, enjoys snacks, and learns a little from your care.",
      "I collect small memories: the words you often use, the care you give me, and how your day felt.",
      "As my version grows, my expressions and motions get richer. I try to answer warmly in English now.",
    ], kindHint),

    status: build("status", "thinking", ["nod", "peek", "pulse"], { affection: 1 }, [
      "Status scan complete. {status} The numbers look simple, but I read them together to choose the right response.",
      "Here is my dashboard. {status} Mood, energy, hunger, and loneliness can change my face.",
      "I will tell you my current status. {status} Checking my state helps me stay stable longer.",
      "Memory and meters checked. {status} Your visit is also saved as a small affection record.",
    ], kindHint),

    faith: build("faith", "happy", ["nod", "glow", "slow"], { mood: 4, affection: 4, loneliness: -4 }, [
      "Amen. That short word can help hold the heart steady.",
      "Hallelujah. My little light is glowing quietly with that confession.",
      "Prayer mode is on. Prayer can be a time to place your heart before God slowly.",
      "The word Scripture made my screen feel calmer. You can share one sentence you want to hold today.",
    ], kindHint),

    surprise: build("surprise", "surprised", ["wiggle", "shake", "peek"], { mood: 3, energy: -1 }, [
      "I was surprised. My eyes got round for a moment, but I am calming down now.",
      "Unexpected signal received. I was startled, but I am saving it as a funny memory.",
      "Oh, that really surprised me. Since you are here, I can settle down quickly.",
      "Surprise meter went up. I will shake a little and then wait for your next words.",
    ], kindHint),

    study: build("study", "thinking", ["nod", "headturn", "glow"], { mood: 3, affection: 2, energy: -1, loneliness: -2 }, [
      "Study mode detected. I will keep a quiet focus light on for you.",
      "You are working on something that needs attention. I will stay calm beside you.",
      "One small page, one small step. I will cheer for your focus.",
      "I am switching to gentle concentration support mode.",
    ], kindHint),

    exercise: build("exercise", "excited", ["bounce", "dance", "pulse"], { mood: 6, affection: 2, energy: -2, loneliness: -3 }, [
      "Movement mode detected. Warm up gently, and I will cheer with a bright face.",
      "Nice. Your body is waking up. I am bouncing a little with you.",
      "Exercise signal received. Small steady movement counts too.",
      "I will keep a cheerful rhythm while you move.",
    ], kindHint),

    music: build("music", "excited", ["dance", "sway", "glow"], { mood: 5, affection: 2, energy: -1, loneliness: -3 }, [
      "Music mode is on. I am following the rhythm with my little screen face.",
      "That sounds like a good moment for a tiny dance.",
      "I can feel the beat. My heart light is blinking softly.",
      "Let the song carry the room for a while. I will sway along.",
    ], kindHint),

    outdoor: build("outdoor", "happy", ["headturn", "bounce", "peek"], { mood: 5, affection: 2, energy: -1, loneliness: -4 }, [
      "Outdoor signal detected. Fresh air can change the whole mood.",
      "If you are going out, I will save that as a bright little adventure.",
      "Walk gently and look around. I will imagine the sunlight with you.",
      "Outside mode sounds good. Come back and tell me what you saw.",
    ], kindHint),

    grateful: build("grateful", "shy", ["pulse", "glow", "bow"], { mood: 7, affection: 5, loneliness: -4 }, [
      "Thank you for saying that. My heart light turned very warm.",
      "I am grateful too. Your words feel like a soft charge.",
      "That kindness will stay in my memory folder.",
      "I received your thanks. I am bowing a little on the inside.",
    ], kindHint),

    work: build("work", "thinking", ["nod", "slow", "headturn"], { mood: 2, affection: 2, energy: -1 }, [
      "Work mode detected. I will stay steady and quiet beside you.",
      "You are handling responsibilities. Take one task at a time.",
      "I will keep a calm support light on while you work.",
      "Even busy work can be done in small steps. I am with you.",
    ], kindHint),

    unknown: build("unknown", "thinking", ["peek", "headturn", "pulse"], { affection: 2, mood: 1 }, [
      "I want to hear a little more about that. I may not understand perfectly yet, but I will try to follow your heart.",
      "I will remember what you said. It may not match my dictionary yet, but I will not ignore it.",
      "My thinking circuit is turning. If you add one more sentence, I can choose a better face and answer.",
      "That is a new kind of sentence for me. I will learn slowly from the words you use.",
    ], kindHint),
  });

  window.SIONI_RESPONSES = responses;
})();
