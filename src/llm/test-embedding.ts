import "dotenv/config";

import { embeddings } from "./model.js";

async function testEmbedding() {
  console.log("Generating embedding...");

  const result = await embeddings.embedQuery(
    "What technologies does this document contain?"
  );

  console.log("Embedding generated successfully.");

  console.log("Type:", typeof result);
  console.log("Is array:", Array.isArray(result));
  console.log("Dimensions:", result.length);
  console.log("First 5 values:", result.slice(0, 5));
}

testEmbedding().catch((error) => {
  console.error("Embedding test failed:");
  console.error(error);
});