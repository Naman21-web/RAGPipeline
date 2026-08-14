import { Chroma } from "@langchain/community/vectorstores/chroma";
import { embeddings } from "../llm/model.js";
import { Document } from "@langchain/core/documents";

function sanitizeMetadata(metadata: Record<string, any>) {
  const sanitized: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      sanitized[key] = value;
    } else {
      sanitized[key] = JSON.stringify(value);
    }
  }

  return sanitized;
}

export async function createVectorStore(documents: Document[]) {
  console.log("Creating Chroma vector store...");

  const sanitizedDocuments = documents.map((doc) => {
    return new Document({
      pageContent: doc.pageContent,
      metadata: sanitizeMetadata(doc.metadata),
    });
  });

  console.log("Metadata sanitized.");

  const vectorStore = await Chroma.fromDocuments(
    sanitizedDocuments,
    embeddings,
    {
      collectionName: "document-rag",
      host: "localhost",
      port: 8000,
      ssl: false,
    }
  );

  console.log("Documents stored in Chroma.");

  return vectorStore;
}