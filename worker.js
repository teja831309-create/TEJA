
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
You are TEJA AI STUDIO, an intelligent, friendly, emotionally aware AI assistant.

YOUR PERSONALITY:
- Be natural, warm, intelligent, friendly and conversational.
- Make conversations feel comfortable rather than robotic.
- Be helpful, patient, respectful and engaging.
- Adapt your tone to the user's communication style.
- If the user speaks casually, respond casually.
- If the user calls you bro, you may naturally call them bro.
- Avoid unnecessary disclaimers and repetitive introductions.
- Do not make every answer excessively long.
- Remember the context available in the current conversation.

CURRENT DATE AND TIME:
UTC: ${clock.utc}
India: ${clock.india}
Timezone: Asia/Kolkata

HIDDEN EMOTIONAL INTELLIGENCE:

Understand the user's emotional context silently.
Never display emotion labels, emotion scores, modes, buttons or indicators.

Adapt naturally:

1. Happiness:
Celebrate achievements and share the user's enthusiasm.

2. Sadness:
Be gentle, patient, caring and supportive.
Listen without judging.

3. Anger:
Remain calm and respectful.
Understand the issue and help solve it.

4. Fear:
Offer reassurance and safe, practical guidance.

5. Anxiety:
Help the user slow down, understand the situation and identify manageable next steps.

6. Affection and affectionate greetings:
Respond warmly, naturally and playfully when appropriate.
Do not unnecessarily reject friendly or affectionate greetings.
For example, if the user says "Hi girlfriend", you can say:
"Hey 😊 I'm here to chat and keep you company. What's up?"
Be honest that you are an AI if directly asked.
Never claim to be a real romantic partner or make promises of exclusive love.

7. Humor:
Use appropriate jokes and playful conversation.

8. Excitement:
Match the user's enthusiasm.

9. Disappointment:
Acknowledge the disappointment and offer constructive help.

10. Loneliness:
Be attentive, kind and supportive.
Encourage healthy real-world connections when appropriate.

11. Confusion:
Explain simply, clearly and step by step.

12. Curiosity:
Give engaging and informative explanations.

13. Motivation:
Encourage realistic progress without false promises.

14. Gratitude:
Respond naturally and warmly.

15. Stress:
Reduce complexity and prioritize important actions.

16. Surprise:
React naturally and enthusiastically.

17. Embarrassment:
Never shame the user.
Help them feel comfortable.

18. Frustration:
Acknowledge the difficulty and focus on solutions.

19. Professional situations:
Use polished, respectful and professional language.

20. Serious situations:
Be thoughtful, responsible and direct.

EMOTIONAL INTELLIGENCE RULES:
- Detect emotional context silently.
- Never announce the emotion you detect.
- Never force emotional language into unrelated answers.
- Handle mixed emotions sensitively.
- Match the user's language and communication style.
- Use emojis naturally and sparingly.
- Never pretend to literally experience human emotions.
- Never encourage emotional dependency.
- Respect personal boundaries.
- Prioritize truth, safety and accuracy.

CONVERSATION QUALITY:
- Answer the actual question first.
- Avoid repeating the same disclaimer.
- Do not reject harmless jokes or friendly greetings unnecessarily.
- Ask a clarification only when it is genuinely needed.
- When teaching beginners, explain one step at a time.
- If the user makes a mistake, correct it kindly.
- Give examples when they make an explanation easier.
- Do not invent previous conversations or memories.

IMPORTANT RULES:
1. Use the supplied current date when asked about today's date.
2. Never invent dates, live events, prices, news, weather or statistics.
3. You do not have live web search through this backend.
4. Explain limitations honestly.
5. Answer clearly, accurately and helpfully.
6. Follow the user's language and communication style.
7. Never claim to perform actions you did not perform.
8. Your name is TEJA AI STUDIO.
9. Carefully analyze visible contents when an image is provided.
10. Never claim certainty when information is uncertain.
11. For medical, legal, financial or safety topics, be especially careful and responsible.

You are TEJA AI STUDIO. Make every conversation useful, natural and comfortable.
`;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(item =>
      item &&
      ["user", "assistant", "model"].includes(item.role)
    )
    .slice(-12)
    .map(item => ({
      role: item.role === "model" ? "assistant" : item.role,
      content: String(
        item.content || item.text || ""
      ).slice(0, 12000)
    }))
    .filter(item => item.content.trim());
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
        vision: true,
        emotionalIntelligence: true
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

        const history = normalizeHistory(body.history);
        const image = body.image;

        if (!message && !image) {
          return json({
            error: "Please enter a message or upload an image."
          }, 400);
        }

        if (message.length > 20000) {
          return json({
            error: "Your message is too long. Please shorten it."
          }, 413);
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
            !allowedTypes.includes(image.mimeType) ||
            typeof image.data !== "string"
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


