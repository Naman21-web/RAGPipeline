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
} from "./nodes.js";

function routeAfterGrading(
  state: typeof RAGState.State
) {
  if (state.isRelevant) {
    return "generate";
  }

  return "reject";
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
    "reject",
    rejectNode
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
    END
  )

  .addEdge(
    "reject",
    END
  );

export const ragGraph = workflow.compile();