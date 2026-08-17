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

  console.log("\n========================================");
  console.log("VERIFICATION");
  console.log("========================================");

  console.log(
    "Supported:",
    result.answerSupported
  );

  console.log(
    "Reason:",
    result.verificationReason
  );
}

async function main() {
  // Clearly answerable
  await testGraph(
    "What technologies does Naman know?"
  );

  // Clearly unanswerable
  await testGraph(
    "What is Naman's favorite football team?"
  );

  // Potentially dangerous inference
  await testGraph(
    "How many years of experience does Naman have with MongoDB?"
  );
}

main().catch(console.error);