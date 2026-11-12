
const MODEL = "@cf/google/gemma-4-26b-a4b-it";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json"
    }
  });
}

function getCurrentTime() {
  const now = new Date();

  return {
    utc: now.toISOString(),
    india: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "long"
    }).format(now)
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (url.pathname === "/api/health") {
      return json({
        status: "ok",
        app: "TEJA AI STUDIO",
        ai: !!env.AI,
        model: MODEL,
        liveClock: true
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!env.AI) {
          return json({ error: "AI binding missing" }, 500);
        }

        const message = String(
          body.message || body.prompt || ""
        ).trim();

        const history = Array.isArray(body.history)
          ? body.history
          : [];

        if (!message && !history.length) {
          return json({ error: "Message is empty" }, 400);
        }

        const clock = getCurrentTime();

        const systemPrompt = `
You are TEJA AI STUDIO, an intelligent and honest AI assistant.

CURRENT DATE AND TIME:
UTC: ${clock.utc}
India: ${clock.india}
India timezone: Asia/Kolkata

IMPORTANT RULES:
1. Always use the supplied current date when asked today's date.
2. Never claim the date is May 14, 2024 or another outdated date.
3. Never invent current events, live prices, news, weather or statistics.
4. You do not have live internet search unless a search tool is explicitly provided.
5. If information requires live internet access, honestly explain this limitation.
6. Give accurate, helpful and detailed answers.
7. Follow the user's language and communication style.
8. Never pretend to have performed actions you did not perform.
9. Be friendly, natural and conversational.
10. Your name is TEJA AI STUDIO.
`;

        const messages = [
          {
            role: "system",
            content: systemPrompt
          },

          ...history
            .filter(item =>
              ["user", "assistant", "model"].includes(item.role)
            )
            .slice(-20)
            .map(item => ({
              role: item.role === "model" ? "assistant" : item.role,
              content: String(item.content || item.text || "")
            }))
            .filter(item => item.content.trim()),

          ...(message ? [{
            role: "user",
            content: message
          }] : [])
        ];

        const result = await env.AI.run(MODEL, {
          messages,
          max_tokens: 1800
        });

        let answer =
          result?.response ||
          result?.choices?.[0]?.message?.content ||
          result?.output_text ||
          "";

        if (Array.isArray(answer)) {
          answer = answer.map(x =>
            typeof x === "string" ? x : x?.text || ""
          ).join("");
        }

        if (typeof answer !== "string" || !answer.trim()) {
          console.error("Empty AI result:", result);

          return json({
            error: "AI returned empty text"
          }, 502);
        }

        return json({
          text: answer.trim(),
          sources: [],
          success: true,
          model: MODEL,
          timestamp: clock.utc
        });

      } catch (error) {
        console.error("Chat error:", error);

        return json({
          error: error.message || "AI request failed"
        }, 500);
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", {
      status: 404,
      headers: cors
    });
  }
};


