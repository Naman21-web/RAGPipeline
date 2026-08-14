import {
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";

import { RAGState } from "./state.js";

import {
  retrieveNode,
  gradeDocumentsNode,
} from "./nodes.js";

function routeAfterGrading(
  state: typeof RAGState.State
) {
  if (state.isRelevant) {
    return "relevant";
  }

  return "irrelevant";
}

const workflow = new StateGraph(RAGState)

  .addNode("retrieve", retrieveNode)

  .addNode(
    "gradeDocuments",
    gradeDocumentsNode
  )

  .addEdge(START, "retrieve")

  .addEdge(
    "retrieve",
    "gradeDocuments"
  )

  .addConditionalEdges(
    "gradeDocuments",
    routeAfterGrading,
    {
      relevant: END,
      irrelevant: END,
    }
  );

export const ragGraph = workflow.compile();