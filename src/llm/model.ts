import { GoogleGenerativeAIEmbeddings,ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY,
});

export const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.6-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});