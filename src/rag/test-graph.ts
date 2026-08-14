import "dotenv/config";

import { ragGraph } from "./graph.js";

async function testGraph(question: string) {
  console.log("\n");
  console.log("========================================");
  console.log("QUESTION");
  console.log("========================================");
  console.log(question);

  const result = await ragGraph.invoke({
    question,
  });

  console.log("\n========================================");
  console.log("FINAL ANSWER");
  console.log("========================================");

  console.log(result.answer);
}

async function main() {
  await testGraph(
    "What technologies does Naman know?"
  );

  await testGraph(
    "What is Naman's favorite football team?"
  );
}

main().catch(console.error);