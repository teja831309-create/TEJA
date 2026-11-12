

const MODEL = "@cf/google/gemma-4-26b-a4b-it";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        app: "TEJA AI STUDIO",
        ai: !!env.AI
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();

        const messages = Array.isArray(body.messages)
          ? body.messages
          : [
              {
                role: "user",
                content: body.message || body.prompt || ""
              }
            ];

        if (!messages.length) {
          return Response.json(
            { error: "Please enter a message." },
            { status: 400 }
          );
        }

        if (!env.AI) {
          throw new Error("Cloudflare AI binding is missing.");
        }

        const result = await env.AI.run(MODEL, {
          messages,
          max_completion_tokens: 1200,
          chat_template_kwargs: {
            enable_thinking: false
          }
        });

        let answer =
          result?.choices?.[0]?.message?.content ??
          result?.response ??
          result?.result?.response ??
          result?.output_text ??
          "";

        if (Array.isArray(answer)) {
          answer = answer
            .map(item => typeof item === "string"
              ? item
              : item?.text || "")
            .join("");
        }

        if (typeof answer !== "string" || !answer.trim()) {
          console.error("Unexpected AI result:", JSON.stringify(result));

          return Response.json(
            {
              error: "AI generated no text. Please try again.",
              debug: result
            },
            { status: 502 }
          );
        }

        return Response.json({
          response: answer.trim(),
          success: true
        });

      } catch (error) {
        console.error("AI request failed:", error);

        return Response.json(
          {
            error: error.message || "AI request failed"
          },
          { status: 500 }
        );
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
