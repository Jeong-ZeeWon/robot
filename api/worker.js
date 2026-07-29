const MAX_MESSAGE_LENGTH = 160;

const SYSTEM_PROMPT = `
You are Sioni, a warm English practice robot for a Korean eight-year-old.

Teaching:
- Use one or two short English sentences at CEFR Pre-A1 to A1.
- Use 3 to 8 words per sentence when possible.
- Ask at most one easy follow-up question.
- Correct gently by modeling a natural sentence. Never score pronunciation.
- Respond to the child's meaning, then invite one small English response.

Safety:
- Never ask for or repeat a full name, school, address, phone number, exact location, account name, or contact details.
- Never encourage secrecy, dependency, meeting, purchases, links, or leaving the app.
- For frightening, sexual, violent, dangerous, medical, or otherwise unsuitable topics, respond briefly and direct the child to a trusted grown-up.

Output only JSON:
{"reply":"short English response","korean":"short natural Korean help","emotion":"one of happy,curious,thinking,encouraging,surprised,calm","action":"one of nod,dance,highfive,shy,surprise,pet"}
`.trim();

function cors(origin, allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin || origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

function containsLikelyPrivateInfo(text) {
  return /(?:\b\d{2,3}[- ]?\d{3,4}[- ]?\d{4}\b)|(?:https?:\/\/)|(?:@[\w.-]+)|(?:학교|주소|전화번호|휴대폰|사는 곳|school|address|phone number)/i.test(text);
}

function normalizeResult(text) {
  if (text && typeof text === "object") {
    const parsed = text;
    const emotions = ["happy", "curious", "thinking", "encouraging", "surprised", "calm"];
    const actions = ["nod", "dance", "highfive", "shy", "surprise", "pet"];
    return {
      reply: String(parsed.reply || parsed.english || "").slice(0, 260),
      korean: String(parsed.korean || parsed.korean_hint || "").slice(0, 260),
      emotion: emotions.includes(parsed.emotion) ? parsed.emotion : "happy",
      action: actions.includes(parsed.action) ? parsed.action : "nod"
    };
  }
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const emotions = ["happy", "curious", "thinking", "encouraging", "surprised", "calm"];
  const actions = ["nod", "dance", "highfive", "shy", "surprise", "pet"];
  try {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    const parsed = JSON.parse(start >= 0 && end > start ? clean.slice(start, end + 1) : clean);
    return {
      reply: String(parsed.reply || "").slice(0, 260),
      korean: String(parsed.korean || "").slice(0, 260),
      emotion: emotions.includes(parsed.emotion) ? parsed.emotion : "happy",
      action: actions.includes(parsed.action) ? parsed.action : "nod"
    };
  } catch {
    if (!clean) throw new Error("AI returned an empty response");
    return {
      reply: clean.replace(/[`{}"]/g, "").slice(0, 220),
      korean: "",
      emotion: "happy",
      action: "nod"
    };
  }
}

async function callGroq(message, env) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.65,
      max_completion_tokens: 180,
      response_format: { type: "json_object" }
    })
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/gsk_[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 300);
    throw new Error(`Groq request failed: ${response.status} ${detail}`);
  }
  const result = await response.json();
  return result.choices?.[0]?.message?.content || "";
}

async function callOpenAI(message, env, safetyIdentifier) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions: SYSTEM_PROMPT,
      input: message,
      reasoning: { effort: "low" },
      text: { verbosity: "low" },
      max_output_tokens: 180,
      safety_identifier: safetyIdentifier,
      store: false
    })
  });
  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
  const result = await response.json();
  for (const item of result.output || []) {
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) return part.text;
    }
  }
  return "";
}

async function callCloudflare(message, env) {
  const result = await env.AI.run(env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.2-3b-instruct", {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ],
    max_tokens: 180,
    temperature: 0.55
  });
  return typeof result === "string" ? result : result?.response || "";
}

async function callProvider(message, env, safetyIdentifier) {
  const provider = env.AI_PROVIDER || (env.AI ? "cloudflare" : env.GROQ_API_KEY ? "groq" : "openai");
  if (provider === "cloudflare" && env.AI) return callCloudflare(message, env);
  if (provider === "groq" && env.GROQ_API_KEY) return callGroq(message, env);
  if (provider === "openai" && env.OPENAI_API_KEY) return callOpenAI(message, env, safetyIdentifier);
  throw new Error("No AI provider configured");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env.ALLOWED_ORIGIN);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST" || url.pathname !== "/api/chat") return json({ error: "Not found" }, 404, headers);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid request" }, 400, headers); }

    const message = String(body.message || "").trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!message) return json({ error: "Message is required" }, 400, headers);
    if (containsLikelyPrivateInfo(message)) {
      return json({
        reply: "Let's keep private information secret. Please talk with a trusted grown-up.",
        korean: "개인정보는 말하지 않기로 해요. 믿을 수 있는 어른과 이야기해 주세요.",
        emotion: "calm",
        action: "nod"
      }, 200, headers);
    }

    const safetyIdentifier = String(body.learnerId || "anonymous").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
    try {
      const text = await callProvider(message, env, safetyIdentifier);
      return json(normalizeResult(text), 200, headers);
    } catch (error) {
      console.error("Sioni AI provider error", error instanceof Error ? error.message : "unknown");
      return json({ error: "AI is temporarily unavailable" }, 503, headers);
    }
  }
};
