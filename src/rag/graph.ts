import {
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";

import { RAGState } from "./state.js";

import {
  retrieveNode,
  gradeDocumentsNode,
  generateAnswerNode,
  rejectNode,
  verifyClaimsNode,
  verificationFailureNode,
} from "./nodes.js";

function routeAfterGrading(
  state: typeof RAGState.State
) {
  if (state.isRelevant) {
    return "generate";
  }

  return "reject";
}

function routeAfterClaimVerification(
  state: typeof RAGState.State
) {
  if (state.answerSupported) {
    return "success";
  }

  return "failure";
}

const workflow = new StateGraph(RAGState)

  .addNode("retrieve", retrieveNode)

  .addNode(
    "gradeDocuments",
    gradeDocumentsNode
  )

  .addNode(
    "generateAnswer",
    generateAnswerNode
  )

  .addNode(
    "verifyClaims",
    verifyClaimsNode
  )

  .addNode(
    "reject",
    rejectNode
  )

  .addNode(
    "verificationFailure",
    verificationFailureNode
  )

  .addEdge(
    START,
    "retrieve"
  )

  .addEdge(
    "retrieve",
    "gradeDocuments"
  )

  .addConditionalEdges(
    "gradeDocuments",
    routeAfterGrading,
    {
      generate: "generateAnswer",
      reject: "reject",
    }
  )

  .addEdge(
    "generateAnswer",
    "verifyClaims"
  )

  .addConditionalEdges(
    "verifyClaims",
    routeAfterClaimVerification,
    {
      success: END,
      failure: "verificationFailure",
    }
  )

  .addEdge(
    "reject",
    END
  )

  .addEdge(
    "verificationFailure",
    END
  );

export const ragGraph = workflow.compile();