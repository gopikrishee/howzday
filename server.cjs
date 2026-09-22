var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var PORT = 3e3;
var aiClient = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json({ limit: "1mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", serverTime: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/monthly-insight", async (req, res) => {
    try {
      const { month, monthName, stats, entries } = req.body;
      if (!month || !entries || !Array.isArray(entries)) {
        res.status(400).json({
          error: 'Invalid request: "month" and "entries" array are required.'
        });
        return;
      }
      if (entries.length === 0) {
        res.status(400).json({
          error: "Cannot generate insight for empty entries list."
        });
        return;
      }
      const ai = getAi();
      const sanitizedEntries = entries.map((e) => ({
        date: e.date,
        mood: e.mood,
        tags: Array.isArray(e.tags) ? e.tags : [],
        // Only include reflection notes if not marked private
        note: e.isPrivateReason ? "[Private note]" : (e.reason || "").trim()
      }));
      const prompt = `You are an empathetic, expert emotional wellness coach for the HowZDay mindfulness app.
Analyze the user's emotional journal for the month of ${monthName || month}.

User Month Summary:
- Total check-ins logged: ${entries.length}
- Current Streak: ${stats?.currentStreak || 0} days
- Mood tally: ${JSON.stringify(stats?.moodCounts || {})}
- Daily logs:
${JSON.stringify(sanitizedEntries, null, 2)}

Provide a reflective, uplifting, and psychologically grounded monthly overview.
Tasks:
1. "archetype": Create a poetic 2-3 word emotional weather archetype describing their month (e.g. "Golden Horizon", "Steady Anchor", "Breezy Growth", "Gentle Rain & Renewal", "Vibrant Spark", "Quiet Resilience").
2. "emoji": A single visual weather or nature emoji matching the archetype (e.g. \u{1F305}, \u2693, \u{1F33F}, \u{1F308}, \u26A1, \u{1F324}\uFE0F).
3. "headline": A crisp, elegant 1-sentence headline capturing the primary theme of their month.
4. "reflectiveSummary": A warm, validating 2-3 sentence reflection analyzing their emotional trajectory, acknowledging any challenging dips with kindness, and celebrating their mindful awareness.
5. "keyStrengths": Exactly 2 or 3 brief, encouraging observations (e.g., resilience after tough days, consistency in logging, healthy tag correlations).
6. "mindfulExperiment": Exactly 1 gentle, creative, actionable micro-practice for the upcoming month (e.g. "When work pressure mounts, try taking 3 conscious belly breaths before opening your morning inbox.").
7. "positiveCatalysts": Top 1 to 3 tags/factors associated with uplifted, relaxed, or romantic feelings.
8. "stressTriggers": Top 1 to 2 tags/factors associated with tiredness, sleepiness, sickness, sadness, or stress.`;
      const modelCandidates = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];
      let responseText = null;
      let lastModelError = null;
      for (const modelName of modelCandidates) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: "You are an empathetic, non-judgmental emotional wellness coach. Do not be clinical, patronizing, or overly generic. Tailor your reflections specifically to the mood patterns, tags, and notes provided.",
              responseMimeType: "application/json",
              responseSchema: {
                type: import_genai.Type.OBJECT,
                properties: {
                  archetype: {
                    type: import_genai.Type.STRING,
                    description: 'Poetic 2-3 word archetype, e.g., "Golden Horizon"'
                  },
                  emoji: {
                    type: import_genai.Type.STRING,
                    description: "Single emoji representing the archetype"
                  },
                  headline: {
                    type: import_genai.Type.STRING,
                    description: "1-sentence headline for the month"
                  },
                  reflectiveSummary: {
                    type: import_genai.Type.STRING,
                    description: "2-3 sentence thoughtful reflection"
                  },
                  keyStrengths: {
                    type: import_genai.Type.ARRAY,
                    items: { type: import_genai.Type.STRING },
                    description: "2-3 bullet highlights"
                  },
                  mindfulExperiment: {
                    type: import_genai.Type.STRING,
                    description: "1 actionable mindfulness nudge"
                  },
                  positiveCatalysts: {
                    type: import_genai.Type.ARRAY,
                    items: { type: import_genai.Type.STRING },
                    description: "Tags boosting positive moods"
                  },
                  stressTriggers: {
                    type: import_genai.Type.ARRAY,
                    items: { type: import_genai.Type.STRING },
                    description: "Tags associated with stress or fatigue"
                  }
                },
                required: [
                  "archetype",
                  "emoji",
                  "headline",
                  "reflectiveSummary",
                  "keyStrengths",
                  "mindfulExperiment"
                ]
              }
            }
          });
          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err) {
          lastModelError = err;
        }
      }
      if (!responseText) {
        console.warn("All Gemini candidate models failed to generate content:", lastModelError?.message || lastModelError);
        res.status(503).json({
          error: "Temporary AI model unavailability. Please try again in a few moments."
        });
        return;
      }
      const parsed = JSON.parse(responseText);
      res.json({
        success: true,
        month,
        monthName: monthName || month,
        data: parsed,
        isAiGenerated: true,
        generatedAt: Date.now()
      });
    } catch (err) {
      console.error("Gemini monthly insight generation failed:", err);
      res.status(500).json({
        error: err.message || "Failed to generate monthly insight"
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HowZDay Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
