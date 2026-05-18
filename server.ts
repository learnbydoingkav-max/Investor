import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization of Gemini
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features will fail.");
    }
    genAI = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

// --- API Routes ---

// 1. Daily Learning Snippets
app.get("/api/learning-snippet", async (req, res) => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a daily stock market learning snippet. Follow this exact pattern: 1. A quick analogy to explain the concept. 2. A minimal runnable example or mental exercise. 3. Three quick check questions (multiple choice). Focus on a practical skill (e.g., understanding P/E ratio, Diversification, Limit Orders). Return in JSON format.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            analogy: { type: Type.STRING },
            example: { type: Type.STRING },
            checks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  answer: { type: Type.INTEGER }
                },
                required: ["question", "options", "answer"]
              }
            }
          },
          required: ["title", "analogy", "example", "checks"]
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Snippet error:", error);
    res.status(500).json({ error: "Failed to generate snippet" });
  }
});

// 2. Portfolio Insights
app.post("/api/portfolio-insights", async (req, res) => {
  const { portfolio, goals } = req.body;
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Act as a robo-advisor. Analyze this portfolio: ${JSON.stringify(portfolio)} for these goals: ${goals}. Provide personalized insights on risk, allocation, and 3 actionable micro-goals. Be concise. Explain concepts with analogies.`,
    });
    res.json({ analysis: response.text });
  } catch (error) {
    console.error("Insights error:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// 3. Simulated Market Data
app.get("/api/market-data", (req, res) => {
  // Mocking global asset data for interactive charts
  const symbols = ["AAPL", "BTC", "GOLD", "EURUSD", "TSLA", "NVDA"];
  const data = symbols.map(symbol => ({
    symbol,
    price: (Math.random() * 1000).toFixed(2),
    change: (Math.random() * 10 - 5).toFixed(2),
    history: Array.from({ length: 20 }, (_, i) => ({
      time: i,
      value: (Math.random() * 1000).toFixed(2)
    }))
  }));
  res.json(data);
});

// 4. Breaking News & Social Sentiment (Simulated using Gemini for variety)
app.get("/api/market-news", async (req, res) => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Provide 5 realistic global financial market news headlines and a brief social sentiment indicator (Bullish/Bearish/Neutral) for each. Return as JSON array of objects with 'title', 'sentiment', and 'source'.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              sentiment: { type: Type.STRING },
              source: { type: Type.STRING }
            }
          }
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    res.json([
      { title: "Fed Hints at Rate Stability", sentiment: "Neutral", source: "Global Finance" },
      { title: "Tech Stocks Surge on AI Hype", sentiment: "Bullish", source: "Market Pulse" }
    ]);
  }
});

// 5. Social Sentiment Trends (Simulated)
app.get("/api/social-sentiment", async (req, res) => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Return a JSON object for market social sentiment. Include: 1. 'globalScore' (0-100), 2. 'trendingAssets' (array of 4 objects with 'symbol', 'mentions', 'sentiment' as Bullish/Bearish), 3. 'topKeywords' (array of strings), 4. 'historicalSentiment' (array of 10 objects with 'time' and 'score'). Focus on current tech and finance vibes.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            globalScore: { type: Type.NUMBER },
            trendingAssets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  mentions: { type: Type.NUMBER },
                  sentiment: { type: Type.STRING }
                }
              }
            },
            topKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            historicalSentiment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  score: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["globalScore", "trendingAssets", "topKeywords", "historicalSentiment"]
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    res.json({
      globalScore: 68,
      trendingAssets: [
        { symbol: "NVDA", mentions: 12400, sentiment: "Bullish" },
        { symbol: "BTC", mentions: 8500, sentiment: "Bullish" }
      ],
      topKeywords: ["AI", "Rate Cut", "Bull Run"],
      historicalSentiment: Array.from({ length: 10 }, (_, i) => ({ time: i.toString(), score: 50 + Math.random() * 30 }))
    });
  }
});

// --- Vite Middleware ---

async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Critical server startup error:", err);
    process.exit(1);
  }
}

startServer();
