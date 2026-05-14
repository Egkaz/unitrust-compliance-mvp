import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/analyze-incident", async (req, res) => {
    try {
      const { description } = req.body;
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      const prompt = `
        Проанализируй следующий отчет об инциденте в университете.
        Определи:
        1. Основную категорию комплаенса (primaryCategory: Академическая честность, Безопасность, Финансы, Исследовательская этика).
        2. Уровень серьезности (severityLevel: Низкий, Средний, Высокий, Критический).
        3. Краткое резюме рекомендованных следующих шагов для университета (recommendedNextSteps).
        4. Релевантную область политики (policyArea).

        Отчет: ${JSON.stringify(description)}

        Верни ответ СТРОГО в формате JSON.
        Поля: primaryCategory, severityLevel, recommendedNextSteps, policyArea.
        Используй русский язык.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = result.text || "{}";
      res.json(JSON.parse(text.trim()));
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to analyze incident" });
    }
  });

  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
