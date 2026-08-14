import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
});