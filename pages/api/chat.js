// pages/api/chat.js

import { GoogleGenAI } from "@google/genai";
import { add } from "../../lib/add";
import { minus } from "../../lib/minus";
import { multiplication } from "../../lib/multiplication";
import { division } from "../../lib/division";
import { increment } from "../../lib/increment";
import { decrement } from "../../lib/decrement";
import { getCount } from "../../lib/getcount";

const GEMINI_MODEL = "gemini-2.5-flash";

const systemPrompt =
  "You are a strict counter agent for a single numeric count stored on disk.\n" +
  "You CANNOT directly see or change the count. The server will perform operations for you.\n" +
  "Your job is to decide ONE operation to apply, and explain it.\n\n" +
  "Respond ONLY with valid JSON of the form:\n" +
  "{\n" +
  '  "operation": "get|increment|decrement|add|minus|multiply|divide",\n' +
  '  "value": number or null,\n' +
  '  "explanation": "short natural language explanation"\n' +
  "}\n\n" +
  "Rules:\n" +
  "- Use operation 'get' when the user only wants to know the current count.\n" +
  "- For increment/decrement, set value to null.\n" +
  "- For add/minus/multiply/divide, 'value' is the numeric argument.\n" +
  "- Never include any extra text outside the JSON object.";

async function callGemini(userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the environment");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents:
      systemPrompt +
      "\n\nUser message:\n" +
      userMessage +
      "\n\nRemember: respond with ONLY the JSON object.",
    // ⬇️ Force JSON output from the model
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response?.text ?? "";

  // ⬇️ Safer JSON parsing with fallback
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Try to rescue the JSON object from extra text (if any)
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonSlice = text.slice(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(jsonSlice);
      } catch (e2) {
        console.error("Gemini raw response (failed parse):", text);
        throw new Error("Gemini did not return valid JSON");
      }
    } else {
      console.error("Gemini raw response (no braces):", text);
      throw new Error("Gemini did not return valid JSON");
    }
  }

  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Missing message" });
    return;
  }

  try {
    const instruction = await callGemini(message);

    const operation = String(instruction.operation || "get").toLowerCase();
    const value =
      typeof instruction.value === "number"
        ? instruction.value
        : Number(instruction.value);
    const explanation =
      typeof instruction.explanation === "string"
        ? instruction.explanation
        : "";

    let newCount;
    if (operation === "get") {
      newCount = await getCount();
    } else if (operation === "increment") {
      newCount = await increment();
    } else if (operation === "decrement") {
      newCount = await decrement();
    } else if (operation === "add") {
      newCount = await add(value);
    } else if (operation === "minus") {
      newCount = await minus(value);
    } else if (operation === "multiply") {
      newCount = await multiplication(value);
    } else if (operation === "divide") {
      newCount = await division(value);
    } else {
      // Unknown op → just get current count
      newCount = await getCount();
    }

    const replyText =
      explanation ||
      `Operation '${operation}' applied. The current count is now ${newCount}.`;

    res.status(200).json({ reply: replyText, count: newCount });
  } catch (error) {
    console.error("API /api/chat error:", error);
    res.status(500).json({ error: error.message || "Unexpected error" });
  }
}