import "dotenv/config";

import { loadPDF } from "./loader.js";
import { splitter } from "./splitter.js";
import { createVectorStore } from "../vectorstore/chroma.js";

async function ingest() {
  const filePath = "./documents/resume.pdf";

  console.log("Loading document...");

  const documents = await loadPDF(filePath);

  console.log(`Loaded ${documents.length} pages`);

  console.log("Splitting document...");

  const chunks = await splitter.splitDocuments(documents);

  console.log(`Created ${chunks.length} chunks`);

  console.log("Creating embeddings and storing in Chroma...");

  await createVectorStore(chunks);

  console.log("Document successfully indexed.");
}

ingest().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exit(1);
});