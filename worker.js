

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
        ai: !!env.AI
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!env.AI) {
          return json({ error: "AI binding missing" }, 500);
        }

        const history = Array.isArray(body.history)
          ? body.history
          : [];

        const messages = history.map(item => ({
          role: item.role === "model" ? "assistant" : item.role,
          content: item.content || item.text || ""
        })).filter(item =>
          ["user", "assistant", "system"].includes(item.role)
        );

        const message = body.message || body.prompt || "";

        if (message.trim()) {
          messages.push({
            role: "user",
            content: message
          });
        }

        if (!messages.length) {
          return json({ error: "Message is empty" }, 400);
        }

        const result = await env.AI.run(MODEL, {
          messages,
          max_tokens: 1200
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
          console.error("Empty AI result:", JSON.stringify(result));
          return json({
            error: "AI returned empty text",
            debug: result
          }, 502);
        }

        // IMPORTANT: Frontend expects "text"
        return json({
          text: answer.trim(),
          sources: [],
          success: true
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

    return new Response("Not Found", { status: 404 });
  }
};

