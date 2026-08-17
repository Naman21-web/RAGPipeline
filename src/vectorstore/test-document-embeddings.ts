import "dotenv/config";

import { loadPDF } from "../ingestion/loader.js";
import { splitter } from "../ingestion/splitter.js";
import { embeddings } from "../llm/model.js";

async function testDocumentEmbeddings() {
  const documents = await loadPDF("./documents/resume.pdf");

  const chunks = await splitter.splitDocuments(documents);

  console.log(`Chunks: ${chunks.length}`);

  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i].pageContent;

    console.log(`\nEmbedding chunk ${i + 1}`);
    console.log("Text length:", text.length);

    const vector = await embeddings.embedQuery(text);

    console.log("Vector dimensions:", vector.length);
    console.log("First values:", vector.slice(0, 3));
  }
}

testDocumentEmbeddings().catch(console.error);