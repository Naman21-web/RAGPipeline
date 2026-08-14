import "dotenv/config";

import { retrieveDocuments } from "./retriever.js";

async function testRetrieval() {
  const query = "What is Naman's favorite football team?";

  console.log(`\nQuery: ${query}\n`);

  const documents = await retrieveDocuments(query, 4);

  documents.forEach((doc, index) => {
    console.log("====================================");
    console.log(`RESULT ${index + 1}`);
    console.log("====================================");

    console.log(doc.pageContent);

    console.log("\nMetadata:");
    console.log(doc.metadata);

    console.log("\n");
  });
}

testRetrieval().catch((error) => {
  console.error("Retrieval failed:");
  console.error(error);
});