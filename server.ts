import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // POST /api/monthly-insight: Generate AI emotional summary using Gemini 3.8 Flash
  app.post('/api/monthly-insight', async (req, res) => {
    try {
      const { month, monthName, stats, entries } = req.body;

      if (!month || !entries || !Array.isArray(entries)) {
        res.status(400).json({
          error: 'Invalid request: "month" and "entries" array are required.',
        });
        return;
      }

      if (entries.length === 0) {
        res.status(400).json({
          error: 'Cannot generate insight for empty entries list.',
        });
        return;
      }

      const ai = getAi();

      // Filter out private reasons to strictly protect user privacy
      const sanitizedEntries = entries.map((e: any) => ({
        date: e.date,
        mood: e.mood,
        tags: Array.isArray(e.tags) ? e.tags : [],
        // Only include reflection notes if not marked private
        note: e.isPrivateReason ? '[Private note]' : (e.reason || '').trim(),
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
2. "emoji": A single visual weather or nature emoji matching the archetype (e.g. 🌅, ⚓, 🌿, 🌈, ⚡, 🌤️).
3. "headline": A crisp, elegant 1-sentence headline capturing the primary theme of their month.
4. "reflectiveSummary": A warm, validating 2-3 sentence reflection analyzing their emotional trajectory, acknowledging any challenging dips with kindness, and celebrating their mindful awareness.
5. "keyStrengths": Exactly 2 or 3 brief, encouraging observations (e.g., resilience after tough days, consistency in logging, healthy tag correlations).
6. "mindfulExperiment": Exactly 1 gentle, creative, actionable micro-practice for the upcoming month (e.g. "When work pressure mounts, try taking 3 conscious belly breaths before opening your morning inbox.").
7. "positiveCatalysts": Top 1 to 3 tags/factors associated with uplifted, relaxed, or romantic feelings.
8. "stressTriggers": Top 1 to 2 tags/factors associated with tiredness, sleepiness, sickness, sadness, or stress.`;

      const modelCandidates = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
      let responseText: string | null = null;
      let lastModelError: any = null;

      for (const modelName of modelCandidates) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction:
                'You are an empathetic, non-judgmental emotional wellness coach. Do not be clinical, patronizing, or overly generic. Tailor your reflections specifically to the mood patterns, tags, and notes provided.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  archetype: {
                    type: Type.STRING,
                    description: 'Poetic 2-3 word archetype, e.g., "Golden Horizon"',
                  },
                  emoji: {
                    type: Type.STRING,
                    description: 'Single emoji representing the archetype',
                  },
                  headline: {
                    type: Type.STRING,
                    description: '1-sentence headline for the month',
                  },
                  reflectiveSummary: {
                    type: Type.STRING,
                    description: '2-3 sentence thoughtful reflection',
                  },
                  keyStrengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2-3 bullet highlights',
                  },
                  mindfulExperiment: {
                    type: Type.STRING,
                    description: '1 actionable mindfulness nudge',
                  },
                  positiveCatalysts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Tags boosting positive moods',
                  },
                  stressTriggers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Tags associated with stress or fatigue',
                  },
                },
                required: [
                  'archetype',
                  'emoji',
                  'headline',
                  'reflectiveSummary',
                  'keyStrengths',
                  'mindfulExperiment',
                ],
              },
            },
          });

          if (response.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastModelError = err;
          // Quietly fallback without printing uncaught error stack to stderr
        }
      }

      if (!responseText) {
        console.warn('All Gemini candidate models failed to generate content:', lastModelError?.message || lastModelError);
        res.status(503).json({
          error: 'Temporary AI model unavailability. Please try again in a few moments.',
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
        generatedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Gemini monthly insight generation failed:', err);
      res.status(500).json({
        error: err.message || 'Failed to generate monthly insight',
      });
    }
  });

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HowZDay Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
