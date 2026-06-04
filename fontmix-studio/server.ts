import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.json());

// API route first: AI-powered pairing recommendations
app.post("/api/ai-pairing", async (req, res) => {
  const { concept, userDescription } = req.body;

  if (!concept) {
    return res.status(400).json({ error: "concept is required" });
  }

  // Lazy initialize GoogleGenAI with safe validation
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // If key is missing or is the placeholder, return a guidance message instead of crashing
    return res.json({
      useDefault: true,
      error: "Gemini API Key is not configured yet. Using mock standard pairing guidance.",
      recommendation: {
        englishFontId: concept.includes("tech") ? "Space Grotesk" : "Playfair Display",
        koreanFontId: concept.includes("tech") ? "IBM Plex Sans KR" : "Nanum Myeongjo",
        rationaleKorean: "Gemini API 키가 아직 설정되지 않아, 사용자의 컨셉 방향성에 맞춘 기본 추천 서체 쌍을 선별해 드립니다. 설정 완료 후 더욱 똑똑한 무드 매칭 피드백이 제공됩니다.",
        suggestedHeadingSizeAdjust: "102%",
        sampleTextEN: "Crafting modern harmony through digital space.",
        sampleTextKO: "디지털 공간을 통해 현대적인 조화로움을 설계합니다."
      }
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const prompt = `You are an expert typography pairing assistant specializing in mixing Korean (Hangul) and English (Latin) fonts.
The user wants custom recommendations for a branding or design theme:
Theme: "${concept}"
Additional Details: "${userDescription || 'None'}"

Select ONE English font and ONE Korean font from the supported lists below that harmonizes perfectly for this concept:

Supported English Fonts (Choose EXACTLY ONE from this list or similar classic web-safe / google font):
- "Inter" (neutral, highly legible sans)
- "Playfair Display" (elegant high-contrast luxury serif)
- "Space Grotesk" (quirky, futuristic tech sans)
- "JetBrains Mono" (crisp, technical developer monospace)
- "Syne" (expressive, wide-set artistic sans)
- "Cormorant Garamond" (delicate classical book serif)
- "Outfit" (geometric, smooth circle-like sans)
- "Montserrat" (bold, urban, structural geometric sans)
- "Fraunces" (vintage, warm chunky editorial serif)
- "Plus Jakarta Sans" (premium corporate clean sans)
- "Cinzel" (roman-inspired display title)
- "Bricolage Grotesque" (organic, expressive modern sans)

Supported Korean Fonts (Choose EXACTLY ONE from this list):
- "Noto Sans KR" (perfect, clean gothic neutral)
- "Nanum Gothic" (highly readable round gothic)
- "Nanum Myeongjo" (traditional literary editorial serif)
- "Gowun Batang" (warm, cozy book-serif)
- "Gowun Dodum" (soft and clean friendly sans)
- "Do Hyeon" (chunky geometric headline)
- "Black Han Sans" (extreme visual weight headline)
- "IBM Plex Sans KR" (sophisticated modern business tech sans)
- "Nanum Brush Script" (expressive hand-brushed script)
- "Song Myung" (high-contrast beautiful traditional scroll serif)

Please provide the output in JSON matching the requested schema. Explain your rationale in friendly, professional Korean. Recommend a minor size adjustment for the English font to align perfectly with the Korean baseline/height (normally 95% - 105%). Make sure formatting is flawless.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            englishFontId: {
              type: Type.STRING,
              description: "The official font family name of the English font as listed in the prompt"
            },
            koreanFontId: {
              type: Type.STRING,
              description: "The official font family name of the Korean font as listed in the prompt"
            },
            rationaleKorean: {
              type: Type.STRING,
              description: "Professional Korean explanation of why this specific EN+KR combination creates the perfect vibe"
            },
            suggestedHeadingSizeAdjust: {
              type: Type.STRING,
              description: "Size alignment factor, e.g. '100%', '98%', '102%', '105%'"
            },
            sampleTextEN: {
              type: Type.STRING,
              description: "Inspiring sample sentence in English matching the theme"
            },
            sampleTextKO: {
              type: Type.STRING,
              description: "Inspiring matching sample sentence in Korean"
            }
          },
          required: [
            "englishFontId",
            "koreanFontId",
            "rationaleKorean",
            "suggestedHeadingSizeAdjust",
            "sampleTextEN",
            "sampleTextKO"
          ]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText.trim());
      return res.json({ useDefault: false, recommendation: parsed });
    } else {
      throw new Error("Empty response text from Gemini API");
    }
  } catch (error: any) {
    console.error("Gemini API Error in server.ts:", error);
    return res.status(500).json({
      error: "AI 추천 생성 실패",
      details: error.message
    });
  }
});

// Proxy route to bypass CORS and retrieve TTF/WOFF binary file for font merging
app.get("/api/fetch-font-ttf", async (req, res) => {
  const { family } = req.query;
  if (!family) {
    return res.status(400).json({ error: "font family is required" });
  }

  try {
    const googleCssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family as string)}:wght@400;700`;
    const response = await fetch(googleCssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPad; CPU OS 5_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9B176 Safari/7534.48.3"
      }
    });

    const cssText = await response.text();
    const ttfMatch = cssText.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/i) || 
                     cssText.match(/url\(['"]?(https:\/\/[^'")]+?\.ttf)['"]?\)/i);

    if (!ttfMatch || !ttfMatch[1]) {
      const woffMatch = cssText.match(/src:\s*url\((https:\/\/[^)]+\.woff)\)/i) || 
                       cssText.match(/url\(['"]?(https:\/\/[^'")]+?\.woff)['"]?\)/i);
      
      if (!woffMatch || !woffMatch[1]) {
        return res.status(404).json({ error: `Could not retrieve TTF or WOFF structure for font family '${family}'` });
      }

      const fontResponse = await fetch(woffMatch[1]);
      const buffer = await fontResponse.arrayBuffer();
      res.setHeader("Content-Type", "font/woff");
      return res.send(Buffer.from(buffer));
    }

    const ttfUrl = ttfMatch[1];
    const fontResponse = await fetch(ttfUrl);
    const buffer = await fontResponse.arrayBuffer();
    res.setHeader("Content-Type", "font/ttf");
    return res.send(Buffer.from(buffer));
  } catch (e: any) {
    console.error("Failed to proxy font:", e);
    return res.status(500).json({ error: "Failed to fetch font data", details: e.message });
  }
});

// Setup Vite middleware for development or Serve static files in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, HOST, () => {
    console.log(`[FontMix Studio] Express server running on http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  });
}

start();
