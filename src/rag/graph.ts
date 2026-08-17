import {
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";

import { RAGState } from "./state.js";

import {
  retrieveNode,
//   gradeDocumentsNode,
  generateAnswerNode,
  verifyAnswerNode,
  rejectNode,
//   verifyClaimsNode,
//   verificationFailureNode,
} from "./nodes.js";

// function routeAfterGrading(
//   state: typeof RAGState.State
// ) {
//   if (state.isRelevant) {
//     return "generate";
//   }

//   return "reject";
// }

// function routeAfterClaimVerification(
//   state: typeof RAGState.State
// ) {
//   if (state.answerSupported) {
//     return "success";
//   }

//   return "failure";
// }

function shouldRejectAfterGeneration(
  state: typeof RAGState.State
) {
  if (
    state.answer
      .toLowerCase()
      .includes("i don't know")
  ) {
    return "reject";
  }

  return "verify";
}

function shouldAcceptAnswer(
  state: typeof RAGState.State
) {
  if (state.answerSupported === true) {
    return "answer";
  }

  return "reject";
}

const workflow = new StateGraph(RAGState)

  .addNode("retrieve", retrieveNode)
  .addNode("generate", generateAnswerNode)
  .addNode("verify", verifyAnswerNode)
  .addNode("reject", rejectNode)

  .addEdge(START, "retrieve")

  .addEdge("retrieve", "generate")

  .addConditionalEdges(
    "generate",
    shouldRejectAfterGeneration,
    {
      verify: "verify",
      reject: "reject",
    }
  )

  .addConditionalEdges(
    "verify",
    shouldAcceptAnswer,
    {
      answer: END,
      reject: "reject",
    }
  )

  .addEdge("reject", END);

export const ragGraph = workflow.compile();