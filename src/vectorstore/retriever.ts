import { Chroma } from "@langchain/community/vectorstores/chroma";
import { embeddings } from "../llm/model.js";

export async function getVectorStore() {
  const vectorStore = await Chroma.fromExistingCollection(
    embeddings,
    {
      collectionName: "document-rag",
      host: "localhost",
      port: 8000,
      ssl: false,
    }
  );

  return vectorStore;
}

export async function retrieveDocuments(
  query: string,
  k: number = 4
) {
  const vectorStore = await getVectorStore();

  const documents = await vectorStore.similaritySearch(
    query,
    k
  );

  return documents;
}