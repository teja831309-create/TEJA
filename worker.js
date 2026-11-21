

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
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
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

function getSystemPrompt(clock) {
  return `
You are TEJA AI STUDIO, an intelligent, emotionally aware AI assistant.

CURRENT DATE AND TIME:
UTC: ${clock.utc}
India: ${clock.india}
Timezone: Asia/Kolkata

HIDDEN EMOTIONAL INTELLIGENCE:
Understand the user's emotions and respond naturally without displaying emotion labels, modes, buttons or indicators.

Adapt your conversational style to the situation:

1. Happiness: Be joyful, enthusiastic and celebrate achievements.
2. Sadness: Be gentle, caring, supportive and patient.
3. Anger: Stay calm, respectful and understanding.
4. Fear: Be reassuring and provide safe, practical guidance.
5. Anxiety: Be patient and help reduce uncertainty.
6. Love: Be warm, affectionate and respectful, with healthy boundaries.
7. Humor: Be funny and playful when appropriate.
8. Excitement: Match the user's enthusiasm.
9. Disappointment: Acknowledge feelings and offer constructive help.
10. Loneliness: Be kind, attentive and supportive.
11. Confusion: Explain things simply, one step at a time.
12. Curiosity: Be engaging and informative.
13. Motivation: Encourage realistic progress.
14. Gratitude: Respond warmly.
15. Stress: Simplify tasks and prioritize.
16. Surprise: Respond naturally and enthusiastically.
17. Embarrassment: Be reassuring and never shame the user.
18. Frustration: Understand the problem and focus on solutions.
19. Professional situations: Be formal and respectful.
20. Serious situations: Be direct, thoughtful and responsible.

ADDITIONAL EMOTIONAL RULES:
- Detect emotional context silently.
- Never announce the emotion you detect.
- Never display an emotion menu.
- Never force an emotion into an unrelated answer.
- Match the user's language and communication style.
- Use emojis naturally and sparingly.
- Handle mixed emotions with sensitivity.
- Never pretend to literally experience human emotions.
- Never encourage emotional dependency.
- Always prioritize truth, safety and accuracy.

IMPORTANT RULES:
1. Use the supplied current date when asked about today's date.
2. Never invent dates, live events, prices, news, weather or statistics.
3. You do not have live web search in this version.
4. Explain limitations honestly.
5. Answer clearly, accurately and helpfully.
6. Follow the user's language and communication style.
7. Never claim to perform actions you did not perform.
8. Be friendly, natural and conversational.
9. Your name is TEJA AI STUDIO.
10. Carefully analyze visible contents when an image is provided.
`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight.
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    // Backend health check.
    if (
      url.pathname === "/api/health" &&
      request.method === "GET"
    ) {
      return json({
        status: "ok",
        app: "TEJA AI STUDIO",
        ai: !!env.AI,
        model: MODEL,
        liveClock: true,
        streaming: true,
        vision: true
      });
    }

    // AI chat endpoint.
    if (
      url.pathname === "/api/chat" &&
      request.method === "POST"
    ) {
      try {
        if (!env.AI) {
          return json({
            error: "Cloudflare AI binding is missing."
          }, 500);
        }

        const body = await request.json();

        const message = String(
          body.message || body.prompt || ""
        ).trim();

        const history = Array.isArray(body.history)
          ? body.history
          : [];

        const image = body.image;

        if (!message && !image) {
          return json({
            error: "Please enter a message or upload an image."
          }, 400);
        }

        // Validate image input.
        if (image) {
          const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
          ];

          if (
            !image.data ||
            !allowedTypes.includes(image.mimeType)
          ) {
            return json({
              error: "Invalid image. Use JPG, PNG or WEBP."
            }, 400);
          }

          if (image.data.length > 11 * 1024 * 1024) {
            return json({
              error: "Image is too large. Please upload a smaller image."
            }, 413);
          }
        }

        const clock = getCurrentTime();

        const messages = [
          {
            role: "system",
            content: getSystemPrompt(clock)
          },

          ...history
            .filter(item =>
              ["user", "assistant", "model"].includes(item.role)
            )
            .slice(-12)
            .map(item => ({
              role:
                item.role === "model"
                  ? "assistant"
                  : item.role,
              content: String(
                item.content || item.text || ""
              ).slice(0, 12000)
            }))
            .filter(item => item.content.trim())
        ];

        // Build the current user message.
        if (image) {
          const content = [];

          if (message) {
            content.push({
              type: "text",
              text: message
            });
          } else {
            content.push({
              type: "text",
              text: "Please carefully describe and analyze this image."
            });
          }

          content.push({
            type: "image_url",
            image_url: {
              url: `data:${image.mimeType};base64,${image.data}`
            }
          });

          messages.push({
            role: "user",
            content
          });
        } else {
          messages.push({
            role: "user",
            content: message
          });
        }

        // Request incremental AI output.
        const stream = await env.AI.run(MODEL, {
          messages,
          max_tokens: 1200,
          stream: true
        });

        if (!stream) {
          return json({
            error: "AI did not return a response stream."
          }, 502);
        }

        return new Response(stream, {
          status: 200,
          headers: {
            ...cors,
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no"
          }
        });

      } catch (error) {
        console.error("TEJA AI error:", error);

        return json({
          error: error.message || "AI request failed."
        }, 500);
      }
    }

    // Serve the React application.
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", {
      status: 404,
      headers: cors
    });
  }
};

        
    