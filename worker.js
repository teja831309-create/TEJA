
const MODEL = "@cf/google/gemma-4-26b-a4b-it";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({ status: "online" });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        if (!env.AI) {
          return Response.json(
            { error: "Workers AI binding AI is not configured." },
            { status: 503 }
          );
        }

        const body = await request.json();
        const message = String(body.message || "").trim();

        if (!message) {
          return Response.json(
            { error: "Please enter a message." },
            { status: 400 }
          );
        }

        if (body.image) {
          return Response.json(
            { error: "Image understanding is not configured yet." },
            { status: 501 }
          );
        }

        const history = Array.isArray(body.history)
          ? body.history.slice(-20)
          : [];

        const messages = [
          {
            role: "system",
            content: "You are TEJA AI STUDIO, a helpful and accurate AI assistant. Answer clearly and honestly."
          },
          ...history
            .filter(m =>
              ["user", "model"].includes(m.role) &&
              typeof m.text === "string"
            )
            .map(m => ({
              role: m.role === "model" ? "assistant" : "user",
              content: m.text.slice(0, 6000)
            })),
          { role: "user", content: message.slice(0, 6000) }
        ];

        const result = await env.AI.run(MODEL, {
          messages,
          max_tokens: 1200
        });

        if (!result?.response) {
          return Response.json(
            { error: "AI returned an empty response." },
            { status: 502 }
          );
        }

        return Response.json({
          text: result.response,
          sources: []
        });
      } catch (error) {
        return Response.json(
          { error: error.message || "AI request failed." },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
